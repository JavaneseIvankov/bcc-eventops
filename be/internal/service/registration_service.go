package service

import (
	"context"

	"github.com/bcc/eventops-be/internal/cache"
	"github.com/bcc/eventops-be/internal/dto"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/google/uuid"
)

type RegistrationService interface {
	Register(eventID, userID uuid.UUID) (*models.Registration, error)
	CancelSelf(eventID, userID uuid.UUID) error
	CancelByID(eventID, registrationID uuid.UUID) error
	ListMine(userID uuid.UUID, page, limit int, status string) ([]models.Registration, int64, error)
	ListParticipants(eventID uuid.UUID, page, limit int, search, status string) ([]dto.ParticipantResponse, int64, error)
	CheckIn(eventID, registrationID uuid.UUID) (*models.Registration, error)
}

type registrationService struct {
	registrationRepo repository.RegistrationRepository
	eventRepo        repository.EventRepository
	hub              *ws.Hub
	cache            *cache.EventCache
}

func NewRegistrationService(registrationRepo repository.RegistrationRepository, eventRepo repository.EventRepository, hub *ws.Hub, eventCache *cache.EventCache) RegistrationService {
	return &registrationService{registrationRepo: registrationRepo, eventRepo: eventRepo, hub: hub, cache: eventCache}
}

func (s *registrationService) invalidateEventCache(eventID uuid.UUID) {
	ctx := context.Background()
	s.cache.InvalidateList(ctx)
	s.cache.InvalidateDetail(ctx, eventID)
}

func (s *registrationService) Register(eventID, userID uuid.UUID) (*models.Registration, error) {
	registration, err := s.registrationRepo.RegisterParticipant(eventID, userID)
	if err != nil {
		return nil, err
	}

	s.invalidateEventCache(eventID)
	s.broadcastQuota(eventID)
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventRegistrationUpdated, map[string]any{
		"registration_id": registration.ID,
		"status":          registration.Status,
	}))
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventParticipantRegistered, dto.NewRegistrationResponse(registration)))
	s.broadcastDashboard(eventID)

	return registration, nil
}

func (s *registrationService) CancelSelf(eventID, userID uuid.UUID) error {
	if err := s.registrationRepo.CancelSelf(eventID, userID); err != nil {
		return err
	}

	s.invalidateEventCache(eventID)
	s.broadcastQuota(eventID)
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventRegistrationUpdated, map[string]any{
		"status": models.RegistrationCancelled,
	}))
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventParticipantCancelled, map[string]any{
		"user_id": userID,
	}))
	s.broadcastDashboard(eventID)

	return nil
}

func (s *registrationService) CancelByID(eventID, registrationID uuid.UUID) error {
	if err := s.registrationRepo.CancelByID(eventID, registrationID); err != nil {
		return err
	}

	s.invalidateEventCache(eventID)
	s.broadcastQuota(eventID)
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventRegistrationUpdated, map[string]any{
		"registration_id": registrationID,
		"status":          models.RegistrationCancelled,
	}))
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventParticipantCancelled, map[string]any{
		"registration_id": registrationID,
	}))
	s.broadcastDashboard(eventID)

	return nil
}

func (s *registrationService) ListMine(userID uuid.UUID, page, limit int, status string) ([]models.Registration, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.registrationRepo.FindByUserID(userID, page, limit, status)
}

func (s *registrationService) ListParticipants(eventID uuid.UUID, page, limit int, search, status string) ([]dto.ParticipantResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.registrationRepo.FindParticipants(eventID, page, limit, search, status)
}

func (s *registrationService) CheckIn(eventID, registrationID uuid.UUID) (*models.Registration, error) {
	registration, err := s.registrationRepo.CheckIn(eventID, registrationID)
	if err != nil {
		return nil, err
	}

	s.invalidateEventCache(eventID)
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventRegistrationUpdated, map[string]any{
		"registration_id": registration.ID,
		"status":          registration.Status,
	}))
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventParticipantCheckedIn, dto.NewRegistrationResponse(registration)))
	s.broadcastDashboard(eventID)

	return registration, nil
}

func (s *registrationService) broadcastQuota(eventID uuid.UUID) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return
	}
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventQuotaUpdated, map[string]any{
		"quota_total":     event.QuotaTotal,
		"quota_filled":    event.QuotaFilled,
		"quota_available": event.QuotaAvailable(),
	}))
}

func (s *registrationService) broadcastDashboard(eventID uuid.UUID) {
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventDashboardUpdated, map[string]any{
		"event_id": eventID,
	}))
}

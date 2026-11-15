package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/bcc/eventops-be/internal/cache"
	"github.com/bcc/eventops-be/internal/dto"
	"github.com/bcc/eventops-be/internal/email"
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
	CheckInByQR(eventID uuid.UUID, qrToken string) (*models.Registration, error)
	ExportParticipants(eventID uuid.UUID, search, status string) ([]dto.ParticipantResponse, error)
}

type registrationService struct {
	registrationRepo repository.RegistrationRepository
	eventRepo        repository.EventRepository
	userRepo         repository.UserRepository
	hub              *ws.Hub
	cache            *cache.EventCache
	emailSender      email.Sender
}

func NewRegistrationService(registrationRepo repository.RegistrationRepository, eventRepo repository.EventRepository, userRepo repository.UserRepository, hub *ws.Hub, eventCache *cache.EventCache, emailSender email.Sender) RegistrationService {
	return &registrationService{
		registrationRepo: registrationRepo,
		eventRepo:        eventRepo,
		userRepo:         userRepo,
		hub:              hub,
		cache:            eventCache,
		emailSender:      emailSender,
	}
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

	s.sendRegistrationConfirmation(eventID, userID, registration)

	return registration, nil
}

func (s *registrationService) sendRegistrationConfirmation(eventID, userID uuid.UUID, registration *models.Registration) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		slog.Warn("gagal mengambil data user untuk email konfirmasi", slog.String("error", err.Error()))
		return
	}

	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		slog.Warn("gagal mengambil data event untuk email konfirmasi", slog.String("error", err.Error()))
		return
	}

	subject := fmt.Sprintf("Konfirmasi Pendaftaran: %s", event.Name)
	body := fmt.Sprintf(
		"Halo %s,\n\nPendaftaran kamu untuk event \"%s\" berhasil.\n\nLokasi: %s\nWaktu: %s - %s\nKode QR: %s\n\nSampai jumpa di acara!",
		user.Name, event.Name, event.Location,
		event.StartTime.Format("02 Jan 2006 15:04"), event.EndTime.Format("02 Jan 2006 15:04"),
		registration.QRToken,
	)

	if err := s.emailSender.Send(user.Email, subject, body); err != nil {
		slog.Warn("gagal mengirim email konfirmasi pendaftaran", slog.String("error", err.Error()))
	}
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

func (s *registrationService) ExportParticipants(eventID uuid.UUID, search, status string) ([]dto.ParticipantResponse, error) {
	return s.registrationRepo.FindAllParticipants(eventID, search, status)
}

func (s *registrationService) CheckIn(eventID, registrationID uuid.UUID) (*models.Registration, error) {
	registration, err := s.registrationRepo.CheckIn(eventID, registrationID)
	if err != nil {
		return nil, err
	}

	s.afterCheckIn(eventID, registration)
	return registration, nil
}

func (s *registrationService) CheckInByQR(eventID uuid.UUID, qrToken string) (*models.Registration, error) {
	registration, err := s.registrationRepo.CheckInByQRToken(eventID, qrToken)
	if err != nil {
		return nil, err
	}

	s.afterCheckIn(eventID, registration)
	return registration, nil
}

func (s *registrationService) afterCheckIn(eventID uuid.UUID, registration *models.Registration) {
	s.invalidateEventCache(eventID)
	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventRegistrationUpdated, map[string]any{
		"registration_id": registration.ID,
		"status":          registration.Status,
	}))
	s.hub.Broadcast(eventID, ws.RoomCommittee, ws.NewMessage(ws.EventParticipantCheckedIn, dto.NewRegistrationResponse(registration)))
	s.broadcastDashboard(eventID)
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

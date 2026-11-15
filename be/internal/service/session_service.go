package service

import (
	"errors"
	"net/http"

	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionService interface {
	List(eventID uuid.UUID) ([]models.Session, error)
	Create(eventID, userID uuid.UUID, req dto.CreateSessionRequest) (*models.Session, error)
	Update(eventID, sessionID, userID uuid.UUID, req dto.UpdateSessionRequest) (*models.Session, error)
	Delete(eventID, sessionID, userID uuid.UUID) error
	UpdateStatus(eventID, sessionID, userID uuid.UUID, status string) (*models.Session, error)
}

type sessionService struct {
	sessionRepo   repository.SessionRepository
	eventRepo     repository.EventRepository
	committeeRepo repository.CommitteeRepository
	hub           *ws.Hub
}

func NewSessionService(sessionRepo repository.SessionRepository, eventRepo repository.EventRepository, committeeRepo repository.CommitteeRepository, hub *ws.Hub) SessionService {
	return &sessionService{
		sessionRepo:   sessionRepo,
		eventRepo:     eventRepo,
		committeeRepo: committeeRepo,
		hub:           hub,
	}
}

func (s *sessionService) List(eventID uuid.UUID) ([]models.Session, error) {
	if _, err := s.eventRepo.FindByID(eventID); err != nil {
		return nil, err
	}
	return s.sessionRepo.FindByEventIDSorted(eventID)
}

func (s *sessionService) Create(eventID, userID uuid.UUID, req dto.CreateSessionRequest) (*models.Session, error) {
	if _, err := s.eventRepo.FindByID(eventID); err != nil {
		return nil, err
	}

	if err := s.requireCoordinator(eventID, userID); err != nil {
		return nil, err
	}

	session := &models.Session{
		EventID:     eventID,
		Title:       req.Title,
		Description: req.Description,
		Speaker:     req.Speaker,
		Location:    req.Location,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Status:      models.SessionStatusUpcoming,
	}
	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventSessionCreated, dto.NewSessionResponse(session)))

	return session, nil
}

func (s *sessionService) Update(eventID, sessionID, userID uuid.UUID, req dto.UpdateSessionRequest) (*models.Session, error) {
	if _, err := s.eventRepo.FindByID(eventID); err != nil {
		return nil, err
	}
	if err := s.requireCoordinator(eventID, userID); err != nil {
		return nil, err
	}

	session, err := s.findSessionInEvent(eventID, sessionID)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		session.Title = *req.Title
	}
	if req.Description != nil {
		session.Description = req.Description
	}
	if req.Speaker != nil {
		session.Speaker = *req.Speaker
	}
	if req.Location != nil {
		session.Location = *req.Location
	}
	if req.StartTime != nil {
		session.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		session.EndTime = *req.EndTime
	}

	if !session.EndTime.After(session.StartTime) {
		return nil, apperr.New(http.StatusBadRequest, "INVALID_INPUT", "end_time harus lebih besar dari start_time.")
	}

	if err := s.sessionRepo.Update(session); err != nil {
		return nil, err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventSessionUpdated, dto.NewSessionResponse(session)))

	return session, nil
}

func (s *sessionService) Delete(eventID, sessionID, userID uuid.UUID) error {
	if _, err := s.eventRepo.FindByID(eventID); err != nil {
		return err
	}
	if err := s.requireCoordinator(eventID, userID); err != nil {
		return err
	}

	session, err := s.findSessionInEvent(eventID, sessionID)
	if err != nil {
		return err
	}

	if err := s.sessionRepo.Delete(session.ID); err != nil {
		return err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventSessionDeleted, map[string]any{
		"id": session.ID,
	}))

	return nil
}

func (s *sessionService) UpdateStatus(eventID, sessionID, userID uuid.UUID, status string) (*models.Session, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, err
	}
	if event.Status == models.EventStatusFinished {
		return nil, apperr.ErrInvalidState
	}
	if err := s.requireCommitteeMember(eventID, userID); err != nil {
		return nil, err
	}

	session, err := s.findSessionInEvent(eventID, sessionID)
	if err != nil {
		return nil, err
	}

	session.Status = status
	if err := s.sessionRepo.Update(session); err != nil {
		return nil, err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventSessionStatusChanged, dto.NewSessionResponse(session)))

	return session, nil
}

func (s *sessionService) requireCommitteeMember(eventID, userID uuid.UUID) error {
	_, err := s.committeeRepo.FindRole(eventID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.ErrForbidden
		}
		return err
	}
	return nil
}

func (s *sessionService) findSessionInEvent(eventID, sessionID uuid.UUID) (*models.Session, error) {
	session, err := s.sessionRepo.FindByID(sessionID)
	if err != nil {
		return nil, err
	}
	if session.EventID != eventID {
		return nil, apperr.ErrNotFound
	}
	return session, nil
}

func (s *sessionService) requireCoordinator(eventID, userID uuid.UUID) error {
	role, err := s.committeeRepo.FindRole(eventID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.ErrForbidden
		}
		return err
	}
	if role != models.RoleCoordinator {
		return apperr.ErrForbidden
	}
	return nil
}

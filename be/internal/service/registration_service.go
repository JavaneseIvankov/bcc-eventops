package service

import (
	"github.com/bcc/eventops-be/internal/dto"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
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
}

func NewRegistrationService(registrationRepo repository.RegistrationRepository) RegistrationService {
	return &registrationService{registrationRepo: registrationRepo}
}

func (s *registrationService) Register(eventID, userID uuid.UUID) (*models.Registration, error) {
	return s.registrationRepo.RegisterParticipant(eventID, userID)
}

func (s *registrationService) CancelSelf(eventID, userID uuid.UUID) error {
	return s.registrationRepo.CancelSelf(eventID, userID)
}

func (s *registrationService) CancelByID(eventID, registrationID uuid.UUID) error {
	return s.registrationRepo.CancelByID(eventID, registrationID)
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
	return s.registrationRepo.CheckIn(eventID, registrationID)
}

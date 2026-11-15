package service

import (
	"github.com/bcc/eventops-be/internal/dto"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/google/uuid"
)

type DashboardService interface {
	GetSummary(eventID uuid.UUID) (dto.DashboardSummaryResponse, error)
}

type dashboardService struct {
	eventRepo        repository.EventRepository
	registrationRepo repository.RegistrationRepository
	sessionRepo      repository.SessionRepository
}

func NewDashboardService(eventRepo repository.EventRepository, registrationRepo repository.RegistrationRepository, sessionRepo repository.SessionRepository) DashboardService {
	return &dashboardService{
		eventRepo:        eventRepo,
		registrationRepo: registrationRepo,
		sessionRepo:      sessionRepo,
	}
}

func (s *dashboardService) GetSummary(eventID uuid.UUID) (dto.DashboardSummaryResponse, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return dto.DashboardSummaryResponse{}, err
	}

	regCounts, err := s.registrationRepo.CountByStatus(eventID)
	if err != nil {
		return dto.DashboardSummaryResponse{}, err
	}

	sessionCounts, err := s.sessionRepo.CountByStatus(eventID)
	if err != nil {
		return dto.DashboardSummaryResponse{}, err
	}

	registered := int(regCounts[models.RegistrationRegistered])
	checkedIn := int(regCounts[models.RegistrationCheckedIn])
	cancelled := int(regCounts[models.RegistrationCancelled])
	activeRegistrations := registered + checkedIn

	quotaAvailable := event.QuotaTotal - activeRegistrations
	if quotaAvailable < 0 {
		quotaAvailable = 0
	}

	upcoming := int(sessionCounts[models.SessionStatusUpcoming])
	ongoing := int(sessionCounts[models.SessionStatusOngoing])
	finished := int(sessionCounts[models.SessionStatusFinished])

	return dto.DashboardSummaryResponse{
		QuotaTotal:          event.QuotaTotal,
		ActiveRegistrations: activeRegistrations,
		CheckedInCount:      checkedIn,
		NotCheckedInCount:   registered,
		CancelledCount:      cancelled,
		QuotaAvailable:      quotaAvailable,
		SessionsSummary: dto.SessionsSummary{
			Total:    upcoming + ongoing + finished,
			Upcoming: upcoming,
			Ongoing:  ongoing,
			Finished: finished,
		},
	}, nil
}

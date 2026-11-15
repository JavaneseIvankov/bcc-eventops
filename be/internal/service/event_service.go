package service

import (
	"context"
	"net/http"

	"github.com/bcc/eventops-be/internal/cache"
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/google/uuid"
)

type EventService interface {
	Create(userID uuid.UUID, req dto.CreateEventRequest) (*models.Event, error)
	List(userID uuid.UUID, page, limit int, search, status string, managedByMe bool) ([]models.Event, map[uuid.UUID]string, int64, error)
	Detail(eventID, userID uuid.UUID) (*models.Event, *string, error)
	Update(eventID uuid.UUID, req dto.UpdateEventRequest) (*models.Event, error)
	Delete(eventID uuid.UUID) error
}

type eventService struct {
	eventRepo        repository.EventRepository
	registrationRepo repository.RegistrationRepository
	cache            *cache.EventCache
}

func NewEventService(eventRepo repository.EventRepository, registrationRepo repository.RegistrationRepository, eventCache *cache.EventCache) EventService {
	return &eventService{eventRepo: eventRepo, registrationRepo: registrationRepo, cache: eventCache}
}

func (s *eventService) Create(userID uuid.UUID, req dto.CreateEventRequest) (*models.Event, error) {
	event := &models.Event{
		Name:             req.Name,
		ShortDescription: req.ShortDescription,
		PosterURL:        req.PosterURL,
		Location:         req.Location,
		StartTime:        req.StartTime,
		EndTime:          req.EndTime,
		Status:           models.EventStatusUpcoming,
		QuotaTotal:       req.QuotaTotal,
		QuotaFilled:      0,
		CreatedBy:        userID,
	}

	if err := s.eventRepo.CreateWithCoordinator(event, userID); err != nil {
		return nil, err
	}

	s.cache.InvalidateList(context.Background())

	return event, nil
}

func (s *eventService) List(userID uuid.UUID, page, limit int, search, status string, managedByMe bool) ([]models.Event, map[uuid.UUID]string, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	ctx := context.Background()
	cacheUserID := uuid.Nil
	if managedByMe {
		cacheUserID = userID
	}

	var events []models.Event
	var total int64

	if cached, ok := s.cache.GetList(ctx, page, limit, search, status, managedByMe, cacheUserID); ok {
		events = cached.Events
		total = cached.Total
	} else {
		filter := repository.EventListFilter{
			Page:        page,
			Limit:       limit,
			Search:      search,
			Status:      status,
			ManagedByMe: managedByMe,
			UserID:      userID,
		}

		var err error
		events, total, err = s.eventRepo.List(filter)
		if err != nil {
			return nil, nil, 0, err
		}

		s.cache.SetList(ctx, page, limit, search, status, managedByMe, cacheUserID, cache.EventListResult{Events: events, Total: total})
	}

	eventIDs := make([]uuid.UUID, len(events))
	for i, e := range events {
		eventIDs[i] = e.ID
	}

	roles, err := s.eventRepo.FindMyRoles(userID, eventIDs)
	if err != nil {
		return nil, nil, 0, err
	}

	return events, roles, total, nil
}

func (s *eventService) Detail(eventID, userID uuid.UUID) (*models.Event, *string, error) {
	ctx := context.Background()

	event, ok := s.cache.GetDetail(ctx, eventID)
	if !ok {
		var err error
		event, err = s.eventRepo.FindByID(eventID)
		if err != nil {
			return nil, nil, err
		}
		s.cache.SetDetail(ctx, event)
	}

	roles, err := s.eventRepo.FindMyRoles(userID, []uuid.UUID{eventID})
	if err != nil {
		return nil, nil, err
	}

	var myRole *string
	if role, ok := roles[eventID]; ok {
		myRole = &role
	}

	return event, myRole, nil
}

func (s *eventService) Update(eventID uuid.UUID, req dto.UpdateEventRequest) (*models.Event, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		event.Name = *req.Name
	}
	if req.ShortDescription != nil {
		event.ShortDescription = *req.ShortDescription
	}
	if req.PosterURL != nil {
		event.PosterURL = req.PosterURL
	}
	if req.Location != nil {
		event.Location = *req.Location
	}
	if req.StartTime != nil {
		event.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		event.EndTime = *req.EndTime
	}

	if !event.EndTime.After(event.StartTime) {
		return nil, apperr.New(http.StatusBadRequest, "INVALID_INPUT", "end_time harus lebih besar dari start_time.")
	}

	if req.QuotaTotal != nil {
		activeCount, err := s.registrationRepo.CountActiveByEventID(eventID)
		if err != nil {
			return nil, err
		}
		if int64(*req.QuotaTotal) < activeCount {
			return nil, apperr.New(http.StatusBadRequest, "INVALID_STATE", "Kapasitas baru tidak boleh lebih kecil dari jumlah pendaftar aktif.")
		}
		event.QuotaTotal = *req.QuotaTotal
	}

	if req.Status != nil {
		event.Status = *req.Status
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, err
	}

	ctx := context.Background()
	s.cache.InvalidateList(ctx)
	s.cache.InvalidateDetail(ctx, eventID)

	return event, nil
}

func (s *eventService) Delete(eventID uuid.UUID) error {
	if _, err := s.eventRepo.FindByID(eventID); err != nil {
		return err
	}
	if err := s.eventRepo.Delete(eventID); err != nil {
		return err
	}

	ctx := context.Background()
	s.cache.InvalidateList(ctx)
	s.cache.InvalidateDetail(ctx, eventID)

	return nil
}

package service

import (
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/google/uuid"
)

type AnnouncementService interface {
	List(eventID uuid.UUID) ([]models.Announcement, error)
	Create(eventID, authorID uuid.UUID, req dto.CreateAnnouncementRequest) (*models.Announcement, error)
	Update(eventID, announcementID uuid.UUID, req dto.UpdateAnnouncementRequest) (*models.Announcement, error)
	Delete(eventID, announcementID uuid.UUID) error
}

type announcementService struct {
	announcementRepo repository.AnnouncementRepository
	hub              *ws.Hub
}

func NewAnnouncementService(announcementRepo repository.AnnouncementRepository, hub *ws.Hub) AnnouncementService {
	return &announcementService{announcementRepo: announcementRepo, hub: hub}
}

func (s *announcementService) List(eventID uuid.UUID) ([]models.Announcement, error) {
	return s.announcementRepo.FindByEventID(eventID)
}

func (s *announcementService) Create(eventID, authorID uuid.UUID, req dto.CreateAnnouncementRequest) (*models.Announcement, error) {
	announcement := &models.Announcement{
		EventID:  eventID,
		AuthorID: authorID,
		Title:    req.Title,
		Content:  req.Content,
	}
	if err := s.announcementRepo.Create(announcement); err != nil {
		return nil, err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventAnnouncementCreated, dto.NewAnnouncementResponse(announcement)))

	return announcement, nil
}

func (s *announcementService) Update(eventID, announcementID uuid.UUID, req dto.UpdateAnnouncementRequest) (*models.Announcement, error) {
	announcement, err := s.findInEvent(eventID, announcementID)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		announcement.Title = *req.Title
	}
	if req.Content != nil {
		announcement.Content = *req.Content
	}

	if err := s.announcementRepo.Update(announcement); err != nil {
		return nil, err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventAnnouncementUpdated, dto.NewAnnouncementResponse(announcement)))

	return announcement, nil
}

func (s *announcementService) Delete(eventID, announcementID uuid.UUID) error {
	announcement, err := s.findInEvent(eventID, announcementID)
	if err != nil {
		return err
	}
	if err := s.announcementRepo.Delete(announcement.ID); err != nil {
		return err
	}

	s.hub.Broadcast(eventID, ws.RoomPublic, ws.NewMessage(ws.EventAnnouncementDeleted, map[string]any{
		"id": announcement.ID,
	}))

	return nil
}

func (s *announcementService) findInEvent(eventID, announcementID uuid.UUID) (*models.Announcement, error) {
	announcement, err := s.announcementRepo.FindByID(announcementID)
	if err != nil {
		return nil, err
	}
	if announcement.EventID != eventID {
		return nil, apperr.ErrNotFound
	}
	return announcement, nil
}

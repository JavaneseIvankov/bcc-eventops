package service

import (
	"net/http"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/google/uuid"
)

type BookmarkService interface {
	Add(userID, sessionID uuid.UUID) error
	Remove(userID, sessionID uuid.UUID) error
	ListMine(userID uuid.UUID) ([]models.SessionBookmark, error)
}

type bookmarkService struct {
	bookmarkRepo repository.BookmarkRepository
	sessionRepo  repository.SessionRepository
}

func NewBookmarkService(bookmarkRepo repository.BookmarkRepository, sessionRepo repository.SessionRepository) BookmarkService {
	return &bookmarkService{bookmarkRepo: bookmarkRepo, sessionRepo: sessionRepo}
}

func (s *bookmarkService) Add(userID, sessionID uuid.UUID) error {
	if _, err := s.sessionRepo.FindByID(sessionID); err != nil {
		return err
	}

	exists, err := s.bookmarkRepo.Exists(userID, sessionID)
	if err != nil {
		return err
	}
	if exists {
		return apperr.New(http.StatusConflict, "ALREADY_BOOKMARKED", "Sesi ini sudah di-bookmark.")
	}

	return s.bookmarkRepo.Create(userID, sessionID)
}

func (s *bookmarkService) Remove(userID, sessionID uuid.UUID) error {
	return s.bookmarkRepo.Delete(userID, sessionID)
}

func (s *bookmarkService) ListMine(userID uuid.UUID) ([]models.SessionBookmark, error) {
	return s.bookmarkRepo.FindByUserID(userID)
}

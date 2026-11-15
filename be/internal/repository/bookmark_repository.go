package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookmarkRepository interface {
	Create(userID, sessionID uuid.UUID) error
	Delete(userID, sessionID uuid.UUID) error
	FindByUserID(userID uuid.UUID) ([]models.SessionBookmark, error)
	Exists(userID, sessionID uuid.UUID) (bool, error)
}

type bookmarkRepository struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) BookmarkRepository {
	return &bookmarkRepository{db: db}
}

func (r *bookmarkRepository) Create(userID, sessionID uuid.UUID) error {
	bookmark := &models.SessionBookmark{UserID: userID, SessionID: sessionID}
	return r.db.Create(bookmark).Error
}

func (r *bookmarkRepository) Delete(userID, sessionID uuid.UUID) error {
	return r.db.Where("user_id = ? AND session_id = ?", userID, sessionID).Delete(&models.SessionBookmark{}).Error
}

func (r *bookmarkRepository) FindByUserID(userID uuid.UUID) ([]models.SessionBookmark, error) {
	var bookmarks []models.SessionBookmark
	if err := r.db.Preload("Session").Where("user_id = ?", userID).Order("created_at DESC").Find(&bookmarks).Error; err != nil {
		return nil, err
	}
	return bookmarks, nil
}

func (r *bookmarkRepository) Exists(userID, sessionID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.SessionBookmark{}).Where("user_id = ? AND session_id = ?", userID, sessionID).Count(&count).Error
	return count > 0, err
}

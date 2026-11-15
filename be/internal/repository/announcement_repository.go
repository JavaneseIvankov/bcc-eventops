package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AnnouncementRepository interface {
	FindByEventID(eventID uuid.UUID) ([]models.Announcement, error)
	Create(announcement *models.Announcement) error
	FindByID(id uuid.UUID) (*models.Announcement, error)
	Update(announcement *models.Announcement) error
	Delete(id uuid.UUID) error
}

type announcementRepository struct {
	db *gorm.DB
}

func NewAnnouncementRepository(db *gorm.DB) AnnouncementRepository {
	return &announcementRepository{db: db}
}

func (r *announcementRepository) FindByEventID(eventID uuid.UUID) ([]models.Announcement, error) {
	var announcements []models.Announcement
	if err := r.db.Preload("Author").Where("event_id = ?", eventID).Order("created_at DESC").Find(&announcements).Error; err != nil {
		return nil, err
	}
	return announcements, nil
}

func (r *announcementRepository) Create(announcement *models.Announcement) error {
	return r.db.Create(announcement).Error
}

func (r *announcementRepository) FindByID(id uuid.UUID) (*models.Announcement, error) {
	var announcement models.Announcement
	if err := r.db.Preload("Author").First(&announcement, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &announcement, nil
}

func (r *announcementRepository) Update(announcement *models.Announcement) error {
	return r.db.Save(announcement).Error
}

func (r *announcementRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Announcement{}, "id = ?", id).Error
}

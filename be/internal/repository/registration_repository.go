package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RegistrationRepository interface {
	CountActiveByEventID(eventID uuid.UUID) (int64, error)
}

type registrationRepository struct {
	db *gorm.DB
}

func NewRegistrationRepository(db *gorm.DB) RegistrationRepository {
	return &registrationRepository{db: db}
}

func (r *registrationRepository) CountActiveByEventID(eventID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Registration{}).
		Where("event_id = ? AND status IN ?", eventID, []string{models.RegistrationRegistered, models.RegistrationCheckedIn}).
		Count(&count).Error
	return count, err
}

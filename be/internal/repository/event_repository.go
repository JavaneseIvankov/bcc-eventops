package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EventRepository interface {
	FindByID(id uuid.UUID) (*models.Event, error)
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) FindByID(id uuid.UUID) (*models.Event, error) {
	var event models.Event
	if err := r.db.First(&event, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

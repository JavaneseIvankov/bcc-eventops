package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionRepository interface {
	Create(session *models.Session) error
	FindByID(id uuid.UUID) (*models.Session, error)
	FindByEventIDSorted(eventID uuid.UUID) ([]models.Session, error)
	Update(session *models.Session) error
	Delete(id uuid.UUID) error
	CountByStatus(eventID uuid.UUID) (map[string]int64, error)
}

type sessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

func (r *sessionRepository) FindByID(id uuid.UUID) (*models.Session, error) {
	var session models.Session
	if err := r.db.First(&session, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) FindByEventIDSorted(eventID uuid.UUID) ([]models.Session, error) {
	var sessions []models.Session
	if err := r.db.Where("event_id = ?", eventID).Order("start_time ASC").Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *sessionRepository) Update(session *models.Session) error {
	return r.db.Save(session).Error
}

func (r *sessionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Session{}, "id = ?", id).Error
}

func (r *sessionRepository) CountByStatus(eventID uuid.UUID) (map[string]int64, error) {
	type statusCount struct {
		Status string
		Count  int64
	}

	var rows []statusCount
	if err := r.db.Model(&models.Session{}).
		Select("status, count(*) as count").
		Where("event_id = ?", eventID).
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	counts := make(map[string]int64, len(rows))
	for _, row := range rows {
		counts[row.Status] = row.Count
	}
	return counts, nil
}

package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommitteeRepository interface {
	FindRole(eventID, userID uuid.UUID) (string, error)
}

type committeeRepository struct {
	db *gorm.DB
}

func NewCommitteeRepository(db *gorm.DB) CommitteeRepository {
	return &committeeRepository{db: db}
}

func (r *committeeRepository) FindRole(eventID, userID uuid.UUID) (string, error) {
	var member models.CommitteeMember
	if err := r.db.Where("event_id = ? AND user_id = ?", eventID, userID).First(&member).Error; err != nil {
		return "", err
	}
	return member.Role, nil
}

package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommitteeRepository interface {
	FindRole(eventID, userID uuid.UUID) (string, error)
	FindByEventAndUser(eventID, userID uuid.UUID) (*models.CommitteeMember, error)
	FindByEventID(eventID uuid.UUID) ([]models.CommitteeMember, error)
	CountCoordinators(eventID uuid.UUID) (int64, error)
	Update(member *models.CommitteeMember) error
	Delete(eventID, userID uuid.UUID) error
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

func (r *committeeRepository) FindByEventAndUser(eventID, userID uuid.UUID) (*models.CommitteeMember, error) {
	var member models.CommitteeMember
	if err := r.db.Where("event_id = ? AND user_id = ?", eventID, userID).First(&member).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *committeeRepository) FindByEventID(eventID uuid.UUID) ([]models.CommitteeMember, error) {
	var members []models.CommitteeMember
	if err := r.db.Preload("User").Where("event_id = ?", eventID).Order("created_at ASC").Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (r *committeeRepository) CountCoordinators(eventID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.CommitteeMember{}).
		Where("event_id = ? AND role = ?", eventID, models.RoleCoordinator).
		Count(&count).Error
	return count, err
}

func (r *committeeRepository) Update(member *models.CommitteeMember) error {
	return r.db.Save(member).Error
}

func (r *committeeRepository) Delete(eventID, userID uuid.UUID) error {
	return r.db.Where("event_id = ? AND user_id = ?", eventID, userID).Delete(&models.CommitteeMember{}).Error
}

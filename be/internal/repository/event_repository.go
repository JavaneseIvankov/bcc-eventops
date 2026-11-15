package repository

import (
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EventListFilter struct {
	Page        int
	Limit       int
	Search      string
	Status      string
	ManagedByMe bool
	UserID      uuid.UUID
}

type EventRepository interface {
	CreateWithCoordinator(event *models.Event, creatorID uuid.UUID) error
	List(filter EventListFilter) ([]models.Event, int64, error)
	FindMyRoles(userID uuid.UUID, eventIDs []uuid.UUID) (map[uuid.UUID]string, error)
	FindByID(id uuid.UUID) (*models.Event, error)
	Update(event *models.Event) error
	Delete(id uuid.UUID) error
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) CreateWithCoordinator(event *models.Event, creatorID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(event).Error; err != nil {
			return err
		}

		member := &models.CommitteeMember{
			EventID: event.ID,
			UserID:  creatorID,
			Role:    models.RoleCoordinator,
		}
		return tx.Create(member).Error
	})
}

func (r *eventRepository) List(filter EventListFilter) ([]models.Event, int64, error) {
	query := r.db.Model(&models.Event{})

	if filter.Search != "" {
		query = query.Where("name ILIKE ?", "%"+filter.Search+"%")
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.ManagedByMe {
		query = query.Where("id IN (SELECT event_id FROM committee_members WHERE user_id = ?)", filter.UserID)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var events []models.Event
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Order("start_time ASC").Limit(filter.Limit).Offset(offset).Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

func (r *eventRepository) FindMyRoles(userID uuid.UUID, eventIDs []uuid.UUID) (map[uuid.UUID]string, error) {
	roles := make(map[uuid.UUID]string, len(eventIDs))
	if len(eventIDs) == 0 {
		return roles, nil
	}

	var members []models.CommitteeMember
	if err := r.db.Where("user_id = ? AND event_id IN ?", userID, eventIDs).Find(&members).Error; err != nil {
		return nil, err
	}

	for _, m := range members {
		roles[m.EventID] = m.Role
	}
	return roles, nil
}

func (r *eventRepository) FindByID(id uuid.UUID) (*models.Event, error) {
	var event models.Event
	if err := r.db.First(&event, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

func (r *eventRepository) Delete(id uuid.UUID) error {
	return r.db.Unscoped().Delete(&models.Event{}, "id = ?", id).Error
}

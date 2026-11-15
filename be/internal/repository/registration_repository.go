package repository

import (
	"errors"
	"net/http"

	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RegistrationRepository interface {
	CountActiveByEventID(eventID uuid.UUID) (int64, error)
	RegisterParticipant(eventID, userID uuid.UUID) (*models.Registration, error)
	CancelSelf(eventID, userID uuid.UUID) error
	CancelByID(eventID, registrationID uuid.UUID) error
	FindByUserID(userID uuid.UUID, page, limit int, status string) ([]models.Registration, int64, error)
	FindParticipants(eventID uuid.UUID, page, limit int, search, status string) ([]dto.ParticipantResponse, int64, error)
	CheckIn(eventID, registrationID uuid.UUID) (*models.Registration, error)
	CountByStatus(eventID uuid.UUID) (map[string]int64, error)
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

func (r *registrationRepository) RegisterParticipant(eventID, userID uuid.UUID) (*models.Registration, error) {
	var registration models.Registration

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, "id = ?", eventID).Error; err != nil {
			return err
		}

		if event.Status != models.EventStatusUpcoming {
			return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Event tidak lagi berstatus UPCOMING.")
		}
		if event.QuotaAvailable() <= 0 {
			return apperr.ErrQuotaExceeded
		}

		var existing models.Registration
		err := tx.Where("event_id = ? AND user_id = ?", eventID, userID).First(&existing).Error
		switch {
		case err == nil:
			if existing.Status == models.RegistrationRegistered || existing.Status == models.RegistrationCheckedIn {
				return apperr.ErrAlreadyRegistered
			}
			existing.Status = models.RegistrationRegistered
			existing.QRToken = utils.GenerateQRToken()
			existing.RegisteredAt = utils.NowUTC()
			existing.CheckedInAt = nil
			if err := tx.Save(&existing).Error; err != nil {
				return err
			}
			registration = existing
		case errors.Is(err, gorm.ErrRecordNotFound):
			registration = models.Registration{
				EventID:      eventID,
				UserID:       userID,
				Status:       models.RegistrationRegistered,
				QRToken:      utils.GenerateQRToken(),
				RegisteredAt: utils.NowUTC(),
			}
			if err := tx.Create(&registration).Error; err != nil {
				return err
			}
		default:
			return err
		}

		return tx.Model(&models.Event{}).Where("id = ?", eventID).
			UpdateColumn("quota_filled", gorm.Expr("quota_filled + 1")).Error
	})
	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (r *registrationRepository) CancelSelf(eventID, userID uuid.UUID) error {
	return r.cancel(eventID, func(tx *gorm.DB) (*models.Registration, error) {
		var reg models.Registration
		err := tx.Where("event_id = ? AND user_id = ?", eventID, userID).First(&reg).Error
		return &reg, err
	})
}

func (r *registrationRepository) CancelByID(eventID, registrationID uuid.UUID) error {
	return r.cancel(eventID, func(tx *gorm.DB) (*models.Registration, error) {
		var reg models.Registration
		err := tx.First(&reg, "id = ? AND event_id = ?", registrationID, eventID).Error
		return &reg, err
	})
}

func (r *registrationRepository) FindByUserID(userID uuid.UUID, page, limit int, status string) ([]models.Registration, int64, error) {
	query := r.db.Model(&models.Registration{}).Where("user_id = ?", userID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var registrations []models.Registration
	offset := (page - 1) * limit
	if err := query.Order("registered_at DESC").Limit(limit).Offset(offset).Find(&registrations).Error; err != nil {
		return nil, 0, err
	}

	return registrations, total, nil
}

func (r *registrationRepository) FindParticipants(eventID uuid.UUID, page, limit int, search, status string) ([]dto.ParticipantResponse, int64, error) {
	query := r.db.Table("registrations").
		Joins("JOIN users ON users.id = registrations.user_id").
		Where("registrations.event_id = ?", eventID)

	if search != "" {
		query = query.Where("users.name ILIKE ? OR users.email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if status != "" {
		query = query.Where("registrations.status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var participants []dto.ParticipantResponse
	offset := (page - 1) * limit
	err := query.Select(
		"registrations.id AS registration_id, registrations.user_id, users.name, users.email, registrations.status, registrations.registered_at, registrations.checked_in_at",
	).Order("registrations.registered_at DESC").Limit(limit).Offset(offset).Scan(&participants).Error
	if err != nil {
		return nil, 0, err
	}

	return participants, total, nil
}

func (r *registrationRepository) CheckIn(eventID, registrationID uuid.UUID) (*models.Registration, error) {
	now := utils.NowUTC()

	result := r.db.Model(&models.Registration{}).
		Where("id = ? AND event_id = ? AND status = ?", registrationID, eventID, models.RegistrationRegistered).
		Where("EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.status != ?)", models.EventStatusFinished).
		Updates(map[string]interface{}{"status": models.RegistrationCheckedIn, "checked_in_at": now})
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, r.checkInFailureReason(eventID, registrationID)
	}

	var reg models.Registration
	if err := r.db.First(&reg, "id = ? AND event_id = ?", registrationID, eventID).Error; err != nil {
		return nil, err
	}
	return &reg, nil
}

func (r *registrationRepository) CountByStatus(eventID uuid.UUID) (map[string]int64, error) {
	type statusCount struct {
		Status string
		Count  int64
	}

	var rows []statusCount
	if err := r.db.Model(&models.Registration{}).
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

func (r *registrationRepository) checkInFailureReason(eventID, registrationID uuid.UUID) error {
	var event models.Event
	if err := r.db.First(&event, "id = ?", eventID).Error; err != nil {
		return err
	}
	if event.Status == models.EventStatusFinished {
		return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Event sudah berstatus FINISHED, check-in tidak dapat dilakukan.")
	}

	var reg models.Registration
	if err := r.db.First(&reg, "id = ? AND event_id = ?", registrationID, eventID).Error; err != nil {
		return err
	}

	switch reg.Status {
	case models.RegistrationCancelled:
		return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Pendaftaran berstatus CANCELLED, tidak dapat check-in.")
	case models.RegistrationCheckedIn:
		return apperr.NewWithData(http.StatusConflict, "ALREADY_CHECKED_IN", "Peserta sudah berstatus CHECKED_IN sebelumnya.", map[string]any{
			"checked_in_at": reg.CheckedInAt,
		})
	default:
		return apperr.ErrInvalidInput
	}
}

func (r *registrationRepository) cancel(eventID uuid.UUID, find func(tx *gorm.DB) (*models.Registration, error)) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var event models.Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, "id = ?", eventID).Error; err != nil {
			return err
		}
		if event.Status != models.EventStatusUpcoming {
			return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Event sudah dimulai/selesai, pendaftaran tidak dapat dibatalkan.")
		}

		reg, err := find(tx)
		if err != nil {
			return err
		}
		if reg.Status == models.RegistrationCheckedIn {
			return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Peserta sudah check-in, tidak dapat dibatalkan.")
		}
		if reg.Status == models.RegistrationCancelled {
			return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Pendaftaran sudah dibatalkan sebelumnya.")
		}

		reg.Status = models.RegistrationCancelled
		if err := tx.Save(reg).Error; err != nil {
			return err
		}

		return tx.Model(&models.Event{}).Where("id = ?", eventID).
			UpdateColumn("quota_filled", gorm.Expr("quota_filled - 1")).Error
	})
}

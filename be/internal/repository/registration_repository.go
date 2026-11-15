package repository

import (
	"errors"
	"net/http"

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

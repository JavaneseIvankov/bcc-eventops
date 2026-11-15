package repository

import (
	"net/http"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InvitationRepository interface {
	Create(invitation *models.Invitation) error
	FindPendingByEventAndInvitee(eventID, inviteeID uuid.UUID) (*models.Invitation, error)
	FindByInviteeID(inviteeID uuid.UUID, page, limit int, status string) ([]models.Invitation, int64, error)
	FindByID(id uuid.UUID) (*models.Invitation, error)
	Update(invitation *models.Invitation) error
	Accept(invitationID, userID uuid.UUID) (*models.Invitation, error)
	Delete(id uuid.UUID) error
	FindByEventID(eventID uuid.UUID) ([]models.Invitation, error)
}

type invitationRepository struct {
	db *gorm.DB
}

func NewInvitationRepository(db *gorm.DB) InvitationRepository {
	return &invitationRepository{db: db}
}

func (r *invitationRepository) Create(invitation *models.Invitation) error {
	return r.db.Create(invitation).Error
}

func (r *invitationRepository) FindPendingByEventAndInvitee(eventID, inviteeID uuid.UUID) (*models.Invitation, error) {
	var inv models.Invitation
	err := r.db.Where("event_id = ? AND invitee_user_id = ? AND status = ?", eventID, inviteeID, models.InvitationPending).
		First(&inv).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invitationRepository) FindByInviteeID(inviteeID uuid.UUID, page, limit int, status string) ([]models.Invitation, int64, error) {
	query := r.db.Model(&models.Invitation{}).Where("invitee_user_id = ?", inviteeID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var invitations []models.Invitation
	offset := (page - 1) * limit
	if err := query.Preload("Invitee").Order("created_at DESC").Limit(limit).Offset(offset).Find(&invitations).Error; err != nil {
		return nil, 0, err
	}

	return invitations, total, nil
}

func (r *invitationRepository) FindByID(id uuid.UUID) (*models.Invitation, error) {
	var inv models.Invitation
	if err := r.db.Preload("Invitee").First(&inv, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invitationRepository) Update(invitation *models.Invitation) error {
	return r.db.Save(invitation).Error
}

func (r *invitationRepository) Accept(invitationID, userID uuid.UUID) (*models.Invitation, error) {
	var invitation models.Invitation

	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&invitation, "id = ?", invitationID).Error; err != nil {
			return err
		}
		if invitation.InviteeUserID != userID {
			return apperr.ErrForbidden
		}
		if invitation.Status != models.InvitationPending {
			return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Undangan sudah diproses sebelumnya.")
		}

		invitation.Status = models.InvitationAccepted
		if err := tx.Save(&invitation).Error; err != nil {
			return err
		}

		member := &models.CommitteeMember{
			EventID: invitation.EventID,
			UserID:  userID,
			Role:    invitation.Role,
		}
		return tx.Create(member).Error
	})
	if err != nil {
		return nil, err
	}

	return &invitation, nil
}

func (r *invitationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Invitation{}, "id = ?", id).Error
}

func (r *invitationRepository) FindByEventID(eventID uuid.UUID) ([]models.Invitation, error) {
	var invitations []models.Invitation
	if err := r.db.Preload("Invitee").Where("event_id = ?", eventID).Order("created_at DESC").Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

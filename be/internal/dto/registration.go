package dto

import (
	"net/http"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type RegistrationResponse struct {
	ID           uuid.UUID  `json:"id"`
	EventID      uuid.UUID  `json:"event_id"`
	UserID       uuid.UUID  `json:"user_id"`
	Status       string     `json:"status"`
	QRToken      string     `json:"qr_token"`
	RegisteredAt time.Time  `json:"registered_at"`
	CheckedInAt  *time.Time `json:"checked_in_at"`
}

func NewRegistrationResponse(reg *models.Registration) RegistrationResponse {
	return RegistrationResponse{
		ID:           reg.ID,
		EventID:      reg.EventID,
		UserID:       reg.UserID,
		Status:       reg.Status,
		QRToken:      reg.QRToken,
		RegisteredAt: reg.RegisteredAt,
		CheckedInAt:  reg.CheckedInAt,
	}
}

type ParticipantResponse struct {
	RegistrationID uuid.UUID  `json:"registration_id"`
	UserID         uuid.UUID  `json:"user_id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	Status         string     `json:"status"`
	RegisteredAt   time.Time  `json:"registered_at"`
	CheckedInAt    *time.Time `json:"checked_in_at"`
}

func NewRegistrationResponseList(regs []models.Registration) []RegistrationResponse {
	list := make([]RegistrationResponse, 0, len(regs))
	for i := range regs {
		list = append(list, NewRegistrationResponse(&regs[i]))
	}
	return list
}

type CheckInByQRRequest struct {
	QRToken string `json:"qr_token"`
}

func (r *CheckInByQRRequest) Validate() error {
	r.QRToken = strings.TrimSpace(r.QRToken)
	if r.QRToken == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "qr_token wajib diisi.")
	}
	return nil
}

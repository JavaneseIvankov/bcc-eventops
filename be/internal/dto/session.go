package dto

import (
	"net/http"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type CreateSessionRequest struct {
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Speaker     string    `json:"speaker"`
	Location    string    `json:"location"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
}

func (r *CreateSessionRequest) Validate() error {
	r.Title = strings.TrimSpace(r.Title)
	r.Speaker = strings.TrimSpace(r.Speaker)
	r.Location = strings.TrimSpace(r.Location)

	if r.Title == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Judul sesi wajib diisi.")
	}
	if r.Speaker == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Pembicara wajib diisi.")
	}
	if r.Location == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Lokasi wajib diisi.")
	}
	if !r.EndTime.After(r.StartTime) {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "end_time harus lebih besar dari start_time.")
	}
	return nil
}

type UpdateSessionRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Speaker     *string    `json:"speaker"`
	Location    *string    `json:"location"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
}

func (r *UpdateSessionRequest) Validate() error {
	if r.Title != nil {
		*r.Title = strings.TrimSpace(*r.Title)
		if *r.Title == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Judul sesi tidak boleh kosong.")
		}
	}
	if r.Speaker != nil {
		*r.Speaker = strings.TrimSpace(*r.Speaker)
		if *r.Speaker == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Pembicara tidak boleh kosong.")
		}
	}
	if r.Location != nil {
		*r.Location = strings.TrimSpace(*r.Location)
		if *r.Location == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Lokasi tidak boleh kosong.")
		}
	}
	return nil
}

type UpdateSessionStatusRequest struct {
	Status string `json:"status"`
}

func (r *UpdateSessionStatusRequest) Validate() error {
	switch r.Status {
	case models.SessionStatusUpcoming, models.SessionStatusOngoing, models.SessionStatusFinished:
		return nil
	default:
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Status sesi tidak valid.")
	}
}

type SessionResponse struct {
	ID          uuid.UUID `json:"id"`
	EventID     uuid.UUID `json:"event_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Speaker     string    `json:"speaker"`
	Location    string    `json:"location"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Status      string    `json:"status"`
}

func NewSessionResponse(session *models.Session) SessionResponse {
	return SessionResponse{
		ID:          session.ID,
		EventID:     session.EventID,
		Title:       session.Title,
		Description: session.Description,
		Speaker:     session.Speaker,
		Location:    session.Location,
		StartTime:   session.StartTime,
		EndTime:     session.EndTime,
		Status:      session.Status,
	}
}

func NewSessionResponseList(sessions []models.Session) []SessionResponse {
	list := make([]SessionResponse, 0, len(sessions))
	for i := range sessions {
		list = append(list, NewSessionResponse(&sessions[i]))
	}
	return list
}

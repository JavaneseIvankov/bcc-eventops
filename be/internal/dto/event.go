package dto

import (
	"net/http"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type CreateEventRequest struct {
	Name             string    `json:"name"`
	ShortDescription string    `json:"short_description"`
	PosterURL        *string   `json:"poster_url"`
	Location         string    `json:"location"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	QuotaTotal       int       `json:"quota_total"`
}

func (r *CreateEventRequest) Validate() error {
	r.Name = strings.TrimSpace(r.Name)
	r.ShortDescription = strings.TrimSpace(r.ShortDescription)
	r.Location = strings.TrimSpace(r.Location)

	if r.Name == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Nama event wajib diisi.")
	}
	if r.ShortDescription == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Deskripsi singkat wajib diisi.")
	}
	if r.Location == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Lokasi wajib diisi.")
	}
	if !r.EndTime.After(r.StartTime) {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "end_time harus lebih besar dari start_time.")
	}
	if r.QuotaTotal < 1 {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "quota_total minimal 1.")
	}
	return nil
}

type UpdateEventRequest struct {
	Name             *string    `json:"name"`
	ShortDescription *string    `json:"short_description"`
	PosterURL        *string    `json:"poster_url"`
	Location         *string    `json:"location"`
	StartTime        *time.Time `json:"start_time"`
	EndTime          *time.Time `json:"end_time"`
	QuotaTotal       *int       `json:"quota_total"`
	Status           *string    `json:"status"`
}

func (r *UpdateEventRequest) Validate() error {
	if r.Name != nil {
		*r.Name = strings.TrimSpace(*r.Name)
		if *r.Name == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Nama event tidak boleh kosong.")
		}
	}
	if r.ShortDescription != nil {
		*r.ShortDescription = strings.TrimSpace(*r.ShortDescription)
		if *r.ShortDescription == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Deskripsi singkat tidak boleh kosong.")
		}
	}
	if r.Location != nil {
		*r.Location = strings.TrimSpace(*r.Location)
		if *r.Location == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Lokasi tidak boleh kosong.")
		}
	}
	if r.QuotaTotal != nil && *r.QuotaTotal < 1 {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "quota_total minimal 1.")
	}
	if r.Status != nil {
		switch *r.Status {
		case models.EventStatusUpcoming, models.EventStatusOngoing, models.EventStatusFinished:
		default:
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Status event tidak valid.")
		}
	}
	return nil
}

type EventSummaryResponse struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	ShortDescription string    `json:"short_description"`
	PosterURL        *string   `json:"poster_url"`
	Location         string    `json:"location"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	Status           string    `json:"status"`
	QuotaTotal       int       `json:"quota_total"`
	QuotaFilled      int       `json:"quota_filled"`
	QuotaAvailable   int       `json:"quota_available"`
	MyRole           *string   `json:"my_role"`
}

func NewEventSummaryResponse(event *models.Event, myRole *string) EventSummaryResponse {
	return EventSummaryResponse{
		ID:               event.ID,
		Name:             event.Name,
		ShortDescription: event.ShortDescription,
		PosterURL:        event.PosterURL,
		Location:         event.Location,
		StartTime:        event.StartTime,
		EndTime:          event.EndTime,
		Status:           event.Status,
		QuotaTotal:       event.QuotaTotal,
		QuotaFilled:      event.QuotaFilled,
		QuotaAvailable:   event.QuotaAvailable(),
		MyRole:           myRole,
	}
}

type EventDetailResponse struct {
	EventSummaryResponse
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func NewEventDetailResponse(event *models.Event, myRole *string) EventDetailResponse {
	return EventDetailResponse{
		EventSummaryResponse: NewEventSummaryResponse(event, myRole),
		CreatedAt:            event.CreatedAt,
		UpdatedAt:            event.UpdatedAt,
	}
}

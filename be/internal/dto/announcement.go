package dto

import (
	"net/http"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type CreateAnnouncementRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (r *CreateAnnouncementRequest) Validate() error {
	r.Title = strings.TrimSpace(r.Title)
	r.Content = strings.TrimSpace(r.Content)

	if r.Title == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Judul pengumuman wajib diisi.")
	}
	if r.Content == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Isi pengumuman wajib diisi.")
	}
	return nil
}

type UpdateAnnouncementRequest struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

func (r *UpdateAnnouncementRequest) Validate() error {
	if r.Title != nil {
		*r.Title = strings.TrimSpace(*r.Title)
		if *r.Title == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Judul pengumuman tidak boleh kosong.")
		}
	}
	if r.Content != nil {
		*r.Content = strings.TrimSpace(*r.Content)
		if *r.Content == "" {
			return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Isi pengumuman tidak boleh kosong.")
		}
	}
	return nil
}

type AnnouncementResponse struct {
	ID         uuid.UUID `json:"id"`
	EventID    uuid.UUID `json:"event_id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	AuthorName string    `json:"author_name"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func NewAnnouncementResponse(a *models.Announcement) AnnouncementResponse {
	resp := AnnouncementResponse{
		ID:        a.ID,
		EventID:   a.EventID,
		Title:     a.Title,
		Content:   a.Content,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
	if a.Author != nil {
		resp.AuthorName = a.Author.Name
	}
	return resp
}

func NewAnnouncementResponseList(announcements []models.Announcement) []AnnouncementResponse {
	list := make([]AnnouncementResponse, 0, len(announcements))
	for i := range announcements {
		list = append(list, NewAnnouncementResponse(&announcements[i]))
	}
	return list
}

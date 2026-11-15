package dto

import (
	"time"

	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type BookmarkedSessionResponse struct {
	SessionID uuid.UUID `json:"session_id"`
	Title     string    `json:"title"`
	EventID   uuid.UUID `json:"event_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"bookmarked_at"`
}

func NewBookmarkedSessionResponse(b *models.SessionBookmark) BookmarkedSessionResponse {
	resp := BookmarkedSessionResponse{
		SessionID: b.SessionID,
		CreatedAt: b.CreatedAt,
	}
	if b.Session != nil {
		resp.Title = b.Session.Title
		resp.EventID = b.Session.EventID
		resp.StartTime = b.Session.StartTime
		resp.EndTime = b.Session.EndTime
		resp.Status = b.Session.Status
	}
	return resp
}

func NewBookmarkedSessionResponseList(bookmarks []models.SessionBookmark) []BookmarkedSessionResponse {
	list := make([]BookmarkedSessionResponse, 0, len(bookmarks))
	for i := range bookmarks {
		list = append(list, NewBookmarkedSessionResponse(&bookmarks[i]))
	}
	return list
}

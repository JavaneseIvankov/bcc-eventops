package handler

import (
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RealtimeHandler struct {
	hub *ws.Hub
}

func NewRealtimeHandler(hub *ws.Hub) *RealtimeHandler {
	return &RealtimeHandler{hub: hub}
}

func (h *RealtimeHandler) PublicRoom(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	return websocket.New(func(conn *websocket.Conn) {
		client := ws.NewClient(conn, userID, eventID, ws.RoomPublic)
		h.hub.Register(client)
		defer h.hub.Unregister(client)

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	})(c)
}

func (h *RealtimeHandler) CommitteeRoom(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	return websocket.New(func(conn *websocket.Conn) {
		client := ws.NewClient(conn, userID, eventID, ws.RoomCommittee)
		h.hub.Register(client)
		defer h.hub.Unregister(client)

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	})(c)
}

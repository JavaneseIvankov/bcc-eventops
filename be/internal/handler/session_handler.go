package handler

import (
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SessionHandler struct {
	sessionService service.SessionService
}

func NewSessionHandler(sessionService service.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

// @Summary Mendapatkan daftar sesi rundown terurut berdasarkan waktu mulai
// @Tags Sessions
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {array} dto.SessionResponse
// @Failure 404 {string} string "Event tidak ditemukan"
// @Router /events/{eventId}/sessions [get]
func (h *SessionHandler) List(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	sessions, err := h.sessionService.List(eventID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Daftar sesi berhasil diambil.", dto.NewSessionResponseList(sessions))
}

// @Summary Menambahkan sesi baru ke dalam rundown (Khusus COORDINATOR)
// @Tags Sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param request body dto.CreateSessionRequest true "Data sesi"
// @Success 201 {object} dto.SessionResponse
// @Failure 403 {string} string "Hanya coordinator yang dapat menambahkan sesi"
// @Router /events/{eventId}/sessions [post]
func (h *SessionHandler) Create(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.CreateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	session, err := h.sessionService.Create(eventID, userID, req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Sesi berhasil dibuat.", dto.NewSessionResponse(session))
}

// @Summary Mengedit detail sesi (Khusus COORDINATOR)
// @Tags Sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param sessionId path string true "UUID Sesi"
// @Param request body dto.UpdateSessionRequest true "Data sesi yang diubah"
// @Success 200 {object} dto.SessionResponse
// @Failure 403 {string} string "Hanya coordinator yang dapat mengedit sesi"
// @Router /events/{eventId}/sessions/{sessionId} [patch]
func (h *SessionHandler) Update(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.UpdateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	session, err := h.sessionService.Update(eventID, sessionID, userID, req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Sesi berhasil diperbarui.", dto.NewSessionResponse(session))
}

// @Summary Menghapus sesi dari rundown (Khusus COORDINATOR)
// @Tags Sessions
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param sessionId path string true "UUID Sesi"
// @Success 200 {string} string "Sesi berhasil dihapus"
// @Failure 403 {string} string "Hanya coordinator yang dapat menghapus sesi"
// @Router /events/{eventId}/sessions/{sessionId} [delete]
func (h *SessionHandler) Delete(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.sessionService.Delete(eventID, sessionID, userID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Sesi berhasil dihapus.", nil)
}

// @Summary Memperbarui status sesi (COORDINATOR & COMMITTEE)
// @Tags Sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param sessionId path string true "UUID Sesi"
// @Param request body dto.UpdateSessionStatusRequest true "Status baru"
// @Success 200 {object} dto.SessionResponse
// @Failure 400 {string} string "Event sudah FINISHED sehingga status sesi tidak dapat diubah"
// @Router /events/{eventId}/sessions/{sessionId}/status [patch]
func (h *SessionHandler) UpdateStatus(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.UpdateSessionStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	session, err := h.sessionService.UpdateStatus(eventID, sessionID, userID, req.Status)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Status sesi berhasil diubah.", dto.NewSessionResponse(session))
}

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

type AnnouncementHandler struct {
	announcementService service.AnnouncementService
}

func NewAnnouncementHandler(announcementService service.AnnouncementService) *AnnouncementHandler {
	return &AnnouncementHandler{announcementService: announcementService}
}

// @Summary Mendapatkan daftar pengumuman event (Terbaru di atas)
// @Tags Operations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {array} dto.AnnouncementResponse
// @Router /events/{eventId}/announcements [get]
func (h *AnnouncementHandler) List(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	announcements, err := h.announcementService.List(eventID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Daftar pengumuman berhasil diambil.", dto.NewAnnouncementResponseList(announcements))
}

// @Summary Membuat pengumuman baru (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param request body dto.CreateAnnouncementRequest true "Data pengumuman"
// @Success 201 {object} dto.AnnouncementResponse
// @Router /events/{eventId}/announcements [post]
func (h *AnnouncementHandler) Create(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	authorID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.CreateAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	announcement, err := h.announcementService.Create(eventID, authorID, req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Pengumuman berhasil diterbitkan.", dto.NewAnnouncementResponse(announcement))
}

// @Summary Mengedit pengumuman (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param announcementId path string true "UUID Pengumuman"
// @Param request body dto.UpdateAnnouncementRequest true "Data pengumuman yang diubah"
// @Success 200 {object} dto.AnnouncementResponse
// @Router /events/{eventId}/announcements/{announcementId} [patch]
func (h *AnnouncementHandler) Update(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	announcementID, err := uuid.Parse(c.Params("announcementId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	var req dto.UpdateAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	announcement, err := h.announcementService.Update(eventID, announcementID, req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Pengumuman berhasil diperbarui.", dto.NewAnnouncementResponse(announcement))
}

// @Summary Menghapus pengumuman (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param announcementId path string true "UUID Pengumuman"
// @Success 200 {string} string "Pengumuman berhasil dihapus"
// @Router /events/{eventId}/announcements/{announcementId} [delete]
func (h *AnnouncementHandler) Delete(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	announcementID, err := uuid.Parse(c.Params("announcementId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	if err := h.announcementService.Delete(eventID, announcementID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Pengumuman berhasil dihapus.", nil)
}

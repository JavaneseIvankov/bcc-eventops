package handler

import (
	"math"
	"strconv"

	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type EventHandler struct {
	eventService service.EventService
}

func NewEventHandler(eventService service.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

// @Summary Membuat event baru (Pembuat otomatis menjadi COORDINATOR)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateEventRequest true "Data event"
// @Success 201 {object} dto.EventDetailResponse
// @Failure 400 {string} string "Data yang dikirim tidak valid"
// @Router /events [post]
func (h *EventHandler) Create(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.CreateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	event, err := h.eventService.Create(userID, req)
	if err != nil {
		return err
	}

	myRole := models.RoleCoordinator
	return response.Success(c, fiber.StatusCreated, "Event berhasil dibuat.", dto.NewEventDetailResponse(event, &myRole))
}

// @Summary Katalog daftar event (Paginated)
// @Tags Events
// @Produce json
// @Security BearerAuth
// @Param page query int false "Halaman"
// @Param limit query int false "Jumlah per halaman"
// @Param search query string false "Cari berdasarkan nama event"
// @Param status query string false "Filter status event"
// @Param managed_by_me query bool false "Filter event yang dikelola user"
// @Success 200 {array} dto.EventSummaryResponse
// @Router /events [get]
func (h *EventHandler) List(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")
	managedByMe := c.QueryBool("managed_by_me", false)

	events, roles, total, err := h.eventService.List(userID, page, limit, search, status, managedByMe)
	if err != nil {
		return err
	}

	items := make([]dto.EventSummaryResponse, len(events))
	for i := range events {
		var myRole *string
		if role, ok := roles[events[i].ID]; ok {
			myRole = &role
		}
		items[i] = dto.NewEventSummaryResponse(&events[i], myRole)
	}

	if limit < 1 {
		limit = 10
	}
	if page < 1 {
		page = 1
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	meta := response.Meta{Page: page, Limit: limit, TotalItems: int(total), TotalPages: totalPages}
	return response.SuccessWithMeta(c, fiber.StatusOK, "Daftar event berhasil diambil.", items, meta)
}

// @Summary Mendapatkan detail informasi event beserta my_role dan kuota
// @Tags Events
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {object} dto.EventDetailResponse
// @Failure 404 {string} string "Event tidak ditemukan"
// @Router /events/{eventId} [get]
func (h *EventHandler) Get(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	event, myRole, err := h.eventService.Detail(eventID, userID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Detail event berhasil diambil.", dto.NewEventDetailResponse(event, myRole))
}

// @Summary Mengubah informasi event atau kapasitas (Khusus COORDINATOR)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param request body dto.UpdateEventRequest true "Data event yang diubah"
// @Success 200 {object} dto.EventDetailResponse
// @Failure 400 {string} string "Kapasitas baru lebih kecil dari jumlah pendaftar aktif"
// @Failure 403 {string} string "Hanya coordinator yang dapat mengubah event"
// @Router /events/{eventId} [patch]
func (h *EventHandler) Update(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	var req dto.UpdateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	event, err := h.eventService.Update(eventID, req)
	if err != nil {
		return err
	}

	myRole := models.RoleCoordinator
	return response.Success(c, fiber.StatusOK, "Event berhasil diperbarui.", dto.NewEventDetailResponse(event, &myRole))
}

// @Summary Menghapus event beserta seluruh data terkait (Khusus COORDINATOR)
// @Tags Events
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {string} string "Event berhasil dihapus"
// @Failure 403 {string} string "Hanya coordinator yang dapat menghapus event"
// @Router /events/{eventId} [delete]
func (h *EventHandler) Delete(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	if err := h.eventService.Delete(eventID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Event berhasil dihapus.", nil)
}

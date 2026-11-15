package handler

import (
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DashboardHandler struct {
	dashboardService service.DashboardService
}

func NewDashboardHandler(dashboardService service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

// @Summary Mendapatkan ringkasan statistik operasional kehadiran & sesi (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {object} dto.DashboardSummaryResponse
// @Router /events/{eventId}/dashboard [get]
func (h *DashboardHandler) Get(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	var summary dto.DashboardSummaryResponse
	summary, err = h.dashboardService.GetSummary(eventID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Ringkasan dashboard berhasil diambil.", summary)
}

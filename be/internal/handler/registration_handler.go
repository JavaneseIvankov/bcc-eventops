package handler

import (
	"bytes"
	"encoding/csv"
	"math"
	"strconv"

	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RegistrationHandler struct {
	registrationService service.RegistrationService
}

func NewRegistrationHandler(registrationService service.RegistrationService) *RegistrationHandler {
	return &RegistrationHandler{registrationService: registrationService}
}

// @Summary Mendaftarkan diri sendiri sebagai peserta pada event
// @Tags Registrations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 201 {object} dto.RegistrationResponse
// @Failure 400 {string} string "Event tidak berstatus UPCOMING"
// @Failure 409 {string} string "Kuota penuh atau sudah terdaftar aktif"
// @Router /events/{eventId}/registrations [post]
func (h *RegistrationHandler) Register(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	registration, err := h.registrationService.Register(eventID, userID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Pendaftaran berhasil.", dto.NewRegistrationResponse(registration))
}

// @Summary Membatalkan pendaftaran diri sendiri (Hanya saat event UPCOMING & belum CHECKED_IN)
// @Tags Registrations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {string} string "Pendaftaran berhasil dibatalkan dan kuota dilepaskan"
// @Failure 400 {string} string "Event sudah dimulai/selesai atau peserta sudah check-in"
// @Router /events/{eventId}/registrations/me/cancel [post]
func (h *RegistrationHandler) CancelSelf(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.registrationService.CancelSelf(eventID, userID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Pendaftaran berhasil dibatalkan.", nil)
}

// @Summary Membatalkan pendaftaran peserta lain (Khusus COORDINATOR)
// @Tags Registrations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param registrationId path string true "UUID Pendaftaran"
// @Success 200 {string} string "Pendaftaran peserta berhasil dibatalkan"
// @Router /events/{eventId}/registrations/{registrationId}/cancel [post]
func (h *RegistrationHandler) CancelByID(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	registrationID, err := uuid.Parse(c.Params("registrationId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	if err := h.registrationService.CancelByID(eventID, registrationID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Pendaftaran peserta berhasil dibatalkan.", nil)
}

// @Summary Melihat daftar pendaftaran event saya
// @Tags Registrations
// @Produce json
// @Security BearerAuth
// @Param page query int false "Halaman"
// @Param limit query int false "Jumlah per halaman"
// @Param status query string false "Filter status pendaftaran"
// @Success 200 {array} dto.RegistrationResponse
// @Router /me/registrations [get]
func (h *RegistrationHandler) ListMine(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")

	registrations, total, err := h.registrationService.ListMine(userID, page, limit, status)
	if err != nil {
		return err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	meta := response.Meta{Page: page, Limit: limit, TotalItems: int(total), TotalPages: totalPages}
	return response.SuccessWithMeta(c, fiber.StatusOK, "Daftar pendaftaran saya berhasil diambil.", dto.NewRegistrationResponseList(registrations), meta)
}

// @Summary Mendapatkan daftar tabel peserta dengan pencarian & filter (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param page query int false "Halaman"
// @Param limit query int false "Jumlah per halaman"
// @Param search query string false "Cari berdasarkan nama atau email"
// @Param status query string false "Filter status pendaftaran"
// @Success 200 {array} dto.ParticipantResponse
// @Router /events/{eventId}/participants [get]
func (h *RegistrationHandler) ListParticipants(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")

	participants, total, err := h.registrationService.ListParticipants(eventID, page, limit, search, status)
	if err != nil {
		return err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	meta := response.Meta{Page: page, Limit: limit, TotalItems: int(total), TotalPages: totalPages}
	return response.SuccessWithMeta(c, fiber.StatusOK, "Daftar peserta berhasil diambil.", participants, meta)
}

// @Summary Check-in peserta secara manual dari daftar peserta (COORDINATOR & COMMITTEE)
// @Tags Registrations
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param registrationId path string true "UUID Pendaftaran"
// @Success 200 {object} dto.RegistrationResponse
// @Failure 400 {string} string "Pendaftaran berstatus CANCELLED atau Event sudah FINISHED"
// @Failure 409 {string} string "Peserta sudah berstatus CHECKED_IN sebelumnya"
// @Router /events/{eventId}/registrations/{registrationId}/check-in [post]
func (h *RegistrationHandler) CheckIn(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	registrationID, err := uuid.Parse(c.Params("registrationId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	registration, err := h.registrationService.CheckIn(eventID, registrationID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Check-in berhasil.", dto.NewRegistrationResponse(registration))
}

// @Summary Check-in peserta dengan memindai QR Token (COORDINATOR & COMMITTEE)
// @Tags Registrations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param request body dto.CheckInByQRRequest true "QR token peserta"
// @Success 200 {object} dto.RegistrationResponse
// @Failure 404 {string} string "QR token tidak ditemukan"
// @Failure 409 {string} string "Peserta sudah berstatus CHECKED_IN sebelumnya"
// @Router /events/{eventId}/check-in/qr [post]
func (h *RegistrationHandler) CheckInByQR(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	var req dto.CheckInByQRRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	registration, err := h.registrationService.CheckInByQR(eventID, req.QRToken)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Check-in via QR berhasil.", dto.NewRegistrationResponse(registration))
}

// @Summary Ekspor rekap peserta dan kehadiran ke CSV (COORDINATOR & COMMITTEE)
// @Tags Operations
// @Produce text/csv
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param search query string false "Cari berdasarkan nama atau email"
// @Param status query string false "Filter status pendaftaran"
// @Success 200 {string} string "File CSV"
// @Router /events/{eventId}/participants/export [get]
func (h *RegistrationHandler) ExportParticipants(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	search := c.Query("search")
	status := c.Query("status")

	participants, err := h.registrationService.ExportParticipants(eventID, search, status)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	_ = writer.Write([]string{"name", "email", "status", "registered_at", "checked_in_at"})
	for _, p := range participants {
		checkedInAt := ""
		if p.CheckedInAt != nil {
			checkedInAt = p.CheckedInAt.Format("2006-01-02T15:04:05Z07:00")
		}
		_ = writer.Write([]string{
			p.Name,
			p.Email,
			p.Status,
			p.RegisteredAt.Format("2006-01-02T15:04:05Z07:00"),
			checkedInAt,
		})
	}
	writer.Flush()

	c.Set(fiber.HeaderContentType, "text/csv")
	c.Set(fiber.HeaderContentDisposition, `attachment; filename="participants.csv"`)
	return c.Send(buf.Bytes())
}

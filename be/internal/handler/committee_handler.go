package handler

import (
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

type CommitteeHandler struct {
	committeeService service.CommitteeService
}

func NewCommitteeHandler(committeeService service.CommitteeService) *CommitteeHandler {
	return &CommitteeHandler{committeeService: committeeService}
}

// @Summary Mengundang pengguna terdaftar sebagai panitia/koordinator (Khusus COORDINATOR)
// @Tags Committees
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param request body dto.InviteRequest true "Data undangan"
// @Success 201 {object} dto.InvitationResponse
// @Failure 404 {string} string "Akun dengan email tersebut tidak ditemukan"
// @Router /events/{eventId}/invitations [post]
func (h *CommitteeHandler) Invite(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	inviterID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	var req dto.InviteRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	invitation, err := h.committeeService.Invite(eventID, inviterID, req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Undangan berhasil dikirim.", dto.NewInvitationResponse(invitation))
}

// @Summary Melihat daftar undangan kepanitiaan yang masuk untuk pengguna saat ini
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param page query int false "Halaman"
// @Param limit query int false "Jumlah per halaman"
// @Param status query string false "Filter status undangan"
// @Success 200 {array} dto.InvitationResponse
// @Router /me/invitations [get]
func (h *CommitteeHandler) ListMyInvitations(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")

	invitations, total, err := h.committeeService.ListMyInvitations(userID, page, limit, status)
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
	return response.SuccessWithMeta(c, fiber.StatusOK, "Daftar undangan berhasil diambil.", dto.NewInvitationResponseList(invitations), meta)
}

// @Summary Menerima undangan kepanitiaan
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param invitationId path string true "UUID Undangan"
// @Success 200 {object} dto.InvitationResponse
// @Router /invitations/{invitationId}/accept [post]
func (h *CommitteeHandler) Accept(c *fiber.Ctx) error {
	invitationID, err := uuid.Parse(c.Params("invitationId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	invitation, err := h.committeeService.Accept(invitationID, userID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Undangan diterima.", dto.NewInvitationResponse(invitation))
}

// @Summary Menolak undangan kepanitiaan
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param invitationId path string true "UUID Undangan"
// @Success 200 {string} string "Undangan ditolak"
// @Router /invitations/{invitationId}/reject [post]
func (h *CommitteeHandler) Reject(c *fiber.Ctx) error {
	invitationID, err := uuid.Parse(c.Params("invitationId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.committeeService.Reject(invitationID, userID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Undangan ditolak.", nil)
}

// @Summary Membatalkan undangan yang masih berstatus PENDING (Khusus COORDINATOR)
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param invitationId path string true "UUID Undangan"
// @Success 200 {string} string "Undangan berhasil dibatalkan"
// @Router /events/{eventId}/invitations/{invitationId} [delete]
func (h *CommitteeHandler) CancelInvitation(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	invitationID, err := uuid.Parse(c.Params("invitationId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	if err := h.committeeService.CancelInvitation(eventID, invitationID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Undangan berhasil dibatalkan.", nil)
}

// @Summary Melihat daftar anggota panitia aktif dan status undangan (Khusus Panitia/Koordinator)
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {object} dto.CommitteeOverviewResponse
// @Router /events/{eventId}/committees [get]
func (h *CommitteeHandler) GetOverview(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	members, invitations, err := h.committeeService.GetOverview(eventID)
	if err != nil {
		return err
	}

	overview := dto.CommitteeOverviewResponse{
		Members:     dto.NewCommitteeMemberResponseList(members),
		Invitations: dto.NewInvitationResponseList(invitations),
	}

	return response.Success(c, fiber.StatusOK, "Daftar kepanitiaan berhasil diambil.", overview)
}

// @Summary Mengubah role anggota panitia aktif (Khusus COORDINATOR)
// @Tags Committees
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param userId path string true "UUID Pengguna"
// @Param request body dto.UpdateMemberRoleRequest true "Role baru"
// @Success 200 {object} dto.CommitteeMemberResponse
// @Failure 409 {string} string "Tidak bisa menurunkan Koordinator terakhir"
// @Router /events/{eventId}/committees/{userId} [patch]
func (h *CommitteeHandler) UpdateMemberRole(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	targetUserID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	var req dto.UpdateMemberRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	member, err := h.committeeService.UpdateMemberRole(eventID, targetUserID, req.Role)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Role berhasil diubah.", dto.NewCommitteeMemberResponse(member))
}

// @Summary Mengeluarkan anggota panitia dari event (Khusus COORDINATOR)
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param userId path string true "UUID Pengguna"
// @Success 200 {string} string "Anggota panitia berhasil dikeluarkan"
// @Failure 409 {string} string "Tidak bisa mengeluarkan Koordinator terakhir"
// @Router /events/{eventId}/committees/{userId} [delete]
func (h *CommitteeHandler) RemoveMember(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}
	targetUserID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	if err := h.committeeService.RemoveMember(eventID, targetUserID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Anggota panitia berhasil dikeluarkan.", nil)
}

// @Summary Keluar secara mandiri dari kepanitiaan event
// @Tags Committees
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Success 200 {string} string "Berhasil keluar dari kepanitiaan"
// @Failure 409 {string} string "Koordinator terakhir tidak dapat keluar sebelum menunjuk pengganti"
// @Router /events/{eventId}/committees/me [delete]
func (h *CommitteeHandler) LeaveSelf(c *fiber.Ctx) error {
	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.committeeService.LeaveSelf(eventID, userID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Berhasil keluar dari kepanitiaan.", nil)
}

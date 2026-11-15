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

type BookmarkHandler struct {
	bookmarkService service.BookmarkService
}

func NewBookmarkHandler(bookmarkService service.BookmarkService) *BookmarkHandler {
	return &BookmarkHandler{bookmarkService: bookmarkService}
}

// @Summary Bookmark sebuah sesi
// @Tags Sessions
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param sessionId path string true "UUID Sesi"
// @Success 201 {string} string "Sesi berhasil di-bookmark"
// @Router /events/{eventId}/sessions/{sessionId}/bookmark [post]
func (h *BookmarkHandler) Add(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.bookmarkService.Add(userID, sessionID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Sesi berhasil di-bookmark.", nil)
}

// @Summary Hapus bookmark sebuah sesi
// @Tags Sessions
// @Produce json
// @Security BearerAuth
// @Param eventId path string true "UUID Event"
// @Param sessionId path string true "UUID Sesi"
// @Success 200 {string} string "Bookmark berhasil dihapus"
// @Router /events/{eventId}/sessions/{sessionId}/bookmark [delete]
func (h *BookmarkHandler) Remove(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return apperr.ErrInvalidInput
	}

	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := h.bookmarkService.Remove(userID, sessionID); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Bookmark berhasil dihapus.", nil)
}

// @Summary Daftar sesi yang saya bookmark
// @Tags Sessions
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.BookmarkedSessionResponse
// @Router /me/bookmarks [get]
func (h *BookmarkHandler) ListMine(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	bookmarks, err := h.bookmarkService.ListMine(userID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Daftar bookmark berhasil diambil.", dto.NewBookmarkedSessionResponseList(bookmarks))
}

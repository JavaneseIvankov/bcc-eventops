package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const (
	maxPosterUploadSize = 5 * 1024 * 1024
	posterUploadDir     = "./uploads/posters"
)

var allowedPosterExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// @Summary Upload file gambar poster event
// @Tags Uploads
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "File gambar poster (maks. 5MB)"
// @Success 201 {object} map[string]string
// @Failure 400 {string} string "File tidak valid"
// @Router /uploads [post]
func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "File wajib diunggah.")
	}

	if fileHeader.Size > maxPosterUploadSize {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Ukuran file maksimal 5MB.")
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedPosterExtensions[ext] {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Format file harus jpg, jpeg, png, webp, atau gif.")
	}

	if err := os.MkdirAll(posterUploadDir, 0o755); err != nil {
		return apperr.ErrInternal
	}

	filename := uuid.New().String() + ext
	path := filepath.Join(posterUploadDir, filename)
	if err := c.SaveFile(fileHeader, path); err != nil {
		return apperr.ErrInternal
	}

	url := "/uploads/posters/" + filename
	return response.Success(c, fiber.StatusCreated, "File berhasil diunggah.", fiber.Map{"url": url})
}

package router

import (
	"errors"
	"log"

	"github.com/bcc/eventops-be/internal/config"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

func Register(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": cfg.App.Name})
	})

	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api/v1")
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "BCC EventOps API v1",
		})
	})

	_ = db
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	var appErr *apperr.AppError
	if errors.As(err, &appErr) {
		return response.Error(c, appErr.Status, appErr.Code, appErr.Message)
	}

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return response.Error(c, fiberErr.Code, "HTTP_ERROR", fiberErr.Message)
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return response.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Data tidak ditemukan.")
	}

	log.Printf("unhandled error: %v", err)
	return response.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Terjadi kesalahan pada server.")
}

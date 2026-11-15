package router

import (
	"errors"
	"log"

	"github.com/bcc/eventops-be/internal/config"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/handler"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

func Register(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": cfg.App.Name})
	})

	app.Get("/swagger/*", swagger.HandlerDefault)

	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	authService := service.NewAuthService(userRepo, refreshTokenRepo, cfg.JWT)
	authHandler := handler.NewAuthHandler(authService)

	eventRepo := repository.NewEventRepository(db)
	registrationRepo := repository.NewRegistrationRepository(db)
	committeeRepo := repository.NewCommitteeRepository(db)
	eventService := service.NewEventService(eventRepo, registrationRepo)
	eventHandler := handler.NewEventHandler(eventService)

	registrationService := service.NewRegistrationService(registrationRepo)
	registrationHandler := handler.NewRegistrationHandler(registrationService)

	api := app.Group("/api/v1")
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "BCC EventOps API v1",
		})
	})

	authMiddleware := middleware.RequireAuth(cfg)

	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", authMiddleware, authHandler.Me)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authHandler.Logout)

	requireCoordinator := middleware.RequireEventRole(committeeRepo, models.RoleCoordinator)

	events := api.Group("/events", authMiddleware)
	events.Get("/", eventHandler.List)
	events.Post("/", eventHandler.Create)
	events.Get("/:eventId", eventHandler.Get)
	events.Patch("/:eventId", requireCoordinator, eventHandler.Update)
	events.Delete("/:eventId", requireCoordinator, eventHandler.Delete)

	registrations := events.Group("/:eventId/registrations")
	registrations.Post("/", registrationHandler.Register)
	registrations.Post("/me/cancel", registrationHandler.CancelSelf)
	registrations.Post("/:registrationId/cancel", requireCoordinator, registrationHandler.CancelByID)

	me := api.Group("/me", authMiddleware)
	me.Get("/registrations", registrationHandler.ListMine)
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

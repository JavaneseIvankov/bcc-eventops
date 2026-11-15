package bootstrap

import (
	"github.com/bcc/eventops-be/internal/config"
	"github.com/bcc/eventops-be/internal/database"
	"github.com/bcc/eventops-be/internal/router"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

type App struct {
	Fiber *fiber.App
	DB    *gorm.DB
	Cfg   *config.Config
}

func New() (*fiber.App, *config.Config, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, err
	}

	db, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		return nil, nil, err
	}

	app := fiber.New(fiber.Config{
		AppName:               cfg.App.Name,
		DisableStartupMessage: true,
		ErrorHandler:          router.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	router.Register(app, db, cfg)

	return app, cfg, nil
}

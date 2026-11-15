package middleware

import (
	"github.com/bcc/eventops-be/internal/config"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/utils"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func RequireWSUpgrade(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func RequireWSAuth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Query("token")
		if token == "" {
			return apperr.ErrUnauthorized
		}

		claims, err := utils.ParseToken(cfg.JWT.AccessSecret, token)
		if err != nil {
			return apperr.ErrUnauthorized
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			return apperr.ErrUnauthorized
		}

		c.Locals(UserIDContextKey, userID)
		return c.Next()
	}
}

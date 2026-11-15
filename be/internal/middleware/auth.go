package middleware

import (
	"strings"

	"github.com/bcc/eventops-be/internal/config"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const UserIDContextKey = "userID"

func RequireAuth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			return apperr.ErrUnauthorized
		}

		claims, err := utils.ParseToken(cfg.JWT.AccessSecret, parts[1])
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

func UserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userID, ok := c.Locals(UserIDContextKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, apperr.ErrUnauthorized
	}
	return userID, nil
}

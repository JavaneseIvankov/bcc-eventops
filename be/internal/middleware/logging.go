package middleware

import (
	"errors"
	"log/slog"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func StructuredLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		status := c.Response().StatusCode()
		if err != nil {
			var appErr *apperr.AppError
			var fiberErr *fiber.Error
			switch {
			case errors.As(err, &appErr):
				status = appErr.Status
			case errors.As(err, &fiberErr):
				status = fiberErr.Code
			default:
				status = fiber.StatusInternalServerError
			}
		}

		attrs := []any{
			slog.String("method", c.Method()),
			slog.String("path", c.Path()),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("ip", c.IP()),
		}

		if userID, ok := c.Locals(UserIDContextKey).(uuid.UUID); ok {
			attrs = append(attrs, slog.String("user_id", userID.String()))
		}

		if err != nil {
			slog.Error("request failed", append(attrs, slog.String("error", err.Error()))...)
		} else {
			slog.Info("request completed", attrs...)
		}

		return err
	}
}

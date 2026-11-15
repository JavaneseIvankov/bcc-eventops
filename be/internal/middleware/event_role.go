package middleware

import (
	"errors"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func RequireEventRole(committeeRepo repository.CommitteeRepository, allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		eventID, err := uuid.Parse(c.Params("eventId"))
		if err != nil {
			return apperr.ErrInvalidInput
		}

		userID, err := UserIDFromContext(c)
		if err != nil {
			return err
		}

		role, err := committeeRepo.FindRole(eventID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperr.ErrForbidden
			}
			return err
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				return c.Next()
			}
		}
		return apperr.ErrForbidden
	}
}

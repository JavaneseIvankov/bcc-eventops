package handler

import (
	"time"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/gofiber/fiber/v2"
)

func setAuthCookies(c *fiber.Ctx, cfg *config.Config, accessToken, refreshToken string) {
	secure := cfg.App.Env == "production"

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Expires:  time.Now().Add(cfg.JWT.AccessTTL),
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Expires:  time.Now().Add(cfg.JWT.RefreshTTL),
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
	})
}

func clearAuthCookies(c *fiber.Ctx, cfg *config.Config) {
	secure := cfg.App.Env == "production"
	expired := time.Now().Add(-time.Hour)

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  expired,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  expired,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
	})
}

package handler

import (
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// @Summary Registrasi akun pengguna baru
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "Data registrasi"
// @Success 201 {object} dto.UserResponse
// @Failure 400 {string} string "Data yang dikirim tidak valid"
// @Failure 409 {string} string "Email sudah terdaftar"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	user, err := h.authService.Register(req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusCreated, "Registrasi berhasil.", dto.NewUserResponse(user))
}

// @Summary Login pengguna dengan email dan password
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "Kredensial login"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {string} string "Data yang dikirim tidak valid"
// @Failure 401 {string} string "Email atau password salah"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	user, accessToken, refreshToken, err := h.authService.Login(req)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Login berhasil.", dto.NewAuthResponse(user, accessToken, refreshToken))
}

// @Summary Mendapatkan profil pengguna yang sedang login
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dto.UserResponse
// @Failure 401 {string} string "Autentikasi diperlukan"
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, err := middleware.UserIDFromContext(c)
	if err != nil {
		return err
	}

	user, err := h.authService.Me(userID)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Profil pengguna berhasil diambil.", dto.NewUserResponse(user))
}

// @Summary Memperbarui access_token menggunakan refresh_token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.RefreshRequest true "Refresh token"
// @Success 200 {object} dto.TokenResponse
// @Failure 401 {string} string "Autentikasi diperlukan"
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var req dto.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return apperr.ErrInvalidInput
	}
	if err := req.Validate(); err != nil {
		return err
	}

	accessToken, newRefreshToken, err := h.authService.Refresh(req.RefreshToken)
	if err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Token berhasil diperbarui.", dto.NewTokenResponse(accessToken, newRefreshToken))
}

// @Summary Logout dan revoke refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.LogoutRequest false "Refresh token yang akan di-revoke"
// @Success 200 {string} string "Logout berhasil"
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	var req dto.LogoutRequest
	_ = c.BodyParser(&req)

	if err := h.authService.Logout(req.RefreshToken); err != nil {
		return err
	}

	return response.Success(c, fiber.StatusOK, "Logout berhasil.", nil)
}

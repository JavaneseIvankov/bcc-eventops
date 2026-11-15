package dto

import (
	"net/http"
	"net/mail"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *RegisterRequest) Sanitize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
}

func (r *RegisterRequest) Validate() error {
	r.Sanitize()
	if len(r.Name) < 2 {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Nama minimal 2 karakter.")
	}
	if _, err := mail.ParseAddress(r.Email); err != nil {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Format email tidak valid.")
	}
	if len(r.Password) < 8 {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Password minimal 8 karakter.")
	}
	return nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *LoginRequest) Sanitize() {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
}

func (r *LoginRequest) Validate() error {
	r.Sanitize()
	if _, err := mail.ParseAddress(r.Email); err != nil {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Format email tidak valid.")
	}
	if r.Password == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Password wajib diisi.")
	}
	return nil
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

func NewUserResponse(user *models.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
}

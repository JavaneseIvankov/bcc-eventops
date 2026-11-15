package service

import (
	"errors"
	"time"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(req dto.RegisterRequest) (*models.User, error)
	Login(req dto.LoginRequest) (*models.User, string, string, error)
	Me(userID uuid.UUID) (*models.User, error)
	Refresh(refreshToken string) (string, string, error)
	Logout(refreshToken string) error
}

type authService struct {
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	jwtCfg           config.JWTConfig
}

func NewAuthService(userRepo repository.UserRepository, refreshTokenRepo repository.RefreshTokenRepository, jwtCfg config.JWTConfig) AuthService {
	return &authService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtCfg:           jwtCfg,
	}
}

func (s *authService) Register(req dto.RegisterRequest) (*models.User, error) {
	_, err := s.userRepo.FindByEmail(req.Email)
	if err == nil {
		return nil, apperr.ErrEmailExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, apperr.ErrInternal
	}

	user := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: passwordHash,
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(req dto.LoginRequest) (*models.User, string, string, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", apperr.ErrInvalidCreds
		}
		return nil, "", "", err
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		return nil, "", "", apperr.ErrInvalidCreds
	}

	accessToken, refreshToken, err := s.generateTokenPair(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func (s *authService) Me(userID uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.ErrUnauthorized
		}
		return nil, err
	}
	return user, nil
}

func (s *authService) Refresh(refreshToken string) (string, string, error) {
	if refreshToken == "" {
		return "", "", apperr.ErrUnauthorized
	}

	claims, err := utils.ParseToken(s.jwtCfg.RefreshSecret, refreshToken)
	if err != nil {
		return "", "", apperr.ErrUnauthorized
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return "", "", apperr.ErrUnauthorized
	}

	stored, err := s.refreshTokenRepo.FindByTokenHash(utils.HashToken(refreshToken))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", apperr.ErrUnauthorized
		}
		return "", "", err
	}

	if stored.Revoked || stored.UserID != userID || time.Now().UTC().After(stored.ExpiresAt) {
		return "", "", apperr.ErrUnauthorized
	}

	if err := s.refreshTokenRepo.Revoke(stored.ID); err != nil {
		return "", "", err
	}

	return s.generateTokenPair(userID)
}

func (s *authService) Logout(refreshToken string) error {
	if refreshToken == "" {
		return nil
	}

	stored, err := s.refreshTokenRepo.FindByTokenHash(utils.HashToken(refreshToken))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}

	return s.refreshTokenRepo.Revoke(stored.ID)
}

func (s *authService) generateTokenPair(userID uuid.UUID) (string, string, error) {
	accessToken, err := utils.GenerateToken(s.jwtCfg.AccessSecret, userID, s.jwtCfg.AccessTTL)
	if err != nil {
		return "", "", apperr.ErrInternal
	}

	refreshToken, err := utils.GenerateToken(s.jwtCfg.RefreshSecret, userID, s.jwtCfg.RefreshTTL)
	if err != nil {
		return "", "", apperr.ErrInternal
	}

	refreshTokenModel := &models.RefreshToken{
		UserID:    userID,
		TokenHash: utils.HashToken(refreshToken),
		ExpiresAt: time.Now().UTC().Add(s.jwtCfg.RefreshTTL),
	}
	if err := s.refreshTokenRepo.Create(refreshTokenModel); err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

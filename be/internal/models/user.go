package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	Base
	SoftDelete
	Name         string `gorm:"type:varchar(120);not null" json:"name"`
	Email        string `gorm:"type:varchar(255);not null;uniqueIndex:idx_users_email_lower,expression:lower(email)" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"`

	RefreshTokens    []RefreshToken    `gorm:"foreignKey:UserID" json:"-"`
	CreatedEvents    []Event           `gorm:"foreignKey:CreatedBy" json:"-"`
	CommitteeMembers []CommitteeMember `gorm:"foreignKey:UserID" json:"-"`
	Registrations    []Registration    `gorm:"foreignKey:UserID" json:"-"`
}

func (User) TableName() string { return "users" }

type RefreshToken struct {
	Base
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	TokenHash string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"-"`
	ExpiresAt time.Time `gorm:"type:timestamptz;not null" json:"expires_at"`
	Revoked   bool      `gorm:"not null;default:false" json:"revoked"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }

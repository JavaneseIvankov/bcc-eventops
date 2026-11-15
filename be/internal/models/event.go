package models

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	Base
	SoftDelete
	Name             string     `gorm:"type:varchar(200);not null;index" json:"name"`
	ShortDescription string     `gorm:"type:text;not null" json:"short_description"`
	PosterURL        *string    `gorm:"type:text" json:"poster_url"`
	Location         string     `gorm:"type:varchar(255);not null" json:"location"`
	StartTime        time.Time  `gorm:"type:timestamptz;not null;index" json:"start_time"`
	EndTime          time.Time  `gorm:"type:timestamptz;not null" json:"end_time"`
	Status           string     `gorm:"type:varchar(20);not null;default:'UPCOMING';index" json:"status"`
	QuotaTotal       int        `gorm:"type:integer;not null" json:"quota_total"`
	QuotaFilled      int        `gorm:"type:integer;not null;default:0" json:"quota_filled"`
	CreatedBy        uuid.UUID  `gorm:"type:uuid;not null;index" json:"created_by"`
	CreatedByUser    *User      `gorm:"foreignKey:CreatedBy" json:"-"`

	Committees    []CommitteeMember `gorm:"foreignKey:EventID" json:"-"`
	Invitations   []Invitation      `gorm:"foreignKey:EventID" json:"-"`
	Sessions      []Session         `gorm:"foreignKey:EventID" json:"-"`
	Registrations []Registration    `gorm:"foreignKey:EventID" json:"-"`
	Announcements []Announcement    `gorm:"foreignKey:EventID" json:"-"`
}

func (Event) TableName() string { return "events" }

func (e Event) QuotaAvailable() int {
	available := e.QuotaTotal - e.QuotaFilled
	if available < 0 {
		return 0
	}
	return available
}

type CommitteeMember struct {
	Base
	EventID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:uq_committee_event_user" json:"event_id"`
	UserID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:uq_committee_event_user;index" json:"user_id"`
	Role    string    `gorm:"type:varchar(20);not null" json:"role"`

	User *User `gorm:"foreignKey:UserID" json:"-"`
}

func (CommitteeMember) TableName() string { return "committee_members" }

type Invitation struct {
	Base
	EventID       uuid.UUID `gorm:"type:uuid;not null;index" json:"event_id"`
	InviterUserID uuid.UUID `gorm:"type:uuid;not null" json:"inviter_user_id"`
	InviteeUserID uuid.UUID `gorm:"type:uuid;not null;index" json:"invitee_user_id"`
	Role          string    `gorm:"type:varchar(20);not null" json:"role"`
	Status        string    `gorm:"type:varchar(20);not null;default:'PENDING';index" json:"status"`

	Event   *Event `gorm:"foreignKey:EventID" json:"-"`
	Invitee *User  `gorm:"foreignKey:InviteeUserID" json:"-"`
	Inviter *User  `gorm:"foreignKey:InviterUserID" json:"-"`
}

func (Invitation) TableName() string { return "invitations" }

type Session struct {
	Base
	EventID     uuid.UUID `gorm:"type:uuid;not null;index" json:"event_id"`
	Title       string    `gorm:"type:varchar(200);not null" json:"title"`
	Description *string   `gorm:"type:text" json:"description"`
	Speaker     string    `gorm:"type:varchar(150);not null" json:"speaker"`
	Location    string    `gorm:"type:varchar(255);not null" json:"location"`
	StartTime   time.Time `gorm:"type:timestamptz;not null;index" json:"start_time"`
	EndTime     time.Time `gorm:"type:timestamptz;not null" json:"end_time"`
	Status      string    `gorm:"type:varchar(20);not null;default:'UPCOMING';index" json:"status"`
}

func (Session) TableName() string { return "sessions" }

type Registration struct {
	Base
	EventID      uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:uq_registration_event_user;index" json:"event_id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:uq_registration_event_user;index" json:"user_id"`
	Status       string     `gorm:"type:varchar(20);not null;default:'REGISTERED';index" json:"status"`
	QRToken      string     `gorm:"type:varchar(100);not null;uniqueIndex" json:"qr_token"`
	RegisteredAt time.Time  `gorm:"type:timestamptz;not null;default:now()" json:"registered_at"`
	CheckedInAt  *time.Time `gorm:"type:timestamptz" json:"checked_in_at"`

	User  *User  `gorm:"foreignKey:UserID" json:"-"`
	Event *Event `gorm:"foreignKey:EventID" json:"-"`
}

func (Registration) TableName() string { return "registrations" }

type Announcement struct {
	Base
	EventID     uuid.UUID `gorm:"type:uuid;not null;index" json:"event_id"`
	AuthorID    uuid.UUID `gorm:"type:uuid;not null" json:"author_id"`
	Title       string    `gorm:"type:varchar(200);not null" json:"title"`
	Content     string    `gorm:"type:text;not null" json:"content"`

	Author *User `gorm:"foreignKey:AuthorID" json:"-"`
}

func (Announcement) TableName() string { return "announcements" }

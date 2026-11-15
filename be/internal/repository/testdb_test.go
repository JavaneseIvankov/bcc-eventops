package repository

import (
	"testing"
	"time"

	"github.com/bcc/eventops-be/internal/models"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const testSchema = `
CREATE TABLE users (
	id TEXT PRIMARY KEY,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	deleted_at DATETIME,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	password_hash TEXT NOT NULL
);

CREATE TABLE events (
	id TEXT PRIMARY KEY,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	deleted_at DATETIME,
	name TEXT NOT NULL,
	short_description TEXT NOT NULL,
	poster_url TEXT,
	location TEXT NOT NULL,
	start_time DATETIME NOT NULL,
	end_time DATETIME NOT NULL,
	status TEXT NOT NULL DEFAULT 'UPCOMING',
	quota_total INTEGER NOT NULL,
	quota_filled INTEGER NOT NULL DEFAULT 0,
	created_by TEXT NOT NULL
);

CREATE TABLE committee_members (
	id TEXT PRIMARY KEY,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	event_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	role TEXT NOT NULL
);

CREATE TABLE registrations (
	id TEXT PRIMARY KEY,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	event_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'REGISTERED',
	qr_token TEXT NOT NULL,
	registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	checked_in_at DATETIME
);
`

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.Exec(testSchema).Error; err != nil {
		t.Fatalf("failed to create test schema: %v", err)
	}

	return db
}

func createTestUser(t *testing.T, db *gorm.DB) models.User {
	t.Helper()
	user := models.User{
		Name:         "Test User",
		Email:        uuid.New().String() + "@test.local",
		PasswordHash: "hash",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}
	return user
}

func createTestEvent(t *testing.T, db *gorm.DB, creatorID uuid.UUID, quotaTotal int, status string) models.Event {
	t.Helper()
	now := time.Now().UTC()
	event := models.Event{
		Name:             "Test Event",
		ShortDescription: "desc",
		Location:         "loc",
		StartTime:        now.Add(24 * time.Hour),
		EndTime:          now.Add(27 * time.Hour),
		Status:           status,
		QuotaTotal:       quotaTotal,
		QuotaFilled:      0,
		CreatedBy:        creatorID,
	}
	if err := db.Create(&event).Error; err != nil {
		t.Fatalf("failed to create test event: %v", err)
	}
	return event
}

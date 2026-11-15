//go:build integration

package repository

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/bcc/eventops-be/internal/database"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/utils"
	"github.com/google/uuid"
)

func TestIntegration_ConcurrentRegistration_NoOverbooking(t *testing.T) {
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	db, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		t.Fatalf("failed to connect to postgres: %v", err)
	}

	const quotaTotal = 5
	const participantCount = 25

	coordinator := models.User{
		Name:         "Integration Coordinator",
		Email:        "integration_coord_" + uuid.New().String() + "@test.local",
		PasswordHash: "hash",
	}
	if err := db.Create(&coordinator).Error; err != nil {
		t.Fatalf("failed to create coordinator: %v", err)
	}

	event := models.Event{
		Name:             "Integration Race Test Event",
		ShortDescription: "concurrent registration test",
		Location:         "test",
		StartTime:        utils.NowUTC().Add(24 * time.Hour),
		EndTime:          utils.NowUTC().Add(27 * time.Hour),
		Status:           models.EventStatusUpcoming,
		QuotaTotal:       quotaTotal,
		QuotaFilled:      0,
		CreatedBy:        coordinator.ID,
	}
	if err := db.Create(&event).Error; err != nil {
		t.Fatalf("failed to create event: %v", err)
	}

	participants := make([]models.User, participantCount)
	for i := range participants {
		participants[i] = models.User{
			Name:         "Integration Participant",
			Email:        "integration_racer_" + uuid.New().String() + "@test.local",
			PasswordHash: "hash",
		}
		if err := db.Create(&participants[i]).Error; err != nil {
			t.Fatalf("failed to create participant %d: %v", i, err)
		}
	}

	t.Cleanup(func() {
		db.Unscoped().Delete(&models.Event{}, "id = ?", event.ID)
		db.Unscoped().Delete(&models.User{}, "id = ?", coordinator.ID)
		for _, p := range participants {
			db.Unscoped().Delete(&models.User{}, "id = ?", p.ID)
		}
	})

	repo := NewRegistrationRepository(db)

	var wg sync.WaitGroup
	var mu sync.Mutex
	successCount := 0
	quotaExceededCount := 0
	otherErrors := 0

	for _, p := range participants {
		wg.Add(1)
		go func(userID uuid.UUID) {
			defer wg.Done()
			_, err := repo.RegisterParticipant(event.ID, userID)

			mu.Lock()
			defer mu.Unlock()
			switch {
			case err == nil:
				successCount++
			case isQuotaExceeded(err):
				quotaExceededCount++
			default:
				otherErrors++
				t.Logf("unexpected error for user %s: %v", userID, err)
			}
		}(p.ID)
	}
	wg.Wait()

	if successCount != quotaTotal {
		t.Errorf("expected exactly %d successful registrations, got %d", quotaTotal, successCount)
	}
	if otherErrors != 0 {
		t.Errorf("expected 0 unexpected errors, got %d", otherErrors)
	}
	if successCount+quotaExceededCount != participantCount {
		t.Errorf("expected success+quotaExceeded to equal %d, got %d", participantCount, successCount+quotaExceededCount)
	}

	var finalEvent models.Event
	if err := db.First(&finalEvent, "id = ?", event.ID).Error; err != nil {
		t.Fatalf("failed to reload event: %v", err)
	}
	if finalEvent.QuotaFilled != quotaTotal {
		t.Errorf("expected final quota_filled=%d, got %d (overbooking!)", quotaTotal, finalEvent.QuotaFilled)
	}
	if finalEvent.QuotaFilled > finalEvent.QuotaTotal {
		t.Errorf("OVERBOOKING DETECTED: quota_filled=%d exceeds quota_total=%d", finalEvent.QuotaFilled, finalEvent.QuotaTotal)
	}
}

func isQuotaExceeded(err error) bool {
	var appErr *apperr.AppError
	return errors.As(err, &appErr) && appErr.Code == "QUOTA_EXCEEDED"
}

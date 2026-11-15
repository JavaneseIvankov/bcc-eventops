package repository

import (
	"errors"
	"testing"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
)

func TestRegisterParticipant_Success(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if reg.Status != models.RegistrationRegistered {
		t.Errorf("expected status REGISTERED, got %s", reg.Status)
	}

	var updated models.Event
	db.First(&updated, "id = ?", event.ID)
	if updated.QuotaFilled != 1 {
		t.Errorf("expected quota_filled=1, got %d", updated.QuotaFilled)
	}
}

func TestRegisterParticipant_QuotaExceeded(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 1, models.EventStatusUpcoming)

	p1 := createTestUser(t, db)
	if _, err := repo.RegisterParticipant(event.ID, p1.ID); err != nil {
		t.Fatalf("unexpected error on first registration: %v", err)
	}

	p2 := createTestUser(t, db)
	_, err := repo.RegisterParticipant(event.ID, p2.ID)
	if err == nil {
		t.Fatal("expected quota exceeded error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "QUOTA_EXCEEDED" {
		t.Errorf("expected QUOTA_EXCEEDED, got %v", err)
	}
}

func TestRegisterParticipant_AlreadyRegistered(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	if _, err := repo.RegisterParticipant(event.ID, participant.ID); err != nil {
		t.Fatalf("unexpected error on first registration: %v", err)
	}

	_, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err == nil {
		t.Fatal("expected already registered error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "ALREADY_REGISTERED" {
		t.Errorf("expected ALREADY_REGISTERED, got %v", err)
	}
}

func TestRegisterParticipant_EventNotUpcoming(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusOngoing)

	_, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err == nil {
		t.Fatal("expected invalid state error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "INVALID_STATE" {
		t.Errorf("expected INVALID_STATE, got %v", err)
	}
}

func TestRegisterParticipant_ReactivatesCancelled(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	first, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error on first registration: %v", err)
	}
	if err := repo.CancelSelf(event.ID, participant.ID); err != nil {
		t.Fatalf("unexpected error cancelling: %v", err)
	}

	second, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error re-registering: %v", err)
	}
	if second.ID != first.ID {
		t.Errorf("expected same registration row to be reactivated, got different IDs")
	}
	if second.Status != models.RegistrationRegistered {
		t.Errorf("expected status REGISTERED after reactivation, got %s", second.Status)
	}

	var event2 models.Event
	db.First(&event2, "id = ?", event.ID)
	if event2.QuotaFilled != 1 {
		t.Errorf("expected quota_filled=1 after cancel+reregister, got %d", event2.QuotaFilled)
	}
}

func TestCancelSelf_ReleasesQuota(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	if _, err := repo.RegisterParticipant(event.ID, participant.ID); err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}
	if err := repo.CancelSelf(event.ID, participant.ID); err != nil {
		t.Fatalf("unexpected error cancelling: %v", err)
	}

	var updated models.Event
	db.First(&updated, "id = ?", event.ID)
	if updated.QuotaFilled != 0 {
		t.Errorf("expected quota_filled=0 after cancel, got %d", updated.QuotaFilled)
	}
}

func TestCheckIn_Success(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}

	checkedIn, err := repo.CheckIn(event.ID, reg.ID)
	if err != nil {
		t.Fatalf("unexpected error checking in: %v", err)
	}
	if checkedIn.Status != models.RegistrationCheckedIn {
		t.Errorf("expected status CHECKED_IN, got %s", checkedIn.Status)
	}
	if checkedIn.CheckedInAt == nil {
		t.Error("expected checked_in_at to be set")
	}
}

func TestCheckIn_AlreadyCheckedIn(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}
	if _, err := repo.CheckIn(event.ID, reg.ID); err != nil {
		t.Fatalf("unexpected error on first check-in: %v", err)
	}

	_, err = repo.CheckIn(event.ID, reg.ID)
	if err == nil {
		t.Fatal("expected already checked in error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "ALREADY_CHECKED_IN" {
		t.Errorf("expected ALREADY_CHECKED_IN, got %v", err)
	}
	if appErr.Data == nil {
		t.Error("expected error data to carry checked_in_at")
	}
}

func TestCheckIn_RejectsCancelled(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}
	if err := repo.CancelSelf(event.ID, participant.ID); err != nil {
		t.Fatalf("unexpected error cancelling: %v", err)
	}

	_, err = repo.CheckIn(event.ID, reg.ID)
	if err == nil {
		t.Fatal("expected invalid state error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "INVALID_STATE" {
		t.Errorf("expected INVALID_STATE, got %v", err)
	}
}

func TestCheckIn_RejectsWhenEventFinished(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}

	if err := db.Model(&models.Event{}).Where("id = ?", event.ID).Update("status", models.EventStatusFinished).Error; err != nil {
		t.Fatalf("unexpected error finishing event: %v", err)
	}

	_, err = repo.CheckIn(event.ID, reg.ID)
	if err == nil {
		t.Fatal("expected invalid state error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "INVALID_STATE" {
		t.Errorf("expected INVALID_STATE, got %v", err)
	}
}

func TestCancelSelf_RejectsWhenAlreadyCheckedIn(t *testing.T) {
	db := newTestDB(t)
	repo := NewRegistrationRepository(db)

	coordinator := createTestUser(t, db)
	participant := createTestUser(t, db)
	event := createTestEvent(t, db, coordinator.ID, 10, models.EventStatusUpcoming)

	reg, err := repo.RegisterParticipant(event.ID, participant.ID)
	if err != nil {
		t.Fatalf("unexpected error registering: %v", err)
	}
	if _, err := repo.CheckIn(event.ID, reg.ID); err != nil {
		t.Fatalf("unexpected error checking in: %v", err)
	}

	err = repo.CancelSelf(event.ID, participant.ID)
	if err == nil {
		t.Fatal("expected invalid state error, got nil")
	}
	var appErr *apperr.AppError
	if !errors.As(err, &appErr) || appErr.Code != "INVALID_STATE" {
		t.Errorf("expected INVALID_STATE, got %v", err)
	}
}

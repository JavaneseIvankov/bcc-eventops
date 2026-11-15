package middleware

import (
	"errors"
	"net/http/httptest"
	"testing"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type fakeCommitteeRepo struct {
	role string
	err  error
}

func (f *fakeCommitteeRepo) FindRole(eventID, userID uuid.UUID) (string, error) {
	return f.role, f.err
}

func (f *fakeCommitteeRepo) FindByEventAndUser(eventID, userID uuid.UUID) (*models.CommitteeMember, error) {
	return nil, f.err
}

func (f *fakeCommitteeRepo) FindByEventID(eventID uuid.UUID) ([]models.CommitteeMember, error) {
	return nil, nil
}

func (f *fakeCommitteeRepo) CountCoordinators(eventID uuid.UUID) (int64, error) { return 0, nil }
func (f *fakeCommitteeRepo) Update(member *models.CommitteeMember) error        { return nil }
func (f *fakeCommitteeRepo) Delete(eventID, userID uuid.UUID) error             { return nil }

var _ repository.CommitteeRepository = (*fakeCommitteeRepo)(nil)

func newRoleTestApp(repo repository.CommitteeRepository, userID uuid.UUID, allowedRoles ...string) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			var appErr *apperr.AppError
			if errors.As(err, &appErr) {
				return c.Status(appErr.Status).JSON(fiber.Map{"code": appErr.Code})
			}
			return c.SendStatus(fiber.StatusInternalServerError)
		},
	})

	app.Get("/events/:eventId/test",
		func(c *fiber.Ctx) error {
			c.Locals(UserIDContextKey, userID)
			return c.Next()
		},
		RequireEventRole(repo, allowedRoles...),
		func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusOK)
		},
	)

	return app
}

func TestRequireEventRole_AllowsCoordinator(t *testing.T) {
	userID := uuid.New()
	repo := &fakeCommitteeRepo{role: models.RoleCoordinator}
	app := newRoleTestApp(repo, userID, models.RoleCoordinator)

	req := httptest.NewRequest("GET", "/events/"+uuid.New().String()+"/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRequireEventRole_RejectsCommitteeOnCoordinatorOnlyRoute(t *testing.T) {
	userID := uuid.New()
	repo := &fakeCommitteeRepo{role: models.RoleCommittee}
	app := newRoleTestApp(repo, userID, models.RoleCoordinator)

	req := httptest.NewRequest("GET", "/events/"+uuid.New().String()+"/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusForbidden {
		t.Errorf("expected 403, got %d", resp.StatusCode)
	}
}

func TestRequireEventRole_AllowsCommitteeWhenBothRolesAllowed(t *testing.T) {
	userID := uuid.New()
	repo := &fakeCommitteeRepo{role: models.RoleCommittee}
	app := newRoleTestApp(repo, userID, models.RoleCoordinator, models.RoleCommittee)

	req := httptest.NewRequest("GET", "/events/"+uuid.New().String()+"/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRequireEventRole_RejectsNonMember(t *testing.T) {
	userID := uuid.New()
	repo := &fakeCommitteeRepo{err: gorm.ErrRecordNotFound}
	app := newRoleTestApp(repo, userID, models.RoleCoordinator, models.RoleCommittee)

	req := httptest.NewRequest("GET", "/events/"+uuid.New().String()+"/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusForbidden {
		t.Errorf("expected 403, got %d", resp.StatusCode)
	}
}

func TestRequireEventRole_InvalidEventID(t *testing.T) {
	userID := uuid.New()
	repo := &fakeCommitteeRepo{role: models.RoleCoordinator}
	app := newRoleTestApp(repo, userID, models.RoleCoordinator)

	req := httptest.NewRequest("GET", "/events/not-a-uuid/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

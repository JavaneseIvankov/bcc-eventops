package service

import (
	"errors"
	"net/http"

	"github.com/bcc/eventops-be/internal/dto"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommitteeService interface {
	Invite(eventID, inviterID uuid.UUID, req dto.InviteRequest) (*models.Invitation, error)
	ListMyInvitations(userID uuid.UUID, page, limit int, status string) ([]models.Invitation, int64, error)
	Accept(invitationID, userID uuid.UUID) (*models.Invitation, error)
	Reject(invitationID, userID uuid.UUID) error
	CancelInvitation(eventID, invitationID uuid.UUID) error
	GetOverview(eventID uuid.UUID) ([]models.CommitteeMember, []models.Invitation, error)
	UpdateMemberRole(eventID, targetUserID uuid.UUID, newRole string) (*models.CommitteeMember, error)
	RemoveMember(eventID, targetUserID uuid.UUID) error
	LeaveSelf(eventID, userID uuid.UUID) error
}

type committeeService struct {
	invitationRepo repository.InvitationRepository
	committeeRepo  repository.CommitteeRepository
	userRepo       repository.UserRepository
	hub            *ws.Hub
}

func NewCommitteeService(invitationRepo repository.InvitationRepository, committeeRepo repository.CommitteeRepository, userRepo repository.UserRepository, hub *ws.Hub) CommitteeService {
	return &committeeService{
		invitationRepo: invitationRepo,
		committeeRepo:  committeeRepo,
		userRepo:       userRepo,
		hub:            hub,
	}
}

func (s *committeeService) Invite(eventID, inviterID uuid.UUID, req dto.InviteRequest) (*models.Invitation, error) {
	invitee, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.New(http.StatusNotFound, "NOT_FOUND", "Akun dengan email tersebut tidak ditemukan.")
		}
		return nil, err
	}

	if _, err := s.committeeRepo.FindByEventAndUser(eventID, invitee.ID); err == nil {
		return nil, apperr.New(http.StatusConflict, "ALREADY_MEMBER", "Pengguna ini sudah menjadi panitia/koordinator event ini.")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if _, err := s.invitationRepo.FindPendingByEventAndInvitee(eventID, invitee.ID); err == nil {
		return nil, apperr.New(http.StatusConflict, "INVITATION_PENDING", "Sudah ada undangan PENDING untuk pengguna ini.")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	invitation := &models.Invitation{
		EventID:       eventID,
		InviterUserID: inviterID,
		InviteeUserID: invitee.ID,
		Role:          req.Role,
		Status:        models.InvitationPending,
	}
	if err := s.invitationRepo.Create(invitation); err != nil {
		return nil, err
	}

	invitation.Invitee = invitee
	return invitation, nil
}

func (s *committeeService) ListMyInvitations(userID uuid.UUID, page, limit int, status string) ([]models.Invitation, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.invitationRepo.FindByInviteeID(userID, page, limit, status)
}

func (s *committeeService) Accept(invitationID, userID uuid.UUID) (*models.Invitation, error) {
	return s.invitationRepo.Accept(invitationID, userID)
}

func (s *committeeService) Reject(invitationID, userID uuid.UUID) error {
	invitation, err := s.invitationRepo.FindByID(invitationID)
	if err != nil {
		return err
	}
	if invitation.InviteeUserID != userID {
		return apperr.ErrForbidden
	}
	if invitation.Status != models.InvitationPending {
		return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Undangan sudah diproses sebelumnya.")
	}

	invitation.Status = models.InvitationRejected
	return s.invitationRepo.Update(invitation)
}

func (s *committeeService) CancelInvitation(eventID, invitationID uuid.UUID) error {
	invitation, err := s.invitationRepo.FindByID(invitationID)
	if err != nil {
		return err
	}
	if invitation.EventID != eventID {
		return apperr.ErrNotFound
	}
	if invitation.Status != models.InvitationPending {
		return apperr.New(http.StatusBadRequest, "INVALID_STATE", "Undangan sudah diproses, tidak dapat dibatalkan.")
	}

	return s.invitationRepo.Delete(invitation.ID)
}

func (s *committeeService) GetOverview(eventID uuid.UUID) ([]models.CommitteeMember, []models.Invitation, error) {
	members, err := s.committeeRepo.FindByEventID(eventID)
	if err != nil {
		return nil, nil, err
	}

	invitations, err := s.invitationRepo.FindByEventID(eventID)
	if err != nil {
		return nil, nil, err
	}

	return members, invitations, nil
}

func (s *committeeService) UpdateMemberRole(eventID, targetUserID uuid.UUID, newRole string) (*models.CommitteeMember, error) {
	member, err := s.committeeRepo.FindByEventAndUser(eventID, targetUserID)
	if err != nil {
		return nil, err
	}

	if member.Role == models.RoleCoordinator && newRole != models.RoleCoordinator {
		count, err := s.committeeRepo.CountCoordinators(eventID)
		if err != nil {
			return nil, err
		}
		if count <= 1 {
			return nil, apperr.ErrLastCoordinator
		}
	}

	member.Role = newRole
	if err := s.committeeRepo.Update(member); err != nil {
		return nil, err
	}

	s.hub.CloseUserConnections(eventID, ws.RoomCommittee, targetUserID, ws.NewMessage(ws.EventAccessRevoked, map[string]any{
		"reason": "ROLE_CHANGED",
	}))

	return member, nil
}

func (s *committeeService) RemoveMember(eventID, targetUserID uuid.UUID) error {
	return s.exitCommittee(eventID, targetUserID)
}

func (s *committeeService) LeaveSelf(eventID, userID uuid.UUID) error {
	return s.exitCommittee(eventID, userID)
}

func (s *committeeService) exitCommittee(eventID, userID uuid.UUID) error {
	member, err := s.committeeRepo.FindByEventAndUser(eventID, userID)
	if err != nil {
		return err
	}

	if member.Role == models.RoleCoordinator {
		count, err := s.committeeRepo.CountCoordinators(eventID)
		if err != nil {
			return err
		}
		if count <= 1 {
			return apperr.ErrLastCoordinator
		}
	}

	if err := s.committeeRepo.Delete(eventID, userID); err != nil {
		return err
	}

	s.hub.CloseUserConnections(eventID, ws.RoomCommittee, userID, ws.NewMessage(ws.EventAccessRevoked, map[string]any{
		"reason": "REMOVED_FROM_COMMITTEE",
	}))

	return nil
}

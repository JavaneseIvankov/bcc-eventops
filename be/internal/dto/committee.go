package dto

import (
	"net/http"
	"strings"
	"time"

	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
)

type InviteRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (r *InviteRequest) Validate() error {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	if r.Email == "" {
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Email wajib diisi.")
	}
	switch r.Role {
	case models.RoleCoordinator, models.RoleCommittee:
		return nil
	default:
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Role tidak valid.")
	}
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role"`
}

func (r *UpdateMemberRoleRequest) Validate() error {
	switch r.Role {
	case models.RoleCoordinator, models.RoleCommittee:
		return nil
	default:
		return apperr.New(http.StatusBadRequest, "INVALID_INPUT", "Role tidak valid.")
	}
}

type InvitationResponse struct {
	ID            uuid.UUID `json:"id"`
	EventID       uuid.UUID `json:"event_id"`
	InviteeUserID uuid.UUID `json:"invitee_user_id"`
	InviteeName   string    `json:"invitee_name"`
	InviteeEmail  string    `json:"invitee_email"`
	Role          string    `json:"role"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

func NewInvitationResponse(inv *models.Invitation) InvitationResponse {
	resp := InvitationResponse{
		ID:            inv.ID,
		EventID:       inv.EventID,
		InviteeUserID: inv.InviteeUserID,
		Role:          inv.Role,
		Status:        inv.Status,
		CreatedAt:     inv.CreatedAt,
	}
	if inv.Invitee != nil {
		resp.InviteeName = inv.Invitee.Name
		resp.InviteeEmail = inv.Invitee.Email
	}
	return resp
}

func NewInvitationResponseList(invs []models.Invitation) []InvitationResponse {
	list := make([]InvitationResponse, 0, len(invs))
	for i := range invs {
		list = append(list, NewInvitationResponse(&invs[i]))
	}
	return list
}

type CommitteeMemberResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	Name     string    `json:"name"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

func NewCommitteeMemberResponse(member *models.CommitteeMember) CommitteeMemberResponse {
	resp := CommitteeMemberResponse{
		UserID:   member.UserID,
		Role:     member.Role,
		JoinedAt: member.CreatedAt,
	}
	if member.User != nil {
		resp.Name = member.User.Name
		resp.Email = member.User.Email
	}
	return resp
}

func NewCommitteeMemberResponseList(members []models.CommitteeMember) []CommitteeMemberResponse {
	list := make([]CommitteeMemberResponse, 0, len(members))
	for i := range members {
		list = append(list, NewCommitteeMemberResponse(&members[i]))
	}
	return list
}

type CommitteeOverviewResponse struct {
	Members     []CommitteeMemberResponse `json:"members"`
	Invitations []InvitationResponse      `json:"invitations"`
}

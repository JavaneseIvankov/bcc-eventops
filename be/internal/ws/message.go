package ws

const (
	EventQuotaUpdated          = "QUOTA_UPDATED"
	EventSessionCreated        = "SESSION_CREATED"
	EventSessionUpdated        = "SESSION_UPDATED"
	EventSessionDeleted        = "SESSION_DELETED"
	EventSessionStatusChanged  = "SESSION_STATUS_CHANGED"
	EventAnnouncementCreated   = "ANNOUNCEMENT_CREATED"
	EventAnnouncementUpdated   = "ANNOUNCEMENT_UPDATED"
	EventAnnouncementDeleted   = "ANNOUNCEMENT_DELETED"
	EventRegistrationUpdated   = "REGISTRATION_UPDATED"
	EventDashboardUpdated      = "DASHBOARD_UPDATED"
	EventParticipantRegistered = "PARTICIPANT_REGISTERED"
	EventParticipantCancelled  = "PARTICIPANT_CANCELLED"
	EventParticipantCheckedIn  = "PARTICIPANT_CHECKED_IN"
	EventAccessRevoked         = "ACCESS_REVOKED"
)

type Message struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

func NewMessage(eventType string, data any) Message {
	return Message{Type: eventType, Data: data}
}

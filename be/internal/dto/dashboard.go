package dto

type SessionsSummary struct {
	Total    int `json:"total"`
	Upcoming int `json:"upcoming"`
	Ongoing  int `json:"ongoing"`
	Finished int `json:"finished"`
}

type DashboardSummaryResponse struct {
	QuotaTotal          int             `json:"quota_total"`
	ActiveRegistrations int             `json:"active_registrations"`
	CheckedInCount      int             `json:"checked_in_count"`
	NotCheckedInCount   int             `json:"not_checked_in_count"`
	CancelledCount      int             `json:"cancelled_count"`
	QuotaAvailable      int             `json:"quota_available"`
	SessionsSummary     SessionsSummary `json:"sessions_summary"`
}

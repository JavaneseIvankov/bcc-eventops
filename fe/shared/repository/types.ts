// types.ts

export type EventStatus = "UPCOMING" | "ONGOING" | "FINISHED";
export type SessionStatus = "UPCOMING" | "ONGOING" | "FINISHED";
export type CommitteeRole = "COORDINATOR" | "COMMITTEE";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type RegistrationStatus = "REGISTERED" | "CHECKED_IN" | "CANCELLED";

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ============================================================================
// ENTITIES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface UploadResponseData {
  url: string;
}

export interface EventSummary {
  id: string;
  name: string;
  short_description: string;
  poster_url: string | null;
  location: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  quota_total: number;
  quota_filled: number;
  quota_available: number;
  my_role: CommitteeRole | null;
}

export interface Registration {
  id: string;
  event_id?: string;
  user_id?: string;
  status: RegistrationStatus;
  qr_token: string;
  registered_at: string;
  checked_in_at: string | null;
  // Catatan: API `/me/registrations` TIDAK menyertakan objek event.
  // Detail event di-join manual lewat `event_id` di `useMyRegistrationsWithEvents`.
}

export interface EventDetail extends EventSummary {
  my_registration: Registration | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  event_id?: string;
  invitee_user_id?: string;
  invitee_name?: string;
  invitee_email?: string;
  invited_by_name?: string;
  role: CommitteeRole;
  status: InvitationStatus;
  created_at: string;
  event?: {
    id: string;
    name: string;
    start_time: string;
    location: string;
  };
}

export interface CommitteeMember {
  user_id: string;
  name: string;
  email: string;
  role: CommitteeRole;
  joined_at: string;
}

export interface EventCommitteesData {
  members: CommitteeMember[];
  invitations?: Invitation[];
}

export interface Session {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  speaker: string;
  location: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
}

export interface CheckInResultData {
  id: string;
  user_name: string;
  user_email: string;
  status: RegistrationStatus;
  checked_in_at: string;
}

export interface ParticipantItem {
  registration_id: string;
  user_id: string;
  name: string;
  email: string;
  status: RegistrationStatus;
  registered_at: string;
  checked_in_at: string | null;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  quota_total: number;
  active_registrations: number;
  checked_in_count: number;
  not_checked_in_count: number;
  cancelled_count: number;
  quota_available: number;
  sessions_summary: {
    total: number;
    upcoming: number;
    ongoing: number;
    finished: number;
  };
}

// ============================================================================
// REQUEST INPUTS & QUERY PARAMS
// ============================================================================

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EventStatus;
  managed_by_me?: boolean;
}

export interface CreateEventInput {
  name: string;
  short_description: string;
  poster_url?: string | null;
  location: string;
  start_time: string;
  end_time: string;
  quota_total: number;
}

export interface UpdateEventInput {
  name?: string;
  short_description?: string;
  poster_url?: string | null;
  location?: string;
  start_time?: string;
  end_time?: string;
  quota_total?: number;
  status?: EventStatus;
}

export interface InviteCommitteeInput {
  email: string;
  role: CommitteeRole;
}

export interface GetMyInvitationsParams {
  page?: number;
  limit?: number;
  status?: InvitationStatus;
}

export interface UpdateCommitteeRoleInput {
  role: CommitteeRole;
}

export interface CreateSessionInput {
  title: string;
  description?: string | null;
  speaker: string;
  location: string;
  start_time: string;
  end_time: string;
}

export interface UpdateSessionInput {
  title?: string;
  description?: string | null;
  speaker?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
}

export interface UpdateSessionStatusInput {
  status: SessionStatus;
}

export interface GetMyRegistrationsParams {
  page?: number;
  limit?: number;
  status?: RegistrationStatus;
}

export interface CheckInQrInput {
  qr_token: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
}

export interface GetEventParticipantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RegistrationStatus;
}
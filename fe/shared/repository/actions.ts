"use server"

import { createFetch } from "@better-fetch/fetch"
import { cookies } from "next/headers"
import type {
  ApiResponse,
  PaginatedApiResponse,
  User,
  UploadResponseData,
  EventSummary,
  EventDetail,
  Invitation,
  EventCommitteesData,
  Session,
  Registration,
  CheckInResultData,
  Announcement,
  DashboardSummary,
  ParticipantItem,
  RegisterInput,
  LoginInput,
  GetEventsParams,
  CreateEventInput,
  UpdateEventInput,
  InviteCommitteeInput,
  GetMyInvitationsParams,
  UpdateCommitteeRoleInput,
  CreateSessionInput,
  UpdateSessionInput,
  UpdateSessionStatusInput,
  GetMyRegistrationsParams,
  CheckInQrInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  GetEventParticipantsParams,
} from "./types"

// ============================================================================
// AUTH TOKEN TYPES & COOKIE HELPER
// ============================================================================

interface AuthTokenData {
  access_token: string
  refresh_token: string
}

interface LoginResponseData extends AuthTokenData {
  user: User
}

async function setAuthCookies(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies()

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 30, // 30 menit
  })

  if (refreshToken) {
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    })
  }
}

// ============================================================================
// BETTER-FETCH INSTANCE (SERVER-SIDE DENGAN BEARER TOKEN)
// ============================================================================

const $fetch = createFetch({
  baseURL:
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api/v1",
  throw: true,
  onRequest: async (context) => {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (accessToken && !context.headers.has("Authorization")) {
      context.headers.set("Authorization", `Bearer ${accessToken}`)
    }

    return context
  },
})

// ============================================================================
// M1: AUTH ACTIONS
// ============================================================================

export async function registerAction(body: RegisterInput) {
  return $fetch<ApiResponse<User>>("/auth/register", {
    method: "POST",
    body,
  })
}

export async function loginAction(body: LoginInput) {
  const res = await $fetch<ApiResponse<LoginResponseData>>("/auth/login", {
    method: "POST",
    body,
  })

  await setAuthCookies(res.data.access_token, res.data.refresh_token)

  return { ...res, data: res.data.user } satisfies ApiResponse<User>
}

export async function refreshTokenAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("refresh_token")?.value

  const res = await $fetch<ApiResponse<AuthTokenData>>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  })

  await setAuthCookies(res.data.access_token, res.data.refresh_token)

  return { ...res, data: null } satisfies ApiResponse<null>
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("refresh_token")?.value

  try {
    await $fetch<ApiResponse<null>>("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
  } finally {
    cookieStore.delete("access_token")
    cookieStore.delete("refresh_token")
  }

  return {
    success: true,
    message: "Logout berhasil",
    data: null,
  } satisfies ApiResponse<null>
}

export async function getMeAction() {
  return $fetch<ApiResponse<User>>("/auth/me", {
    method: "GET",
  })
}

// ============================================================================
// UPLOADS ACTION
// ============================================================================

export async function uploadFileAction(formData: FormData) {
  return $fetch<ApiResponse<UploadResponseData>>("/uploads", {
    method: "POST",
    body: formData,
  })
}

// ============================================================================
// M2: EVENTS ACTIONS
// ============================================================================

export async function getEventsAction(params?: GetEventsParams) {
  return $fetch<PaginatedApiResponse<EventSummary>>("/events", {
    method: "GET",
    query: params,
  })
}

export async function createEventAction(body: CreateEventInput) {
  return $fetch<ApiResponse<EventDetail>>("/events", {
    method: "POST",
    body,
  })
}

export async function getEventDetailAction(eventId: string) {
  return $fetch<ApiResponse<EventDetail>>(`/events/${eventId}`, {
    method: "GET",
  })
}

export async function updateEventAction({
  eventId,
  body,
}: {
  eventId: string
  body: UpdateEventInput
}) {
  return $fetch<ApiResponse<EventDetail>>(`/events/${eventId}`, {
    method: "PATCH",
    body,
  })
}

export async function deleteEventAction(eventId: string) {
  return $fetch<ApiResponse<null>>(`/events/${eventId}`, {
    method: "DELETE",
  })
}

// ============================================================================
// M3: COMMITTEES & INVITATIONS ACTIONS
// ============================================================================

export async function inviteCommitteeAction({
  eventId,
  body,
}: {
  eventId: string
  body: InviteCommitteeInput
}) {
  return $fetch<ApiResponse<Invitation>>(`/events/${eventId}/invitations`, {
    method: "POST",
    body,
  })
}

export async function getMyInvitationsAction(params?: GetMyInvitationsParams) {
  return $fetch<PaginatedApiResponse<Invitation>>("/me/invitations", {
    method: "GET",
    query: params,
  })
}

export async function acceptInvitationAction(invitationId: string) {
  return $fetch<ApiResponse<null>>(`/invitations/${invitationId}/accept`, {
    method: "POST",
  })
}

export async function rejectInvitationAction(invitationId: string) {
  return $fetch<ApiResponse<null>>(`/invitations/${invitationId}/reject`, {
    method: "POST",
  })
}

export async function cancelInvitationAction({
  eventId,
  invitationId,
}: {
  eventId: string
  invitationId: string
}) {
  return $fetch<ApiResponse<null>>(
    `/events/${eventId}/invitations/${invitationId}`,
    {
      method: "DELETE",
    }
  )
}

export async function getEventCommitteesAction(eventId: string) {
  return $fetch<ApiResponse<EventCommitteesData>>(
    `/events/${eventId}/committees`,
    {
      method: "GET",
    }
  )
}

export async function updateCommitteeRoleAction({
  eventId,
  userId,
  body,
}: {
  eventId: string
  userId: string
  body: UpdateCommitteeRoleInput
}) {
  return $fetch<ApiResponse<null>>(`/events/${eventId}/committees/${userId}`, {
    method: "PATCH",
    body,
  })
}

export async function removeCommitteeMemberAction({
  eventId,
  userId,
}: {
  eventId: string
  userId: string
}) {
  return $fetch<ApiResponse<null>>(`/events/${eventId}/committees/${userId}`, {
    method: "DELETE",
  })
}

export async function leaveCommitteeAction(eventId: string) {
  return $fetch<ApiResponse<null>>(`/events/${eventId}/committees/me`, {
    method: "DELETE",
  })
}

// ============================================================================
// M4: SESSIONS (RUNDOWN) ACTIONS
// ============================================================================

export async function getEventSessionsAction(eventId: string) {
  return $fetch<ApiResponse<Session[]>>(`/events/${eventId}/sessions`, {
    method: "GET",
  })
}

export async function createSessionAction({
  eventId,
  body,
}: {
  eventId: string
  body: CreateSessionInput
}) {
  return $fetch<ApiResponse<Session>>(`/events/${eventId}/sessions`, {
    method: "POST",
    body,
  })
}

export async function updateSessionAction({
  eventId,
  sessionId,
  body,
}: {
  eventId: string
  sessionId: string
  body: UpdateSessionInput
}) {
  return $fetch<ApiResponse<Session>>(
    `/events/${eventId}/sessions/${sessionId}`,
    {
      method: "PATCH",
      body,
    }
  )
}

export async function deleteSessionAction({
  eventId,
  sessionId,
}: {
  eventId: string
  sessionId: string
}) {
  return $fetch<ApiResponse<null>>(`/events/${eventId}/sessions/${sessionId}`, {
    method: "DELETE",
  })
}

export async function updateSessionStatusAction({
  eventId,
  sessionId,
  body,
}: {
  eventId: string
  sessionId: string
  body: UpdateSessionStatusInput
}) {
  return $fetch<ApiResponse<Session>>(
    `/events/${eventId}/sessions/${sessionId}/status`,
    {
      method: "PATCH",
      body,
    }
  )
}

// ============================================================================
// M5 & M6: REGISTRATIONS & CHECK-IN ACTIONS
// ============================================================================

export async function registerEventAction(eventId: string) {
  return $fetch<ApiResponse<Registration>>(`/events/${eventId}/registrations`, {
    method: "POST",
    body: {},
  })
}

export async function getMyRegistrationsAction(
  params?: GetMyRegistrationsParams
) {
  return $fetch<PaginatedApiResponse<Registration>>("/me/registrations", {
    method: "GET",
    query: params,
  })
}

export async function cancelMyRegistrationAction(eventId: string) {
  return $fetch<ApiResponse<Registration>>(
    `/events/${eventId}/registrations/me/cancel`,
    {
      method: "POST",
    }
  )
}

export async function cancelParticipantRegistrationAction({
  eventId,
  registrationId,
}: {
  eventId: string
  registrationId: string
}) {
  return $fetch<ApiResponse<null>>(
    `/events/${eventId}/registrations/${registrationId}/cancel`,
    {
      method: "POST",
    }
  )
}

export async function checkInManualAction({
  eventId,
  registrationId,
}: {
  eventId: string
  registrationId: string
}) {
  return $fetch<ApiResponse<CheckInResultData>>(
    `/events/${eventId}/registrations/${registrationId}/check-in`,
    {
      method: "POST",
    }
  )
}

export async function checkInQrAction({
  eventId,
  body,
}: {
  eventId: string
  body: CheckInQrInput
}) {
  return $fetch<ApiResponse<CheckInResultData>>(
    `/events/${eventId}/check-in/qr`,
    {
      method: "POST",
      body,
    }
  )
}

// ============================================================================
// M7: OPERATIONS (ANNOUNCEMENTS, DASHBOARD, PARTICIPANTS) ACTIONS
// ============================================================================

export async function getAnnouncementsAction(eventId: string) {
  return $fetch<ApiResponse<Announcement[]>>(
    `/events/${eventId}/announcements`,
    {
      method: "GET",
    }
  )
}

export async function createAnnouncementAction({
  eventId,
  body,
}: {
  eventId: string
  body: CreateAnnouncementInput
}) {
  return $fetch<ApiResponse<Announcement>>(`/events/${eventId}/announcements`, {
    method: "POST",
    body,
  })
}

export async function updateAnnouncementAction({
  eventId,
  announcementId,
  body,
}: {
  eventId: string
  announcementId: string
  body: UpdateAnnouncementInput
}) {
  return $fetch<ApiResponse<Announcement>>(
    `/events/${eventId}/announcements/${announcementId}`,
    {
      method: "PATCH",
      body,
    }
  )
}

export async function deleteAnnouncementAction({
  eventId,
  announcementId,
}: {
  eventId: string
  announcementId: string
}) {
  return $fetch<ApiResponse<null>>(
    `/events/${eventId}/announcements/${announcementId}`,
    {
      method: "DELETE",
    }
  )
}

export async function getEventDashboardAction(eventId: string) {
  return $fetch<ApiResponse<DashboardSummary>>(`/events/${eventId}/dashboard`, {
    method: "GET",
  })
}

export async function getEventParticipantsAction({
  eventId,
  params,
}: {
  eventId: string
  params?: GetEventParticipantsParams
}) {
  return $fetch<PaginatedApiResponse<ParticipantItem>>(
    `/events/${eventId}/participants`,
    {
      method: "GET",
      query: params,
    }
  )
}

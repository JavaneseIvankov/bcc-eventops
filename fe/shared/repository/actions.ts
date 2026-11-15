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
// BETTER-FETCH INSTANCE (SERVER-SIDE DENGAN COOKIE FORWARDING)
// ============================================================================

const $fetch = createFetch({
  baseURL:
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api/v1",
  throw: true,
  onRequest: async (context) => {
    // Meneruskan HTTP-Only cookie (access_token & refresh_token) dari Browser -> Go Fiber
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    if (cookieHeader) {
      context.headers.set("cookie", cookieHeader)
    }
    return context
  },
  onResponse: async ({ response }) => {
    // Meneruskan Set-Cookie dari Go Fiber (saat login/register/refresh/logout) -> Browser
    const setCookieHeaders =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : []

    if (setCookieHeaders.length > 0) {
      const cookieStore = await cookies()
      for (const rawCookie of setCookieHeaders) {
        const [nameValue, ...attrs] = rawCookie.split(";").map((s) => s.trim())
        const eqIdx = nameValue.indexOf("=")
        if (eqIdx === -1) continue

        const name = nameValue.slice(0, eqIdx)
        const value = nameValue.slice(eqIdx + 1)

        const httpOnly = attrs.some((a) => a.toLowerCase() === "httponly")
        const secure = attrs.some((a) => a.toLowerCase() === "secure")
        const pathAttr = attrs.find((a) => a.toLowerCase().startsWith("path="))
        const maxAgeAttr = attrs.find((a) =>
          a.toLowerCase().startsWith("max-age=")
        )

        cookieStore.set(name, value, {
          httpOnly,
          secure,
          path: pathAttr ? pathAttr.split("=")[1] : "/",
          ...(maxAgeAttr ? { maxAge: Number(maxAgeAttr.split("=")[1]) } : {}),
          sameSite: "lax",
        })
      }
    }
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
  return $fetch<ApiResponse<User>>("/auth/login", {
    method: "POST",
    body,
  })
}

export async function refreshTokenAction() {
  return $fetch<ApiResponse<null>>("/auth/refresh", {
    method: "POST",
  })
}

export async function logoutAction() {
  return $fetch<ApiResponse<null>>("/auth/logout", {
    method: "POST",
  })
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

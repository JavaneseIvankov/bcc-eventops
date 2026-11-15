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

<<<<<<< HEAD
const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api/v1"

=======
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
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

<<<<<<< HEAD
export async function getAccessTokenAction(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value ?? null
}

// ============================================================================
// ERROR EXTRACTOR & QUERY CLEANER
// ============================================================================

function cleanQuery<T extends Record<string, any> | undefined>(
  params: T
): Record<string, any> | undefined {
  if (!params) return undefined
  const cleaned: Record<string, any> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
      cleaned[key] = value
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

function extractBackendErrorMessage(err: any): string {
  // Struktur error dari Go Fiber: { success: false, error: { code: "...", message: "..." } }
  const nestedMessage =
    err?.error?.error?.message ||
    err?.cause?.error?.message ||
    err?.error?.message ||
    err?.cause?.message

  if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
    return nestedMessage
  }

  // Abaikan jika err.message hanya berisi kode angka status HTTP (misal "409", "400")
  if (
    typeof err?.message === "string" &&
    err.message.trim().length > 0 &&
    !/^\d{3}$/.test(err.message.trim())
  ) {
    return err.message
  }

  const status = err?.status || err?.response?.status
  if (status === 401) return "Sesi Anda telah berakhir atau kredensial salah."
  if (status === 403)
    return "Anda tidak memiliki akses operasional untuk tindakan ini."
  if (status === 404) return "Data yang diminta tidak ditemukan."
  if (status === 409)
    return "Data sudah ada atau tidak dapat diproses karena konflik status."

  return "Terjadi kesalahan pada server."
}

// ============================================================================
// BETTER-FETCH INSTANCE & WRAPPER (DENGAN AUTO-REFRESH & ERROR FORMATTING)
=======
// ============================================================================
// BETTER-FETCH INSTANCE (SERVER-SIDE DENGAN BEARER TOKEN)
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
// ============================================================================

const $fetch = createFetch({
  baseURL: API_BASE_URL,
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
<<<<<<< HEAD

async function apiFetch<T>(
  endpoint: string,
  options: Record<string, any> = {},
  isRetry = false
): Promise<T> {
  try {
    return await $fetch<T>(endpoint, options)
  } catch (err: any) {
    // Auto-refresh token jika 401 Unauthorized dan bukan di endpoint auth
    if (
      err?.status === 401 &&
      !isRetry &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register" &&
      endpoint !== "/auth/refresh"
    ) {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get("refresh_token")?.value

      if (refreshToken) {
        try {
          const refreshRes = await $fetch<ApiResponse<AuthTokenData>>(
            "/auth/refresh",
            {
              method: "POST",
              body: { refresh_token: refreshToken },
            }
          )
          await setAuthCookies(
            refreshRes.data.access_token,
            refreshRes.data.refresh_token
          )
          return await apiFetch<T>(endpoint, options, true)
        } catch {
          cookieStore.delete("access_token")
          cookieStore.delete("refresh_token")
        }
      }
    }

    // Lempar standar Error dengan pesan asli backend agar terbaca di client Toast
    const message = extractBackendErrorMessage(err)
    throw new Error(message)
  }
}
=======
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58

// ============================================================================
// M1: AUTH ACTIONS
// ============================================================================

export async function registerAction(body: RegisterInput) {
  return apiFetch<ApiResponse<User>>("/auth/register", {
    method: "POST",
    body,
  })
}

export async function loginAction(body: LoginInput) {
<<<<<<< HEAD
  const res = await apiFetch<ApiResponse<LoginResponseData>>("/auth/login", {
=======
  const res = await $fetch<ApiResponse<LoginResponseData>>("/auth/login", {
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
    method: "POST",
    body,
  })

  await setAuthCookies(res.data.access_token, res.data.refresh_token)

  return { ...res, data: res.data.user } satisfies ApiResponse<User>
}

export async function refreshTokenAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("refresh_token")?.value

<<<<<<< HEAD
  const res = await apiFetch<ApiResponse<AuthTokenData>>("/auth/refresh", {
=======
  const res = await $fetch<ApiResponse<AuthTokenData>>("/auth/refresh", {
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
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
<<<<<<< HEAD
    await apiFetch<ApiResponse<null>>("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
  } catch {
    // Abaikan error dari server saat logout
=======
    await $fetch<ApiResponse<null>>("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    })
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
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
  return apiFetch<ApiResponse<User>>("/auth/me", {
    method: "GET",
  })
}

// ============================================================================
// UPLOADS ACTION
// ============================================================================

export async function uploadFileAction(formData: FormData) {
  return apiFetch<ApiResponse<UploadResponseData>>("/uploads", {
    method: "POST",
    body: formData,
  })
}

// ============================================================================
// M2: EVENTS ACTIONS
// ============================================================================

export async function getEventsAction(params?: GetEventsParams) {
  return apiFetch<PaginatedApiResponse<EventSummary>>("/events", {
    method: "GET",
    query: cleanQuery(params),
  })
}

export async function createEventAction(body: CreateEventInput) {
  return apiFetch<ApiResponse<EventDetail>>("/events", {
    method: "POST",
    body,
  })
}

export async function getEventDetailAction(eventId: string) {
  return apiFetch<ApiResponse<EventDetail>>(`/events/${eventId}`, {
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
  return apiFetch<ApiResponse<EventDetail>>(`/events/${eventId}`, {
    method: "PATCH",
    body,
  })
}

export async function deleteEventAction(eventId: string) {
  return apiFetch<ApiResponse<null>>(`/events/${eventId}`, {
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
  return apiFetch<ApiResponse<Invitation>>(`/events/${eventId}/invitations`, {
    method: "POST",
    body,
  })
}

export async function getMyInvitationsAction(params?: GetMyInvitationsParams) {
  return apiFetch<PaginatedApiResponse<Invitation>>("/me/invitations", {
    method: "GET",
    query: cleanQuery(params),
  })
}

export async function acceptInvitationAction(invitationId: string) {
  return apiFetch<ApiResponse<null>>(`/invitations/${invitationId}/accept`, {
    method: "POST",
    body: {},
  })
}

export async function rejectInvitationAction(invitationId: string) {
  return apiFetch<ApiResponse<null>>(`/invitations/${invitationId}/reject`, {
    method: "POST",
    body: {},
  })
}

export async function cancelInvitationAction({
  eventId,
  invitationId,
}: {
  eventId: string
  invitationId: string
}) {
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/invitations/${invitationId}`,
    {
      method: "DELETE",
    }
  )
}

export async function getEventCommitteesAction(eventId: string) {
  return apiFetch<ApiResponse<EventCommitteesData>>(
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
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/committees/${userId}`,
    {
      method: "PATCH",
      body,
    }
  )
}

export async function removeCommitteeMemberAction({
  eventId,
  userId,
}: {
  eventId: string
  userId: string
}) {
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/committees/${userId}`,
    {
      method: "DELETE",
    }
  )
}

export async function leaveCommitteeAction(eventId: string) {
  return apiFetch<ApiResponse<null>>(`/events/${eventId}/committees/me`, {
    method: "DELETE",
  })
}

// ============================================================================
// M4: SESSIONS (RUNDOWN) ACTIONS
// ============================================================================

export async function getEventSessionsAction(eventId: string) {
  return apiFetch<ApiResponse<Session[]>>(`/events/${eventId}/sessions`, {
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
  return apiFetch<ApiResponse<Session>>(`/events/${eventId}/sessions`, {
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
  return apiFetch<ApiResponse<Session>>(
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
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/sessions/${sessionId}`,
    {
      method: "DELETE",
    }
  )
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
  return apiFetch<ApiResponse<Session>>(
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
  return apiFetch<ApiResponse<Registration>>(
    `/events/${eventId}/registrations`,
    {
      method: "POST",
      body: {},
    }
  )
}

export async function getMyRegistrationsAction(
  params?: GetMyRegistrationsParams
) {
  return apiFetch<PaginatedApiResponse<Registration>>("/me/registrations", {
    method: "GET",
    query: cleanQuery(params),
  })
}

export async function cancelMyRegistrationAction(eventId: string) {
  return apiFetch<ApiResponse<Registration>>(
    `/events/${eventId}/registrations/me/cancel`,
    {
      method: "POST",
      body: {},
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
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/registrations/${registrationId}/cancel`,
    {
      method: "POST",
      body: {},
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
  return apiFetch<ApiResponse<CheckInResultData>>(
    `/events/${eventId}/registrations/${registrationId}/check-in`,
    {
      method: "POST",
      body: {},
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
  return apiFetch<ApiResponse<CheckInResultData>>(
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
  return apiFetch<ApiResponse<Announcement[]>>(
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
  return apiFetch<ApiResponse<Announcement>>(
    `/events/${eventId}/announcements`,
    {
      method: "POST",
      body,
    }
  )
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
  return apiFetch<ApiResponse<Announcement>>(
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
  return apiFetch<ApiResponse<null>>(
    `/events/${eventId}/announcements/${announcementId}`,
    {
      method: "DELETE",
    }
  )
}

export async function getEventDashboardAction(eventId: string) {
  return apiFetch<ApiResponse<DashboardSummary>>(
    `/events/${eventId}/dashboard`,
    {
      method: "GET",
    }
  )
}

export async function getEventParticipantsAction({
  eventId,
  params,
}: {
  eventId: string
  params?: GetEventParticipantsParams
}) {
  return apiFetch<PaginatedApiResponse<ParticipantItem>>(
    `/events/${eventId}/participants`,
    {
      method: "GET",
      query: cleanQuery(params),
    }
  )
}
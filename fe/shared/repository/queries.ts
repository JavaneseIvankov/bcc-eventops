"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  ApiResponse,
  PaginatedApiResponse,
  ApiErrorResponse,
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
import {
  registerAction,
  loginAction,
  refreshTokenAction,
  logoutAction,
  getMeAction,
  uploadFileAction,
  getEventsAction,
  createEventAction,
  getEventDetailAction,
  updateEventAction,
  deleteEventAction,
  inviteCommitteeAction,
  getMyInvitationsAction,
  acceptInvitationAction,
  rejectInvitationAction,
  cancelInvitationAction,
  getEventCommitteesAction,
  updateCommitteeRoleAction,
  removeCommitteeMemberAction,
  leaveCommitteeAction,
  getEventSessionsAction,
  createSessionAction,
  updateSessionAction,
  deleteSessionAction,
  updateSessionStatusAction,
  registerEventAction,
  getMyRegistrationsAction,
  cancelMyRegistrationAction,
  cancelParticipantRegistrationAction,
  checkInManualAction,
  checkInQrAction,
  getAnnouncementsAction,
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  getEventDashboardAction,
  getEventParticipantsAction,
} from "./actions"

// ============================================================================
// TOAST MESSAGE HELPERS
// ============================================================================

function getErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback

  const anyErr = err as Partial<ApiErrorResponse> & Record<string, any>

  // 1. Cek struktur error bersarang dari backend / @better-fetch
  const nestedMessage =
    anyErr?.error?.error?.message ||
    anyErr?.cause?.error?.message ||
    anyErr?.error?.message ||
    anyErr?.cause?.message

  if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
    return nestedMessage
  }

  // 2. Cek err.message standar (abaikan jika hanya kode angka HTTP seperti "409" atau pesan digest Next.js)
  if (
    typeof anyErr.message === "string" &&
    anyErr.message.trim().length > 0 &&
    !/^\d{3}$/.test(anyErr.message.trim()) &&
    !anyErr.message.includes("Server Components render")
  ) {
    return anyErr.message
  }

  return fallback
}

function getSuccessMessage(
  res: { message?: string } | undefined,
  fallback: string
): string {
  return res?.message || fallback
}

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const eventOpsKeys = {
  all: ["eventops"] as const,
  auth: {
    all: () => [...eventOpsKeys.all, "auth"] as const,
    me: () => [...eventOpsKeys.auth.all(), "me"] as const,
  },
  events: {
    all: () => [...eventOpsKeys.all, "events"] as const,
    lists: () => [...eventOpsKeys.events.all(), "list"] as const,
    list: (params?: GetEventsParams) =>
      [...eventOpsKeys.events.lists(), params] as const,
    details: () => [...eventOpsKeys.events.all(), "detail"] as const,
    detail: (eventId: string) =>
      [...eventOpsKeys.events.details(), eventId] as const,
    committees: (eventId: string) =>
      [...eventOpsKeys.events.detail(eventId), "committees"] as const,
    sessions: (eventId: string) =>
      [...eventOpsKeys.events.detail(eventId), "sessions"] as const,
    announcements: (eventId: string) =>
      [...eventOpsKeys.events.detail(eventId), "announcements"] as const,
    dashboard: (eventId: string) =>
      [...eventOpsKeys.events.detail(eventId), "dashboard"] as const,
    participants: (eventId: string, params?: GetEventParticipantsParams) =>
      [...eventOpsKeys.events.detail(eventId), "participants", params] as const,
  },
  me: {
    all: () => [...eventOpsKeys.all, "me"] as const,
    invitations: (params?: GetMyInvitationsParams) =>
      [...eventOpsKeys.me.all(), "invitations", params] as const,
    registrations: (params?: GetMyRegistrationsParams) =>
      [...eventOpsKeys.me.all(), "registrations", params] as const,
  },
}

// ============================================================================
// M1: AUTH HOOKS
// ============================================================================

export function useGetMe(
  options?: Omit<
    UseQueryOptions<ApiResponse<User>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.auth.me(),
    queryFn: () => getMeAction(),
    retry: false,
    ...options,
  })
}

export function useRegister(
  options?: UseMutationOptions<
    ApiResponse<User>,
    ApiErrorResponse,
    RegisterInput
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (body) => registerAction(body),
    onSuccess: async (res, variables, onMutateResult, context) => {
      queryClient.setQueryData(eventOpsKeys.auth.me(), res)
      toast.success(
        getSuccessMessage(res, "Registrasi berhasil! Selamat datang di BCCin.")
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal melakukan registrasi akun."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useLogin(
  options?: UseMutationOptions<ApiResponse<User>, ApiErrorResponse, LoginInput>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (body) => loginAction(body),
    onSuccess: async (res, variables, onMutateResult, context) => {
      queryClient.setQueryData(eventOpsKeys.auth.me(), res)
      toast.success(getSuccessMessage(res, "Berhasil masuk ke akun!"))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Email atau password tidak valid."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useRefreshToken(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, void>
) {
  return useMutation({
    mutationFn: () => refreshTokenAction(),
    ...options,
  })
}

export function useLogout(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, void>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: () => logoutAction(),
    onSuccess: async (res, variables, onMutateResult, context) => {
      queryClient.clear()
      toast.success(getSuccessMessage(res, "Berhasil keluar dari akun."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal keluar dari akun."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// UPLOADS HOOK
// ============================================================================

export function useUploadFile(
  options?: UseMutationOptions<
    ApiResponse<UploadResponseData>,
    ApiErrorResponse,
    File | FormData
  >
) {
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (input) => {
      const formData =
        input instanceof FormData
          ? input
          : (() => {
            const fd = new FormData()
            fd.append("file", input)
            return fd
          })()
      return uploadFileAction(formData)
    },
    onSuccess: async (res, variables, onMutateResult, context) => {
      toast.success(getSuccessMessage(res, "Poster berhasil diunggah."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal mengunggah file poster."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// M2: EVENTS HOOKS
// ============================================================================

export function useGetEvents(
  params?: GetEventsParams,
  options?: Omit<
    UseQueryOptions<PaginatedApiResponse<EventSummary>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.list(params),
    queryFn: () => getEventsAction(params),
    ...options,
  })
}

export function useGetEventDetail(
  eventId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<EventDetail>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.detail(eventId),
    queryFn: () => getEventDetailAction(eventId),
    enabled: !!eventId,
    ...options,
  })
}

export function useCreateEvent(
  options?: UseMutationOptions<
    ApiResponse<EventDetail>,
    ApiErrorResponse,
    CreateEventInput
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (body) => createEventAction(body),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.lists(),
      })
      toast.success(
        getSuccessMessage(
          res,
          "Event baru berhasil dibuat! Anda adalah Koordinator."
        )
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal membuat event baru."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useUpdateEvent(
  options?: UseMutationOptions<
    ApiResponse<EventDetail>,
    ApiErrorResponse,
    { eventId: string; body: UpdateEventInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => updateEventAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(
        getSuccessMessage(res, "Informasi event berhasil diperbarui.")
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui informasi event."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useDeleteEvent(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, string>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (eventId) => deleteEventAction(eventId),
    onSuccess: async (res, eventId, onMutateResult, context) => {
      queryClient.removeQueries({
        queryKey: eventOpsKeys.events.detail(eventId),
      })
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.lists(),
      })
      toast.success(getSuccessMessage(res, "Event berhasil dihapus."))
      await onSuccess?.(res, eventId, onMutateResult, context)
    },
    onError: async (err, eventId, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menghapus event."))
      await onError?.(err, eventId, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// M3: COMMITTEES & INVITATIONS HOOKS
// ============================================================================

export function useGetMyInvitations(
  params?: GetMyInvitationsParams,
  options?: Omit<
    UseQueryOptions<PaginatedApiResponse<Invitation>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.me.invitations(params),
    queryFn: () => getMyInvitationsAction(params),
    ...options,
  })
}

export function useGetEventCommittees(
  eventId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<EventCommitteesData>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.committees(eventId),
    queryFn: () => getEventCommitteesAction(eventId),
    enabled: !!eventId,
    ...options,
  })
}

export function useInviteCommittee(
  options?: UseMutationOptions<
    ApiResponse<Invitation>,
    ApiErrorResponse,
    { eventId: string; body: InviteCommitteeInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => inviteCommitteeAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.committees(variables.eventId),
      })
      toast.success(
        getSuccessMessage(
          res,
          `Undangan panitia dikirim ke ${variables.body.email}.`
        )
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal mengirim undangan kepanitiaan."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useAcceptInvitation(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, string>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (invitationId) => acceptInvitationAction(invitationId),
    onSuccess: async (res, invitationId, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventOpsKeys.me.all() }),
        queryClient.invalidateQueries({ queryKey: eventOpsKeys.events.all() }),
      ])
      toast.success(
        getSuccessMessage(
          res,
          "Undangan diterima! Anda kini menjadi panitia aktif."
        )
      )
      await onSuccess?.(res, invitationId, onMutateResult, context)
    },
    onError: async (err, invitationId, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menerima undangan kepanitiaan."))
      await onError?.(err, invitationId, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useRejectInvitation(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, string>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (invitationId) => rejectInvitationAction(invitationId),
    onSuccess: async (res, invitationId, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: eventOpsKeys.me.all() })
      toast.success(
        getSuccessMessage(res, "Undangan kepanitiaan telah ditolak.")
      )
      await onSuccess?.(res, invitationId, onMutateResult, context)
    },
    onError: async (err, invitationId, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menolak undangan kepanitiaan."))
      await onError?.(err, invitationId, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useCancelInvitation(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; invitationId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => cancelInvitationAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.committees(variables.eventId),
      })
      toast.success(getSuccessMessage(res, "Undangan berhasil dibatalkan."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal membatalkan undangan."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useUpdateCommitteeRole(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; userId: string; body: UpdateCommitteeRoleInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => updateCommitteeRoleAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.committees(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(variables.eventId),
        }),
      ])
      toast.success(
        getSuccessMessage(res, "Role anggota panitia berhasil diubah.")
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal mengubah role anggota panitia."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useRemoveCommitteeMember(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; userId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => removeCommitteeMemberAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.committees(variables.eventId),
      })
      toast.success(
        getSuccessMessage(
          res,
          "Anggota panitia berhasil dikeluarkan dari event."
        )
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal mengeluarkan anggota panitia."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useLeaveCommittee(
  options?: UseMutationOptions<ApiResponse<null>, ApiErrorResponse, string>
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (eventId) => leaveCommitteeAction(eventId),
    onSuccess: async (res, eventId, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.lists(),
        }),
      ])
      toast.success(
        getSuccessMessage(res, "Anda telah keluar dari kepanitiaan event ini.")
      )
      await onSuccess?.(res, eventId, onMutateResult, context)
    },
    onError: async (err, eventId, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal keluar dari kepanitiaan."))
      await onError?.(err, eventId, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// M4: SESSIONS (RUNDOWN) HOOKS
// ============================================================================

export function useGetEventSessions(
  eventId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Session[]>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.sessions(eventId),
    queryFn: () => getEventSessionsAction(eventId),
    enabled: !!eventId,
    ...options,
  })
}

export function useCreateSession(
  options?: UseMutationOptions<
    ApiResponse<Session>,
    ApiErrorResponse,
    { eventId: string; body: CreateSessionInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => createSessionAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.sessions(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(getSuccessMessage(res, "Sesi baru berhasil ditambahkan."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menambahkan sesi ke rundown."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useUpdateSession(
  options?: UseMutationOptions<
    ApiResponse<Session>,
    ApiErrorResponse,
    { eventId: string; sessionId: string; body: UpdateSessionInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => updateSessionAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.sessions(variables.eventId),
      })
      toast.success(getSuccessMessage(res, "Detail sesi berhasil diperbarui."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui detail sesi."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useDeleteSession(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; sessionId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => deleteSessionAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.sessions(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(
        getSuccessMessage(res, "Sesi berhasil dihapus dari rundown.")
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menghapus sesi."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useUpdateSessionStatus(
  options?: UseMutationOptions<
    ApiResponse<Session>,
    ApiErrorResponse,
    { eventId: string; sessionId: string; body: UpdateSessionStatusInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => updateSessionStatusAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.sessions(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(
        getSuccessMessage(
          res,
          `Status sesi diperbarui menjadi ${variables.body.status}.`
        )
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui status sesi."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// M5 & M6: REGISTRATIONS & CHECK-IN HOOKS
// ============================================================================

export function useGetMyRegistrations(
  params?: GetMyRegistrationsParams,
  options?: Omit<
    UseQueryOptions<PaginatedApiResponse<Registration>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.me.registrations(params),
    queryFn: () => getMyRegistrationsAction(params),
    ...options,
  })
}

export function useRegisterEvent(
  options?: UseMutationOptions<
    ApiResponse<Registration>,
    ApiErrorResponse,
    string
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (eventId) => registerEventAction(eventId),
    onSuccess: async (res, eventId, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.lists(),
        }),
        queryClient.invalidateQueries({ queryKey: eventOpsKeys.me.all() }),
      ])
      toast.success(
        getSuccessMessage(
          res,
          "Berhasil mendaftar! Tiket QR Anda sudah tersedia."
        )
      )
      await onSuccess?.(res, eventId, onMutateResult, context)
    },
    onError: async (err, eventId, onMutateResult, context) => {
      // Sinkronkan ulang status pendaftaran jika user sudah terdaftar (409 ALREADY_REGISTERED)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(eventId),
        }),
        queryClient.invalidateQueries({ queryKey: eventOpsKeys.me.all() }),
      ])
      toast.error(
        getErrorMessage(
          err,
          "Anda sudah terdaftar aktif atau kuota pada event ini sudah penuh."
        )
      )
      await onError?.(err, eventId, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useCancelMyRegistration(
  options?: UseMutationOptions<
    ApiResponse<Registration>,
    ApiErrorResponse,
    string
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (eventId) => cancelMyRegistrationAction(eventId),
    onSuccess: async (res, eventId, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.lists(),
        }),
        queryClient.invalidateQueries({ queryKey: eventOpsKeys.me.all() }),
      ])
      toast.success(
        getSuccessMessage(res, "Pendaftaran Anda berhasil dibatalkan.")
      )
      await onSuccess?.(res, eventId, onMutateResult, context)
    },
    onError: async (err, eventId, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal membatalkan pendaftaran."))
      await onError?.(err, eventId, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useCancelParticipantRegistration(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; registrationId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => cancelParticipantRegistrationAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(
        getSuccessMessage(res, "Pendaftaran peserta berhasil dibatalkan.")
      )
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(
        getErrorMessage(err, "Gagal membatalkan pendaftaran peserta.")
      )
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useCheckInManual(
  options?: UseMutationOptions<
    ApiResponse<CheckInResultData>,
    ApiErrorResponse,
    { eventId: string; registrationId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => checkInManualAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(getSuccessMessage(res, "Check-in peserta berhasil!"))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal melakukan check-in peserta."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useCheckInQr(
  options?: UseMutationOptions<
    ApiResponse<CheckInResultData>,
    ApiErrorResponse,
    { eventId: string; body: CheckInQrInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => checkInQrAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.detail(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventOpsKeys.events.dashboard(variables.eventId),
        }),
      ])
      toast.success(getSuccessMessage(res, "Check-in via QR berhasil!"))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal memverifikasi QR Code peserta."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

// ============================================================================
// M7: OPERATIONS (ANNOUNCEMENTS, DASHBOARD, PARTICIPANTS) HOOKS
// ============================================================================

export function useGetAnnouncements(
  eventId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Announcement[]>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.announcements(eventId),
    queryFn: () => getAnnouncementsAction(eventId),
    enabled: !!eventId,
    ...options,
  })
}

export function useCreateAnnouncement(
  options?: UseMutationOptions<
    ApiResponse<Announcement>,
    ApiErrorResponse,
    { eventId: string; body: CreateAnnouncementInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => createAnnouncementAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.announcements(variables.eventId),
      })
      toast.success(getSuccessMessage(res, "Pengumuman berhasil diterbitkan."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menerbitkan pengumuman."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useUpdateAnnouncement(
  options?: UseMutationOptions<
    ApiResponse<Announcement>,
    ApiErrorResponse,
    { eventId: string; announcementId: string; body: UpdateAnnouncementInput }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => updateAnnouncementAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.announcements(variables.eventId),
      })
      toast.success(getSuccessMessage(res, "Pengumuman berhasil diperbarui."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal memperbarui pengumuman."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useDeleteAnnouncement(
  options?: UseMutationOptions<
    ApiResponse<null>,
    ApiErrorResponse,
    { eventId: string; announcementId: string }
  >
) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, ...restOptions } = options ?? {}

  return useMutation({
    mutationFn: (vars) => deleteAnnouncementAction(vars),
    onSuccess: async (res, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: eventOpsKeys.events.announcements(variables.eventId),
      })
      toast.success(getSuccessMessage(res, "Pengumuman berhasil dihapus."))
      await onSuccess?.(res, variables, onMutateResult, context)
    },
    onError: async (err, variables, onMutateResult, context) => {
      toast.error(getErrorMessage(err, "Gagal menghapus pengumuman."))
      await onError?.(err, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}

export function useGetEventDashboard(
  eventId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<DashboardSummary>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.dashboard(eventId),
    queryFn: () => getEventDashboardAction(eventId),
    enabled: !!eventId,
    ...options,
  })
}

export function useGetEventParticipants(
  eventId: string,
  params?: GetEventParticipantsParams,
  options?: Omit<
    UseQueryOptions<PaginatedApiResponse<ParticipantItem>, ApiErrorResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: eventOpsKeys.events.participants(eventId, params),
    queryFn: () => getEventParticipantsAction({ eventId, params }),
    enabled: !!eventId,
    ...options,
  })
}
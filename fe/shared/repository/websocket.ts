"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { eventOpsKeys } from "./queries"

type SocketChannel = "public" | "committee"

interface SocketMessage {
  event: string
  data?: unknown
}

function toWsBase(apiUrl: string | undefined) {
  if (!apiUrl) return null
  // API memakai http(s); socket memakai ws(s) dengan host yang sama.
  return apiUrl.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "")
}

/**
 * Berlangganan channel WebSocket untuk satu event dan invalidasi cache
 * TanStack Query sesuai event yang masuk, supaya UI update tanpa refresh.
 */
export function useEventRealtime({
  eventId,
  channel,
  enabled = true,
  onAccessRevoked,
}: {
  eventId: string
  channel: SocketChannel
  enabled?: boolean
  onAccessRevoked?: () => void
}) {
  const queryClient = useQueryClient()
  const onRevokedRef = React.useRef(onAccessRevoked)

  React.useEffect(() => {
    onRevokedRef.current = onAccessRevoked
  }, [onAccessRevoked])

  React.useEffect(() => {
    if (!enabled || !eventId) return

    const base = toWsBase(process.env.NEXT_PUBLIC_API_URL)
    if (!base) return

    const url = `${base}/ws/v1/events/${eventId}/${channel}`
    let socket: WebSocket | null = null
    let isClosedByUs = false
    let retry = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const invalidate = (key: readonly unknown[]) =>
      queryClient.invalidateQueries({ queryKey: key })

    const handleMessage = (raw: MessageEvent<string>) => {
      let message: SocketMessage
      try {
        message = JSON.parse(raw.data)
      } catch {
        return
      }

      const detail = eventOpsKeys.events.detail(eventId)

      switch (message.event) {
        case "EVENT_UPDATED":
        case "QUOTA_UPDATED":
          invalidate(detail)
          invalidate(eventOpsKeys.events.lists())
          break

        case "SESSION_CREATED":
        case "SESSION_UPDATED":
        case "SESSION_STATUS_UPDATED":
        case "SESSION_DELETED":
          invalidate(eventOpsKeys.events.sessions(eventId))
          invalidate(eventOpsKeys.events.dashboard(eventId))
          break

        case "ANNOUNCEMENT_CREATED":
        case "ANNOUNCEMENT_UPDATED":
        case "ANNOUNCEMENT_DELETED":
          invalidate(eventOpsKeys.events.announcements(eventId))
          break

        case "REGISTRATION_UPDATED":
          invalidate(detail)
          invalidate(eventOpsKeys.me.registrations())
          break

        case "DASHBOARD_UPDATED":
          invalidate(eventOpsKeys.events.dashboard(eventId))
          break

        case "PARTICIPANT_REGISTERED":
        case "PARTICIPANT_CANCELLED":
        case "PARTICIPANT_CHECKED_IN":
          invalidate(eventOpsKeys.events.participants(eventId))
          invalidate(eventOpsKeys.events.dashboard(eventId))
          break

        case "COMMITTEE_ROLE_CHANGED":
          invalidate(detail)
          invalidate(eventOpsKeys.events.committees(eventId))
          break

        case "ACCESS_REVOKED":
          isClosedByUs = true
          socket?.close()
          onRevokedRef.current?.()
          break

        default:
          break
      }
    }

    const connect = () => {
      socket = new WebSocket(url)

      socket.onopen = () => {
        retry = 0
      }

      socket.onmessage = handleMessage

      socket.onclose = () => {
        if (isClosedByUs) return
        // Backoff ringan supaya tidak menabrak server saat restart.
        retry = Math.min(retry + 1, 5)
        retryTimer = setTimeout(connect, retry * 1000)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      isClosedByUs = true
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    }
  }, [eventId, channel, enabled, queryClient])
}

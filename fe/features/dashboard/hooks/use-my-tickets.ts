"use client"

import { useMemo } from "react"
import {
  useGetEvents,
  useGetMyRegistrations,
} from "@/shared/repository/queries"
import type { EventSummary, Registration } from "@/shared/repository/types"

export interface TicketWithEvent {
  registration: Registration
  event: EventSummary | null
}

export function useMyTickets() {
  const registrationsQuery = useGetMyRegistrations({ limit: 50 })
  const eventsQuery = useGetEvents({ limit: 100 })

  const tickets = useMemo<TicketWithEvent[]>(() => {
    const registrations = registrationsQuery.data?.data ?? []
    const eventById = new Map(
      (eventsQuery.data?.data ?? []).map((event) => [event.id, event])
    )

    return registrations.map((registration) => ({
      registration,
      event: registration.event_id
        ? (eventById.get(registration.event_id) ?? null)
        : null,
    }))
  }, [registrationsQuery.data, eventsQuery.data])

  return {
    tickets,
    isLoading: registrationsQuery.isLoading || eventsQuery.isLoading,
  }
}

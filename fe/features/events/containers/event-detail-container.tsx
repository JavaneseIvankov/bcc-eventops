"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGetEventDetail } from "@/shared/repository/queries"
import { useEventRealtime } from "@/shared/repository/websocket"
import { EventDetailView } from "@/features/events/components/event-detail-view"

export function EventDetailContainer() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const { data, isLoading, isError } = useGetEventDetail(eventId)
  const event = data?.data

  // Update realtime: status event, rundown, pengumuman, dan tiket peserta.
  useEventRealtime({ eventId, channel: "public" })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-72 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm font-medium">Event tidak ditemukan</p>
        <p className="text-xs text-muted-foreground">
          Mungkin event sudah dihapus atau kamu tidak punya akses.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/events")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Kembali ke katalog
        </Button>
      </div>
    )
  }

  return <EventDetailView event={event} onBack={() => router.back()} />
}

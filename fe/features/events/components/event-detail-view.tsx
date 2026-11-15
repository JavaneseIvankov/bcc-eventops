"use client"

import { ArrowLeft, Calendar, Clock, MapPin, Megaphone } from "lucide-react"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import type { EventDetail } from "@/shared/repository/types"
import { EventStatusBadge, RoleBadge } from "@/features/events/components/event-status-badge"
import { formatDateRange, formatTimeRange } from "@/features/events/components/event-date"
import { RegistrationCard } from "@/features/events/components/registration-card"
import { LiveRundown } from "@/features/events/components/live-rundown"
import { LiveAnnouncements } from "@/features/events/components/live-announcements"
import { CommitteeBar } from "@/features/events/components/committee-bar"
import { cn } from "@/shared/lib/utils"

interface EventDetailViewProps {
  event: EventDetail
  onBack: () => void
}

export function EventDetailView({ event, onBack }: EventDetailViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {event.my_role && <CommitteeBar eventId={event.id} role={event.my_role} />}

      <button
        type="button"
        onClick={onBack}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-fit gap-1.5 text-muted-foreground"
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom kiri: hero + tab konten */}
        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="relative aspect-[16/9] w-full bg-muted">
              {event.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.poster_url}
                  alt={event.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Tanpa poster
                </div>
              )}
            </div>

            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <EventStatusBadge status={event.status} />
                {event.my_role && <RoleBadge role={event.my_role} />}
              </div>

              <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDateRange(event.start_time, event.end_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatTimeRange(event.start_time, event.end_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {event.short_description}
              </p>
            </div>
          </div>

          <Tabs defaultValue="rundown">
            <TabsList>
              <TabsTrigger value="rundown" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Live Rundown
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                Pengumuman
              </TabsTrigger>
            </TabsList>
            <TabsContent value="rundown" className="mt-3">
              <LiveRundown eventId={event.id} />
            </TabsContent>
            <TabsContent value="announcements" className="mt-3">
              <LiveAnnouncements eventId={event.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Kolom kanan: sticky registration card */}
        <div>
          <RegistrationCard event={event} />
        </div>
      </div>
    </div>
  )
}

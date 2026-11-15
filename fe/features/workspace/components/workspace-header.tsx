"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Calendar, MapPin, ScanLine } from "lucide-react"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import type { EventDetail } from "@/shared/repository/types"
import { EventStatusBadge, RoleBadge } from "@/features/events/components/event-status-badge"
import { formatDateRange, formatTimeRange } from "@/features/events/components/event-date"

export function WorkspaceHeader({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <Link
            href={`/events/${event.id}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            View Public Page
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Link
          href={`/events/${event.id}/workspace?tab=check-in`}
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
        >
          <ScanLine className="h-3.5 w-3.5" />
          Check-in Desk
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={event.status} />
          {event.my_role && <RoleBadge role={event.my_role} />}
        </div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {event.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateRange(event.start_time, event.end_time)} ·{" "}
            {formatTimeRange(event.start_time, event.end_time)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
        </div>
      </div>
    </div>
  )
}

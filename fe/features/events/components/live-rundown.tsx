"use client"

import { Clock, MapPin, Mic2 } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/shared/lib/utils"
import { useGetEventSessions } from "@/shared/repository/queries"
import { formatTimeRange } from "./event-date"
import { formatDateRange } from "./event-date"

export function LiveRundown({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetEventSessions(eventId)
  const sessions = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center">
        <p className="text-sm font-medium">Rundown belum tersedia</p>
        <p className="text-xs text-muted-foreground">
          Panitia belum menambahkan sesi untuk event ini.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {sessions.map((session) => {
        const isLive = session.status === "ONGOING"
        const isDone = session.status === "FINISHED"

        return (
          <li
            key={session.id}
            className={cn(
              "rounded-lg border p-4 transition-colors",
              isLive && "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]",
              isDone && "opacity-60"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{session.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {session.speaker && (
                    <span className="flex items-center gap-1">
                      <Mic2 className="h-3 w-3" />
                      {session.speaker}
                    </span>
                  )}
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateRange(session.start_time)}
                  </span>
                </div>
              </div>

              {isLive ? (
                <Badge variant="default" className="gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE NOW
                </Badge>
              ) : (
                <Badge variant={isDone ? "outline" : "secondary"}>
                  {formatTimeRange(session.start_time, session.end_time)}
                </Badge>
              )}
            </div>

            {session.description && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {session.description}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

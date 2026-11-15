"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarX } from "lucide-react"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGetEvents } from "@/shared/repository/queries"
import { EventStatusBadge, RoleBadge } from "@/features/events/components/event-status-badge"
import { formatDateRange } from "@/features/events/components/event-date"

export function ManagedEventsTable() {
  const { data, isLoading } = useGetEvents({ managed_by_me: true, limit: 100 })
  const events = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
        <CalendarX className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Belum ada event yang kamu kelola</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Buat event baru atau terima undangan panitia untuk mulai mengelola.
        </p>
        <Link
          href="/events/new"
          className={cn(buttonVariants({ size: "sm" }), "mt-2")}
        >
          Create event
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead className="hidden md:table-cell">Jadwal</TableHead>
            <TableHead className="hidden sm:table-cell">Peran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="max-w-[280px]">
                <Link
                  href={`/events/${event.id}/workspace`}
                  className="line-clamp-1 font-medium hover:text-primary hover:underline"
                >
                  {event.name}
                </Link>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {event.location}
                </p>
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                {formatDateRange(event.start_time, event.end_time)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {event.my_role && <RoleBadge role={event.my_role} />}
              </TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/events/${event.id}/workspace`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1"
                  )}
                >
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

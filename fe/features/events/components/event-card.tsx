import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  Clock,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { EventStatus, EventSummary } from "@/shared/repository/types"

import { Badge } from "@/shared/components/ui/badge"
import { buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Progress } from "@/shared/components/ui/progress"
import { Skeleton } from "@/shared/components/ui/skeleton"

import { formatDateRange, formatTimeRange } from "./event-date"

const STATUS_BADGE_MAP: Record<
  EventStatus,
  {
    label: string
    variant: "default" | "secondary" | "outline"
    dotClass: string
  }
> = {
  ONGOING: {
    label: "Live Now",
    variant: "default",
    dotClass: "bg-emerald-400 animate-pulse",
  },
  UPCOMING: {
    label: "Upcoming",
    variant: "secondary",
    dotClass: "bg-blue-500",
  },
  FINISHED: {
    label: "Finished",
    variant: "outline",
    dotClass: "bg-muted-foreground",
  },
}

export function EventCard({ event }: { event: EventSummary }) {
  const statusMeta = STATUS_BADGE_MAP[event.status]
  const fillPct =
    event.quota_total > 0
      ? Math.min(
          100,
          Math.round((event.quota_filled / event.quota_total) * 100)
        )
      : 0

  const isFull = event.quota_available <= 0
  const isAlmostFull =
    !isFull &&
    event.status === "UPCOMING" &&
    event.quota_available <= Math.ceil(event.quota_total * 0.15)

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
      {/* Poster / Thumbnail Header */}
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b bg-muted">
        {event.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.poster_url}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/10 via-muted to-background text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-[11px] font-medium">BCC EventOps</span>
          </div>
        )}

        {/* Top Left: Event Status Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <Badge
            variant={statusMeta.variant}
            className="gap-1.5 shadow-xs backdrop-blur"
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dotClass)}
            />
            {statusMeta.label}
          </Badge>
        </div>

        {/* Top Right: My Role Badge (Jika User adalah Coordinator / Committee) */}
        {event.my_role && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className="gap-1 border border-primary/30 bg-background/90 text-foreground shadow-xs backdrop-blur"
            >
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold">
                {event.my_role === "COORDINATOR" ? "Coordinator" : "Committee"}
              </span>
            </Badge>
          </div>
        )}
      </div>

      {/* Card Header & Description */}
      <CardHeader className="space-y-1.5 pb-3">
        <CardTitle className="line-clamp-1 text-lg leading-snug">
          <Link
            href={`/events/${event.id}`}
            className="transition-colors hover:text-primary"
          >
            {event.name}
          </Link>
        </CardTitle>
        <p className="line-clamp-2 min-h-[40px] text-xs leading-relaxed text-muted-foreground">
          {event.short_description || "Tidak ada deskripsi singkat."}
        </p>
      </CardHeader>

      {/* Card Body: Metadata & Quota Bar */}
      <CardContent className="flex-1 space-y-4 pb-4">
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">
              {formatDateRange(event.start_time, event.end_time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {formatTimeRange(event.start_time, event.end_time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Kuota Peserta</span>
            </span>

            {event.status === "FINISHED" ? (
              <span className="font-medium text-muted-foreground">
                {event.quota_filled} / {event.quota_total} terdaftar
              </span>
            ) : isFull ? (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                Kuota Penuh
              </Badge>
            ) : isAlmostFull ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Sisa {event.quota_available} kursi!
              </span>
            ) : (
              <span className="font-medium text-foreground">
                Sisa {event.quota_available} dari {event.quota_total}
              </span>
            )}
          </div>

          <Progress value={fillPct} className="h-1.5" />
        </div>
      </CardContent>

      {/* Card Footer: Action Buttons */}
      <CardFooter className="flex items-center gap-2 border-t bg-muted/10 pt-3">
        <Link
          href={`/events/${event.id}`}
          className={cn(
            buttonVariants({
              variant: event.my_role ? "outline" : "default",
              size: "sm",
            }),
            "flex-1 justify-center"
          )}
        >
          <span>
            {event.status === "UPCOMING" && !isFull && !event.my_role
              ? "Lihat & Daftar"
              : "Lihat Detail"}
          </span>
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>

        {/* Shortcut ke Tab-Based Event Workspace bila user adalah Panitia/Koordinator */}
        {event.my_role && (
          <Link
            href={`/events/${event.id}/workspace`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Workspace</span>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

export function EventCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardHeader className="space-y-2 pb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-4">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}

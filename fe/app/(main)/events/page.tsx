"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { useGetEvents } from "@/shared/repository/queries"
import type { EventStatus, EventSummary } from "@/shared/repository/types"

import { Badge } from "@/shared/components/ui/badge"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Progress } from "@/shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Skeleton } from "@/shared/components/ui/skeleton"

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const PAGE_LIMIT = 9

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

function formatEventDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  if (sameDay) {
    return dateFormatter.format(start)
  }

  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`
}

function formatEventTimeRange(startIso: string, endIso: string) {
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${timeFormatter.format(new Date(startIso))} – ${timeFormatter.format(
    new Date(endIso)
  )} WIB`
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExploreEventsPage() {
  // Filter & Pagination State
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "ALL">(
    "ALL"
  )
  const [managedOnly, setManagedOnly] = React.useState(false)
  const [page, setPage] = React.useState(1)

  // Debounce search input (350ms) agar tidak memicu request di setiap ketikan
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset ke halaman 1 ketika filter status atau managed_by_me berubah
  const handleStatusChange = (val: string) => {
    setStatusFilter(val as EventStatus | "ALL")
    setPage(1)
  }

  const handleToggleManagedOnly = () => {
    setManagedOnly((prev) => !prev)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchInput("")
    setDebouncedSearch("")
    setStatusFilter("ALL")
    setManagedOnly(false)
    setPage(1)
  }

  // Fetch Events dari API
  const {
    data: eventsRes,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetEvents({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    managed_by_me: managedOnly ? true : undefined,
  })

  const events = eventsRes?.data ?? []
  const meta = eventsRes?.meta
  const totalPages = meta?.total_pages ?? 1
  const totalItems = meta?.total_items ?? events.length

  const hasActiveFilters =
    debouncedSearch !== "" || statusFilter !== "ALL" || managedOnly

  return (
    <div className="flex flex-col gap-6">
      {/* Hero / Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs md:flex-row md:items-center">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <Compass className="h-4 w-4" />
            <span>BCC EventOps Catalog</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Explore Workshops &amp; Events
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Temukan kegiatan internal &amp; eksternal BCC, daftar secara instan
            untuk mendapatkan tiket QR Code, dan pantau rundown sesi secara
            realtime.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            My Dashboard
          </Link>
          <Link href="/events/new" className={buttonVariants()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama workshop, seminar, atau kegiatan..."
            className="pl-9"
          />
        </div>

        {/* Status & Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Status Pills (Desktop) / Select */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[155px]" aria-label="Filter status">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ONGOING">Live / Ongoing</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="FINISHED">Finished</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Managed By Me */}
          <Button
            type="button"
            variant={managedOnly ? "default" : "outline"}
            size="default"
            onClick={handleToggleManagedOnly}
            className="gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Managed by me</span>
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Result Count & Loading Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Menampilkan{" "}
          <strong className="text-foreground">{events.length}</strong> dari{" "}
          <strong className="text-foreground">{totalItems}</strong> event
          {hasActiveFilters ? " (terfilter)" : ""}
        </span>
        {isFetching && !isLoading && (
          <span className="animate-pulse font-medium text-primary">
            Memperbarui daftar...
          </span>
        )}
      </div>

      {/* Event Cards Grid */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-destructive">
              Gagal memuat katalog event.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <EventCardSkeleton key={idx} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyEventsState
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCatalogCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Halaman <strong className="text-foreground">{page}</strong> dari{" "}
            <strong className="text-foreground">{totalPages}</strong> (
            {totalItems} total event)
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EventCatalogCard({ event }: { event: EventSummary }) {
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
              {formatEventDateRange(event.start_time, event.end_time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {formatEventTimeRange(event.start_time, event.end_time)}
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

function EventCardSkeleton() {
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

function EmptyEventsState({
  hasActiveFilters,
  onReset,
}: {
  hasActiveFilters: boolean
  onReset: () => void
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {hasActiveFilters
            ? "Tidak ada event yang cocok dengan filter"
            : "Belum ada event yang tersedia"}
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {hasActiveFilters
            ? "Coba ubah kata kunci pencarian atau reset filter status untuk melihat seluruh kegiatan."
            : "Jadilah yang pertama membuat kegiatan baru untuk komunitas BCC."}
        </p>
        <div className="mt-5 flex items-center gap-2.5">
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Filter
            </Button>
          ) : (
            <Link href="/events/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="mr-1.5 h-4 w-4" />
              Buat Event Pertama
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

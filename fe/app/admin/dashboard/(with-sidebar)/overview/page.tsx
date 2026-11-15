"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  MailWarning,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
  Users,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  useDeleteEvent,
  useGetEventDashboard,
  useGetEvents,
  useGetMyInvitations,
} from "@/shared/repository/queries"
import type {
  DashboardSummary,
  EventStatus,
  EventSummary,
} from "@/shared/repository/types"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { Badge } from "@/shared/components/ui/badge"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { AdminDashboardShell } from "@/features/admin-dashboard/components/admin-dashboard-shell"

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const PAGE_SIZE = 5

const STATUS_BADGE_MAP: Record<
  EventStatus,
  {
    label: string
    variant: "default" | "secondary" | "outline"
    dotClass: string
  }
> = {
  ONGOING: {
    label: "Ongoing",
    variant: "default",
    dotClass: "bg-emerald-500",
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

interface KpiMetrics {
  totalEvents: number
  coordinatorCount: number
  committeeCount: number
  totalRegistrations: number
  fillRate: number
  activeCount: number
  ongoingCount: number
  availableSeats: number
}

function formatMonthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ============================================================================
// PAGE ENTRY
// ============================================================================

export default function AdminDashboardOverviewPage() {
  return (
    <AdminDashboardShell
      breadcrumbs={[
        { label: "Workspace", href: "/dashboard" },
        { label: "Overview" },
      ]}
    >
      <Content />
    </AdminDashboardShell>
  )
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

function Content() {
  const [selectedMonth, setSelectedMonth] = React.useState<string>("ALL")
  const [selectedEventId, setSelectedEventId] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "ALL">(
    "ALL"
  )
  const [page, setPage] = React.useState(1)
  const [eventToDelete, setEventToDelete] = React.useState<EventSummary | null>(
    null
  )

  const {
    data: eventsRes,
    isLoading: isEventsLoading,
    isError: isEventsError,
  } = useGetEvents({ managed_by_me: true, limit: 100 })

  const { data: invitationsRes } = useGetMyInvitations({
    status: "PENDING",
    limit: 1,
  })

  const allManagedEvents = React.useMemo(
    () => eventsRes?.data ?? [],
    [eventsRes?.data]
  )

  const monthOptions = React.useMemo(() => {
    const keys = new Set<string>()
    for (const ev of allManagedEvents) {
      if (ev.start_time) keys.add(formatMonthKey(ev.start_time))
    }
    return Array.from(keys).sort().reverse()
  }, [allManagedEvents])

  const periodEvents = React.useMemo(() => {
    if (selectedMonth === "ALL") return allManagedEvents
    return allManagedEvents.filter(
      (ev) => formatMonthKey(ev.start_time) === selectedMonth
    )
  }, [allManagedEvents, selectedMonth])

  React.useEffect(() => {
    if (periodEvents.length === 0) {
      setSelectedEventId("")
      return
    }
    const stillExists = periodEvents.some((e) => e.id === selectedEventId)
    if (!stillExists) {
      const preferred =
        periodEvents.find((e) => e.status === "ONGOING") ??
        periodEvents.find((e) => e.status === "UPCOMING") ??
        periodEvents[0]
      setSelectedEventId(preferred.id)
    }
  }, [periodEvents, selectedEventId])

  const { data: dashboardRes, isLoading: isDashboardLoading } =
    useGetEventDashboard(selectedEventId)

  const deleteEventMutation = useDeleteEvent({
    onSuccess: () => {
      setEventToDelete(null)
    },
  })

  const kpis = React.useMemo<KpiMetrics>(() => {
    const totalEvents = periodEvents.length
    const coordinatorCount = periodEvents.filter(
      (e) => e.my_role === "COORDINATOR"
    ).length
    const committeeCount = periodEvents.filter(
      (e) => e.my_role === "COMMITTEE"
    ).length

    const totalRegistrations = periodEvents.reduce(
      (acc, e) => acc + e.quota_filled,
      0
    )
    const totalQuota = periodEvents.reduce((acc, e) => acc + e.quota_total, 0)
    const fillRate =
      totalQuota > 0 ? Math.round((totalRegistrations / totalQuota) * 100) : 0

    const activeCount = periodEvents.filter(
      (e) => e.status === "UPCOMING" || e.status === "ONGOING"
    ).length
    const ongoingCount = periodEvents.filter(
      (e) => e.status === "ONGOING"
    ).length

    const availableSeats = periodEvents
      .filter((e) => e.status !== "FINISHED")
      .reduce((acc, e) => acc + e.quota_available, 0)

    return {
      totalEvents,
      coordinatorCount,
      committeeCount,
      totalRegistrations,
      fillRate,
      activeCount,
      ongoingCount,
      availableSeats,
    }
  }, [periodEvents])

  const comingUpNext = React.useMemo(() => {
    return allManagedEvents
      .filter((e) => e.status === "UPCOMING" || e.status === "ONGOING")
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
      .slice(0, 3)
  }, [allManagedEvents])

  const filteredTableEvents = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return periodEvents.filter((ev) => {
      const matchesStatus = statusFilter === "ALL" || ev.status === statusFilter
      const matchesSearch =
        !q ||
        ev.name.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [periodEvents, searchQuery, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTableEvents.length / PAGE_SIZE)
  )
  const safePage = Math.min(page, totalPages)
  const paginatedEvents = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredTableEvents.slice(start, start + PAGE_SIZE)
  }, [filteredTableEvents, safePage])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, selectedMonth])

  const pendingInvitesCount = invitationsRes?.meta?.total_items ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <PendingInvitationsBanner count={pendingInvitesCount} />

      <DashboardHeader
        selectedMonth={selectedMonth}
        monthOptions={monthOptions}
        onMonthChange={setSelectedMonth}
      />

      <KpiGrid kpis={kpis} isLoading={isEventsLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EventOperationsCard
          events={periodEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          summary={dashboardRes?.data}
          isLoading={isEventsLoading || isDashboardLoading}
        />

        <ComingUpNextCard events={comingUpNext} isLoading={isEventsLoading} />
      </div>

      <ManagedEventsTableCard
        events={paginatedEvents}
        totalFilteredCount={filteredTableEvents.length}
        isLoading={isEventsLoading}
        isError={isEventsError}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        onRequestDelete={setEventToDelete}
      />

      <DeleteEventConfirmDialog
        event={eventToDelete}
        isPending={deleteEventMutation.isPending}
        onClose={() => setEventToDelete(null)}
        onConfirm={(id) => deleteEventMutation.mutate(id)}
      />
    </div>
  )
}

// ============================================================================
// COMPOSABLE SUB-COMPONENTS
// ============================================================================

function PendingInvitationsBanner({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5 text-sm">
          <MailWarning className="h-4 w-4 shrink-0 text-primary" />
          <span>
            You have{" "}
            <strong className="font-semibold">
              {count} pending committee{" "}
              {count === 1 ? "invitation" : "invitations"}
            </strong>{" "}
            waiting for your response.
          </span>
        </div>
        <Link
          href="/invitations"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Review invitations
        </Link>
      </CardContent>
    </Card>
  )
}

function DashboardHeader({
  selectedMonth,
  monthOptions,
  onMonthChange,
}: {
  selectedMonth: string
  monthOptions: string[]
  onMonthChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Workspace Overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Every great event starts here.
        </h1>
        <p className="text-sm text-muted-foreground">
          A clear view of your managed events, attendance operations, and
          what&apos;s coming next.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={selectedMonth}
          onValueChange={(v, _) => onMonthChange(v ?? "")}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by month">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All periods</SelectItem>
            {monthOptions.map((key) => (
              <SelectItem key={key} value={key}>
                {formatMonthLabel(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Link href="/events/new" className={buttonVariants()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create event
        </Link>
      </div>
    </div>
  )
}

function KpiStatCard({
  title,
  value,
  subtitle,
  icon,
  isLoading,
  skeletonWidth = "w-16",
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  isLoading: boolean
  skeletonWidth?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className={cn("h-8", skeletonWidth)} />
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function KpiGrid({
  kpis,
  isLoading,
}: {
  kpis: KpiMetrics
  isLoading: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiStatCard
        title="Managed events"
        value={kpis.totalEvents}
        subtitle={`${kpis.coordinatorCount} coordinator · ${kpis.committeeCount} committee`}
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        skeletonWidth="w-16"
      />
      <KpiStatCard
        title="Active registrations"
        value={kpis.totalRegistrations.toLocaleString()}
        subtitle={`${kpis.fillRate}% of total quota filled`}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        skeletonWidth="w-24"
      />
      <KpiStatCard
        title="Upcoming & live"
        value={kpis.activeCount}
        subtitle={`${kpis.ongoingCount} currently ongoing`}
        icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        skeletonWidth="w-16"
      />
      <KpiStatCard
        title="Available seats"
        value={kpis.availableSeats.toLocaleString()}
        subtitle="Across active & upcoming events"
        icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        skeletonWidth="w-20"
      />
    </div>
  )
}

function EventOperationsCard({
  events,
  selectedEventId,
  onSelectEvent,
  summary,
  isLoading,
}: {
  events: EventSummary[]
  selectedEventId: string
  onSelectEvent: (eventId: string) => void
  summary?: DashboardSummary
  isLoading: boolean
}) {
  const checkedInPct =
    summary && summary.active_registrations > 0
      ? Math.round(
          (summary.checked_in_count / summary.active_registrations) * 100
        )
      : 0

  return (
    <Card className="flex flex-col justify-between lg:col-span-2">
      <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle>Event operations overview</CardTitle>
          <CardDescription>
            Live check-in progress and rundown session status
          </CardDescription>
        </div>

        {events.length > 0 && (
          <Select value={selectedEventId} onValueChange={(v, _) => onSelectEvent(v ?? "")}>
            <SelectTrigger className="w-full sm:w-[230px]">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : !summary ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-sm font-medium">No event selected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create an event or accept a committee invitation to view
              operational metrics.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Attendee check-in rate</span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">
                    {summary.checked_in_count}
                  </strong>{" "}
                  / {summary.active_registrations} checked in ({checkedInPct}%)
                </span>
              </div>
              <Progress value={checkedInPct} className="h-2.5" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Checked in</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.checked_in_count}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Not arrived</p>
                <p className="mt-1 text-2xl font-bold">
                  {summary.not_checked_in_count}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="mt-1 text-2xl font-bold text-muted-foreground">
                  {summary.cancelled_count}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Quota left</p>
                <p className="mt-1 text-2xl font-bold">
                  {summary.quota_available}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{summary.quota_total}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-xs">
              <span className="font-medium text-muted-foreground">
                Rundown sessions ({summary.sessions_summary.total} total)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  {summary.sessions_summary.ongoing} Ongoing
                </Badge>
                <Badge variant="secondary">
                  {summary.sessions_summary.upcoming} Upcoming
                </Badge>
                <Badge variant="outline">
                  {summary.sessions_summary.finished} Finished
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {selectedEventId && (
        <CardFooter className="justify-end border-t pt-4">
          <Link
            href={`/events/${selectedEventId}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Open event workspace
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}

function ComingUpNextCard({
  events,
  isLoading,
}: {
  events: EventSummary[]
  isLoading: boolean
}) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Coming up next</CardTitle>
        <CardDescription>Your next moments that matter.</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm font-medium">No upcoming events</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Scheduled upcoming or ongoing events will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const dateObj = new Date(ev.start_time)
              const day = String(dateObj.getDate()).padStart(2, "0")
              const month = dateObj
                .toLocaleDateString("en-US", { month: "short" })
                .toUpperCase()

              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                      <span className="text-sm leading-none font-bold">
                        {day}
                      </span>
                      <span className="mt-0.5 text-[10px] font-semibold">
                        {month}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ev.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{formatTime(ev.start_time)}</span>
                        <span>·</span>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Link
          href="/events"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-between"
          )}
        >
          <span>View all events</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}

function ManagedEventRow({
  event,
  onRequestDelete,
}: {
  event: EventSummary
  onRequestDelete: (event: EventSummary) => void
}) {
  const router = useRouter()
  const statusMeta = STATUS_BADGE_MAP[event.status]
  const regPct =
    event.quota_total > 0
      ? Math.min(
          100,
          Math.round((event.quota_filled / event.quota_total) * 100)
        )
      : 0

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.name}
          </Link>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="capitalize">
            {event.my_role?.toLowerCase() ?? "Member"}
          </span>
          <span>·</span>
          <span className="truncate">{event.location}</span>
        </div>
      </TableCell>

      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
        {formatShortDate(event.start_time)}
      </TableCell>

      <TableCell>
        <Badge variant={statusMeta.variant} className="gap-1.5">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dotClass)}
          />
          {statusMeta.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {event.quota_filled} / {event.quota_total}
            </span>
            <span className="text-muted-foreground">{regPct}%</span>
          </div>
          <Progress value={regPct} className="h-1.5" />
        </div>
      </TableCell>

      <TableCell className="text-right font-medium">
        {event.quota_available === 0 ? (
          <Badge variant="outline">Full</Badge>
        ) : (
          <span>{event.quota_available}</span>
        )}
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8"
            )}
            aria-label="Event actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Open workspace
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/events/${event.id}/check-in`)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Check-in desk
            </DropdownMenuItem>
            {event.my_role === "COORDINATOR" && (
              <>
                <DropdownMenuItem
                  onClick={() => router.push(`/events/${event.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit event
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRequestDelete(event)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete event
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function TablePaginationFooter({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <CardFooter className="flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {totalItems} events
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </CardFooter>
  )
}

function ManagedEventsTableCard({
  events,
  totalFilteredCount,
  isLoading,
  isError,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  onPageChange,
  onRequestDelete,
}: {
  events: EventSummary[]
  totalFilteredCount: number
  isLoading: boolean
  isError: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  statusFilter: EventStatus | "ALL"
  onStatusFilterChange: (status: EventStatus | "ALL") => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRequestDelete: (event: EventSummary) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle>Managed events</CardTitle>
            <Badge variant="secondary">{totalFilteredCount}</Badge>
          </div>
          <CardDescription>
            Keep every detail moving in the right direction.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events or location..."
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              onStatusFilterChange(v as EventStatus | "ALL")
            }
          >
            <SelectTrigger className="w-[145px]">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="FINISHED">Finished</SelectItem>
            </SelectContent>
          </Select>

          <Link
            href="/events"
            className={buttonVariants({ variant: "outline" })}
          >
            View all events
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {isError ? (
          <div className="flex h-36 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            Failed to load managed events. Please try refreshing the page.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px]">Registrations</TableHead>
                  <TableHead className="text-right">Seats left</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="h-5 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No events match your current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((ev) => (
                    <ManagedEventRow
                      key={ev.id}
                      event={ev}
                      onRequestDelete={onRequestDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <TablePaginationFooter
        page={page}
        totalPages={totalPages}
        totalItems={totalFilteredCount}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </Card>
  )
}

function DeleteEventConfirmDialog({
  event,
  isPending,
  onClose,
  onConfirm,
}: {
  event: EventSummary | null
  isPending: boolean
  onClose: () => void
  onConfirm: (eventId: string) => void
}) {
  return (
    <AlertDialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete event?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <strong className="text-foreground">{event?.name}</strong> along
            with all sessions, registrations, and announcements. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              if (event) {
                onConfirm(event.id)
              }
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

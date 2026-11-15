import { Link2, ShieldCheck, Ticket, CalendarClock } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

interface KpiCardProps {
  label: string
  value: number | string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
}

function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {hint && (
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardKpi({
  managedCount,
  coordinatorCount,
  committeeCount,
  activeRegistrations,
  upcomingLiveCount,
  ticketCount,
}: {
  managedCount: number
  coordinatorCount: number
  committeeCount: number
  activeRegistrations: number
  upcomingLiveCount: number
  ticketCount: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Managed Events"
        value={managedCount}
        hint={`${coordinatorCount} coordinator · ${committeeCount} committee`}
        icon={ShieldCheck}
      />
      <KpiCard
        label="Active Registrations"
        value={activeRegistrations}
        hint="Pendaftaran yang masih berlaku"
        icon={Link2}
      />
      <KpiCard
        label="Upcoming & Live"
        value={upcomingLiveCount}
        hint="Dari event yang kamu kelola"
        icon={CalendarClock}
      />
      <KpiCard
        label="My Tickets"
        value={ticketCount}
        hint="Event yang kamu ikuti"
        icon={Ticket}
      />
    </div>
  )
}

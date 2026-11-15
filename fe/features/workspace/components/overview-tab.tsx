"use client"

import { CalendarCheck, CalendarClock, UserMinus, UserX } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Progress } from "@/shared/components/ui/progress"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGetEventDashboard } from "@/shared/repository/queries"

export function OverviewTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetEventDashboard(eventId)
  const summary = data?.data

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  const checkedInPct =
    summary.active_registrations > 0
      ? Math.round(
          (summary.checked_in_count / summary.active_registrations) * 100
        )
      : 0

  const cards = [
    {
      label: "Checked In",
      value: summary.checked_in_count,
      hint: `${checkedInPct}% dari ${summary.active_registrations} peserta aktif`,
      icon: CalendarCheck,
      progress: checkedInPct,
    },
    {
      label: "Not Arrived",
      value: summary.not_checked_in_count,
      hint: "Terdaftar tapi belum check-in",
      icon: CalendarClock,
    },
    {
      label: "Cancelled",
      value: summary.cancelled_count,
      hint: "Pendaftaran dibatalkan",
      icon: UserX,
    },
    {
      label: "Quota Left",
      value: summary.quota_available,
      hint: `dari total ${summary.quota_total} kursi`,
      icon: UserMinus,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon, progress }) => (
          <Card key={label}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {typeof progress === "number" && (
                <Progress value={progress} className="h-1.5" />
              )}
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-semibold">Rundown Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Sesi", value: summary.sessions_summary.total },
              { label: "Ongoing", value: summary.sessions_summary.ongoing },
              { label: "Upcoming", value: summary.sessions_summary.upcoming },
              { label: "Finished", value: summary.sessions_summary.finished },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border bg-muted/30 p-3 text-center"
              >
                <p className="text-lg font-bold tabular-nums">{item.value}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

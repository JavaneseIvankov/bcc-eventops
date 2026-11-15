import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import type { EventStatus } from "@/shared/repository/types"

// Satu sumber kebenaran untuk pemetaan status -> badge.
// Rule warnanya mengikuti bagian 2.5 dev.md, jadi jangan diduplikasi di halaman.
const STATUS_META: Record<
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
    dotClass: "bg-emerald-500 animate-pulse",
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

export function EventStatusBadge({
  status,
  className,
}: {
  status: EventStatus
  className?: string
}) {
  const meta = STATUS_META[status]

  return (
    <Badge variant={meta.variant} className={cn("gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  )
}

export function RoleBadge({ role }: { role: "COORDINATOR" | "COMMITTEE" }) {
  return (
    <Badge variant="outline" className="gap-1 border-primary/30">
      {role === "COORDINATOR" ? "Coordinator" : "Committee"}
    </Badge>
  )
}

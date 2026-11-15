import { Badge } from "@/shared/components/ui/badge"
import type { EventStatus } from "@/shared/repository/types"

interface EventStatusBadgeProps {
  status: EventStatus
  className?: string
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config: Record<
    EventStatus,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    UPCOMING: { label: "Upcoming", variant: "secondary" },
    ONGOING: { label: "Ongoing", variant: "default" },
    FINISHED: { label: "Finished", variant: "outline" },
  }

  const { label, variant } = config[status] ?? {
    label: status,
    variant: "outline",
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

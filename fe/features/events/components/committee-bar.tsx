import Link from "next/link"
import { ArrowUpRight, ScanLine, ShieldCheck } from "lucide-react"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import type { CommitteeRole } from "@/shared/repository/types"

export function CommitteeBar({
  eventId,
  role,
}: {
  eventId: string
  role: CommitteeRole
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p>
          Kamu adalah{" "}
          <span className="font-semibold">
            {role === "COORDINATOR" ? "Koordinator" : "Panitia"}
          </span>{" "}
          di event ini.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/events/${eventId}/workspace`}
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          Buka Workspace
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/events/${eventId}/workspace?tab=check-in`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ScanLine className="h-3.5 w-3.5" />
          Meja Check-in
        </Link>
      </div>
    </div>
  )
}

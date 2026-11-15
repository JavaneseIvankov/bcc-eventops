import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import type { User } from "@/shared/repository/types"

export function DashboardHeader({ user }: { user: User }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Personal dashboard
          </p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Link
        href="/events/new"
        className={cn(buttonVariants(), "shrink-0 self-start md:self-auto")}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Create event
      </Link>
    </div>
  )
}

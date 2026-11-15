import Link from "next/link"
import { Compass, Plus } from "lucide-react"

import { buttonVariants } from "@/shared/components/ui/button"

export function ExploreHeader() {
  return (
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
  )
}

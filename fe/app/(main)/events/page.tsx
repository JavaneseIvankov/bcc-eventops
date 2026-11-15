"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Search } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
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
import { useGetEvents } from "@/shared/repository/queries"
import { EventStatus } from "@/shared/repository/types"

function CatalogStatusBadge({ status }: { status: EventStatus }) {
  if (status === "ONGOING") {
    return (
      <Badge variant="default" className="gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>ONGOING</span>
      </Badge>
    )
  }
  if (status === "UPCOMING") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <span>UPCOMING</span>
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
      <span>FINISHED</span>
    </Badge>
  )
}

export default function ExploreEventsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<EventStatus | "ALL">("ALL")
  const [managedByMe, setManagedByMe] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: res, isLoading } = useGetEvents({
    page,
    limit: 9,
    search: debouncedSearch || undefined,
    status,
    managed_by_me: managedByMe ? true : undefined,
  })

  const events = res?.data ?? []
  const totalPages = res?.meta?.total_pages ?? 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explore Events</h1>
        <p className="text-sm text-muted-foreground">
          Jelajahi katalog kegiatan BCC, pantau kuota peserta, dan daftar secara
          langsung.
        </p>
      </div>

      {/* Filter & Debounced Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama event..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val as EventStatus | "ALL")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ONGOING">ONGOING</SelectItem>
            <SelectItem value="UPCOMING">UPCOMING</SelectItem>
            <SelectItem value="FINISHED">FINISHED</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={managedByMe ? "default" : "outline"}
          onClick={() => {
            setManagedByMe((prev) => !prev)
            setPage(1)
          }}
        >
          Managed by me
        </Button>
      </div>

      {/* Grid Kartu Event */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Tidak ada event yang sesuai dengan filter pencarian.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const pct =
              ev.quota_total > 0
                ? Math.min(
                    100,
                    Math.round((ev.quota_filled / ev.quota_total) * 100)
                  )
                : 0

            return (
              <Card
                key={ev.id}
                className="flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {ev.poster_url ? (
                    <img
                      src={ev.poster_url}
                      alt={ev.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
                      BCCin EVENT
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CatalogStatusBadge status={ev.status} />
                      {ev.my_role && (
                        <Badge variant="secondary">{ev.my_role}</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2 line-clamp-1 text-lg">
                      {ev.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {ev.short_description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(ev.start_time).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-medium text-foreground">
                        <span>
                          Quota: {ev.quota_filled} / {ev.quota_total}
                        </span>
                        <span>{ev.quota_available} left</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  </CardContent>
                </div>

                <div className="flex items-center gap-2 border-t p-4 pt-3">
                  <Link
                    href={`/events/${ev.id}`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "flex-1"
                    )}
                  >
                    View Event
                  </Link>
                  {ev.my_role && (
                    <Link
                      href={`/workspace?eventId=${ev.id}`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" })
                      )}
                    >
                      Workspace
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

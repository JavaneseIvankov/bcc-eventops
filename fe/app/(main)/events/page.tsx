"use client"

import * as React from "react"

import { useGetEvents } from "@/shared/repository/queries"

import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card"

import { EventCard, EventCardSkeleton } from "@/features/events/components/event-card"
import { ExploreEmptyState } from "@/features/events/components/explore-empty-state"
import { ExploreHeader } from "@/features/events/components/explore-header"
import {
  ExplorePagination,
} from "@/features/events/components/explore-pagination"
import {
  ExploreToolbar,
  type StatusFilterValue,
} from "@/features/events/components/explore-toolbar"

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_LIMIT = 9

// ============================================================================
// MAIN PAGE COMPONENT (SMART CONTAINER)
// ============================================================================

export default function ExploreEventsPage() {
  // Filter & Pagination State
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilterValue>("ALL")
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

  // Reset ke halaman 1 ketika filter status atau managed_by_me berubah.
  // Select bisa mengirim null saat nilai dikosongkan, jadi kita guard di boundary
  // alih-alih cast, supaya "ALL" tidak pernah bocor ke query.
  const handleStatusChange = (val: StatusFilterValue | null) => {
    if (!val) return
    setStatusFilter(val)
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
      <ExploreHeader />

      <ExploreToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        managedOnly={managedOnly}
        onToggleManaged={handleToggleManagedOnly}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

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
        <ExploreEmptyState
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {!isLoading && (
        <ExplorePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

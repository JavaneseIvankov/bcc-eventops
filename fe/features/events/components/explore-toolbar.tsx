import { Filter, RotateCcw, Search, ShieldCheck } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import type { EventStatus } from "@/shared/repository/types"

export type StatusFilterValue = EventStatus | "ALL"

export type ExploreToolbarProps = {
  searchInput: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilterValue
  onStatusChange: (value: StatusFilterValue | null) => void
  managedOnly: boolean
  onToggleManaged: () => void
  onReset: () => void
  hasActiveFilters: boolean
}

export function ExploreToolbar({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  managedOnly,
  onToggleManaged,
  onReset,
  hasActiveFilters,
}: ExploreToolbarProps) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama workshop, seminar, atau kegiatan..."
          className="pl-9"
        />
      </div>

      {/* Status & Role Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Status Pills (Desktop) / Select */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[155px]" aria-label="Filter status">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ONGOING">Live / Ongoing</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="FINISHED">Finished</SelectItem>
          </SelectContent>
        </Select>

        {/* Toggle Managed By Me */}
        <Button
          type="button"
          variant={managedOnly ? "default" : "outline"}
          size="default"
          onClick={onToggleManaged}
          className="gap-1.5"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Managed by me</span>
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}

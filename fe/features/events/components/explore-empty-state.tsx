import Link from "next/link"
import { Plus, RotateCcw, Sparkles } from "lucide-react"

import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card"

export type ExploreEmptyStateProps = {
  hasActiveFilters: boolean
  onReset: () => void
}

export function ExploreEmptyState({
  hasActiveFilters,
  onReset,
}: ExploreEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {hasActiveFilters
            ? "Tidak ada event yang cocok dengan filter"
            : "Belum ada event yang tersedia"}
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {hasActiveFilters
            ? "Coba ubah kata kunci pencarian atau reset filter status untuk melihat seluruh kegiatan."
            : "Jadilah yang pertama membuat kegiatan baru untuk komunitas BCC."}
        </p>
        <div className="mt-5 flex items-center gap-2.5">
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Filter
            </Button>
          ) : (
            <Link href="/events/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="mr-1.5 h-4 w-4" />
              Buat Event Pertama
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

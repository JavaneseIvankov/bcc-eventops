import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/shared/components/ui/button"

export type ExplorePaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function ExplorePagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: ExplorePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Halaman <strong className="text-foreground">{page}</strong> dari{" "}
        <strong className="text-foreground">{totalPages}</strong> ({totalItems}{" "}
        total event)
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNumber = idx + 1
          return (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

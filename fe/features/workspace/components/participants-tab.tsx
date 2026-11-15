"use client"

import * as React from "react"
import { Download, Loader2, Search } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import {
  useCheckInManual,
  useGetEventParticipants,
} from "@/shared/repository/queries"
import type { RegistrationStatus } from "@/shared/repository/types"
import { formatDateTime } from "@/features/events/components/event-date"
import { getEventParticipantsAction } from "@/shared/repository/actions"

type StatusFilter = RegistrationStatus | "ALL"

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  REGISTERED: "Terdaftar",
  CHECKED_IN: "Checked In",
  CANCELLED: "Dibatalkan",
}

const STATUS_VARIANT: Record<
  RegistrationStatus,
  "default" | "secondary" | "destructive"
> = {
  REGISTERED: "secondary",
  CHECKED_IN: "default",
  CANCELLED: "destructive",
}

const PAGE_SIZE = 10

export function ParticipantsTab({ eventId }: { eventId: string }) {
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [isExporting, setIsExporting] = React.useState(false)

  const { data, isLoading, refetch } = useGetEventParticipants(eventId, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  })

  const participants = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta?.total_pages ?? 1

  const checkInMut = useCheckInManual()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Ambil seluruh peserta lalu bangun CSV di sisi klien, sesuai spec
      // (limit 10000). Tidak perlu endpoint export terpisah di backend.
      const result = await getEventParticipantsAction({
        eventId,
        params: { limit: 10000 },
      })

      const rows = result.data ?? []
      const header = [
        "Nama",
        "Email",
        "Status",
        "Terdaftar",
        "Check-in",
      ]
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`

      const csv = [
        header.join(","),
        ...rows.map((row) =>
          [
            row.name,
            row.email,
            row.status,
            row.registered_at,
            row.checked_in_at ?? "",
          ]
            .map((cell) => escape(String(cell)))
            .join(",")
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `participants-${eventId}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama atau email..."
              className="pl-9"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              if (typeof value !== "string") return
              setStatus(value as StatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              <SelectItem value="REGISTERED">Terdaftar</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            disabled={isExporting}
            onClick={handleExport}
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : participants.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Belum ada peserta.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Check-in
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.registration_id}>
                    <TableCell className="font-medium">
                      {participant.name}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {participant.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[participant.status]}>
                        {STATUS_LABEL[participant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {participant.checked_in_at
                        ? formatDateTime(participant.checked_in_at)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {participant.status === "REGISTERED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={checkInMut.isPending}
                          onClick={() =>
                            checkInMut.mutate(
                              {
                                eventId,
                                registrationId: participant.registration_id,
                              },
                              { onSuccess: () => refetch() }
                            )
                          }
                        >
                          Check-in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

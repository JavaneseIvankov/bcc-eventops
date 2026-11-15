"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ScanLine,
  UserCheck,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Badge } from "@/shared/components/ui/badge"
import {
  useCheckInManual,
  useCheckInQr,
  useGetEventParticipants,
} from "@/shared/repository/queries"

type ScanFeedback = {
  kind: "success" | "duplicate" | "error"
  title: string
  detail?: string
}

// Terjemahkan status check-in jadi feedback visual yang tidak ambigu:
// hijau = sukses, kuning = sudah pernah check-in, merah = gagal.
function buildFeedback(err: unknown): ScanFeedback {
  const error = err as { error?: { code?: string; message?: string } }
  const code = error?.error?.code
  const message = error?.error?.message

  if (code === "ALREADY_CHECKED_IN") {
    return {
      kind: "duplicate",
      title: "Peserta sudah check-in",
      detail: message ?? "QR ini sebelumnya sudah dipindai.",
    }
  }

  return {
    kind: "error",
    title: "Check-in gagal",
    detail: message ?? "QR tidak valid atau peserta tidak ditemukan.",
  }
}

export function CheckInTab({ eventId }: { eventId: string }) {
  const [token, setToken] = React.useState("")
  const [feedback, setFeedback] = React.useState<ScanFeedback | null>(null)
  const [search, setSearch] = React.useState("")

  const qrMut = useCheckInQr()
  const manualMut = useCheckInManual()

  const { data, isLoading, refetch } = useGetEventParticipants(
    eventId,
    { search: search || undefined, limit: 8 },
    { enabled: !!eventId }
  )
  const participants = data?.data ?? []

  const handleQrSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = token.trim()
    if (!value) return

    qrMut.mutate(
      { eventId, body: { qr_token: value } },
      {
        onSuccess: (res) => {
          setFeedback({
            kind: "success",
            title: `${res.data.user_name} berhasil check-in`,
            detail: res.data.user_email,
          })
          setToken("")
          refetch()
        },
        onError: (err) => setFeedback(buildFeedback(err)),
      }
    )
  }

  const handleManualCheckIn = (registrationId: string, name: string) => {
    manualMut.mutate(
      { eventId, registrationId },
      {
        onSuccess: () => {
          setFeedback({ kind: "success", title: `${name} berhasil check-in` })
          refetch()
        },
        onError: (err) => setFeedback(buildFeedback(err)),
      }
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Kolom kiri: QR scanner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-primary" />
            Scan QR Peserta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleQrSubmit} className="space-y-2">
            <label htmlFor="qr-token" className="text-xs font-medium">
              QR Token
            </label>
            <div className="flex gap-2">
              <Input
                id="qr-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Tempel / scan token QR di sini"
                autoComplete="off"
                disabled={qrMut.isPending}
              />
              <Button type="submit" disabled={qrMut.isPending || !token.trim()}>
                {qrMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check-in"
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gunakan scanner QR yang mengetik otomatis, atau tempel token
              secara manual.
            </p>
          </form>

          {feedback && (
            <div
              className={
                feedback.kind === "success"
                  ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
                  : feedback.kind === "duplicate"
                    ? "rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                    : "rounded-lg border border-destructive/30 bg-destructive/10 p-3"
              }
            >
              <div className="flex items-start gap-2">
                {feedback.kind === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle
                    className={
                      feedback.kind === "duplicate"
                        ? "mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                        : "mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    }
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{feedback.title}</p>
                  {feedback.detail && (
                    <p className="text-xs break-words text-muted-foreground">
                      {feedback.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kolom kanan: manual lookup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            Cari Peserta Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email peserta..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Tidak ada peserta yang cocok.
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => {
                const isCheckedIn = participant.status === "CHECKED_IN"

                return (
                  <div
                    key={participant.registration_id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {participant.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {participant.email}
                      </p>
                    </div>

                    {isCheckedIn ? (
                      <Badge variant="default" className="shrink-0 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        In
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={manualMut.isPending}
                        onClick={() =>
                          handleManualCheckIn(
                            participant.registration_id,
                            participant.name
                          )
                        }
                      >
                        Check-in
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

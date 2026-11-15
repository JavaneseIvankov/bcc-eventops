"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { CheckCircle2, Loader2, Maximize2, XCircle } from "lucide-react"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { Progress } from "@/shared/components/ui/progress"
import { Badge } from "@/shared/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog"
import {
  useCancelMyRegistration,
  useRegisterEvent,
} from "@/shared/repository/queries"
import type { EventDetail } from "@/shared/repository/types"
import { formatDateTime } from "./event-date"

export function RegistrationCard({ event }: { event: EventDetail }) {
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const registerMut = useRegisterEvent()
  const cancelMut = useCancelMyRegistration()

  const registration = event.my_registration
  const fillPct =
    event.quota_total > 0
      ? Math.min(100, Math.round((event.quota_filled / event.quota_total) * 100))
      : 0

  const isUpcoming = event.status === "UPCOMING"
  const hasQuota = event.quota_available > 0
  const isBusy = registerMut.isPending || cancelMut.isPending

  return (
    <div className="sticky top-24 space-y-4 rounded-xl border bg-card p-5 shadow-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Kuota peserta</span>
          <span className="font-medium">
            {event.quota_filled} / {event.quota_total}
          </span>
        </div>
        <Progress value={fillPct} className="h-2" />
        <p className="text-[11px] text-muted-foreground">
          {hasQuota
            ? `Sisa ${event.quota_available} kursi`
            : "Kuota sudah penuh"}
        </p>
      </div>

      <div className="border-t pt-4">
        {!registration && (
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={!isUpcoming || !hasQuota || isBusy}
              onClick={() => registerMut.mutate(event.id)}
            >
              {isBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {event.status === "FINISHED"
                ? "Event sudah selesai"
                : !hasQuota
                  ? "Kuota penuh"
                  : "Daftar Sekarang"}
            </Button>
            {!isUpcoming && hasQuota && (
              <p className="text-center text-[11px] text-muted-foreground">
                Pendaftaran hanya dibuka saat event berstatus upcoming.
              </p>
            )}
          </div>
        )}

        {registration?.status === "REGISTERED" && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Tiket QR kamu
              </p>
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="group relative rounded-xl border bg-white p-3 transition-shadow hover:shadow-md"
                aria-label="Perbesar QR tiket"
              >
                <QRCodeSVG value={registration.qr_token} size={148} />
                <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" />
                </span>
              </button>
            </div>

            {isUpcoming && (
              <AlertDialog>
                <AlertDialogTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full text-destructive hover:text-destructive"
                  )}
                  disabled={isBusy}
                >
                  Batalkan Pendaftaran
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan pendaftaran?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Kamu akan kehilangan tiket QR untuk event ini dan kuota
                      dikembalikan ke peserta lain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Kembali</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancelMut.mutate(event.id)}>
                      Ya, batalkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {registration?.status === "CHECKED_IN" && (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Checked In
            </div>
            {registration.checked_in_at && (
              <p className="text-xs text-muted-foreground">
                pada {formatDateTime(registration.checked_in_at)}
              </p>
            )}
          </div>
        )}

        {registration?.status === "CANCELLED" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              Pendaftaran dibatalkan
            </div>
            <Button
              className="w-full"
              disabled={!isUpcoming || !hasQuota || isBusy}
              onClick={() => registerMut.mutate(event.id)}
            >
              {isBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Daftar Ulang
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{event.name}</DialogTitle>
            <DialogDescription>
              Tunjukkan QR ini ke panitia di meja check-in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-xl border bg-white p-4">
              {registration && (
                <QRCodeSVG value={registration.qr_token} size={224} />
              )}
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              {registration?.qr_token.slice(0, 18)}…
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { QrCode, Ticket } from "lucide-react"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
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
import { useCancelMyRegistration } from "@/shared/repository/queries"
import type { Registration } from "@/shared/repository/types"
import { formatDateTime } from "@/features/events/components/event-date"
import { useMyTickets, type TicketWithEvent } from "../hooks/use-my-tickets"

const REGISTRATION_META: Record<
  Registration["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  REGISTERED: { label: "Terdaftar", variant: "secondary" },
  CHECKED_IN: { label: "Checked In", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
}

export function MyTicketsTable() {
  const { tickets, isLoading } = useMyTickets()
  const [qrTicket, setQrTicket] = React.useState<TicketWithEvent | null>(null)
  const cancelMut = useCancelMyRegistration()

  const registrations = tickets

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
        <Ticket className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Belum ada tiket</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Jelajahi katalog event dan daftar untuk mendapatkan tiket QR kamu.
        </p>
        <Link
          href="/events"
          className={cn(buttonVariants({ size: "sm" }), "mt-2")}
        >
          Explore events
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {registrations.map((ticket) => {
          const { registration, event } = ticket
          const meta = REGISTRATION_META[registration.status]
          const canCancel =
            registration.status === "REGISTERED" && event?.status === "UPCOMING"

          return (
            <div
              key={registration.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {event?.name ?? `Event ${registration.event_id?.slice(0, 8) ?? ""}`}
                  </p>
                  <Badge variant={meta.variant} className="h-5 px-1.5 text-[10px]">
                    {meta.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {event?.location}
                  {event?.start_time &&
                    ` · ${formatDateTime(event.start_time)}`}
                </p>
                {registration.status === "CHECKED_IN" &&
                  registration.checked_in_at && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Checked in pada {formatDateTime(registration.checked_in_at)}
                    </p>
                  )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQrTicket(ticket)}
                >
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  Show QR
                </Button>

                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-destructive hover:text-destructive"
                      )}
                    >
                      Cancel
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Batalkan pendaftaran?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tiket kamu untuk{" "}
                          <span className="font-medium">
                            {event?.name ?? "event ini"}
                          </span>{" "}
                          akan dibatalkan dan kuota dikembalikan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (registration.event_id) {
                              cancelMut.mutate(registration.event_id)
                            }
                          }}
                        >
                          Ya, batalkan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog
        open={!!qrTicket}
        onOpenChange={(open) => !open && setQrTicket(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {qrTicket?.event?.name ??
                `Tiket ${qrTicket?.registration.event_id?.slice(0, 8) ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              Tunjukkan QR ini ke panitia di meja check-in.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-xl border bg-white p-4">
              {qrTicket && (
                <QRCodeSVG value={qrTicket.registration.qr_token} size={192} />
              )}
            </div>
            <p className="max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {qrTicket?.registration.qr_token}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

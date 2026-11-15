"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Calendar,
  MapPin,
  QrCode,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"
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
import { Progress } from "@/shared/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  useGetEventDetail,
  useGetEventSessions,
  useGetAnnouncements,
  useRegisterEvent,
  useCancelMyRegistration,
} from "@/shared/repository/queries"
import { useEventRealtime } from "@/shared/repository/websocket"
import { EventStatus, SessionStatus } from "@/shared/repository/types"

function DetailStatusBadge({ status }: { status: EventStatus | SessionStatus }) {
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

export default function PublicEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  useEventRealtime({ eventId })

  const { data: event, isLoading } = useGetEventDetail(eventId)
  const { data: sessions = [] } = useGetEventSessions(eventId)
  const { data: announcements = [] } = useGetAnnouncements(eventId)

  const registerMutation = useRegisterEvent(eventId)
  const cancelMutation = useCancelMyRegistration()
  const [qrModalOpen, setQrModalOpen] = useState(false)

  if (isLoading || !event) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  const quotaPct =
    event.quota_total > 0
      ? Math.min(100, Math.round((event.quota_filled / event.quota_total) * 100))
      : 0
  const myReg = event.my_registration

  return (
    <div className="space-y-6">
      {/* Conditional Sticky Committee Bar */}
      {event.my_role && (
        <div className="sticky top-16 z-30 flex flex-col justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>
              Kamu adalah <strong>{event.my_role}</strong> di event ini
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace?eventId=${eventId}`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Buka Event Workspace
            </Link>
            <Link
              href={`/workspace?eventId=${eventId}&tab=check-in`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Meja Check-in
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri (2/3 Lebar di Desktop) */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            {event.poster_url && (
              <img
                src={event.poster_url}
                alt={event.name}
                className="h-64 w-full object-cover"
              />
            )}
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DetailStatusBadge status={event.status} />
                {event.my_role && (
                  <Badge variant="secondary">Role: {event.my_role}</Badge>
                )}
              </div>
              <CardTitle className="mt-2 text-2xl font-bold">
                {event.name}
              </CardTitle>
              <CardDescription>{event.short_description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(event.start_time).toLocaleString("id-ID")} —{" "}
                  {new Date(event.end_time).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="rundown" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rundown">
                Live Rundown ({sessions.length})
              </TabsTrigger>
              <TabsTrigger value="announcements">
                Live Announcements ({announcements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rundown" className="space-y-3">
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada sesi pada rundown event ini.
                  </CardContent>
                </Card>
              ) : (
                sessions.map((ses) => (
                  <Card
                    key={ses.id}
                    className={cn(
                      "transition-all",
                      ses.status === "ONGOING" &&
                        "border-emerald-500 ring-2 ring-emerald-500/20"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {new Date(ses.start_time).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(ses.end_time).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {ses.status === "ONGOING" && (
                            <Badge variant="default" className="bg-emerald-600">
                              LIVE NOW
                            </Badge>
                          )}
                          <DetailStatusBadge status={ses.status} />
                        </div>
                      </div>
                      <CardTitle className="text-base font-bold">
                        {ses.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Speaker: {ses.speaker} • Lokasi: {ses.location}
                      </CardDescription>
                    </CardHeader>
                    {ses.description && (
                      <CardContent className="text-xs text-muted-foreground">
                        {ses.description}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="announcements" className="space-y-3">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada pengumuman yang diterbitkan.
                  </CardContent>
                </Card>
              ) : (
                announcements.map((ann) => (
                  <Card key={ann.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {ann.author_name}
                        </span>
                        <span>
                          {new Date(ann.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold">
                        {ann.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">{ann.content}</CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Kolom Kanan (1/3 Lebar — Sticky Registration & Ticket Card) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Pendaftaran Peserta</CardTitle>
              <CardDescription>
                {event.quota_available} kursi tersisa dari {event.quota_total}{" "}
                kapasitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Terisi: {event.quota_filled} peserta</span>
                  <span>{quotaPct}%</span>
                </div>
                <Progress value={quotaPct} />
              </div>

              {!myReg && (
                <Button
                  className="w-full"
                  disabled={
                    event.status !== "UPCOMING" ||
                    event.quota_available <= 0 ||
                    registerMutation.isPending
                  }
                  onClick={() => registerMutation.mutate()}
                >
                  {event.status !== "UPCOMING"
                    ? "Pendaftaran Ditutup"
                    : event.quota_available <= 0
                    ? "Kuota Penuh"
                    : registerMutation.isPending
                    ? "Mendaftarkan..."
                    : "Daftar Sekarang"}
                </Button>
              )}

              {myReg?.status === "REGISTERED" && (
                <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-center">
                  <Badge variant="secondary">REGISTERED</Badge>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      myReg.qr_token
                    )}`}
                    alt="QR Ticket"
                    className="mx-auto h-40 w-40 rounded-lg border bg-white p-2"
                  />
                  <p className="font-mono text-xs font-bold">
                    {myReg.qr_token}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQrModalOpen(true)}
                    >
                      <QrCode className="mr-1.5 h-4 w-4" />
                      Perbesar QR Code
                    </Button>
                    {event.status === "UPCOMING" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          if (confirm("Batalkan pendaftaran Anda?")) {
                            cancelMutation.mutate(eventId)
                          }
                        }}
                      >
                        Batalkan Pendaftaran
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {myReg?.status === "CHECKED_IN" && (
                <div className="flex flex-col items-center space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  <Badge variant="default" className="bg-emerald-600">
                    Checked In pada{" "}
                    {myReg.checked_in_at
                      ? new Date(myReg.checked_in_at).toLocaleTimeString(
                          "id-ID"
                        )
                      : "Lokasi"}
                  </Badge>
                </div>
              )}

              {myReg?.status === "CANCELLED" && (
                <div className="space-y-3 rounded-xl border p-4 text-center">
                  <Badge variant="outline">Pendaftaran Dibatalkan</Badge>
                  <Button
                    className="w-full"
                    disabled={
                      event.status !== "UPCOMING" ||
                      event.quota_available <= 0 ||
                      registerMutation.isPending
                    }
                    onClick={() => registerMutation.mutate()}
                  >
                    Daftar Ulang
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{event.name} — QR Ticket</DialogTitle>
          </DialogHeader>
          {myReg && (
            <div className="flex flex-col items-center space-y-3 py-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  myReg.qr_token
                )}`}
                alt="QR Ticket Large"
                className="h-60 w-60 rounded-xl border bg-white p-2"
              />
              <p className="font-mono text-sm font-bold">{myReg.qr_token}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
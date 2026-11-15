"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Plus, QrCode, Check, X, ExternalLink, Trash2 } from "lucide-react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { EventStatusBadge } from "@/shared/components/status-badge"
import {
  useGetMe,
  useGetMyInvitations,
  useAcceptInvitation,
  useRejectInvitation,
  useGetEvents,
  useDeleteEvent,
  useGetMyRegistrations,
  useCancelMyRegistration,
} from "@/shared/repository/queries"
import { Registration } from "@/shared/repository/types"

export default function PersonalDashboardPage() {
  const { data: userRes, isLoading: loadingUser } = useGetMe()
  const { data: invitationsRes } = useGetMyInvitations({
    status: "PENDING",
  })
  const { data: managedEventsRes, isLoading: loadingManaged } = useGetEvents({
    managed_by_me: true,
    limit: 100,
  })
  const { data: myRegistrationsRes, isLoading: loadingRegs } =
    useGetMyRegistrations()

  const user = userRes?.data
  const pendingInvitations = invitationsRes?.data ?? []
  const myRegistrations = myRegistrationsRes?.data ?? []

  const acceptInvite = useAcceptInvitation()
  const rejectInvite = useRejectInvitation()
  const deleteEvent = useDeleteEvent()
  const cancelMyReg = useCancelMyRegistration()

  const [selectedTicket, setSelectedTicket] = useState<Registration | null>(
    null
  )

  const managedEvents = managedEventsRes?.data ?? []
  const coordinatorCount = managedEvents.filter(
    (e) => e.my_role === "COORDINATOR"
  ).length
  const committeeCount = managedEvents.filter(
    (e) => e.my_role === "COMMITTEE"
  ).length
  const activeRegsCount = myRegistrations.filter(
    (r) => r.status === "REGISTERED" || r.status === "CHECKED_IN"
  ).length
  const upcomingLiveManagedCount = managedEvents.filter(
    (e) => e.status === "UPCOMING" || e.status === "ONGOING"
  ).length

  return (
    <div className="space-y-6">
      {/* 1. Header & User Profile Summary */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          {loadingUser ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">
              Halo, {user?.name}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">
            {user?.email} • Personal Hub untuk tiket peserta & kepanitiaan event
            Anda.
          </p>
        </div>
        <Link
          href="/events/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          <span>Create event</span>
        </Link>
      </div>

      {/* 2. 4 KPI Ringkasan Pribadi */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Managed Events</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {managedEvents.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {coordinatorCount} Coordinator • {committeeCount} Committee
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Registrations</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {activeRegsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Tiket aktif berstatus Registered / Checked In
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming & Live Events</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {upcomingLiveManagedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Event aktif yang sedang Anda kelola
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Registered Tickets</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {myRegistrations.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total riwayat pendaftaran peserta
          </CardContent>
        </Card>
      </div>

      {/* 3. Inline Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Kotak Masuk Undangan Kepanitiaan ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Terima undangan untuk mengakses Event Operations Workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col justify-between gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Role: {inv.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">
                    {inv.event?.name ||
                      (inv.event_id
                        ? `Event ID: ${inv.event_id}`
                        : "Unknown Event")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptInvite.mutate(inv.id)}
                    disabled={acceptInvite.isPending}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectInvite.mutate(inv.id)}
                    disabled={rejectInvite.isPending}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 4. Tabs: Managed Events & My Registered Tickets */}
      <Tabs defaultValue="managed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="managed">
            Managed Events ({managedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="tickets">
            My Registered Tickets ({myRegistrations.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MANAGED EVENTS */}
        <TabsContent value="managed">
          <Card>
            <CardHeader>
              <CardTitle>My Managed Events</CardTitle>
              <CardDescription>
                Daftar event di mana Anda berperan sebagai Coordinator atau
                Committee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingManaged ? (
                <Skeleton className="h-32 w-full" />
              ) : managedEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Anda belum mengelola event apa pun.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Peran Saya</TableHead>
                      <TableHead>Kuota Terisi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managedEvents.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-semibold">
                          <Link
                            href={`/events/${ev.id}/workspace`}
                            className="hover:underline"
                          >
                            {ev.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <EventStatusBadge status={ev.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ev.my_role}</Badge>
                        </TableCell>
                        <TableCell>
                          {ev.quota_filled} / {ev.quota_total}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Link
                            href={`/events/${ev.id}/workspace`}
                            className={cn(
                              buttonVariants({ variant: "default", size: "sm" })
                            )}
                          >
                            Open Workspace
                          </Link>
                          {ev.my_role === "COORDINATOR" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Hapus event "${ev.name}" beserta seluruh datanya?`
                                  )
                                ) {
                                  deleteEvent.mutate(ev.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: MY TICKETS / REGISTRATIONS */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>My Registered Tickets</CardTitle>
              <CardDescription>
                Tunjukkan QR Code kepada panitia saat check-in di lokasi acara.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRegs ? (
                <Skeleton className="h-32 w-full" />
              ) : myRegistrations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Anda belum mendaftar sebagai peserta di event mana pun.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {myRegistrations.map((reg) => (
                    <Card key={reg.id} className="flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              reg.status === "CHECKED_IN"
                                ? "default"
                                : reg.status === "REGISTERED"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {reg.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reg.registered_at).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <CardTitle className="mt-2 text-base">
                          {reg.event?.name || `Event #${reg.event_id}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(reg)}
                          >
                            <QrCode className="mr-1.5 h-4 w-4" />
                            Show QR Code
                          </Button>
                          <Link
                            href={`/events/${reg.event_id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" })
                            )}
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Detail
                          </Link>
                        </div>

                        {reg.status === "REGISTERED" &&
                          (!reg.event || reg.event.status === "UPCOMING") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const eventId = reg.event?.id || reg.event_id
                                if (
                                  eventId &&
                                  confirm(
                                    "Batalkan pendaftaran Anda pada event ini?"
                                  )
                                ) {
                                  cancelMyReg.mutate(eventId)
                                }
                              }}
                            >
                              Cancel Registration
                            </Button>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal QR Code Tiket */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(o) => !o && setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tiket QR Check-in</DialogTitle>
            <DialogDescription>
              Tunjukkan kode ini di meja check-in panitia.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex flex-col items-center space-y-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  selectedTicket.qr_token
                )}`}
                alt="QR Code Ticket"
                className="h-52 w-52 rounded-xl border p-2"
              />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">QR Token</p>
                <p className="font-mono text-sm font-bold">
                  {selectedTicket.qr_token}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
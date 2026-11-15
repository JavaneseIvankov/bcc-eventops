"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ExternalLink,
  QrCode,
  Download,
  Plus,
  Trash2,
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
import { Input } from "@/shared/components/ui/input"
import { Progress } from "@/shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
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
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  useGetEvents,
  useGetEventDetail,
  useUpdateEvent,
  useDeleteEvent,
  useGetEventDashboard,
  useGetEventParticipants,
  useCheckInQr,
  useCheckInManual,
  useCancelParticipantRegistration,
  useGetEventSessions,
  useCreateSession,
  useDeleteSession,
  useUpdateSessionStatus,
  useGetAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useGetEventCommittees,
  useInviteCommittee,
  useCancelInvitation,
  useUpdateCommitteeRole,
  useRemoveCommitteeMember,
  useLeaveCommittee,
  useUploadFile,
} from "@/shared/repository/queries"
import { useEventRealtime } from "@/shared/repository/websocket"
import {
  CommitteeRole,
  EventDetail,
  EventStatus,
  RegistrationStatus,
  SessionStatus,
} from "@/shared/repository/types"

function WorkspaceStatusBadge({
  status,
}: {
  status: EventStatus | SessionStatus
}) {
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

export default function EventWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryEventId = searchParams.get("eventId") || ""
  const currentTab = searchParams.get("tab") || "overview"

  const { data: managedRes, isLoading: loadingList } = useGetEvents({
    managed_by_me: true,
    limit: 50,
  })
  const managedEvents = managedRes?.data ?? []
  const activeEventId = queryEventId || managedEvents[0]?.id || ""

  const { data: event, isLoading: loadingDetail } =
    useGetEventDetail(activeEventId)

  useEventRealtime({
    eventId: activeEventId,
    enableCommitteeChannel: !!event?.my_role,
  })

  useEffect(() => {
    if (!loadingDetail && event && !event.my_role) {
      router.replace(`/events/${event.id}`)
    }
  }, [loadingDetail, event, router])

  if (loadingList || (activeEventId && loadingDetail)) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (!activeEventId || !event) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Pilih event yang Anda kelola melalui halaman Dashboard untuk membuka
          Workspace.
        </CardContent>
      </Card>
    )
  }

  const isCoordinator = event.my_role === "COORDINATOR"

  const handleTabChange = (tab: string) => {
    router.replace(`/workspace?eventId=${event.id}&tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        event={event}
        onOpenCheckIn={() => handleTabChange("check-in")}
      />

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">1. Overview</TabsTrigger>
          <TabsTrigger value="check-in">2. Check-in Desk</TabsTrigger>
          <TabsTrigger value="participants">3. Participants</TabsTrigger>
          <TabsTrigger value="rundown">4. Rundown</TabsTrigger>
          <TabsTrigger value="announcements">5. Announcements</TabsTrigger>
          <TabsTrigger value="committee">6. Committee Team</TabsTrigger>
          {isCoordinator && (
            <TabsTrigger value="settings">7. Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="check-in">
          <CheckInTab event={event} />
        </TabsContent>
        <TabsContent value="participants">
          <ParticipantsTab event={event} />
        </TabsContent>
        <TabsContent value="rundown">
          <RundownTab event={event} />
        </TabsContent>
        <TabsContent value="announcements">
          <AnnouncementsTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="committee">
          <CommitteeTab event={event} />
        </TabsContent>
        {isCoordinator && (
          <TabsContent value="settings">
            <SettingsTab event={event} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/* ==================== WORKSPACE HEADER ==================== */
function WorkspaceHeader({
  event,
  onOpenCheckIn,
}: {
  event: EventDetail
  onOpenCheckIn: () => void
}) {
  const updateEvent = useUpdateEvent(event.id)
  const isCoordinator = event.my_role === "COORDINATOR"

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            href={`/events/${event.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <span>View Public Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <WorkspaceStatusBadge status={event.status} />
              <Badge variant="secondary">Role: {event.my_role}</Badge>
            </div>
            <CardTitle className="mt-2 text-2xl font-bold">
              {event.name}
            </CardTitle>
            <CardDescription>
              {event.location} •{" "}
              {new Date(event.start_time).toLocaleString("id-ID")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {isCoordinator && (
              <Select
                value={event.status}
                onValueChange={(v) =>
                  updateEvent.mutate({ status: v as EventStatus })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                  <SelectItem value="ONGOING">ONGOING</SelectItem>
                  <SelectItem value="FINISHED">FINISHED</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button size="sm" onClick={onOpenCheckIn}>
              <QrCode className="mr-1.5 h-4 w-4" />
              Check-in Desk
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

/* ==================== TAB 1: OVERVIEW ==================== */
function OverviewTab({ eventId }: { eventId: string }) {
  const { data: dash, isLoading } = useGetEventDashboard(eventId)
  if (isLoading || !dash) return <Skeleton className="h-44 w-full" />

  const pct =
    dash.active_registrations > 0
      ? Math.round((dash.checked_in_count / dash.active_registrations) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checked In</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {dash.checked_in_count} / {dash.active_registrations}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Progress value={pct} />
            <p className="text-xs text-muted-foreground">{pct}% hadir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Arrived</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {dash.not_checked_in_count}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Peserta terdaftar belum check-in
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {dash.cancelled_count}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pendaftaran dibatalkan
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quota Left</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {dash.quota_available} / {dash.quota_total}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Sisa kapasitas tersedia
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Rundown Summary ({dash.sessions_summary.total} Sessions)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="default" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ongoing: {dash.sessions_summary.ongoing}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Upcoming: {dash.sessions_summary.upcoming}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Finished: {dash.sessions_summary.finished}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

/* ==================== TAB 2: CHECK-IN DESK ==================== */
function CheckInTab({ event }: { event: EventDetail }) {
  const [qrToken, setQrToken] = useState("")
  const [feedback, setFeedback] = useState<{
    type: "ok" | "dup" | "err"
    text: string
  } | null>(null)
  const [search, setSearch] = useState("")

  const checkInQr = useCheckInQr(event.id)
  const checkInManual = useCheckInManual(event.id)
  const { data: listRes } = useGetEventParticipants(event.id, {
    search,
    limit: 10,
  })

  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrToken.trim()) return
    try {
      await checkInQr.mutateAsync(qrToken.trim())
      setFeedback({
        type: "ok",
        text: `200 OK — Check-in berhasil (${qrToken})`,
      })
      setQrToken("")
    } catch (err: any) {
      if (err?.status === 409 || err?.code === "ALREADY_CHECKED_IN") {
        setFeedback({
          type: "dup",
          text: "409 ALREADY_CHECKED_IN — Peserta sudah check-in sebelumnya!",
        })
      } else {
        setFeedback({
          type: "err",
          text: err?.message || "400/404 — QR Token tidak ditemukan/invalid.",
        })
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner / Input</CardTitle>
          <CardDescription>
            Masukkan atau pindai `qr_token` peserta untuk verifikasi kehadiran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleQrSubmit} className="flex gap-2">
            <Input
              placeholder="Paste / Scan qr_token..."
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              disabled={event.status === "FINISHED"}
            />
            <Button
              type="submit"
              disabled={event.status === "FINISHED" || checkInQr.isPending}
            >
              Check-in QR
            </Button>
          </form>
          {feedback && (
            <div
              className={cn(
                "rounded-lg border p-3 text-xs font-bold",
                feedback.type === "ok" &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-700",
                feedback.type === "dup" &&
                  "border-amber-500 bg-amber-500/10 text-amber-700",
                feedback.type === "err" &&
                  "border-destructive bg-destructive/10 text-destructive"
              )}
            >
              {feedback.text}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Lookup</CardTitle>
          <CardDescription>
            Cari nama/email peserta dan lakukan One-Click Check-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2">
            {(listRes?.data ?? []).map((p) => (
              <div
                key={p.registration_id}
                className="flex items-center justify-between rounded-lg border p-3 text-xs"
              >
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.status}</Badge>
                  {p.status === "REGISTERED" && event.status !== "FINISHED" && (
                    <Button
                      size="sm"
                      onClick={() => checkInManual.mutate(p.registration_id)}
                    >
                      Check-in
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ==================== TAB 3: PARTICIPANTS ==================== */
function ParticipantsTab({ event }: { event: EventDetail }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<RegistrationStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const { data: res } = useGetEventParticipants(event.id, {
    page,
    limit: 10,
    search,
    status,
  })
  const { data: allRes } = useGetEventParticipants(event.id, { limit: 10000 })

  const checkInManual = useCheckInManual(event.id)
  const cancelReg = useCancelParticipantRegistration(event.id)
  const isCoordinator = event.my_role === "COORDINATOR"

  const handleExportCsv = () => {
    const rows = allRes?.data ?? []
    const csv = [
      "Name,Email,Status,RegisteredAt,CheckedInAt",
      ...rows.map(
        (r) =>
          `"${r.name}","${r.email}","${r.status}","${r.registered_at}","${
            r.checked_in_at || ""
          }"`
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `participants-${event.id}.csv`
    a.click()
  }

  return (
    <Card>
      <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            Tabel seluruh peserta terdaftar beserta filter dan ekspor CSV.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Cari nama atau email peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as RegistrationStatus | "ALL")}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="REGISTERED">REGISTERED</SelectItem>
              <SelectItem value="CHECKED_IN">CHECKED_IN</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Checked In At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(res?.data ?? []).map((p) => (
              <TableRow key={p.registration_id}>
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.status}</Badge>
                </TableCell>
                <TableCell>
                  {p.checked_in_at
                    ? new Date(p.checked_in_at).toLocaleTimeString("id-ID")
                    : "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {p.status === "REGISTERED" && event.status !== "FINISHED" && (
                    <Button
                      size="sm"
                      onClick={() => checkInManual.mutate(p.registration_id)}
                    >
                      Check-in
                    </Button>
                  )}
                  {isCoordinator &&
                    p.status === "REGISTERED" &&
                    event.status === "UPCOMING" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Batalkan pendaftaran ${p.name}?`)) {
                            cancelReg.mutate(p.registration_id)
                          }
                        }}
                      >
                        Cancel Registration
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-xs">Page {page}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (res?.meta?.total_pages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ==================== TAB 4: RUNDOWN ==================== */
function RundownTab({ event }: { event: EventDetail }) {
  const { data: sessions = [] } = useGetEventSessions(event.id)
  const createSession = useCreateSession(event.id)
  const deleteSession = useDeleteSession(event.id)
  const updateStatus = useUpdateSessionStatus(event.id)

  const isCoordinator = event.my_role === "COORDINATOR"
  const [form, setForm] = useState({
    title: "",
    speaker: "",
    location: "",
    start_time: "",
    end_time: "",
    description: "",
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createSession.mutateAsync({
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
    })
    setForm({
      title: "",
      speaker: "",
      location: "",
      start_time: "",
      end_time: "",
      description: "",
    })
  }

  return (
    <div className="space-y-6">
      {isCoordinator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">+ Add Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3">
              <Input
                required
                placeholder="Session Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                required
                placeholder="Speaker *"
                value={form.speaker}
                onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              />
              <Input
                required
                placeholder="Location *"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                type="datetime-local"
                required
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
              <Input
                type="datetime-local"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
              <Input
                placeholder="Description (Optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <Button type="submit" className="sm:col-span-3">
                <Plus className="mr-1.5 h-4 w-4" />
                Save Session
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <WorkspaceStatusBadge status={s.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.start_time).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(s.end_time).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 font-bold">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.speaker} • {s.location}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["UPCOMING", "ONGOING", "FINISHED"] as SessionStatus[]).map(
                  (st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={s.status === st ? "default" : "outline"}
                      disabled={event.status === "FINISHED"}
                      onClick={() =>
                        updateStatus.mutate({ sessionId: s.id, status: st })
                      }
                    >
                      {st}
                    </Button>
                  )
                )}
                {isCoordinator && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Hapus sesi "${s.title}"?`)) {
                        deleteSession.mutate(s.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ==================== TAB 5: ANNOUNCEMENTS ==================== */
function AnnouncementsTab({ eventId }: { eventId: string }) {
  const { data: list = [] } = useGetAnnouncements(eventId)
  const createAnn = useCreateAnnouncement(eventId)
  const deleteAnn = useDeleteAnnouncement(eventId)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Broadcast Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await createAnn.mutateAsync({ title, content })
              setTitle("")
              setContent("")
            }}
            className="space-y-3"
          >
            <Input
              required
              placeholder="Judul Pengumuman *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              required
              placeholder="Isi Pengumuman *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button type="submit" disabled={createAnn.isPending}>
              Publish
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.content}</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Hapus pengumuman ini?")) {
                    deleteAnn.mutate(a.id)
                  }
                }}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ==================== TAB 6: COMMITTEE TEAM ==================== */
function CommitteeTab({ event }: { event: EventDetail }) {
  const router = useRouter()
  const { data } = useGetEventCommittees(event.id)
  const inviteMutation = useInviteCommittee(event.id)
  const cancelInvite = useCancelInvitation(event.id)
  const updateRole = useUpdateCommitteeRole(event.id)
  const removeMember = useRemoveCommitteeMember(event.id)
  const leaveCommittee = useLeaveCommittee(event.id)

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<CommitteeRole>("COMMITTEE")
  const isCoordinator = event.my_role === "COORDINATOR"

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-bold">Keanggotaan Kepanitiaan Anda</p>
            <p className="text-xs text-muted-foreground">
              Keluar secara mandiri dari kepanitiaan event ini.
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              if (!confirm("Keluar dari kepanitiaan event ini?")) return
              try {
                await leaveCommittee.mutateAsync()
                router.replace(`/events/${event.id}`)
              } catch (err: any) {
                alert(err?.message)
              }
            }}
          >
            Leave Committee
          </Button>
        </CardContent>
      </Card>

      {isCoordinator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Committee Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  await inviteMutation.mutateAsync({ email, role })
                  setEmail("")
                } catch (err: any) {
                  alert(err?.message)
                }
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                required
                placeholder="Email akun terdaftar..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select
                value={role}
                onValueChange={(v) => setRole(v as CommitteeRole)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMITTEE">COMMITTEE</SelectItem>
                  <SelectItem value="COORDINATOR">COORDINATOR</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Send Invite</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Committee Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isCoordinator && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.members ?? []).map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell className="font-semibold">{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.role}</Badge>
                  </TableCell>
                  {isCoordinator && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const nextRole =
                            m.role === "COORDINATOR"
                              ? "COMMITTEE"
                              : "COORDINATOR"
                          try {
                            await updateRole.mutateAsync({
                              userId: m.user_id,
                              role: nextRole,
                            })
                          } catch (err: any) {
                            alert(err?.message)
                          }
                        }}
                      >
                        Toggle Role
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!confirm(`Keluarkan ${m.name}?`)) return
                          try {
                            await removeMember.mutateAsync(m.user_id)
                          } catch (err: any) {
                            alert(err?.message)
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isCoordinator && (data?.invitations ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending & Past Invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.invitations ?? []).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border p-3 text-xs"
              >
                <span>
                  <strong>{inv.invitee_email}</strong> • {inv.role} •{" "}
                  <Badge variant="outline">{inv.status}</Badge>
                </span>
                {inv.status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelInvite.mutate(inv.id)}
                  >
                    Cancel Invite
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ==================== TAB 7: SETTINGS ==================== */
function SettingsTab({ event }: { event: EventDetail }) {
  const router = useRouter()
  const updateEvent = useUpdateEvent(event.id)
  const deleteEvent = useDeleteEvent()
  const uploadFile = useUploadFile()

  const [form, setForm] = useState({
    name: event.name,
    short_description: event.short_description,
    location: event.location,
    quota_total: event.quota_total,
  })
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [errMsg, setErrMsg] = useState("")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrMsg("")
    try {
      let poster_url = event.poster_url
      if (posterFile) {
        const up = await uploadFile.mutateAsync(posterFile)
        poster_url = up.url
      }
      await updateEvent.mutateAsync({
        name: form.name,
        short_description: form.short_description,
        location: form.location,
        quota_total: Number(form.quota_total),
        poster_url,
      })
      alert("Perubahan event berhasil disimpan.")
    } catch (err: any) {
      setErrMsg(err?.message || "Gagal memperbarui pengaturan event.")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Settings</CardTitle>
          <CardDescription>
            Kapasitas tidak boleh lebih kecil dari pendaftar aktif saat ini (
            {event.quota_filled} peserta).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errMsg && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {errMsg}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Event Name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Short Description</label>
              <Input
                required
                value={form.short_description}
                onChange={(e) =>
                  setForm({ ...form, short_description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Location</label>
                <Input
                  required
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Total Quota</label>
                <Input
                  type="number"
                  min={Math.max(1, event.quota_filled)}
                  required
                  value={form.quota_total}
                  onChange={(e) =>
                    setForm({ ...form, quota_total: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Update Poster</label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="submit" disabled={updateEvent.isPending}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Menghapus event beserta seluruh sesi, pengumuman, pendaftaran, dan
            kepanitiaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Delete Event
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Event Ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini permanen dan menghapus seluruh data operasional{" "}
                  <strong>{event.name}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await deleteEvent.mutateAsync(event.id)
                    router.push("/dashboard")
                  }}
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
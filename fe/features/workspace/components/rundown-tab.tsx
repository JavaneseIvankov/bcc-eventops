"use client"

import * as React from "react"
import { Clock, MapPin, Mic2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Input } from "@/shared/components/ui/input"
import {
  useCreateSession,
  useDeleteSession,
  useGetEventSessions,
  useUpdateSessionStatus,
} from "@/shared/repository/queries"
import type { CommitteeRole, Session, SessionStatus } from "@/shared/repository/types"
import { formatDateTime } from "@/features/events/components/event-date"

const NEXT_STATUS: Record<SessionStatus, SessionStatus | null> = {
  UPCOMING: "ONGOING",
  ONGOING: "FINISHED",
  FINISHED: null,
}

export function RundownTab({
  eventId,
  role,
}: {
  eventId: string
  role: CommitteeRole
}) {
  const { data, isLoading } = useGetEventSessions(eventId)
  const statusMut = useUpdateSessionStatus()
  const createMut = useCreateSession()
  const deleteMut = useDeleteSession()

  const [isAdding, setIsAdding] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    speaker: "",
    location: "",
    start_time: "",
    end_time: "",
  })

  const sessions = data?.data ?? []
  const isCoordinator = role === "COORDINATOR"

  const handleCreate = () => {
    if (!form.title.trim() || !form.start_time || !form.end_time) return

    createMut.mutate(
      {
        eventId,
        body: {
          title: form.title.trim(),
          speaker: form.speaker.trim(),
          location: form.location.trim(),
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
        },
      },
      {
        onSuccess: () => {
          setForm({
            title: "",
            speaker: "",
            location: "",
            start_time: "",
            end_time: "",
          })
          setIsAdding(false)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isCoordinator && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsAdding((v) => !v)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {isAdding ? "Tutup" : "Add Session"}
          </Button>
        </div>
      )}

      {isAdding && isCoordinator && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <Input
              placeholder="Judul sesi"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Pembicara"
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
            />
            <Input
              placeholder="Lokasi"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
              <Input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                size="sm"
                disabled={createMut.isPending}
                onClick={handleCreate}
              >
                {createMut.isPending ? "Menyimpan..." : "Simpan sesi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-xs text-muted-foreground">
            Belum ada sesi rundown.
          </CardContent>
        </Card>
      ) : (
        sessions.map((session: Session) => {
          const nextStatus = NEXT_STATUS[session.status]

          return (
            <Card key={session.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{session.title}</p>
                    <Badge
                      variant={
                        session.status === "ONGOING"
                          ? "default"
                          : session.status === "FINISHED"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {session.speaker && (
                      <span className="flex items-center gap-1">
                        <Mic2 className="h-3 w-3" />
                        {session.speaker}
                      </span>
                    )}
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(session.start_time)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {nextStatus && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusMut.isPending}
                      onClick={() =>
                        statusMut.mutate({
                          eventId,
                          sessionId: session.id,
                          body: { status: nextStatus },
                        })
                      }
                    >
                      → {nextStatus}
                    </Button>
                  )}
                  {isCoordinator && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMut.isPending}
                      onClick={() =>
                        deleteMut.mutate({ eventId, sessionId: session.id })
                      }
                      aria-label="Hapus sesi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

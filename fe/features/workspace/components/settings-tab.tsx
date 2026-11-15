"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Save } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
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
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import {
  useDeleteEvent,
  useUpdateEvent,
} from "@/shared/repository/queries"
import type { EventDetail, EventStatus } from "@/shared/repository/types"

// datetime-local butuh format "YYYY-MM-DDTHH:mm" di zona lokal.
function toLocalInput(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SettingsTab({ event }: { event: EventDetail }) {
  const router = useRouter()
  const updateMut = useUpdateEvent()
  const deleteMut = useDeleteEvent()

  const [form, setForm] = React.useState({
    name: event.name,
    short_description: event.short_description,
    location: event.location,
    start_time: toLocalInput(event.start_time),
    end_time: toLocalInput(event.end_time),
    quota_total: String(event.quota_total),
    status: event.status,
  })
  const [quotaError, setQuotaError] = React.useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const nextQuota = Number(form.quota_total)
    // Kuota tidak boleh di bawah jumlah pendaftar aktif.
    if (!Number.isFinite(nextQuota) || nextQuota < event.quota_filled) {
      setQuotaError(
        `Kuota minimal ${event.quota_filled} (jumlah pendaftar aktif).`
      )
      return
    }
    setQuotaError(null)

    updateMut.mutate({
      eventId: event.id,
      body: {
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        location: form.location.trim(),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        quota_total: nextQuota,
        status: form.status,
      },
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="event-name">
                Nama event
              </label>
              <Input
                id="event-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="event-desc">
                Deskripsi singkat
              </label>
              <Textarea
                id="event-desc"
                value={form.short_description}
                onChange={(e) =>
                  setForm({ ...form, short_description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="event-loc">
                Lokasi
              </label>
              <Input
                id="event-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="event-start">
                Mulai
              </label>
              <Input
                id="event-start"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="event-end">
                Selesai
              </label>
              <Input
                id="event-end"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="event-quota">
                Kuota total
              </label>
              <Input
                id="event-quota"
                type="number"
                min={event.quota_filled}
                value={form.quota_total}
                aria-invalid={!!quotaError}
                onChange={(e) => {
                  setQuotaError(null)
                  setForm({ ...form, quota_total: e.target.value })
                }}
              />
              {quotaError ? (
                <p className="text-[11px] text-destructive">{quotaError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Pendaftar aktif saat ini: {event.quota_filled}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Status event</label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (typeof value !== "string") return
                  setForm({ ...form, status: value as EventStatus })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="FINISHED">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={updateMut.isPending} className="gap-1.5">
                {updateMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Simpan perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            Menghapus event bersifat permanen dan menghapus seluruh data
            pendaftaran.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              className={cn(
                buttonVariants({ variant: "destructive", size: "sm" })
              )}
            >
              Hapus Event
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus event ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium">{event.name}</span> akan
                  dihapus permanen beserta seluruh sesi, pengumuman, dan
                  pendaftaran.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteMut.mutate(event.id, {
                      onSuccess: () => router.replace("/dashboard"),
                    })
                  }
                >
                  Ya, hapus permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

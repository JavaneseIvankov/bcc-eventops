<<<<<<< HEAD
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { useCreateEvent, useUploadFile } from "@/shared/repository/queries"

const MAX_POSTER_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export default function CreateEventPage() {
  const router = useRouter()
  const uploadMut = useUploadFile()
  const createMut = useCreateEvent()

  const [form, setForm] = React.useState({
    name: "",
    short_description: "",
    location: "",
    start_time: "",
    end_time: "",
    quota_total: "50",
  })
  const [posterFile, setPosterFile] = React.useState<File | null>(null)
  const [posterPreview, setPosterPreview] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const isSubmitting = uploadMut.isPending || createMut.isPending

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Poster harus berupa JPG, PNG, atau WEBP.")
      return
    }
    if (file.size > MAX_POSTER_BYTES) {
      setError("Ukuran poster maksimal 5MB.")
      return
    }

    setError(null)
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  const clearPoster = () => {
    setPosterFile(null)
    if (posterPreview) URL.revokeObjectURL(posterPreview)
    setPosterPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.location.trim()) {
      setError("Nama dan lokasi event wajib diisi.")
      return
    }
    if (!form.start_time || !form.end_time) {
      setError("Waktu mulai dan selesai wajib diisi.")
      return
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError("Waktu selesai harus setelah waktu mulai.")
      return
    }

    const quota = Number(form.quota_total)
    if (!Number.isFinite(quota) || quota < 1) {
      setError("Kuota minimal 1 peserta.")
      return
    }

    let posterUrl: string | null = null

    // Poster opsional: upload dulu baru simpan URL-nya di payload event.
    if (posterFile) {
      try {
        const uploaded = await uploadMut.mutateAsync(posterFile)
        posterUrl = uploaded.data.url
      } catch {
        setError("Gagal mengunggah poster. Coba lagi.")
        return
      }
    }

    createMut.mutate(
      {
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        poster_url: posterUrl,
        location: form.location.trim(),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        quota_total: quota,
      },
      {
        onSuccess: (res) => {
          router.push(`/events/${res.data.id}/workspace`)
        },
        onError: (err) => {
          setError(err.error?.message ?? "Gagal membuat event.")
        },
      }
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <p className="text-xs text-muted-foreground">
            Kamu otomatis menjadi Koordinator untuk event yang kamu buat.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="name">
                Nama event <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Workshop Web BCC 2026"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="description">
                Deskripsi singkat
              </label>
              <Textarea
                id="description"
                value={form.short_description}
                onChange={(e) =>
                  setForm({ ...form, short_description: e.target.value })
                }
                rows={3}
                placeholder="Jelaskan secara singkat tentang event ini..."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="location">
                Lokasi <span className="text-destructive">*</span>
              </label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Gedung F Filkom UB, Ruang F2.1"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="start">
                Mulai <span className="text-destructive">*</span>
              </label>
              <Input
                id="start"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="end">
                Selesai <span className="text-destructive">*</span>
              </label>
              <Input
                id="end"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="quota">
                Kuota peserta <span className="text-destructive">*</span>
              </label>
              <Input
                id="quota"
                type="number"
                min={1}
                value={form.quota_total}
                onChange={(e) =>
                  setForm({ ...form, quota_total: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium">Poster (opsional)</span>
              {posterPreview ? (
                <div className="relative overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterPreview}
                    alt="Preview poster"
                    className="h-20 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPoster}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Hapus poster"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-muted/50">
                  <ImagePlus className="h-4 w-4" />
                  Pilih gambar (JPG/PNG/WEBP, maks 5MB)
                  <input
                    type="file"
                    accept={ALLOWED_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive sm:col-span-2">{error}</p>
            )}

            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {uploadMut.isPending
                  ? "Mengunggah poster..."
                  : createMut.isPending
                    ? "Membuat event..."
                    : "Create event"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => router.back()}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
=======
import { CreateEventContainer } from "@/features/events/containers/create-event-container"

export default function CreateEventPage() {
  return <CreateEventContainer />
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
}

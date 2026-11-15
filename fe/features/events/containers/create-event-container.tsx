"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useCreateEvent, useUploadFile } from "@/shared/repository/queries"
import { CreateEventForm, type CreateEventFormValues } from "../components/create-event-form"

const MAX_POSTER_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function CreateEventContainer() {
  const router = useRouter()
  const uploadMut = useUploadFile()
  const createMut = useCreateEvent()
  const [form, setForm] = React.useState<CreateEventFormValues>({ name: "", short_description: "", location: "", start_time: "", end_time: "", quota_total: "50" })
  const [posterFile, setPosterFile] = React.useState<File | null>(null)
  const [posterPreview, setPosterPreview] = React.useState<string | null>(null)
  const previewRef = React.useRef<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const isSubmitting = uploadMut.isPending || createMut.isPending

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { setError("Poster harus berupa JPG, PNG, atau WEBP."); return }
    if (file.size > MAX_POSTER_BYTES) { setError("Ukuran poster maksimal 5MB."); return }
    setError(null)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const preview = URL.createObjectURL(file)
    previewRef.current = preview
    setPosterFile(file)
    setPosterPreview(preview)
  }

  const clearPoster = () => {
    setPosterFile(null)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPosterPreview(null)
  }

  React.useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.location.trim()) { setError("Nama dan lokasi event wajib diisi."); return }
    if (!form.start_time || !form.end_time) { setError("Waktu mulai dan selesai wajib diisi."); return }
    if (new Date(form.end_time) <= new Date(form.start_time)) { setError("Waktu selesai harus setelah waktu mulai."); return }
    const quota = Number(form.quota_total)
    if (!Number.isFinite(quota) || quota < 1) { setError("Kuota minimal 1 peserta."); return }
    let posterUrl: string | null = null
    if (posterFile) {
      try {
        const uploaded = await uploadMut.mutateAsync(posterFile)
        posterUrl = uploaded.data.url
      } catch {
        setError("Gagal mengunggah poster. Coba lagi.")
        return
      }
    }
    createMut.mutate({
      name: form.name.trim(), short_description: form.short_description.trim(), poster_url: posterUrl,
      location: form.location.trim(), start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(), quota_total: quota,
    }, {
      onSuccess: (res) => router.push(`/events/${res.data.id}/workspace`),
      onError: (err) => setError(err.error?.message ?? "Gagal membuat event."),
    })
  }

  return <CreateEventForm form={form} posterPreview={posterPreview} error={error} isSubmitting={isSubmitting} uploadPending={uploadMut.isPending} createPending={createMut.isPending} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} onFileChange={handleFileChange} onClearPoster={clearPoster} onSubmit={handleSubmit} onCancel={() => router.back()} />
}

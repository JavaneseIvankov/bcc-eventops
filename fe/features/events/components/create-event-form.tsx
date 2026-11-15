"use client"

import * as React from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"

export type CreateEventFormValues = {
  name: string
  short_description: string
  location: string
  start_time: string
  end_time: string
  quota_total: string
}

type CreateEventFormProps = {
  form: CreateEventFormValues
  posterPreview: string | null
  error: string | null
  isSubmitting: boolean
  uploadPending: boolean
  createPending: boolean
  onChange: (field: keyof CreateEventFormValues, value: string) => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearPoster: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function CreateEventForm({
  form, posterPreview, error, isSubmitting, uploadPending, createPending,
  onChange, onFileChange, onClearPoster, onSubmit, onCancel,
}: CreateEventFormProps) {
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
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="name">Nama event <span className="text-destructive">*</span></label>
              <Input id="name" value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Workshop Web BCC 2026" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="description">Deskripsi singkat</label>
              <Textarea id="description" value={form.short_description} onChange={(e) => onChange("short_description", e.target.value)} rows={3} placeholder="Jelaskan secara singkat tentang event ini..." disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium" htmlFor="location">Lokasi <span className="text-destructive">*</span></label>
              <Input id="location" value={form.location} onChange={(e) => onChange("location", e.target.value)} placeholder="Gedung F Filkom UB, Ruang F2.1" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="start">Mulai <span className="text-destructive">*</span></label>
              <Input id="start" type="datetime-local" value={form.start_time} onChange={(e) => onChange("start_time", e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="end">Selesai <span className="text-destructive">*</span></label>
              <Input id="end" type="datetime-local" value={form.end_time} onChange={(e) => onChange("end_time", e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="quota">Kuota peserta <span className="text-destructive">*</span></label>
              <Input id="quota" type="number" min={1} value={form.quota_total} onChange={(e) => onChange("quota_total", e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium">Poster (opsional)</span>
              {posterPreview ? (
                <div className="relative overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterPreview} alt="Preview poster" className="h-20 w-full object-cover" />
                  <button type="button" onClick={onClearPoster} className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white" aria-label="Hapus poster"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-muted/50">
                  <ImagePlus className="h-4 w-4" />
                  Pilih gambar (JPG/PNG/WEBP, maks 5MB)
                  <input type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={onFileChange} disabled={isSubmitting} />
                </label>
              )}
            </div>
            {error && <p className="text-xs text-destructive sm:col-span-2">{error}</p>}
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {uploadPending ? "Mengunggah poster..." : createPending ? "Membuat event..." : "Create event"}
              </Button>
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

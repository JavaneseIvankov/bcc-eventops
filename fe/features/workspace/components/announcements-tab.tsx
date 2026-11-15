"use client"

import * as React from "react"
import { Megaphone, Send, Trash2 } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useGetAnnouncements,
} from "@/shared/repository/queries"
import { formatDateTime } from "@/features/events/components/event-date"

export function AnnouncementsTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetAnnouncements(eventId)
  const createMut = useCreateAnnouncement()
  const deleteMut = useDeleteAnnouncement()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")

  const announcements = data?.data ?? []

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) return

    createMut.mutate(
      { eventId, body: { title: title.trim(), content: content.trim() } },
      {
        onSuccess: () => {
          setTitle("")
          setContent("")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" />
            Broadcast Pengumuman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="Judul pengumuman"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Isi pengumuman untuk peserta..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={
                  createMut.isPending || !title.trim() || !content.trim()
                }
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {createMut.isPending ? "Mengirim..." : "Kirim"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-xs text-muted-foreground">
            Belum ada pengumuman.
          </CardContent>
        </Card>
      ) : (
        announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateTime(announcement.created_at)}
                    {announcement.author_name &&
                      ` · ${announcement.author_name}`}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  disabled={deleteMut.isPending}
                  onClick={() =>
                    deleteMut.mutate({
                      eventId,
                      announcementId: announcement.id,
                    })
                  }
                  aria-label="Hapus pengumuman"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                {announcement.content}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

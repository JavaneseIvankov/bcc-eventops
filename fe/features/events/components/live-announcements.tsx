"use client"

import { Megaphone } from "lucide-react"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGetAnnouncements } from "@/shared/repository/queries"
import { formatDateTime } from "./event-date"

export function LiveAnnouncements({ eventId }: { eventId: string }) {
  const { data, isLoading } = useGetAnnouncements(eventId)
  const announcements = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center">
        <Megaphone className="mx-auto h-7 w-7 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium">Belum ada pengumuman</p>
        <p className="text-xs text-muted-foreground">
          Pengumuman dari panitia akan muncul di sini.
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {announcements.map((announcement) => (
        <li key={announcement.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{announcement.title}</p>
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(announcement.created_at)}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
            {announcement.content}
          </p>
          {announcement.author_name && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              — {announcement.author_name}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}

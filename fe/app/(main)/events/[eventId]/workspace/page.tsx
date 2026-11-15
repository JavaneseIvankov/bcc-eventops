"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { useGetEventDetail, useGetMe } from "@/shared/repository/queries"
import { useEventRealtime } from "@/shared/repository/websocket"
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header"
import { OverviewTab } from "@/features/workspace/components/overview-tab"
import { CheckInTab } from "@/features/workspace/components/check-in-tab"
import { ParticipantsTab } from "@/features/workspace/components/participants-tab"
import { RundownTab } from "@/features/workspace/components/rundown-tab"
import { AnnouncementsTab } from "@/features/workspace/components/announcements-tab"
import { CommitteeTab } from "@/features/workspace/components/committee-tab"
import { SettingsTab } from "@/features/workspace/components/settings-tab"

const TABS = [
  "overview",
  "check-in",
  "participants",
  "rundown",
  "announcements",
  "committee",
  "settings",
] as const

type WorkspaceTab = (typeof TABS)[number]

function isWorkspaceTab(value: string | null): value is WorkspaceTab {
  return value !== null && (TABS as readonly string[]).includes(value)
}

export default function WorkspacePage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params.eventId

  const { data: meRes } = useGetMe()
  const { data, isLoading, isError } = useGetEventDetail(eventId)
  const event = data?.data

  // Channel panitia: dashboard, peserta, dan pencabutan akses realtime.
  useEventRealtime({
    eventId,
    channel: "committee",
    enabled: !!event?.my_role,
    onAccessRevoked: () => {
      router.replace(`/events/${eventId}`)
    },
  })

  const tabParam = searchParams.get("tab")
  const activeTab: WorkspaceTab = isWorkspaceTab(tabParam) ? tabParam : "overview"

  // Route ini khusus panitia. Kalau bukan panitia, kembalikan ke halaman publik.
  React.useEffect(() => {
    if (!isLoading && event && !event.my_role) {
      router.replace(`/events/${eventId}`)
    }
  }, [isLoading, event, eventId, router])

  // Tab settings hanya untuk koordinator.
  React.useEffect(() => {
    if (event?.my_role === "COMMITTEE" && activeTab === "settings") {
      router.replace(`/events/${eventId}/workspace?tab=overview`)
    }
  }, [event?.my_role, activeTab, eventId, router])

  const handleTabChange = (value: unknown) => {
    if (typeof value !== "string") return
    router.replace(`/events/${eventId}/workspace?tab=${value}`, {
      scroll: false,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !event || !event.my_role) {
    return null
  }

  return (
    <div className="flex flex-col gap-5">
      <WorkspaceHeader event={event} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="check-in">Check-in Desk</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="rundown">Rundown</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="committee">Committee</TabsTrigger>
            {event.my_role === "COORDINATOR" && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="check-in" className="mt-4">
          <CheckInTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="participants" className="mt-4">
          <ParticipantsTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="rundown" className="mt-4">
          <RundownTab eventId={eventId} role={event.my_role} />
        </TabsContent>
        <TabsContent value="announcements" className="mt-4">
          <AnnouncementsTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="committee" className="mt-4">
          <CommitteeTab
            eventId={eventId}
            role={event.my_role}
            currentUserId={meRes?.data.id ?? ""}
          />
        </TabsContent>
        {event.my_role === "COORDINATOR" && (
          <TabsContent value="settings" className="mt-4">
            <SettingsTab event={event} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

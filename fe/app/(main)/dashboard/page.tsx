<<<<<<< HEAD
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ShieldCheck, Ticket } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent } from "@/shared/components/ui/card"
import { useGetEvents, useGetMe, useGetMyRegistrations } from "@/shared/repository/queries"
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header"
import {
  DashboardKpi,
  DashboardKpiSkeleton,
} from "@/features/dashboard/components/dashboard-kpi"
import { PendingInvitations } from "@/features/dashboard/components/pending-invitations"
import { ManagedEventsTable } from "@/features/dashboard/components/managed-events-table"
import { MyTicketsTable } from "@/features/dashboard/components/my-tickets-table"

type DashboardTab = "managed" | "tickets"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab: DashboardTab = tabParam === "tickets" ? "tickets" : "managed"

  const { data: meRes } = useGetMe()
  const { data: managedRes, isLoading: isManagedLoading } = useGetEvents({
    managed_by_me: true,
    limit: 100,
  })
  const { data: registrationsRes, isLoading: isRegistrationsLoading } =
    useGetMyRegistrations({ limit: 50 })

  const user = meRes?.data
  const managedEvents = managedRes?.data ?? []
  const registrations = registrationsRes?.data ?? []

  const coordinatorCount = managedEvents.filter(
    (event) => event.my_role === "COORDINATOR"
  ).length
  const committeeCount = managedEvents.filter(
    (event) => event.my_role === "COMMITTEE"
  ).length
  const upcomingLiveCount = managedEvents.filter(
    (event) => event.status === "UPCOMING" || event.status === "ONGOING"
  ).length
  const activeRegistrations = registrations.filter(
    (registration) => registration.status !== "CANCELLED"
  ).length

  const isKpiLoading = isManagedLoading || isRegistrationsLoading

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader user={user} />

      {isKpiLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <DashboardKpi
          managedCount={managedEvents.length}
          coordinatorCount={coordinatorCount}
          committeeCount={committeeCount}
          activeRegistrations={activeRegistrations}
          upcomingLiveCount={upcomingLiveCount}
          ticketCount={registrations.length}
        />
      )}

      <PendingInvitations />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value !== "string") return
          router.replace(`/dashboard?tab=${value}`, { scroll: false })
        }}
      >
        <TabsList>
          <TabsTrigger value="managed" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Managed Events
            {managedEvents.length > 0 && (
              <span className="ml-0.5 text-[10px] text-muted-foreground">
                {managedEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            My Tickets
            {registrations.length > 0 && (
              <span className="ml-0.5 text-[10px] text-muted-foreground">
                {registrations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="managed" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <ManagedEventsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <MyTicketsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
=======
import { DashboardContainer } from "@/features/dashboard/containers/dashboard-container"

export default function DashboardPage() {
  return <DashboardContainer />
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
}

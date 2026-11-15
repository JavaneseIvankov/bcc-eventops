"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useGetEvents, useGetMe, useGetMyRegistrations } from "@/shared/repository/queries"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

type DashboardTab = "managed" | "tickets"

export function DashboardContainer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab: DashboardTab = tabParam === "tickets" ? "tickets" : "managed"
  const { data: meRes } = useGetMe()
  const { data: managedRes, isLoading: isManagedLoading } = useGetEvents({ managed_by_me: true, limit: 100 })
  const { data: registrationsRes, isLoading: isRegistrationsLoading } = useGetMyRegistrations({ limit: 50 })
  const user = meRes?.data
  const managedEvents = managedRes?.data ?? []
  const registrations = registrationsRes?.data ?? []
  const kpiData = {
    managedCount: managedEvents.length,
    coordinatorCount: managedEvents.filter((event) => event.my_role === "COORDINATOR").length,
    committeeCount: managedEvents.filter((event) => event.my_role === "COMMITTEE").length,
    activeRegistrations: registrations.filter((registration) => registration.status !== "CANCELLED").length,
    upcomingLiveCount: managedEvents.filter((event) => event.status === "UPCOMING" || event.status === "ONGOING").length,
    ticketCount: registrations.length,
  }

  return (
    <DashboardView
      user={user}
      isKpiLoading={isManagedLoading || isRegistrationsLoading}
      kpiData={kpiData}
      selectedTab={tab}
      managedCount={managedEvents.length}
      ticketCount={registrations.length}
      onTabChange={(value) => {
        if (typeof value !== "string") return
        router.replace(`/dashboard?tab=${value}`, { scroll: false })
      }}
    />
  )
}

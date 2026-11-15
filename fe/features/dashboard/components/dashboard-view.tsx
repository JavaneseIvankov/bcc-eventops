import { Loader2, ShieldCheck, Ticket } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent } from "@/shared/components/ui/card"
import type { User } from "@/shared/repository/types"
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header"
import { DashboardKpi, DashboardKpiSkeleton } from "@/features/dashboard/components/dashboard-kpi"
import { PendingInvitations } from "@/features/dashboard/components/pending-invitations"
import { ManagedEventsTable } from "@/features/dashboard/components/managed-events-table"
import { MyTicketsTable } from "@/features/dashboard/components/my-tickets-table"

type DashboardKpiData = {
  managedCount: number
  coordinatorCount: number
  committeeCount: number
  activeRegistrations: number
  upcomingLiveCount: number
  ticketCount: number
}

type DashboardViewProps = {
  user: User | undefined
  isKpiLoading: boolean
  kpiData: DashboardKpiData
  selectedTab: "managed" | "tickets"
  managedCount: number
  ticketCount: number
  onTabChange: (value: unknown) => void
}

export function DashboardView({ user, isKpiLoading, kpiData, selectedTab, managedCount, ticketCount, onTabChange }: DashboardViewProps) {
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
      {isKpiLoading ? <DashboardKpiSkeleton /> : <DashboardKpi {...kpiData} />}
      <PendingInvitations />
      <Tabs value={selectedTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="managed" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Managed Events
            {managedCount > 0 && <span className="ml-0.5 text-[10px] text-muted-foreground">{managedCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            My Tickets
            {ticketCount > 0 && <span className="ml-0.5 text-[10px] text-muted-foreground">{ticketCount}</span>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="managed" className="mt-4">
          <Card><CardContent className="p-4"><ManagedEventsTable /></CardContent></Card>
        </TabsContent>
        <TabsContent value="tickets" className="mt-4">
          <Card><CardContent className="p-4"><MyTicketsTable /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

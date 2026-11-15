import { AppSidebar } from "@/shared/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar"
import { ReactNode } from "react"

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

import { AdminDashboardShell } from "@/features/admin-dashboard/components/admin-dashboard-layout"

export default function AdminDashboardPage() {
  return (
    <>
      <AdminDashboardShell
        breadcrumbs={[
          { label: "Build Your Application", href: "#" },
          { label: "Data Fetching" },
        ]}
      >
        <div className="w-full-h h-full bg-muted/50"></div>
      </AdminDashboardShell>
    </>
  )
}
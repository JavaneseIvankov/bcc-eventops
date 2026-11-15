import { AdminDashboardShell } from "@/features/admin-dashboard/components/admin-dashboard-layout"
import { redirect } from "next/navigation"

export default function AdminDashboardPage() {
   redirect("/admin/dashboard/overview")
}

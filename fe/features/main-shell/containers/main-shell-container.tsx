"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useGetMe, useGetMyInvitations, useLogout } from "@/shared/repository/queries"
import { MainShellView } from "@/features/main-shell/components/main-shell-view"

export function MainShellContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: meRes, isLoading, isError } = useGetMe()
  const user = meRes?.data
  const { data: invitations } = useGetMyInvitations(
    { status: "PENDING", limit: 1 },
    { enabled: !!user },
  )
  const logout = useLogout({ onSuccess: () => router.replace("/login") })

  React.useEffect(() => {
    if (!isLoading && isError) router.replace("/login")
  }, [isLoading, isError, router])

  if (!isLoading && (isError || !user)) return null
  return (
    <MainShellView
      loading={isLoading}
      user={{ name: user?.name ?? "", email: user?.email ?? "" }}
      inviteCount={invitations?.meta?.total_items ?? 0}
      isExploreActive={pathname === "/events" || (pathname.startsWith("/events/") && !pathname.endsWith("/workspace") && pathname !== "/events/new")}
      isDashboardActive={pathname.startsWith("/dashboard") || pathname.endsWith("/workspace")}
      logoutPending={logout.isPending}
      onLogout={() => logout.mutate()}
      onNavigate={(path) => router.push(path)}
    >{children}</MainShellView>
  )
}

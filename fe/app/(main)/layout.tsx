<<<<<<< HEAD
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  Compass,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  User as UserIcon,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  useGetMe,
  useGetMyInvitations,
  useLogout,
} from "@/shared/repository/queries"

import { Badge } from "@/shared/components/ui/badge"
import { buttonVariants } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { LogoImage } from "@/shared/components/logo"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  // 1. Cek sesi user aktif
  const { data: meRes, isLoading: isMeLoading, isError: isMeError } = useGetMe()
  const user = meRes?.data

  // 2. Cek jumlah undangan panitia yang masih PENDING untuk badge navbar
  const { data: pendingInvitesRes } = useGetMyInvitations(
    { status: "PENDING", limit: 1 },
    { enabled: !!user }
  )
  const pendingInvitesCount = pendingInvitesRes?.meta?.total_items ?? 0

  // 3. Hook Logout
  const logoutMutation = useLogout({
    onSuccess: () => {
      router.replace("/login")
    },
  })

  // Redirect ke /login jika sesi tidak valid
  React.useEffect(() => {
    if (!isMeLoading && isMeError) {
      router.replace("/login")
    }
  }, [isMeLoading, isMeError, router])

  // Tampilkan loading screen tipis saat validasi sesi awal
  if (isMeLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-7 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    )
  }

  if (isMeError || !user) {
    return null
  }

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const isExploreActive =
    pathname === "/events" ||
    (pathname.startsWith("/events/") &&
      !pathname.endsWith("/workspace") &&
      pathname !== "/events/new")

  const isDashboardActive =
    pathname.startsWith("/dashboard") || pathname.endsWith("/workspace")

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand & Main Nav Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold tracking-tight text-foreground"
            >
              <LogoImage className="h-8 w-8"></LogoImage>
              <span className="text-lg">BCCin</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({
                    variant: isDashboardActive ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-2"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
                {pendingInvitesCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-0.5 h-5 px-1.5 text-[10px]"
                  >
                    {pendingInvitesCount}
                  </Badge>
                )}
              </Link>

              <Link
                href="/events"
                className={cn(
                  buttonVariants({
                    variant: isExploreActive ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-2"
                )}
              >
                <Compass className="h-4 w-4" />
                <span>Explore Events</span>
              </Link>
            </nav>
          </div>

          {/* Right: Actions & User Profile Menu */}
          <div className="flex items-center gap-2.5">
            {/* Shortcut lonceng jika ada undangan panitia PENDING */}
            {pendingInvitesCount > 0 && (
              <Link
                href="/dashboard#invitations"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "hidden gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 sm:inline-flex"
                )}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{pendingInvitesCount} Invite</span>
              </Link>
            )}

            {/* CTA Create Event */}
            <Link href="/events/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Create event</span>
              <span className="sm:hidden">New</span>
            </Link>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9 rounded-full border bg-muted/50 text-xs font-semibold"
                )}
                aria-label="User menu"
              >
                {userInitials}
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="truncate text-sm leading-none font-medium">
                        {user.name}
                      </p>
                      <p className="truncate text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Dashboard & Tickets</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => router.push("/events")}>
                    <Compass className="mr-2 h-4 w-4" />
                    <span>Explore Events</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard#profile")}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile Info</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
=======
import * as React from "react"
import { MainShellContainer } from "@/features/main-shell/containers/main-shell-container"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainShellContainer>{children}</MainShellContainer>
>>>>>>> 4d4a4a376b2222d60879d33b310cc207d2a81a58
}

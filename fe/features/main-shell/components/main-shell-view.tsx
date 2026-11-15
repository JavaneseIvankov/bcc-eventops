"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell, Compass, LayoutDashboard, Loader2, LogOut, Plus, User as UserIcon,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import { buttonVariants } from "@/shared/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { LogoImage } from "@/shared/components/logo"

type MainShellUser = { name: string; email: string }
type MainShellViewProps = {
  loading: boolean
  user: MainShellUser
  inviteCount: number
  isExploreActive: boolean
  isDashboardActive: boolean
  logoutPending: boolean
  onLogout: () => void
  onNavigate: (path: string) => void
  children: React.ReactNode
}

export function MainShellView({
  loading, user, inviteCount, isExploreActive, isDashboardActive,
  logoutPending, onLogout, onNavigate, children,
}: MainShellViewProps) {
  if (loading) return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-32" />
          <div className="flex items-center gap-3"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-9 rounded-full" /></div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>
    </div>
  )
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-foreground"><LogoImage className="h-8 w-8"></LogoImage><span className="text-lg">BCCin</span></Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard" className={cn(buttonVariants({ variant: isDashboardActive ? "secondary" : "ghost", size: "sm" }), "gap-2")}><LayoutDashboard className="h-4 w-4" /><span>Dashboard</span>{inviteCount > 0 && <Badge variant="default" className="ml-0.5 h-5 px-1.5 text-[10px]">{inviteCount}</Badge>}</Link>
              <Link href="/events" className={cn(buttonVariants({ variant: isExploreActive ? "secondary" : "ghost", size: "sm" }), "gap-2")}><Compass className="h-4 w-4" /><span>Explore Events</span></Link>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            {inviteCount > 0 && <Link href="/dashboard#invitations" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 sm:inline-flex")}><Bell className="h-3.5 w-3.5" /><span>{inviteCount} Invite</span></Link>}
            <Link href="/events/new" className={buttonVariants({ size: "sm" })}><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Create event</span><span className="sm:hidden">New</span></Link>
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-full border bg-muted/50 text-xs font-semibold")} aria-label="User menu">{initials}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup><DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="truncate text-sm leading-none font-medium">{user.name}</p><p className="truncate text-xs leading-none text-muted-foreground">{user.email}</p></div></DropdownMenuLabel></DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onNavigate("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" /><span>My Dashboard &amp; Tickets</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("/events")}><Compass className="mr-2 h-4 w-4" /><span>Explore Events</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("/dashboard#profile")}><UserIcon className="mr-2 h-4 w-4" /><span>Profile Info</span></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={logoutPending} onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /><span>{logoutPending ? "Logging out..." : "Log out"}</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

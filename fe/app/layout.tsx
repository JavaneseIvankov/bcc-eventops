"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  Compass,
  LayoutDashboard,
  Plus,
  User as UserIcon,
  LogOut,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import {
  useGetMe,
  useGetMyInvitations,
  useLogout,
  useUploadFile,
  useCreateEvent,
} from "@/shared/repository/queries"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  const { data: user, isLoading, isError } = useGetMe()
  const { data: pendingInvites } = useGetMyInvitations({ status: "PENDING" })
  const logoutMutation = useLogout()

  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace("/login")
    }
  }, [isLoading, isError, router])

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true)
    }
  }, [searchParams])

  const pendingCount = pendingInvites?.length ?? 0

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: pendingCount,
    },
    {
      label: "Explore Events",
      href: "/events",
      icon: Compass,
      badge: 0,
    },
  ]

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    router.replace("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar Global */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
                B
              </span>
              <span>BCCin</span>
            </Link>

            <nav className="flex items-center gap-1 rounded-xl bg-muted p-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="bccinTopNavIndicator"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 30 }
                        }
                        className="absolute inset-0 rounded-lg bg-background shadow-xs"
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                    {item.badge > 0 && (
                      <Badge
                        variant="default"
                        className="relative z-10 h-5 px-1.5 text-[11px]"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create event</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2"
                )}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden max-w-[140px] truncate sm:inline-block">
                  {user?.name || "Account"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/events")}>
                  <Compass className="mr-2 h-4 w-4" />
                  <span>Explore Events</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

/* ==================== SUB-COMPONENT: CREATE EVENT DIALOG ==================== */
function CreateEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const uploadMutation = useUploadFile()
  const createEventMutation = useCreateEvent()

  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    location: "",
    start_time: "",
    end_time: "",
    quota_total: 50,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (posterFile && posterFile.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file poster maksimal 5MB.")
      return
    }

    try {
      let poster_url: string | null = null
      if (posterFile) {
        const up = await uploadMutation.mutateAsync(posterFile)
        poster_url = up.url
      }

      const created = await createEventMutation.mutateAsync({
        name: form.name,
        short_description: form.short_description,
        poster_url,
        location: form.location,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        quota_total: Number(form.quota_total),
      })

      onOpenChange(false)
      setForm({
        name: "",
        short_description: "",
        location: "",
        start_time: "",
        end_time: "",
        quota_total: 50,
      })
      setPosterFile(null)
      router.push(`/workspace?eventId=${created.id}`)
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal membuat event baru.")
    }
  }

  const isSubmitting =
    uploadMutation.isPending || createEventMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Anda otomatis menjadi Coordinator pada event yang dibuat. Status
            awal adalah UPCOMING.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Nama Event *</label>
            <Input
              required
              placeholder="Workshop Web BCC 2026"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Deskripsi Singkat (Short Description) *
            </label>
            <Input
              required
              placeholder="Belajar Go Fiber dan Next.js dari dasar hingga deployment."
              value={form.short_description}
              onChange={(e) =>
                setForm({ ...form, short_description: e.target.value })
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Waktu Mulai *</label>
              <Input
                type="datetime-local"
                required
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Waktu Selesai *</label>
              <Input
                type="datetime-local"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Lokasi *</label>
              <Input
                required
                placeholder="Gedung F Filkom UB, Ruang F2.1"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Kuota Peserta *</label>
              <Input
                type="number"
                min={1}
                required
                value={form.quota_total}
                onChange={(e) =>
                  setForm({ ...form, quota_total: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Poster Event (.jpg, .png, .webp maks 5MB)
            </label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
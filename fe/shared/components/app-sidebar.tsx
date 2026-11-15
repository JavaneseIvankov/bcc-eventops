"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar"
import {
  BarChart,
  CalendarDays,
  GalleryHorizontal,
  GalleryVerticalEndIcon,
  Grid2X2,
  Group,
  Megaphone,
  ScanQrCode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import { LogoImage, LogoSvg } from "./logo"
import { Separator } from "./ui/separator"

const pathify = (slug: string) => `/admin/dashboard/${slug}`

type NavItem = {
  icon?: LucideIcon
  title: string
  url: string
  isActive?: boolean
}

type NavGroup = {
  title: string
  url: string
  items: NavItem[]
}

// This is sample data.
const data: { navMain: NavGroup[] } = {
  navMain: [
    {
      title: "Event Operations",
      url: "#",
      items: [
        {
          icon: Grid2X2,
          title: "Overview",
          url: pathify("overview"),
        },
        {
          icon: Users,
          title: "Participants",
          url: pathify("participants"),
        },
        {
          icon: ScanQrCode,
          title: "Check-in",
          url: pathify("check-in"),
        },
        {
          icon: CalendarDays,
          title: "Session Rundown",
          url: pathify("session-rundown"),
        },
        {
          icon: Megaphone,
          title: "Announcements",
          url: pathify("announcements"),
        },
        {
          icon: BarChart,
          title: "Reports",
          url: pathify("reports"),
        },
      ],
    },
    {
      title: "Manage",
      url: "#",
      items: [
        {
          icon: Users,
          title: "Comitee Team",
          url: pathify("comitee-team"),
        },
        {
          icon: Settings,
          title: "Event Settings",
          url: pathify("event-settings"),
          isActive: true,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <LogoImage className="size-20" />
              <Separator orientation="vertical" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-lg font-bold text-primary">BCCin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<a href={item.url} className="font-medium" />}
                >
                  {item.title}
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          isActive={item.isActive}
                          render={<a href={item.url} />}
                        >
                          {item.icon ? <item.icon className="size-4" /> : null}
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

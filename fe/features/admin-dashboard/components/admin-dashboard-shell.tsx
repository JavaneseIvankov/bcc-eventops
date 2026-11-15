import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { Fragment } from "react"

export function AdminDashboardShell({
  children,
  breadcrumbs = [
    { label: "Build Your Application", href: "#" },
    { label: "Data Fetching" },
  ],
}: {
  children: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        {/* <SidebarTrigger className="-ml-1" /> */}
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <Fragment key={`${item.label}-${index}`}>
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                  <BreadcrumbItem
                    className={isLast ? undefined : "hidden md:block"}
                  >
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href ?? "#"}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="m-4 mt-0 min-h-[100vh] flex-1 overflow-clip rounded-xl md:min-h-min">
        {children}
      </div>
    </>
  )
}

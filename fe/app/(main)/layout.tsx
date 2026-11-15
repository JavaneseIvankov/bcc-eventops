import * as React from "react"
import { MainShellContainer } from "@/features/main-shell/containers/main-shell-container"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainShellContainer>{children}</MainShellContainer>
}

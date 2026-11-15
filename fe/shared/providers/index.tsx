"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./theme-provider"
import { useState } from "react"

const createQc = () => {
  return new QueryClient()
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc, _] = useState(() => createQc())

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}

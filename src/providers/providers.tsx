"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "@/components/ui/toast"
import { TOAST_DURATION } from "@/constants/ui"
import { useVietnamDate } from "@/hooks/use-vietnam-date"
import { isCurriculumQuery } from "@/features/curriculum/query-refresh"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const date = useVietnamDate()
  React.useEffect(() => {
    const refresh = () => { void queryClient.invalidateQueries({ predicate: (query) => isCurriculumQuery(query.queryKey) }) }
    const visible = () => { if (document.visibilityState === "visible") refresh() }
    refresh()
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", visible)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [queryClient, date])

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        <Toaster
          duration={TOAST_DURATION.SUCCESS}
          richColors
          position="top-right"
        />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}

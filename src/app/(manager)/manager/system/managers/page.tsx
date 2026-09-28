import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { ManagersView } from "@/features/system/components/managers-view"

export const metadata: Metadata = {
  title: SYSTEM_MSG.MANAGERS_TITLE,
}

export default function ManagersPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <ManagersView />
    </Suspense>
  )
}

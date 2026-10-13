import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { LongLeaveView } from "@/features/absences/components/long-leave-view"

export const metadata: Metadata = {
  title: ABSENCE_MSG.LONG_LEAVE_TITLE,
}

export default function LongLeavePage() {
  // Tabs + filter dùng nuqs (`useSearchParams()`) nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <LongLeaveView />
    </Suspense>
  )
}

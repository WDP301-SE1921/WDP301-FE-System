import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { WithdrawView } from "@/features/absences/components/withdraw-view"

export const metadata: Metadata = {
  title: ABSENCE_MSG.WITHDRAW_TITLE,
}

export default function WithdrawPage() {
  // Tab dùng nuqs (`?tab=`, `useSearchParams()`) nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <WithdrawView />
    </Suspense>
  )
}

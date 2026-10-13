import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { MakeupWorkflowView } from "@/features/absences/components/makeup-workflow-view"
import { MAKEUP_KIND } from "@/lib/validators/absence"

export const metadata: Metadata = {
  title: ABSENCE_MSG.SWAP_TITLE,
}

export default function SwapSessionPage() {
  // nuqs (`?studentId=&sessionId=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <MakeupWorkflowView mode={MAKEUP_KIND.SWAP} />
    </Suspense>
  )
}

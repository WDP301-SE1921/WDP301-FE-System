import { Suspense } from "react"
import type { Metadata } from "next"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { GRADING_MSG } from "@/constants/messages/events/grading"
import { GradingQueueView } from "@/features/grading/components/grading-queue-view"

export const metadata: Metadata = { title: GRADING_MSG.QUEUE_TITLE }

export default function TeacherGradingQueuePage() {
  // nuqs (`?status=`, `?classId=`, `?assignmentId=`) dùng useSearchParams() nên phải
  // có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable rows={6} />
        </PageContainer>
      }
    >
      <GradingQueueView />
    </Suspense>
  )
}

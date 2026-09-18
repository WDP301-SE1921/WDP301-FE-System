import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { StudentDetailView } from "@/features/students/components/student-detail-view"

export const metadata: Metadata = {
  title: STUDENT_MSG.DETAIL_TITLE,
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // nuqs (`?tab=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      <StudentDetailView studentProfileId={id} />
    </Suspense>
  )
}

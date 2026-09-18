import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { TeacherDetailView } from "@/features/teachers/components/teacher-detail-view"

export const metadata: Metadata = {
  title: TEACHER_MSG.LIST_TITLE,
}

export default async function TeacherDetailPage({
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
      <TeacherDetailView teacherId={id} />
    </Suspense>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal"
import { TeacherClassDetailView } from "@/features/classes/components/teacher-class-detail-view"

export const metadata: Metadata = {
  title: TEACHER_CLASS_MSG.LIST_TITLE,
}

export default async function TeacherClassDetailPage({
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
      <TeacherClassDetailView classId={id} />
    </Suspense>
  )
}

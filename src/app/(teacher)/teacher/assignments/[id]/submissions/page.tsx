import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { AssignmentSubmissionsView } from "@/features/assignments/components/assignment-submissions-view"

export const metadata: Metadata = { title: ASSIGNMENT_MSG.LIST_TITLE }

export default async function TeacherAssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // nuqs (`?status=`) dùng useSearchParams() nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      <AssignmentSubmissionsView assignmentId={id} />
    </Suspense>
  )
}

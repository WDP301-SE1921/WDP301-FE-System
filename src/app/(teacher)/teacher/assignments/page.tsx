import { Suspense } from "react"
import type { Metadata } from "next"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { AssignmentsListView } from "@/features/assignments/components/assignments-list-view"

export const metadata: Metadata = { title: ASSIGNMENT_MSG.LIST_TITLE }

export default function TeacherAssignmentsPage() {
  // nuqs (`?search=`, `?classId=`...) dùng useSearchParams() nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable rows={6} />
        </PageContainer>
      }
    >
      <AssignmentsListView />
    </Suspense>
  )
}

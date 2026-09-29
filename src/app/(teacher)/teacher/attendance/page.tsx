import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_ATTENDANCE_MSG } from "@/constants/messages/events/teacher-portal"
import { TeacherAttendanceListView } from "@/features/attendance/components/attendance-list-view"

export const metadata: Metadata = {
  title: TEACHER_ATTENDANCE_MSG.LIST_TITLE,
}

export default function TeacherAttendancePage() {
  // nuqs (`?status=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable rows={3} />
        </PageContainer>
      }
    >
      <TeacherAttendanceListView />
    </Suspense>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { REPORT_MSG } from "@/constants/messages/events/report"
import { TeacherReportsView } from "@/features/reports/components/teacher-reports-view"

export const metadata: Metadata = {
  title: REPORT_MSG.TITLE,
}

export default function TeacherReportsPage() {
  // nuqs (`?page=`, `?pageSize=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable rows={5} />
        </PageContainer>
      }
    >
      <TeacherReportsView />
    </Suspense>
  )
}

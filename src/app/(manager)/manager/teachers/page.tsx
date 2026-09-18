import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { TeachersView } from "@/features/teachers/components/teachers-view"

export const metadata: Metadata = {
  title: TEACHER_MSG.LIST_TITLE,
}

export default function TeachersPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <TeachersView />
    </Suspense>
  )
}

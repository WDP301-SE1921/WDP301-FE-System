import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { EnrollmentWizard } from "@/features/enrollments/components/enrollment-wizard"

export const metadata: Metadata = {
  title: ENROLLMENT_MSG.TITLE,
}

export default function NewEnrollmentPage() {
  // nuqs (`?step=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <EnrollmentWizard />
    </Suspense>
  )
}

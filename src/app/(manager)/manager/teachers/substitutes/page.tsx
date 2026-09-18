import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { SubstitutesView } from "@/features/teachers/components/substitutes-view"

export const metadata: Metadata = {
  title: TEACHER_MSG.SUBSTITUTE_TITLE,
}

export default function SubstitutesPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <SubstitutesView />
    </Suspense>
  )
}

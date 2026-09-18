import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ClassFormView } from "@/features/classes/components/class-form-view"

export const metadata: Metadata = {
  title: CLASS_MSG.CREATE_TITLE,
}

export default function NewClassPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <ClassFormView />
    </Suspense>
  )
}

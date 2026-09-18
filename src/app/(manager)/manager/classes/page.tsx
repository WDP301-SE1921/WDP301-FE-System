import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ClassesView } from "@/features/classes/components/classes-view"

export const metadata: Metadata = {
  title: CLASS_MSG.LIST_TITLE,
}

export default function ClassesPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <ClassesView />
    </Suspense>
  )
}

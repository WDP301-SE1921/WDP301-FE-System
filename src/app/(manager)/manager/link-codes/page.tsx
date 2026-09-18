import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { LINK_CODE_MSG } from "@/constants/messages/events/link-code"
import { LinkCodesView } from "@/features/link-codes/components/link-codes-view"

export const metadata: Metadata = {
  title: LINK_CODE_MSG.TITLE,
}

export default function LinkCodesPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <LinkCodesView />
    </Suspense>
  )
}

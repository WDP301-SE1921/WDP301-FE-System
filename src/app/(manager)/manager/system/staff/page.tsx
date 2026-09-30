import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { StaffAccountsView } from "@/features/system/components/staff-accounts-view"

export const metadata: Metadata = {
  title: SYSTEM_MSG.STAFF_TITLE,
}

export default function StaffAccountsPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <StaffAccountsView />
    </Suspense>
  )
}

import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { AuditLogView } from "@/features/system/components/audit-log-view"

export const metadata: Metadata = {
  title: SYSTEM_MSG.AUDIT_TITLE,
}

export default function AuditLogsPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <AuditLogView />
    </Suspense>
  )
}

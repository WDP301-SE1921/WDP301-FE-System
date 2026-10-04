import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import { ParentsView } from "@/features/parents/components/parents-view"
import { RegistrationParentLookupView } from "@/features/registration-flow/components/parent-lookup-view"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: PARENT_MSG.LIST_TITLE,
}

export default async function ParentsPage() {
  const role = await getServerRole()
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      {role === "staff" || role === "center_manager" ? <RegistrationParentLookupView /> : <ParentsView />}
    </Suspense>
  )
}

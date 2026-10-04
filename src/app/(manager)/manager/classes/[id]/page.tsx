import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ClassDetailView } from "@/features/classes/components/class-detail-view"
import { RegistrationClassEditor } from "@/features/registration-flow/components/class-editor"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: CLASS_MSG.LIST_TITLE,
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const role = await getServerRole()

  // nuqs (`?tab=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      {role === "center_manager" ? <RegistrationClassEditor classId={id} /> : <ClassDetailView classId={id} />}
    </Suspense>
  )
}

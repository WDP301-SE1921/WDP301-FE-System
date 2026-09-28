import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { CatalogView } from "@/features/catalog/components/catalog-view"

export const metadata: Metadata = {
  title: CATALOG_MSG.PAGE_TITLE,
}

export default function CatalogPage() {
  // Tab dùng nuqs (`?tab=`) nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <CatalogView />
    </Suspense>
  )
}

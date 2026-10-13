import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { ManagersView } from "@/features/directory/components/managers-view";

export const metadata: Metadata = { title: "Quản lý trung tâm" };

export default function Page() {
  // Filters and pagination live in the URL (nuqs), which needs Suspense when prerendering.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <ManagersView />
    </Suspense>
  );
}

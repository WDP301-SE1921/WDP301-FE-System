import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { NotificationsHub } from "@/features/system/components/notifications-view";

export const metadata: Metadata = { title: "Thông báo" };

export default function Page() {
  // Tab soạn thảo và phân trang nằm trên URL (nuqs) nên cần Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <NotificationsHub />
    </Suspense>
  );
}

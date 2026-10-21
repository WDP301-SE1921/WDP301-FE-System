import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PeopleHub } from "@/features/directory/components/people-view";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = { title: "Nhân sự" };

export default async function Page() {
  const role = await getServerRole();
  if (!role) return null;
  // Tab, tìm kiếm, phân trang và Sheet nằm trên URL (nuqs) nên cần Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <PeopleHub role={role} />
    </Suspense>
  );
}

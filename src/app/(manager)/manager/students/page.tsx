import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { ParentAccountPanels } from "@/features/directory/components/parent-detail-view";
import { StudentsHub } from "@/features/registration-flow/components/directory-list-view";
import { StudentsView } from "@/features/students/components/students-view";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: "Học sinh & phụ huynh",
};

export default async function StudentsPage() {
  const role = await getServerRole();
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      {role === "center_manager" ? (
        <>
          <StudentsHub role="center_manager" />
          <ParentAccountPanels />
        </>
      ) : (
        <StudentsView />
      )}
    </Suspense>
  );
}

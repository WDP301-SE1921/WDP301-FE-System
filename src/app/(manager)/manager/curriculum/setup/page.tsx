import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { ROUTES } from "@/constants/routes";
import { actsAsManager } from "@/constants/roles";
import { CourseContentSetup } from "@/features/curriculum/components/course-content-setup";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = { title: "Soạn khóa học từng bước" };

/** Luồng 1 (Mục tiêu → Giáo trình → Duyệt) cho Thiết kế giáo trình và Quản lý. */
export default async function CurriculumSetupPage() {
  const role = await getServerRole();
  if (role !== "curriculum_designer" && !actsAsManager(role))
    redirect(ROUTES.MANAGER.CURRICULUM);
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <CourseContentSetup />
    </Suspense>
  );
}

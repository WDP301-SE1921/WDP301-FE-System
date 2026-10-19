import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { HubTabs } from "@/components/shared/layout/hub-tabs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  CURRICULUM_HUB_LABELS,
  CURRICULUM_HUB_RESET_KEYS,
  DESIGNER_CURRICULUM_TABS,
  MANAGER_CURRICULUM_TABS,
} from "@/constants/curriculum-hub";
import { CurriculumFeedbackTab } from "@/features/curriculum/components/live-feedback-view";
import {
  CurriculumUnitsTab,
  CurriculumUnitsView,
} from "@/features/curriculum/components/units-view";
import { ProgramSheet } from "@/features/registration-flow/components/program-detail-view";
import {
  ProgramsCatalogTab,
  SubjectsCatalogTab,
} from "@/features/registration-flow/components/programs-view";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = { title: "Khóa học & giáo trình" };

/**
 * Quản lý: Khóa học & giáo trình / Môn học / Phản hồi. Thiết kế giáo trình: Giáo trình / Phản hồi.
 * Mỗi thân tab tự đọc `?tab=`, trang chỉ ghép các phần của feature lại.
 */
export default async function CurriculumPage() {
  const role = await getServerRole();
  const tabs =
    role === "center_manager"
      ? MANAGER_CURRICULUM_TABS
      : role === "curriculum_designer"
        ? DESIGNER_CURRICULUM_TABS
        : null;
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      {tabs ? (
        <PageContainer maxWidth="full" className="min-w-0">
          <PageHeader
            title={
              role === "center_manager" ? "Khóa học & giáo trình" : "Giáo trình"
            }
            description={
              role === "center_manager"
                ? "Mỗi khóa học (môn + khối) có một giáo trình dùng cho mọi lớp của khóa, mỗi kỳ một phiên bản. Giáo trình do Thiết kế giáo trình soạn, quản lý duyệt áp dụng."
                : "Soạn giáo trình theo khóa học, gửi giáo viên thẩm định rồi chờ quản lý duyệt áp dụng."
            }
          />
          <HubTabs
            ariaLabel="Phần của khóa học và giáo trình"
            items={tabs.map((value) => ({
              value,
              label: CURRICULUM_HUB_LABELS[value],
            }))}
            resetKeys={CURRICULUM_HUB_RESET_KEYS}
          />
          {role === "center_manager" ? (
            <>
              <ProgramsCatalogTab tabs={tabs} />
              <SubjectsCatalogTab tabs={tabs} />
              <ProgramSheet />
            </>
          ) : (
            <CurriculumUnitsTab tabs={tabs} />
          )}
          <CurriculumFeedbackTab tabs={tabs} />
        </PageContainer>
      ) : (
        <CurriculumUnitsView />
      )}
    </Suspense>
  );
}

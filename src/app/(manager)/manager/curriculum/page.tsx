import { actsAsManager } from "@/constants/roles";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
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
import { DesignerOutcomesTab } from "@/features/outcomes/components/program-outcomes-view";
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
    actsAsManager(role)
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
              actsAsManager(role) ? "Khóa học & giáo trình" : "Giáo trình"
            }
            description={
              actsAsManager(role)
                ? "Mỗi khóa học (môn + khối) có một giáo trình dùng cho mọi lớp của khóa, mỗi kỳ một bản. Giáo trình do Thiết kế giáo trình soạn, giáo viên duyệt nội dung, Quản lý duyệt áp dụng."
                : "Soạn giáo trình theo khóa học, gửi giáo viên duyệt nội dung rồi chờ Quản lý duyệt áp dụng."
            }
            actions={
              <Button render={<Link href={ROUTES.MANAGER.CURRICULUM_SETUP} />}>
                Soạn khóa học từng bước
              </Button>
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
          {actsAsManager(role) ? (
            <>
              <ProgramsCatalogTab tabs={tabs} />
              <SubjectsCatalogTab tabs={tabs} />
              <ProgramSheet />
            </>
          ) : (
            <>
              <CurriculumUnitsTab tabs={tabs} />
              <DesignerOutcomesTab tabs={tabs} />
              <ProgramSheet />
            </>
          )}
          <CurriculumFeedbackTab tabs={tabs} />
        </PageContainer>
      ) : (
        <CurriculumUnitsView />
      )}
    </Suspense>
  );
}

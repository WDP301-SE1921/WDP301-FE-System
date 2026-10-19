import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { HubTabs } from "@/components/shared/layout/hub-tabs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  CLASS_HUB_LABELS,
  CLASS_HUB_RESET_KEYS,
  MANAGER_CLASS_TABS,
} from "@/constants/class-hub";
import { CLASS_MSG } from "@/constants/messages/events/class";
import { ROUTES } from "@/constants/routes";
import { RoomsTab } from "@/features/catalog/components/live-rooms-view";
import { ClassesView } from "@/features/classes/components/classes-view";
import { ClassesTab } from "@/features/registration-flow/components/classes-view";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: CLASS_MSG.LIST_TITLE,
};

/** Quản lý: tab Lớp học (lưới thẻ / bảng) và tab Phòng học. Nhánh admin giữ màn cũ. */
export default async function ClassesPage() {
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
        <PageContainer maxWidth="full" className="min-w-0">
          <PageHeader
            title="Lớp học"
            description="Lớp, lịch tuần, giáo viên và sĩ số của trung tâm. Phòng học dùng khi tạo lớp."
            actions={
              <Button render={<Link href={ROUTES.MANAGER.CLASS_NEW} />}>
                Tạo lớp học
              </Button>
            }
          />
          <HubTabs
            ariaLabel="Lớp học hoặc phòng học"
            items={MANAGER_CLASS_TABS.map((value) => ({
              value,
              label: CLASS_HUB_LABELS[value],
            }))}
            resetKeys={CLASS_HUB_RESET_KEYS}
          />
          <ClassesTab tabs={MANAGER_CLASS_TABS} />
          <RoomsTab tabs={MANAGER_CLASS_TABS} />
        </PageContainer>
      ) : (
        <ClassesView />
      )}
    </Suspense>
  );
}

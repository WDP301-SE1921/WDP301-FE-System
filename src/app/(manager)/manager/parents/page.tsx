import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PARENT_MSG } from "@/constants/messages/events/parent";
import { ROUTES } from "@/constants/routes";
import { ParentsView } from "@/features/parents/components/parents-view";
import { getServerRole } from "@/lib/auth/server-role";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

export const metadata: Metadata = {
  title: PARENT_MSG.LIST_TITLE,
};

/** Quản lý xem phụ huynh ở tab Phụ huynh của màn Học sinh & phụ huynh; nhánh admin giữ màn cũ. */
export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const role = await getServerRole();
  if (role !== "admin")
    redirect(
      legacyHref(ROUTES.MANAGER.STUDENTS, { tab: "parents" }, await searchParams),
    );
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <ParentsView />
    </Suspense>
  );
}

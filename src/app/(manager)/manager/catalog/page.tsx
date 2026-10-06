import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { CATALOG_MSG } from "@/constants/messages/events/catalog";
import { CurriculumUnitsView } from "@/features/curriculum/components/units-view";
import { RegistrationProgramsView } from "@/features/registration-flow/components/programs-view";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: CATALOG_MSG.PAGE_TITLE,
};

export default async function CatalogPage() {
  const role = await getServerRole();
  // Tab dùng nuqs (`?tab=`) nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      {role === "center_manager" ? (
        <RegistrationProgramsView />
      ) : (
        <CurriculumUnitsView />
      )}
    </Suspense>
  );
}

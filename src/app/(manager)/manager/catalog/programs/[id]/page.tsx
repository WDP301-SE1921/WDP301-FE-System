import type { Metadata } from "next";
import { CATALOG_MSG } from "@/constants/messages/events/catalog";
import { Suspense } from "react";
import { CurriculumUnitsView } from "@/features/curriculum/components/units-view";

export const metadata: Metadata = {
  title: CATALOG_MSG.TAB_PROGRAMS,
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Đang tải giáo trình…</p>}>
      <CurriculumUnitsView programId={id} />
    </Suspense>
  );
}

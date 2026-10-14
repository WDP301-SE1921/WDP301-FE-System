import { CurriculumUnitDetailView } from "@/features/curriculum/components/unit-detail-view";
import { Suspense } from "react";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";

export default async function CurriculumUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <CurriculumUnitDetailView key={id} unitId={id} />
    </Suspense>
  );
}

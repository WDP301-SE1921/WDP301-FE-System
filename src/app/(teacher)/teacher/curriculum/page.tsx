import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { CurriculumUnitsView } from "@/features/curriculum/components/units-view";

export const metadata: Metadata = { title: "Thẩm định giáo trình" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <CurriculumUnitsView />
    </Suspense>
  );
}

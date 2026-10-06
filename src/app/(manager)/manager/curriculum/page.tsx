import { Suspense } from "react";
import { CurriculumUnitsView } from "@/features/curriculum/components/units-view";

export default function CurriculumPage() {
  return (
    <Suspense fallback={<p>Đang tải giáo trình…</p>}>
      <CurriculumUnitsView />
    </Suspense>
  );
}

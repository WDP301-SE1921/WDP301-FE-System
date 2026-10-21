import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { TeacherCurriculumHub } from "@/features/curriculum/components/teacher-curriculum-hub";

export const metadata: Metadata = { title: "Giáo trình" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <TeacherCurriculumHub />
    </Suspense>
  );
}

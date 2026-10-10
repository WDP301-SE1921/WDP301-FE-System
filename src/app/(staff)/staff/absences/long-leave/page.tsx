import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveStaffWorkflows } from "@/features/absences/components/live-staff-workflows";

export const metadata: Metadata = { title: "Nghỉ học và xếp lớp" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveStaffWorkflows mode="leave" />
    </Suspense>
  );
}

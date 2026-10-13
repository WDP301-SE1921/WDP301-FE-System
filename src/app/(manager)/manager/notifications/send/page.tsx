import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAnnouncementsView } from "@/features/system/components/live-announcements-view";

export const metadata: Metadata = { title: "Thông báo và nhắc học phí" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAnnouncementsView />
    </Suspense>
  );
}

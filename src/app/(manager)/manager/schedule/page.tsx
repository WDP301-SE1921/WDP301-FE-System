import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { SCHEDULE_MSG } from "@/constants/messages/events/schedule";
import { AcademicCalendarView } from "@/features/curriculum/components/calendar-view";

export const metadata: Metadata = {
  title: SCHEDULE_MSG.TITLE,
};

export default function SchedulePage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <AcademicCalendarView defaultView="board" />
    </Suspense>
  );
}

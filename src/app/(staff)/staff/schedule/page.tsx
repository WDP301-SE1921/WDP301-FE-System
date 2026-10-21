import { Suspense } from "react";
import { AcademicCalendarView } from "@/features/curriculum/components/calendar-view";

export default function StaffSchedulePage() {
  return (
    <Suspense fallback={<p>Đang tải buổi học…</p>}>
      <AcademicCalendarView defaultView="board" />
    </Suspense>
  );
}

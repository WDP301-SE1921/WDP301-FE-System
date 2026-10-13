import { Suspense } from "react";
import { ScheduledSessionsView } from "@/features/curriculum/components/sessions-view";

export default function SessionsPage() {
  return (
    <Suspense fallback={<p>Đang tải buổi học…</p>}>
      <ScheduledSessionsView />
    </Suspense>
  );
}

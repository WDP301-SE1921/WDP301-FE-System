import { Suspense } from "react";
import { ScheduledSessionsView } from "@/features/curriculum/components/sessions-view";

export default async function ClassSessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Đang tải buổi học…</p>}>
      <ScheduledSessionsView classId={id} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { ProgramSessionGenerator } from "@/features/curriculum/components/program-session-generator";
import { ScheduledSessionsView } from "@/features/curriculum/components/sessions-view";
import { getServerRole } from "@/lib/auth/server-role";

export default async function SessionsPage() {
  const role = await getServerRole();
  // Chọn màn theo role phía server để không nháy màn cũ trước khi hydrate.
  return (
    <Suspense fallback={<p>Đang tải buổi học…</p>}>
      {role === "center_manager" ? (
        <ProgramSessionGenerator />
      ) : (
        <ScheduledSessionsView />
      )}
    </Suspense>
  );
}

import { Suspense } from "react";
import { RegistrationParentsView } from "@/features/registration-flow/components/directory-list-view";
export const metadata = { title: "Phụ huynh" };
export default function StaffParentsPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải phụ huynh…</p>}>
      <RegistrationParentsView />
    </Suspense>
  );
}

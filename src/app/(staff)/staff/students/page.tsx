import { Suspense } from "react";
import { RegistrationStudentsView } from "@/features/registration-flow/components/directory-list-view";
export const metadata = { title: "Hồ sơ con" };
export default function StaffStudentsPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải hồ sơ con…</p>}>
      <RegistrationStudentsView />
    </Suspense>
  );
}

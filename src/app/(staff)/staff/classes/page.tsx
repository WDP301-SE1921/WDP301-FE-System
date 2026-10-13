import { Suspense } from "react";
import { RegistrationClassesView } from "@/features/registration-flow/components/classes-view";

export default function StaffClassesPage() {
  return (
    <Suspense fallback={<p>Đang tải lớp học…</p>}>
      <RegistrationClassesView />
    </Suspense>
  );
}

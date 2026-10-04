import { Suspense } from "react";
import { RegistrationPaymentsView } from "@/features/registration-flow/components/payments-view";

export const metadata = { title: "Đăng ký & biên lai học phí" };
export default function StaffPaymentsPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải đăng ký…</p>}>
      <RegistrationPaymentsView />
    </Suspense>
  );
}

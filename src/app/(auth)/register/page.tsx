import { AuthLayout } from "@/components/shared/layout/auth-layout";
import { RegisterParentForm } from "@/features/auth/components/register-parent-form";
import { AUTH_MSG } from "@/constants/messages/events/auth";

export const metadata = { title: AUTH_MSG.REGISTER_TITLE };
export default function RegisterPage() {
  return (
    <AuthLayout
      title="EduGrade dành cho phụ huynh"
      subtitle={AUTH_MSG.REGISTER_DESC}
    >
      <RegisterParentForm />
    </AuthLayout>
  );
}

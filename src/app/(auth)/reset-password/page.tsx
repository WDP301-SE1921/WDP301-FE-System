import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldKeyIcon } from "@hugeicons/core-free-icons";

import { AuthLayout } from "@/components/shared/layout/auth-layout";
import { AUTH_MSG } from "@/constants/messages/events/auth";
import { ROUTES } from "@/constants/routes";
import { AuthIllustration } from "@/features/auth/components/auth-illustration";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: AUTH_MSG.RESET_TITLE,
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title={AUTH_MSG.LOGIN_BRAND_TITLE}
      subtitle={AUTH_MSG.FORGOT_BRAND_DESC}
      illustration={
        <AuthIllustration
          icon={ShieldKeyIcon}
          badge={AUTH_MSG.FORGOT_ILLUSTRATION_BADGE}
          title={AUTH_MSG.FORGOT_ILLUSTRATION_TITLE}
          description={AUTH_MSG.FORGOT_ILLUSTRATION_DESC}
        />
      }
      footerLink={
        <Link
          href={ROUTES.AUTH.FORGOT_PASSWORD}
          className="transition-colors hover:text-white"
        >
          {AUTH_MSG.FORGOT_SUBMIT}
        </Link>
      }
    >
      {/* The reset code may arrive as `?token=`, read through nuqs. */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}

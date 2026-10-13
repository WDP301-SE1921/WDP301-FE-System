import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";

import { AuthLayout } from "@/components/shared/layout/auth-layout";
import { AUTH_MSG } from "@/constants/messages/events/auth";
import { ROUTES } from "@/constants/routes";
import { AuthIllustration } from "@/features/auth/components/auth-illustration";
import { AcceptInvitationForm } from "@/features/auth/components/accept-invitation-form";

export const metadata: Metadata = {
  title: AUTH_MSG.INVITE_TITLE,
};

export default function AcceptInvitationPage() {
  return (
    <AuthLayout
      title={AUTH_MSG.LOGIN_BRAND_TITLE}
      subtitle={AUTH_MSG.INVITE_DESC}
      illustration={
        <AuthIllustration
          icon={MailAdd01Icon}
          badge="Lời mời nhân sự"
          title={AUTH_MSG.INVITE_TITLE}
          description={AUTH_MSG.INVITE_SUCCESS_DESC}
        />
      }
      footerLink={
        <Link
          href={ROUTES.AUTH.LOGIN}
          className="transition-colors hover:text-white"
        >
          {AUTH_MSG.SUPPORT_CENTER}
        </Link>
      }
    >
      {/* The invitation code arrives as `?token=`, read through nuqs. */}
      <Suspense>
        <AcceptInvitationForm />
      </Suspense>
    </AuthLayout>
  );
}

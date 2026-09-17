import type { Metadata } from "next"
import Link from "next/link"
import { ShieldKeyIcon } from "@hugeicons/core-free-icons"

import { AuthLayout } from "@/components/shared/layout/auth-layout"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import { AuthIllustration } from "@/features/auth/components/auth-illustration"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = {
  title: AUTH_MSG.FORGOT_TITLE,
}

export default function ForgotPasswordPage() {
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
        <Link href={ROUTES.AUTH.LOGIN} className="transition-colors hover:text-white">
          {AUTH_MSG.SUPPORT_CENTER}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}

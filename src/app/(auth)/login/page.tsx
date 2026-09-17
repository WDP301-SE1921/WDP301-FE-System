import type { Metadata } from "next"
import Link from "next/link"
import { ChartLineData01Icon } from "@hugeicons/core-free-icons"

import { AuthLayout } from "@/components/shared/layout/auth-layout"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import { AuthIllustration } from "@/features/auth/components/auth-illustration"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = {
  title: AUTH_MSG.LOGIN_TITLE,
}

export default function LoginPage() {
  return (
    <AuthLayout
      title={AUTH_MSG.LOGIN_BRAND_TITLE}
      subtitle={AUTH_MSG.LOGIN_BRAND_DESC}
      illustration={
        <AuthIllustration
          icon={ChartLineData01Icon}
          badge={AUTH_MSG.LOGIN_ILLUSTRATION_BADGE}
          title={AUTH_MSG.LOGIN_ILLUSTRATION_TITLE}
          description={AUTH_MSG.LOGIN_ILLUSTRATION_DESC}
        />
      }
      footerLink={
        <Link href={ROUTES.PUBLIC.HOME} className="transition-colors hover:text-white">
          {AUTH_MSG.TERMS_OF_SERVICE}
        </Link>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}

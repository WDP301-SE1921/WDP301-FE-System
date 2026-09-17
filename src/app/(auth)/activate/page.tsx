import type { Metadata } from "next"
import Link from "next/link"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"

import { AuthLayout } from "@/components/shared/layout/auth-layout"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import { ActivateAccountForm } from "@/features/auth/components/activate-account-form"
import { AuthIllustration } from "@/features/auth/components/auth-illustration"

export const metadata: Metadata = {
  title: AUTH_MSG.ACTIVATE_TITLE,
}

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthLayout
      title={AUTH_MSG.LOGIN_BRAND_TITLE}
      subtitle={AUTH_MSG.ACTIVATE_BRAND_DESC}
      illustration={
        <AuthIllustration
          icon={UserAdd01Icon}
          badge={AUTH_MSG.ACTIVATE_ILLUSTRATION_BADGE}
          title={AUTH_MSG.ACTIVATE_ILLUSTRATION_TITLE}
          description={AUTH_MSG.ACTIVATE_ILLUSTRATION_DESC}
        />
      }
      footerLink={
        <Link href={ROUTES.PUBLIC.HOME} className="transition-colors hover:text-white">
          {AUTH_MSG.TERMS_OF_SERVICE}
        </Link>
      }
    >
      <ActivateAccountForm token={token ?? ""} />
    </AuthLayout>
  )
}

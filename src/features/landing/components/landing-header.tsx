import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import { LANDING_NAV } from "@/features/landing/content"
import { LandingLogo } from "@/features/landing/components/landing-logo"

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={ROUTES.PUBLIC.HOME}>
          <LandingLogo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LANDING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button render={<Link href={ROUTES.AUTH.LOGIN} />} className="rounded-full">
          {AUTH_MSG.LOGIN_ACTION}
        </Button>
      </div>
    </header>
  )
}

export { LandingHeader }

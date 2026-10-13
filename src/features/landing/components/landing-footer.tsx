import Link from "next/link"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"
import { LandingLogo } from "@/features/landing/components/landing-logo"

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <LandingLogo />

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {LANDING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          {LANDING_CONTENT.FOOTER_COPYRIGHT(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  )
}

export { LandingFooter }

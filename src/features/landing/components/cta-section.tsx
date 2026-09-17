import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Call02Icon,
  Location01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"

const CONTACT_ICON: Record<string, typeof Call02Icon> = {
  phone: Call02Icon,
  mail: Mail01Icon,
  address: Location01Icon,
}

function CtaSection() {
  const sectionId = LANDING_NAV[2].href.replace("#", "")

  return (
    <section id={sectionId} className="scroll-mt-20 bg-background py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {LANDING_CONTENT.CTA_TITLE}
            </h2>
            <p className="text-base leading-relaxed text-primary-foreground/80">
              {LANDING_CONTENT.CTA_DESC}
            </p>
            <Button
              size="xl"
              className="rounded-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
              render={<Link href={ROUTES.AUTH.LOGIN} />}
              rightIcon={<HugeiconsIcon icon={ArrowRight01Icon} />}
            >
              {LANDING_CONTENT.CTA_ACTION}
            </Button>
          </div>

          <div className="mt-12 grid gap-4 border-t border-primary-foreground/20 pt-10 sm:grid-cols-3">
            {LANDING_CONTENT.CONTACT_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <HugeiconsIcon
                    icon={CONTACT_ICON[item.iconName]}
                    className="size-5"
                  />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-primary-foreground/70">{item.label}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { CtaSection }

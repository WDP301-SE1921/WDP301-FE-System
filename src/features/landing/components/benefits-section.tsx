import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  CheckmarkCircle02Icon,
  ChartLineData01Icon,
} from "@hugeicons/core-free-icons"

import { Card } from "@/components/ui/card"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"

const BENEFIT_ICON: Record<string, typeof AiMagicIcon> = {
  attendance: CheckmarkCircle02Icon,
  grading: AiMagicIcon,
  report: ChartLineData01Icon,
}

function BenefitsSection() {
  const sectionId = LANDING_NAV[1].href.replace("#", "")

  return (
    <section id={sectionId} className="scroll-mt-20 bg-muted/40 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {LANDING_CONTENT.BENEFITS_TITLE}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {LANDING_CONTENT.BENEFITS_DESC}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {LANDING_CONTENT.BENEFITS.map((benefit) => (
            <Card key={benefit.iconName} className="gap-4 rounded-2xl p-7">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                <HugeiconsIcon
                  icon={BENEFIT_ICON[benefit.iconName]}
                  className="size-6"
                />
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {benefit.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export { BenefitsSection }

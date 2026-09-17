import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"

const HERO_HIGHLIGHTS = [
  { icon: Calendar01Icon, label: "Lịch học của con", value: "T2 · T4 · T6 · 18:00" },
  { icon: Task01Icon, label: "Bài tập đã chấm", value: "12 / 12 bài" },
  { icon: CheckmarkCircle02Icon, label: "Tỷ lệ đi học", value: "96%" },
] as const

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        <div className="space-y-7">
          <Badge variant="info" className="rounded-full px-3 py-1">
            {LANDING_CONTENT.HERO_EYEBROW}
          </Badge>

          <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-tight text-foreground sm:text-5xl">
            {LANDING_CONTENT.HERO_TITLE_LEAD}{" "}
            <span className="text-primary">
              {LANDING_CONTENT.HERO_TITLE_HIGHLIGHT}
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {LANDING_CONTENT.HERO_DESC}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="xl"
              className="w-full rounded-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 sm:w-auto"
              render={<Link href={ROUTES.AUTH.LOGIN} />}
              rightIcon={<HugeiconsIcon icon={ArrowRight01Icon} />}
            >
              {LANDING_CONTENT.HERO_PRIMARY_CTA}
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="w-full rounded-full sm:w-auto"
              render={<Link href={LANDING_NAV[1].href} />}
            >
              {LANDING_CONTENT.HERO_SECONDARY_CTA}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            {LANDING_CONTENT.HERO_NOTE}
          </p>

          <dl className="grid grid-cols-3 gap-4 border-t border-border pt-7">
            {LANDING_CONTENT.STATS.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <dt className="font-heading text-2xl font-bold text-foreground">
                  {stat.value}
                </dt>
                <dd className="text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Minh họa: dựng từ component thay vì ảnh, repo chưa có asset WebP hero. */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 size-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-12 -left-8 size-56 rounded-full bg-brand-accent/15 blur-3xl"
          />

          <Card className="relative gap-5 rounded-3xl p-7 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Học sinh</p>
                <p className="font-heading text-lg font-semibold text-foreground">
                  Nguyễn Minh Anh
                </p>
              </div>
              <Badge variant="success" className="rounded-full">
                Lớp 8A
              </Badge>
            </div>

            <div className="space-y-3">
              {HERO_HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HugeiconsIcon icon={item.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export { HeroSection }

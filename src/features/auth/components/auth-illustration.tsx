import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

export interface AuthIllustrationProps {
  icon: IconSvgElement
  badge: string
  title: string
  description: string
}

/**
 * Card minh họa nền trắng ở panel trái của các màn `(auth)`. Truyền vào
 * `AuthLayout` qua prop `illustration`.
 */
function AuthIllustration({
  icon,
  badge,
  title,
  description,
}: AuthIllustrationProps) {
  return (
    <div className="max-w-sm space-y-4 rounded-3xl bg-white/95 p-7 text-center shadow-lg">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <HugeiconsIcon icon={icon} className="size-7" />
      </span>

      <span className="block w-fit mx-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {badge}
      </span>

      <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export { AuthIllustration }

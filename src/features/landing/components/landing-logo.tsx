import { cn } from "cn"
import { LANDING_CONTENT } from "@/features/landing/content"

export interface LandingLogoProps {
  className?: string
  /** Bản trên nền tối (footer) đảo màu chữ cho đủ tương phản. */
  isInverted?: boolean
}

function LandingLogo({ className, isInverted = false }: LandingLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-2xl text-base font-black shadow-sm",
          isInverted
            ? "bg-white text-primary"
            : "bg-primary text-primary-foreground"
        )}
      >
        EG
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-heading text-lg font-bold tracking-tight",
            isInverted ? "text-white" : "text-foreground"
          )}
        >
          {LANDING_CONTENT.BRAND_NAME}
        </span>
        <span
          className={cn(
            "text-[0.625rem] font-medium tracking-wide uppercase",
            isInverted ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {LANDING_CONTENT.BRAND_TAGLINE}
        </span>
      </span>
    </span>
  )
}

export { LandingLogo }

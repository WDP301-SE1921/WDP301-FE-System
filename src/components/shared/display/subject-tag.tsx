import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { SUBJECT_MAP, FALLBACK_SUBJECT } from "@/constants/subjects"
import { cn } from "cn"

export interface SubjectTagProps {
  /** Subject code: "MATH" | "PHYS" | "CHEM" | "BIOL" */
  code: string
  className?: string
}

/**
 * Displays a subject label as a colored badge resolved from SUBJECT_MAP.
 * Falls back gracefully for unknown codes.
 */
function SubjectTag({ code, className }: SubjectTagProps) {
  const config = SUBJECT_MAP[code] ?? FALLBACK_SUBJECT

  return (
    <Badge variant={config.badgeVariant} className={cn(className)}>
      {config.name}
    </Badge>
  )
}

export { SubjectTag }

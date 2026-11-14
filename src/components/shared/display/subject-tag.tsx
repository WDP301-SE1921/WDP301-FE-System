import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { resolveSubject } from "@/constants/subjects"
import { cn } from "cn"

export interface SubjectTagProps {
  /** Mã môn (`MATH`, `PHYSICS`, …) hoặc tên môn BE trả (`Hóa học`). */
  code: string
  className?: string
}

/**
 * Nhãn môn có màu, lấy từ `resolveSubject`: môn mới vẫn hiện đúng tên và có màu riêng.
 */
function SubjectTag({ code, className }: SubjectTagProps) {
  const config = resolveSubject(code)

  return (
    <Badge
      variant={config.badgeVariant}
      className={cn(config.badgeClassName, className)}
    >
      {config.name}
    </Badge>
  )
}

export { SubjectTag }

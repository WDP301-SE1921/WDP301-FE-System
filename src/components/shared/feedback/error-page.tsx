"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ACTION_LABEL, ERROR_MSG } from "@/constants/messages"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ShieldKeyIcon,
  Search01Icon,
  Alert01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons"

export interface ErrorPageProps {
  statusCode?: 403 | 404 | 500 | number
  title?: string
  description?: string
  onRetry?: () => void
}

const ERROR_PRESETS: Record<
  number,
  { title: string; description: string; iconName: IconSvgElement }
> = {
  403: {
    title: "403 — Truy cập bị từ chối",
    description: ERROR_MSG.FORBIDDEN,
    iconName: ShieldKeyIcon,
  },
  404: {
    title: "404 — Không tìm thấy trang",
    description: "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.",
    iconName: Search01Icon,
  },
  500: {
    title: "500 — Lỗi hệ thống máy chủ",
    description: ERROR_MSG.SERVER_ERROR,
    iconName: Alert01Icon,
  },
}

function ErrorPage({
  statusCode = 404,
  title,
  description,
  onRetry,
}: ErrorPageProps) {
  const preset = ERROR_PRESETS[statusCode] || ERROR_PRESETS[500]

  const displayTitle = title || preset.title
  const displayDesc = description || preset.description
  const IconComponent = preset.iconName

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-6 shadow-sm">
        <HugeiconsIcon icon={IconComponent} className="size-10" />
      </div>

      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {displayTitle}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {displayDesc}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="rounded-full">
            {ACTION_LABEL.RETRY}
          </Button>
        )}
        <Button render={<Link href="/" />} className="rounded-full gap-2">
          <HugeiconsIcon icon={Home01Icon} className="size-4" />
          <span>Về trang chủ</span>
        </Button>
      </div>
    </div>
  )
}

export { ErrorPage }

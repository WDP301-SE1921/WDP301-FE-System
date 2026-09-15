"use client"

import { useEffect } from "react"
import { ErrorPage } from "@/components/shared/feedback/error-page"

export default function ManagerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Manager portal error caught:", error)
  }, [error])

  return (
    <ErrorPage
      statusCode={500}
      title="Lỗi phân hệ Quản lý"
      description={error.message || "Không thể tải dữ liệu trang quản lý."}
      onRetry={reset}
    />
  )
}

"use client"

import { useEffect } from "react"
import { ErrorPage } from "@/components/shared/feedback/error-page"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root error boundary caught error:", error)
  }, [error])

  return (
    <ErrorPage
      statusCode={500}
      title="500 — Đã có lỗi xảy ra"
      description={error.message || "Hệ thống gặp sự cố ngoài ý muốn."}
      onRetry={reset}
    />
  )
}

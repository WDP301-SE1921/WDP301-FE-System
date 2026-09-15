import * as React from "react"
import { ErrorState } from "./error-state"
import { EmptyState, type EmptyStateProps } from "./empty-state"
import { SkeletonTable } from "./skeleton-presets"

export interface AsyncBoundaryProps {
  isLoading: boolean
  isError?: boolean
  error?: Error | null
  data?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  skeleton?: React.ReactNode
  emptyProps?: EmptyStateProps
  children: React.ReactNode
}

function AsyncBoundary({
  isLoading,
  isError = false,
  error,
  data,
  isEmpty,
  onRetry,
  skeleton = <SkeletonTable />,
  emptyProps,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message}
        onRetry={onRetry}
      />
    )
  }

  const checkEmpty =
    isEmpty !== undefined
      ? isEmpty
      : data === null ||
        data === undefined ||
        (Array.isArray(data) && data.length === 0)

  if (checkEmpty) {
    return <EmptyState {...emptyProps} />
  }

  return <>{children}</>
}

export { AsyncBoundary }

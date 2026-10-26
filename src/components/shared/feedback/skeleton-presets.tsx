import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="w-full min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4"
    >
      <span className="sr-only">Đang tải dữ liệu...</span>
      <div aria-hidden="true" className="flex min-w-0 items-center justify-between gap-4 border-b border-border pb-3">
        <Skeleton className="h-6 w-36 max-w-full" />
        <Skeleton className="h-9 w-24 shrink-0 rounded-xl" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} aria-hidden="true" className="flex min-w-0 items-center gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 min-w-0 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <span className="sr-only">Đang tải dữ liệu...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="size-8 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 max-w-full" />
          <Skeleton className="h-3 w-20 max-w-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetailHeader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
    >
      <span className="sr-only">Đang tải dữ liệu...</span>
      <div aria-hidden="true" className="flex min-w-0 items-center gap-3 sm:gap-4 lg:flex-1">
        <Skeleton className="size-12 shrink-0 rounded-full sm:size-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="h-4 w-32 max-w-full" />
        </div>
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-24 max-w-full rounded-xl" />
        <Skeleton className="h-10 w-24 max-w-full rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Đang tải dữ liệu...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true" className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCalendar() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="w-full min-w-0 max-w-80 space-y-3 rounded-2xl border border-border bg-card p-4"
    >
      <span className="sr-only">Đang tải dữ liệu...</span>
      <div aria-hidden="true" className="flex min-w-0 items-center justify-between gap-3 pb-2">
        <Skeleton className="h-5 w-28 max-w-full" />
        <div className="flex shrink-0 gap-1">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

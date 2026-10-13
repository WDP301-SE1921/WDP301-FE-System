"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

export interface BreadcrumbPathItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbPathItem[]
  actions?: React.ReactNode
  backHref?: string
  onBack?: () => void
  className?: string
}

function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  backHref,
  onBack,
  className,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  const showBackButton = Boolean(onBack || backHref)

  return (
    <div data-slot="page-header" className={className}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <React.Fragment key={item.label + index}>
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleBack}
              className="mt-0.5 rounded-full shrink-0"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              <span className="sr-only">Quay lại</span>
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export { PageHeader }

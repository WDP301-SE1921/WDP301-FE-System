import * as React from "react"
import { Stepper, type StepperStep } from "./stepper"
import { cn } from "cn"

export interface WizardLayoutProps {
  steps: StepperStep[]
  currentStep: number
  onStepClick?: (index: number) => void
  /** Title for the current step */
  stepTitle?: string
  /** Optional description for the current step */
  stepDescription?: string
  children: React.ReactNode
  /** Optional summary panel / sidebar (rendered on the right in 2/3 + 1/3 layout) */
  summaryPanel?: React.ReactNode
  /** Slot for the footer (typically StickyFormFooter) */
  footer?: React.ReactNode
  className?: string
}

/**
 * Full-page multi-step wizard layout.
 * Composes Stepper + step header + content area (+ optional sticky summary panel) + optional footer.
 * Designed to sit inside PageContainer.
 */
function WizardLayout({
  steps,
  currentStep,
  onStepClick,
  stepTitle,
  stepDescription,
  children,
  summaryPanel,
  footer,
  className,
}: WizardLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Stepper */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={onStepClick}
        />
      </div>

      {/* Step header */}
      {(stepTitle || stepDescription) && (
        <div>
          {stepTitle && (
            <h2 className="text-lg font-semibold text-foreground">{stepTitle}</h2>
          )}
          {stepDescription && (
            <p className="mt-0.5 text-sm text-muted-foreground">{stepDescription}</p>
          )}
        </div>
      )}

      {/* Content layout: full width OR 2/3 content + 1/3 summary panel */}
      {summaryPanel ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">{children}</div>
          <div className="lg:col-span-1 sticky top-20 rounded-2xl border border-border bg-card p-5 shadow-xs">
            {summaryPanel}
          </div>
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}

      {/* Footer */}
      {footer}
    </div>
  )
}

export { WizardLayout }

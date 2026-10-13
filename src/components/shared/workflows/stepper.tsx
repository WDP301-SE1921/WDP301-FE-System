import * as React from "react"
import { cn } from "cn"

export interface StepperStep {
  id?: string
  label?: string
  title?: string
  description?: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  /** 0-indexed */
  onStepClick?: (index: number) => void
  /** Allow clicking past steps to navigate back */
  allowNavBack?: boolean
  className?: string
}

/**
 * Horizontal step indicator for multi-step wizards.
 * Shows completed, current, and pending steps.
 * Clicking completed steps triggers `onStepClick` if `allowNavBack` is true.
 */
function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowNavBack = true,
  className,
}: StepperProps) {
  return (
    <nav aria-label="Các bước" className={cn("w-full", className)}>
      <ol className="flex items-start gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep
          const isClickable = allowNavBack && isCompleted && onStepClick
          const stepKey = step.id || `step-${index}`

          return (
            <li
              key={stepKey}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5",
                "relative",
                // Connector line between steps
                index < steps.length - 1 &&
                  "after:absolute after:top-4 after:left-1/2 after:right-[-50%] after:h-px after:translate-y-[-50%] after:transition-colors",
                index < steps.length - 1 && isCompleted
                  ? "after:bg-primary"
                  : "after:bg-border"
              )}
            >
              {/* Circle indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground cursor-pointer",
                  isCurrent &&
                    "border-primary bg-background text-primary ring-4 ring-primary/20 cursor-default",
                  isPending &&
                    "border-border bg-background text-muted-foreground cursor-default"
                )}
              >
                {isCompleted ? (
                  <svg viewBox="0 0 12 12" fill="none" className="size-4">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>

              {/* Labels */}
              <div className="flex flex-col items-center text-center px-1">
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label || step.title}
                </span>
                {step.description && (
                  <span className="hidden text-[10px] text-muted-foreground sm:block mt-0.5 leading-tight">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Stepper }

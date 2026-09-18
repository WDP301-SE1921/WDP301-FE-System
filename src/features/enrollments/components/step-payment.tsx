"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Alert01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DescriptionList } from "@/components/shared/display/description-list"
import { MoneyText } from "@/components/shared/display/money-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { formatDate, formatMoney } from "@/lib/format"
import type { EnrollmentInput } from "@/lib/validators/enrollment"
import type { TuitionBreakdown } from "@/features/enrollments/selectors"

/** Chip chọn nhanh số tháng, giá trị nằm trong khoảng cho phép của BUSINESS_RULES. */
const QUICK_MONTHS = [1, 3, 6, 12]

export interface StepPaymentProps {
  form: UseFormReturn<EnrollmentInput>
  tuition: TuitionBreakdown
}

function StepPayment({ form, tuition }: StepPaymentProps) {
  const {
    control,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4">
      <SectionCard title={ENROLLMENT_MSG.MONTHS_TITLE}>
        <Controller
          control={control}
          name="months"
          render={({ field }) => {
            const clamp = (next: number) =>
              Math.min(
                BUSINESS_RULES.ENROLLMENT_MONTHS_MAX,
                Math.max(BUSINESS_RULES.ENROLLMENT_MONTHS_MIN, next)
              )

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Giảm số tháng"
                    disabled={field.value <= BUSINESS_RULES.ENROLLMENT_MONTHS_MIN}
                    onClick={() => field.onChange(clamp(field.value - 1))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-4 rotate-45" />
                  </Button>

                  <span className="min-w-16 text-center font-heading text-2xl font-bold text-foreground tabular-nums">
                    {field.value}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Tăng số tháng"
                    disabled={field.value >= BUSINESS_RULES.ENROLLMENT_MONTHS_MAX}
                    onClick={() => field.onChange(clamp(field.value + 1))}
                  >
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {ENROLLMENT_MSG.MONTHS_HINT}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {QUICK_MONTHS.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => field.onChange(months)}
                      aria-pressed={field.value === months}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors outline-none",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        field.value === months
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      {ENROLLMENT_MSG.MONTHS_UNIT(months)}
                    </button>
                  ))}
                </div>

                {errors.months && (
                  <p className="text-xs text-destructive">{errors.months.message}</p>
                )}
              </div>
            )
          }}
        />
      </SectionCard>

      <SectionCard title={ENROLLMENT_MSG.TUITION_TITLE}>
        <div className="space-y-4">
          <DescriptionList
            cols={2}
            dividers
            items={[
              {
                label: ENROLLMENT_MSG.TUITION_PER_MONTH,
                value: <MoneyText amount={tuition.monthlyFee} />,
              },
              {
                label: ENROLLMENT_MSG.TUITION_MONTHS,
                value: ENROLLMENT_MSG.MONTHS_UNIT(tuition.months),
              },
              {
                label: ENROLLMENT_MSG.TUITION_PERIOD,
                value: `${formatDate(tuition.startDate)} – ${formatDate(tuition.endDate)}`,
                fullWidth: true,
              },
            ]}
          />

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <span className="text-sm font-medium text-foreground">
              {ENROLLMENT_MSG.TUITION_TOTAL}
            </span>
            <MoneyText
              amount={tuition.total}
              className="font-heading text-2xl font-bold text-primary"
            />
          </div>
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/40">
        <div className="space-y-3">
          <p className="font-heading text-base font-semibold text-amber-900 dark:text-amber-200">
            {ENROLLMENT_MSG.PAYMENT_CONFIRM_TITLE}
          </p>

          <Controller
            control={control}
            name="hasReceivedPayment"
            render={({ field }) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="enrollment-payment-confirm"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                />
                <Label
                  htmlFor="enrollment-payment-confirm"
                  className="cursor-pointer text-sm font-normal text-amber-900 dark:text-amber-200"
                >
                  {ENROLLMENT_MSG.PAYMENT_CONFIRM_CHECKBOX(formatMoney(tuition.total))}
                </Label>
              </div>
            )}
          />

          <p className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
            <HugeiconsIcon icon={Alert01Icon} className="mt-0.5 size-3.5 shrink-0" />
            {ENROLLMENT_MSG.PAYMENT_CONFIRM_NOTE}
          </p>

          {errors.hasReceivedPayment && (
            <p className="text-xs text-destructive">
              {errors.hasReceivedPayment.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { StepPayment }

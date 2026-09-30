"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Invoice01Icon,
  Mail01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { CodeDisplay } from "@/components/shared/display/code-display"
import { MoneyText } from "@/components/shared/display/money-text"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { ROUTES } from "@/constants/routes"
import { Receipt } from "@/components/shared/display/receipt"
import { buildReceiptProps, findPaymentRow } from "@/features/payments/selectors"
import { useResendEnrollmentEmail } from "@/features/enrollments/hooks/use-create-enrollment"
import type { EnrollmentResult } from "@/mocks/data/enrollments"
import type { EmailStatus } from "@/types/student"

export interface StepDoneProps {
  result: EnrollmentResult
  onStartNew: () => void
}

function StepDone({ result, onStartNew }: StepDoneProps) {
  const resendEmail = useResendEnrollmentEmail()
  const [emailStatus, setEmailStatus] = React.useState<EmailStatus>(result.emailStatus)
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false)

  // Dùng chung selector với màn Lịch sử thanh toán để ra đúng một tờ biên lai.
  const receiptRow = React.useMemo(
    () => findPaymentRow(result.paymentId),
    [result.paymentId]
  )

  const handleResend = () => {
    resendEmail.mutate(result.enrollmentId, {
      onSuccess: (status) => {
        setEmailStatus(status)
        toast.success(ENROLLMENT_MSG.EMAIL_RESEND)
      },
    })
  }

  return (
    <div className="space-y-5">
      {emailStatus === "failed" && (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert01Icon} />
          <AlertTitle>{ENROLLMENT_MSG.EMAIL_FAILED_ALERT_TITLE}</AlertTitle>
          <AlertDescription>{ENROLLMENT_MSG.EMAIL_FAILED_ALERT_DESC}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-8 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8" />
        </span>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {ENROLLMENT_MSG.DONE_TITLE}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ENROLLMENT_MSG.DONE_DESC(result.studentName)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Invoice01Icon} className="size-5" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            {ENROLLMENT_MSG.RECEIPT_TITLE}
          </p>
          <CodeDisplay value={result.receiptCode} boxed />
          <MoneyText
            amount={result.amount}
            className="text-lg font-bold text-foreground"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              onClick={() => setIsReceiptOpen(true)}
            >
              {ENROLLMENT_MSG.RECEIPT_VIEW}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={PrinterIcon} />}
              onClick={() => window.print()}
            >
              {ENROLLMENT_MSG.RECEIPT_PRINT}
            </Button>
          </div>
        </Card>

        <Card className="gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <HugeiconsIcon icon={Mail01Icon} className="size-5" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            {ENROLLMENT_MSG.EMAIL_TITLE}
          </p>
          <StatusBadge category="email" status={emailStatus} />
          <p className="truncate text-sm text-muted-foreground">
            {ENROLLMENT_MSG.EMAIL_SENT_TO(result.parentEmail)}
          </p>
          <Button
            variant={emailStatus === "failed" ? "default" : "outline"}
            size="sm"
            className="w-full rounded-full"
            isLoading={resendEmail.isPending}
            onClick={handleResend}
          >
            {ENROLLMENT_MSG.EMAIL_RESEND}
          </Button>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="rounded-full"
          render={
            <Link href={ROUTES.MANAGER.STUDENT_DETAIL(result.studentProfileId)} />
          }
        >
          {ENROLLMENT_MSG.DONE_VIEW_STUDENT}
        </Button>
        <Button className="rounded-full" onClick={onStartNew}>
          {ENROLLMENT_MSG.DONE_NEW_ENROLLMENT}
        </Button>
      </div>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ENROLLMENT_MSG.RECEIPT_TITLE}</DialogTitle>
          </DialogHeader>
          {receiptRow && <Receipt {...buildReceiptProps(receiptRow)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { StepDone }

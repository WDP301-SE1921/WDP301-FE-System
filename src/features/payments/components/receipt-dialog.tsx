"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon, PrinterIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { Receipt } from "@/components/shared/display/receipt"
import { ACTION_LABEL } from "@/constants/messages/common"
import { PAYMENT_MSG } from "@/constants/messages/events/payment"
import { buildReceiptProps, type PaymentRow } from "@/features/payments/selectors"

export interface ReceiptDialogProps {
  row: PaymentRow | null
  onClose: () => void
}

/** PROMPT 7B — biên lai mở dạng modal trên trang Lịch sử thanh toán. */
function ReceiptDialog({ row, onClose }: ReceiptDialogProps) {
  if (!row) return null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{PAYMENT_MSG.RECEIPT_MODAL_TITLE}</DialogTitle>
        </DialogHeader>

        <Receipt {...buildReceiptProps(row)} />

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            {ACTION_LABEL.CLOSE}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={Download01Icon} />}
            onClick={() => toast.success(PAYMENT_MSG.RECEIPT_DOWNLOAD_SUCCESS)}
          >
            {PAYMENT_MSG.RECEIPT_DOWNLOAD}
          </Button>
          <Button
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={PrinterIcon} />}
            onClick={() => window.print()}
          >
            {PAYMENT_MSG.RECEIPT_PRINT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ReceiptDialog }

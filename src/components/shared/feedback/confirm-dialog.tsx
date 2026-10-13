"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ACTION_LABEL, CONFIRM_MSG } from "@/constants/messages"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger"
  isLoading?: boolean
  requireTypedText?: string
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = CONFIRM_MSG.DELETE_TITLE,
  description = CONFIRM_MSG.DELETE_DESC,
  confirmText = ACTION_LABEL.CONFIRM,
  cancelText = ACTION_LABEL.CANCEL,
  variant = "default",
  isLoading = false,
  requireTypedText,
}: ConfirmDialogProps) {
  const [typedInput, setTypedInput] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTypedInput("")
      setIsSubmitting(false)
    }
    onOpenChange(newOpen)
  }

  const isConfirmedDisabled =
    isLoading ||
    isSubmitting ||
    (Boolean(requireTypedText) && typedInput.trim() !== requireTypedText)

  const handleConfirm = async () => {
    if (isConfirmedDisabled) return
    try {
      setIsSubmitting(true)
      await onConfirm()
      handleOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDanger = variant === "danger"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm" showCloseButton={!isLoading && !isSubmitting}>
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="flex size-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
                <HugeiconsIcon icon={Alert01Icon} className="size-5" />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {requireTypedText && (
          <div className="space-y-2 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Vui lòng gõ lại <strong className="text-foreground">{requireTypedText}</strong> để xác nhận:
            </p>
            <Input
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={requireTypedText}
              disabled={isLoading || isSubmitting}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isSubmitting}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "danger" : "default"}
            onClick={handleConfirm}
            isLoading={isLoading || isSubmitting}
            disabled={isConfirmedDisabled}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }

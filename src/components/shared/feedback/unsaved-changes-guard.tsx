"use client"

import * as React from "react"
import { CONFIRM_MSG } from "@/constants/messages"
import { ConfirmDialog } from "./confirm-dialog"

export interface UnsavedChangesGuardProps {
  isDirty: boolean
  onConfirmLeave?: () => void
  children?: React.ReactNode
}

export function useUnsavedChanges(isDirty: boolean) {
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = CONFIRM_MSG.UNSAVED_DESC
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])
}

function UnsavedChangesGuard({
  isDirty,
  onConfirmLeave,
  children,
}: UnsavedChangesGuardProps) {
  const [showConfirm, setShowConfirm] = React.useState(false)

  useUnsavedChanges(isDirty)

  return (
    <>
      {children}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={() => {
          onConfirmLeave?.()
        }}
        title={CONFIRM_MSG.UNSAVED_TITLE}
        description={CONFIRM_MSG.UNSAVED_DESC}
        variant="danger"
        confirmText="Rời khỏi trang"
      />
    </>
  )
}

export { UnsavedChangesGuard }

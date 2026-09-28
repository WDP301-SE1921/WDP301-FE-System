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
import { toast } from "@/components/ui/toast"
import { SessionOptionList, type SessionOption } from "@/components/shared/pickers/session-option-list"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ERROR_MSG } from "@/constants/messages/error"
import { useChangeMakeupSession, useMakeupCandidates } from "@/features/absences/hooks/use-absences"
import { MockError } from "@/mocks/utils/mock-query"
import type { MakeupPendingRow } from "@/features/absences/selectors"

export interface ChangeMakeupSessionDialogProps {
  row: MakeupPendingRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChangeMakeupSessionDialog({ row, open, onOpenChange }: ChangeMakeupSessionDialogProps) {
  const { data: candidates = [], isPending } = useMakeupCandidates(row.assignment.originalSessionId)
  const changeSession = useChangeMakeupSession()
  const [selectedId, setSelectedId] = React.useState(row.assignment.makeupSessionId)

  const options: SessionOption[] = candidates.map((candidate) => ({
    id: candidate.session.id,
    sessionNo: candidate.order,
    date: candidate.session.date,
    time: `${candidate.session.startTime}–${candidate.session.endTime}`,
    room: candidate.classRecord.room,
    topic: `${candidate.classRecord.name} · ${candidate.lessonTitle}`,
    available: true,
  }))

  const handleConfirm = () => {
    if (!selectedId || selectedId === row.assignment.makeupSessionId) return

    changeSession.mutate(
      { assignmentId: row.assignment.id, newSessionId: selectedId },
      {
        onSuccess: () => {
          toast.success(ABSENCE_MSG.CHANGE_SESSION_SUCCESS)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ABSENCE_MSG.CHANGE_SESSION_TITLE}</DialogTitle>
          <DialogDescription>{ABSENCE_MSG.CHANGE_SESSION_DESC}</DialogDescription>
        </DialogHeader>

        {isPending ? (
          <SkeletonTable rows={2} cols={1} />
        ) : options.length === 0 ? (
          <EmptyState description={ABSENCE_MSG.CHANGE_SESSION_EMPTY} />
        ) : (
          <SessionOptionList sessions={options} value={selectedId} onChange={setSelectedId} />
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            className="rounded-full"
            disabled={!selectedId || selectedId === row.assignment.makeupSessionId}
            isLoading={changeSession.isPending}
            onClick={handleConfirm}
          >
            {ACTION_LABEL.CONFIRM}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ChangeMakeupSessionDialog }

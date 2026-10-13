"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { UserCell } from "@/components/shared/display/user-cell"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ERROR_MSG } from "@/constants/messages/error"
import { useCancelMakeup, usePendingMakeupRows } from "@/features/absences/hooks/use-absences"
import { MockError } from "@/mocks/utils/mock-query"
import type { MakeupPendingRow } from "@/features/absences/selectors"
import type { MakeupKind } from "@/types/absence"
import { ChangeMakeupSessionDialog } from "./change-makeup-session-dialog"

export interface PendingMakeupTableProps {
  kind: MakeupKind
}

function SessionCell({
  className,
  lessonTitle,
  date,
}: {
  className?: string
  lessonTitle?: string
  date?: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{className ?? "—"}</p>
      <p className="text-xs text-muted-foreground">
        {date && <DateText value={date} />}
        {lessonTitle && <span className="ml-1">· {lessonTitle}</span>}
      </p>
    </div>
  )
}

function PendingMakeupTable({ kind }: PendingMakeupTableProps) {
  const { data: rows = [], isPending, isError, refetch } = usePendingMakeupRows(kind)
  const cancelMakeup = useCancelMakeup()
  const [changingRow, setChangingRow] = React.useState<MakeupPendingRow | null>(null)
  const [cancelingId, setCancelingId] = React.useState<string | null>(null)

  const title =
    kind === "swap" ? ABSENCE_MSG.PENDING_TABLE_TITLE_SWAP : ABSENCE_MSG.PENDING_TABLE_TITLE

  return (
    <SectionCard title={title}>
      {isPending ? (
        <SkeletonTable rows={3} cols={5} />
      ) : isError ? (
        <EmptyState
          variant="no-result"
          description={ERROR_MSG.DEFAULT}
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Calendar01Icon} />}
          description={ABSENCE_MSG.PENDING_EMPTY}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{ABSENCE_MSG.COL_PENDING_STUDENT}</TableHead>
              <TableHead>{ABSENCE_MSG.COL_PENDING_ORIGINAL}</TableHead>
              <TableHead>{ABSENCE_MSG.COL_PENDING_MAKEUP}</TableHead>
              <TableHead>{ABSENCE_MSG.COL_PENDING_ASSIGNER}</TableHead>
              <TableHead>{ABSENCE_MSG.COL_PENDING_STATUS}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.assignment.id}>
                <TableCell>
                  <UserCell name={row.student?.name ?? "—"} sub={row.student?.code} />
                </TableCell>
                <TableCell>
                  <SessionCell
                    className={row.originalClass?.name}
                    date={row.originalSession?.date}
                  />
                </TableCell>
                <TableCell>
                  <SessionCell
                    className={row.makeupClass?.name}
                    date={row.makeupSession?.date}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.assignedByName}
                </TableCell>
                <TableCell>
                  <StatusBadge category="makeup" status={row.assignment.status} />
                </TableCell>
                <TableCell>
                  {row.assignment.status === "pending" && (
                    <RowActions
                      items={[
                        {
                          id: "change",
                          label: ABSENCE_MSG.ROW_ACTION_CHANGE_SESSION,
                          onClick: () => setChangingRow(row),
                        },
                        {
                          id: "cancel",
                          label: ABSENCE_MSG.ROW_ACTION_CANCEL,
                          danger: true,
                          onClick: () => setCancelingId(row.assignment.id),
                        },
                      ]}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {changingRow && (
        <ChangeMakeupSessionDialog
          row={changingRow}
          open={Boolean(changingRow)}
          onOpenChange={(open) => {
            if (!open) setChangingRow(null)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelingId)}
        onOpenChange={(open) => {
          if (!open) setCancelingId(null)
        }}
        title={ABSENCE_MSG.CANCEL_CONFIRM_TITLE}
        description={ABSENCE_MSG.CANCEL_CONFIRM_DESC}
        variant="danger"
        isLoading={cancelMakeup.isPending}
        onConfirm={() => {
          if (!cancelingId) return
          cancelMakeup.mutate(cancelingId, {
            onSuccess: () => {
              toast.success(ABSENCE_MSG.CANCEL_SUCCESS)
              setCancelingId(null)
            },
            onError: (error) => {
              toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
            },
          })
        }}
      />
    </SectionCard>
  )
}

export { PendingMakeupTable }

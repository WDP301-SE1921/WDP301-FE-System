"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ChangeDiff } from "@/components/shared/display/change-diff"
import { DescriptionList } from "@/components/shared/display/description-list"
import { UserCell } from "@/components/shared/display/user-cell"
import { AUDIT_ACTION_MAP } from "@/constants/audit"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { formatDate, formatDateTime } from "@/lib/format"
import { findManagerAccount } from "@/mocks/data/system"
import type { SystemAuditLogEntry } from "@/types/system"

export interface AuditLogTableProps {
  rows: SystemAuditLogEntry[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  onRetry?: () => void
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

/**
 * Bảng Lịch sử thay đổi (PROMPT 14B) — có dòng mở rộng inline nên dựng thủ công từ
 * `ui/table.tsx` thay vì `DataTable` (một tầng dưới, vẫn dùng chung primitive).
 */
function AuditLogTable({
  rows,
  isLoading,
  isError,
  error,
  onRetry,
  expandedId,
  onToggleExpand,
}: AuditLogTableProps) {
  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={rows}
      onRetry={onRetry}
      emptyProps={{
        variant: "no-result",
        title: EMPTY_MSG.NO_RESULT_TITLE,
        description: EMPTY_MSG.NO_RESULT_DESC,
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{SYSTEM_MSG.AUDIT_COL_TIME}</TableHead>
            <TableHead>{SYSTEM_MSG.AUDIT_COL_ACTOR}</TableHead>
            <TableHead>{SYSTEM_MSG.AUDIT_COL_ACTION}</TableHead>
            <TableHead>{SYSTEM_MSG.AUDIT_COL_TARGET}</TableHead>
            <TableHead>{SYSTEM_MSG.AUDIT_COL_CHANGE}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isExpanded = expandedId === row.id
            const actorName = findManagerAccount(row.actorId)?.name ?? "—"
            const action = AUDIT_ACTION_MAP[row.actionType]

            return (
              <React.Fragment key={row.id}>
                <TableRow>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>
                    <UserCell name={actorName} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={action.variant} className="rounded-full">
                      {action.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {row.targetHref ? (
                      <Link
                        href={row.targetHref}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.targetLabel}
                      </Link>
                    ) : (
                      <span className="text-foreground">{row.targetLabel}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {row.changeBefore && row.changeAfter ? (
                      <ChangeDiff before={row.changeBefore} after={row.changeAfter} />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full text-muted-foreground"
                      onClick={() => onToggleExpand(row.id)}
                    >
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                        className="size-4"
                      />
                      <span className="sr-only">{SYSTEM_MSG.AUDIT_EXPAND}</span>
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6} className="whitespace-normal bg-muted/30">
                      <DescriptionList
                        cols={3}
                        items={[
                          { label: SYSTEM_MSG.AUDIT_DETAIL_REASON, value: row.reason },
                          {
                            label: SYSTEM_MSG.AUDIT_DETAIL_EFFECTIVE_DATE,
                            value: row.effectiveDate
                              ? formatDate(row.effectiveDate)
                              : undefined,
                          },
                          { label: SYSTEM_MSG.AUDIT_DETAIL_IP, value: row.ip },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </AsyncBoundary>
  )
}

export { AuditLogTable }

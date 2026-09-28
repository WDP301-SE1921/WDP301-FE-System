"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions, type RowActionItem } from "@/components/shared/data-table/row-actions"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { UserCell } from "@/components/shared/display/user-cell"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { ERROR_MSG } from "@/constants/messages/error"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { ROUTES } from "@/constants/routes"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { InviteManagerDialog } from "@/features/system/components/invite-manager-dialog"
import {
  useDeactivateManager,
  useManagers,
  useResendManagerInvite,
} from "@/features/system/hooks/use-managers"
import { formatDate } from "@/lib/format"
import { CURRENT_MANAGER_ID } from "@/mocks/data/system"
import { MockError } from "@/mocks/utils/mock-query"
import type { ManagerAccount } from "@/types/system"

function ManagersView() {
  const managers = useManagers()
  const resendInvite = useResendManagerInvite()
  const deactivateManager = useDeactivateManager()

  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [deactivateTarget, setDeactivateTarget] = React.useState<ManagerAccount | null>(
    null
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => managers.data?.rows ?? [], [managers.data])
  const totals = managers.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows

    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword)
    )
  }, [rows, search])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const handleResendInvite = React.useCallback(
    (row: ManagerAccount) => {
      resendInvite.mutate(row.id, {
        onSuccess: () => toast.success(SYSTEM_MSG.RESEND_INVITE_SUCCESS(row.email)),
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      })
    },
    [resendInvite]
  )

  const handleDeactivate = () => {
    if (!deactivateTarget) return

    deactivateManager.mutate(deactivateTarget.id, {
      onSuccess: () => {
        toast.success(SYSTEM_MSG.DEACTIVATE_SUCCESS(deactivateTarget.name))
        setDeactivateTarget(null)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  const columns = React.useMemo<LegacyColumnDef<ManagerAccount>[]>(
    () =>
      buildColumns({
        onResendInvite: handleResendInvite,
        onRequestDeactivate: setDeactivateTarget,
      }),
    [handleResendInvite]
  )

  return (
    <PageContainer>
      <PageHeader
        title={SYSTEM_MSG.MANAGERS_TITLE}
        description={SYSTEM_MSG.MANAGERS_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Hệ thống" },
          { label: SYSTEM_MSG.MANAGERS_TITLE },
        ]}
        actions={
          <>
            {totals && (
              <Badge variant="secondary" className="rounded-full">
                {SYSTEM_MSG.MANAGERS_BADGE(totals.active, totals.pending)}
              </Badge>
            )}
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
              onClick={() => setIsInviteOpen(true)}
            >
              {SYSTEM_MSG.ACTION_INVITE}
            </Button>
          </>
        }
      />

      <Card className="gap-4">
        <FilterBar searchPlaceholder={SYSTEM_MSG.SEARCH_PLACEHOLDER}>
          <span className="ml-auto text-xs text-muted-foreground">
            Hiển thị {pagedRows.length} trên {filteredRows.length} quản lý
          </span>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={managers.isPending}
          isError={managers.isError}
          error={managers.error}
          onRetry={() => managers.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <InviteManagerDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null)
        }}
        onConfirm={handleDeactivate}
        variant="default"
        title={SYSTEM_MSG.DEACTIVATE_CONFIRM_TITLE}
        description={
          deactivateTarget
            ? SYSTEM_MSG.DEACTIVATE_CONFIRM_DESC(deactivateTarget.name)
            : undefined
        }
        confirmText={SYSTEM_MSG.ACTION_DEACTIVATE}
        isLoading={deactivateManager.isPending}
      />
    </PageContainer>
  )
}

function buildColumns({
  onResendInvite,
  onRequestDeactivate,
}: {
  onResendInvite: (row: ManagerAccount) => void
  onRequestDeactivate: (row: ManagerAccount) => void
}): LegacyColumnDef<ManagerAccount>[] {
  return [
    {
      id: "manager",
      header: SYSTEM_MSG.COL_MANAGER,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserCell name={row.original.name} sub={row.original.phone} />
          {row.original.id === CURRENT_MANAGER_ID && (
            <Badge variant="secondary" className="shrink-0 rounded-full">
              {SYSTEM_MSG.YOU_BADGE}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "email",
      header: SYSTEM_MSG.COL_EMAIL,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.email}</span>
      ),
    },
    {
      id: "status",
      header: SYSTEM_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="manager" status={row.original.status} />
      ),
    },
    {
      id: "joinedAt",
      header: SYSTEM_MSG.COL_JOINED,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDate(row.original.joinedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (row.original.id === CURRENT_MANAGER_ID) return null

        const items: (RowActionItem | "separator")[] = []

        if (row.original.status === "pending") {
          items.push({
            id: "resend",
            label: SYSTEM_MSG.ACTION_RESEND_INVITE,
            onClick: () => onResendInvite(row.original),
          })
        }

        if (row.original.status === "active") {
          items.push({
            id: "deactivate",
            label: SYSTEM_MSG.ACTION_DEACTIVATE,
            danger: true,
            onClick: () => onRequestDeactivate(row.original),
          })
        }

        return <RowActions items={items} />
      },
    },
  ]
}

export { ManagersView }

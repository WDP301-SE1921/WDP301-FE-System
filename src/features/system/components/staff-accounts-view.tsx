"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ACCOUNT_MANAGE_TARGETS } from "@/constants/role-access"
import { BACK_OFFICE_ROLES, ROLE_LABEL, type WebRole } from "@/constants/roles"
import { ROUTES } from "@/constants/routes"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { InviteStaffDialog } from "@/features/system/components/invite-staff-dialog"
import {
  useDeactivateStaff,
  useResendStaffInvite,
  useStaffAccounts,
} from "@/features/system/hooks/use-staff-accounts"
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role"
import { formatDate } from "@/lib/format"
import { MockError } from "@/mocks/utils/mock-query"
import type { StaffAccount } from "@/types/system"

const ALL_VALUE = "all"

const ROLE_ITEMS: Record<string, string> = {
  [ALL_VALUE]: SYSTEM_MSG.FILTER_ALL_ROLES,
  ...Object.fromEntries(BACK_OFFICE_ROLES.map((role) => [role, ROLE_LABEL[role]])),
}

function StaffAccountsView() {
  const staff = useStaffAccounts()
  const resendInvite = useResendStaffInvite()
  const deactivateStaff = useDeactivateStaff()
  const currentRole = useCurrentRole()
  const currentUser = useCurrentUser()

  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [deactivateTarget, setDeactivateTarget] = React.useState<StaffAccount | null>(null)

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [roleFilter, setRoleFilter] = useQueryState("role", parseAsString.withDefault(ALL_VALUE))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => staff.data?.rows ?? [], [staff.data])
  const totals = staff.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (roleFilter !== ALL_VALUE && row.role !== roleFilter) return false
      if (!keyword) return true

      return (
        row.name.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword)
      )
    })
  }, [rows, search, roleFilter])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Vai trò mà người đang đăng nhập được quản lý (mời / vô hiệu hóa). */
  const manageableRoles = React.useMemo(
    () => (currentRole ? (ACCOUNT_MANAGE_TARGETS[currentRole] ?? []) : []),
    [currentRole]
  )

  const handleResendInvite = React.useCallback(
    (row: StaffAccount) => {
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

    deactivateStaff.mutate(
      { id: deactivateTarget.id, actorId: currentUser?.id ?? "" },
      {
        onSuccess: () => {
          toast.success(SYSTEM_MSG.DEACTIVATE_SUCCESS(deactivateTarget.name))
          setDeactivateTarget(null)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  const columns = React.useMemo<LegacyColumnDef<StaffAccount>[]>(
    () =>
      buildColumns({
        currentUserId: currentUser?.id,
        manageableRoles,
        onResendInvite: handleResendInvite,
        onRequestDeactivate: setDeactivateTarget,
      }),
    [currentUser?.id, manageableRoles, handleResendInvite]
  )

  return (
    <PageContainer>
      <PageHeader
        title={SYSTEM_MSG.STAFF_TITLE}
        description={SYSTEM_MSG.STAFF_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Hệ thống" },
          { label: SYSTEM_MSG.STAFF_TITLE },
        ]}
        actions={
          <>
            {totals && (
              <Badge variant="secondary" className="rounded-full">
                {SYSTEM_MSG.STAFF_BADGE(totals.active, totals.pending)}
              </Badge>
            )}
            {manageableRoles.length > 0 && (
              <Button
                className="rounded-full"
                leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
                onClick={() => setIsInviteOpen(true)}
              >
                {SYSTEM_MSG.ACTION_INVITE}
              </Button>
            )}
          </>
        }
      />

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={SYSTEM_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setRoleFilter(null)
            setPage(null)
          }}
        >
          <Select
            items={ROLE_ITEMS}
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value === ALL_VALUE ? null : String(value))
              setPage(null)
            }}
          >
            <SelectTrigger className="w-52 rounded-xl">
              <SelectValue placeholder={SYSTEM_MSG.FILTER_ALL_ROLES} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">
            Hiển thị {pagedRows.length} trên {filteredRows.length} tài khoản
          </span>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={staff.isPending}
          isError={staff.isError}
          error={staff.error}
          onRetry={() => staff.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <InviteStaffDialog
        key={currentRole ?? "none"}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        inviterRole={currentRole}
      />

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
        isLoading={deactivateStaff.isPending}
      />
    </PageContainer>
  )
}

function buildColumns({
  currentUserId,
  manageableRoles,
  onResendInvite,
  onRequestDeactivate,
}: {
  currentUserId?: string
  manageableRoles: readonly WebRole[]
  onResendInvite: (row: StaffAccount) => void
  onRequestDeactivate: (row: StaffAccount) => void
}): LegacyColumnDef<StaffAccount>[] {
  return [
    {
      id: "staff",
      header: SYSTEM_MSG.COL_STAFF,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserCell name={row.original.name} sub={row.original.phone} />
          {row.original.id === currentUserId && (
            <Badge variant="secondary" className="shrink-0 rounded-full">
              {SYSTEM_MSG.YOU_BADGE}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "role",
      header: SYSTEM_MSG.COL_ROLE,
      cell: ({ row }) => (
        <Badge variant="info" className="rounded-full">
          {ROLE_LABEL[row.original.role]}
        </Badge>
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
        <StatusBadge category="staffAccount" status={row.original.status} />
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
        // Người dùng tự quản lý tài khoản mình ở trang Tài khoản; chỉ quản lý được vai trò cấp dưới.
        if (row.original.id === currentUserId) return null
        if (!manageableRoles.includes(row.original.role)) return null

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

        return items.length > 0 ? <RowActions items={items} /> : null
      },
    },
  ]
}

export { StaffAccountsView }

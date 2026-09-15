"use client"

import * as React from "react"
import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy"
import {
  flexRender,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { cn } from "cn"

// Re-export the typed ColumnDef alias consumers should use
export type { LegacyColumnDef as DataTableColumn }

export interface DataTableProps<TData extends RowData, TValue = unknown> {
  columns: LegacyColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  selectable?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  stickyHeader?: boolean
  onRowClick?: (row: TData) => void
  emptyTitle?: string
  emptyDescription?: string
}

function DataTable<TData extends RowData, TValue = unknown>({
  columns,
  data,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  selectable = false,
  rowSelection = {},
  onRowSelectionChange,
  sorting,
  onSortingChange,
  stickyHeader = false,
  onRowClick,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData, TValue>) {
  const tableColumns = React.useMemo<LegacyColumnDef<TData, TValue>[]>(() => {
    if (!selectable) return columns

    const selectColumn: LegacyColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectColumn, ...columns]
  }, [columns, selectable])

  const table = useLegacyTable<TData>({
    data,
    columns: tableColumns as LegacyColumnDef<TData>[],
    state: {
      rowSelection,
      sorting: sorting ?? [],
    },
    enableRowSelection: selectable,
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater
      onRowSelectionChange?.(next)
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting ?? []) : updater
      onSortingChange?.(next)
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={onRetry}
      skeleton={<SkeletonTable rows={5} cols={columns.length + (selectable ? 1 : 0)} />}
      emptyProps={{
        title: emptyTitle,
        description: emptyDescription,
      }}
    >
      <Table>
        <TableHeader
          className={stickyHeader ? "sticky top-0 z-10 bg-card shadow-xs" : undefined}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={() => onRowClick?.(row.original)}
              className={cn(onRowClick && "cursor-pointer hover:bg-muted/60")}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AsyncBoundary>
  )
}

export { DataTable }

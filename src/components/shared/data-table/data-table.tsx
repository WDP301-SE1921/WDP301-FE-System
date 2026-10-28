"use client";

import * as React from "react";
import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import {
  flexRender,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { cn } from "cn";

// Re-export the typed ColumnDef alias consumers should use
export type { LegacyColumnDef as DataTableColumn };

export interface DataTableProps<TData extends RowData, TValue = unknown> {
  columns: LegacyColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  /** `true` cho phép chọn mọi dòng; truyền hàm để chặn chọn một số dòng (vd dòng đang xử lý). */
  selectable?: boolean | ((row: TData) => boolean);
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  stickyHeader?: boolean;
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  mobileCardRenderer?: (row: TData, index: number) => React.ReactNode;
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
  mobileCardRenderer,
}: DataTableProps<TData, TValue>) {
  const tableColumns = React.useMemo<LegacyColumnDef<TData, TValue>[]>(() => {
    if (!selectable) return columns;

    const selectColumn: LegacyColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả dòng trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          disabled={!row.getCanSelect()}
          aria-label={`Chọn dòng ${row.index + 1}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useLegacyTable<TData>({
    data,
    columns: tableColumns as LegacyColumnDef<TData>[],
    state: {
      rowSelection,
      sorting: sorting ?? [],
    },
    enableRowSelection:
      typeof selectable === "function"
        ? (row) => (selectable as (data: TData) => boolean)(row.original)
        : selectable,
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange?.(next);
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next =
        typeof updater === "function" ? updater(sorting ?? []) : updater;
      onSortingChange?.(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={onRetry}
      skeleton={
        <SkeletonTable rows={5} cols={columns.length + (selectable ? 1 : 0)} />
      }
      emptyProps={{
        title: emptyTitle,
        description: emptyDescription,
      }}
    >
      {mobileCardRenderer && (
        <div className="space-y-3 md:hidden">
          {data.map((row, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-4">
              {mobileCardRenderer(row, index)}
            </div>
          ))}
        </div>
      )}
      <div className={cn("overflow-x-auto rounded-xl border border-border", mobileCardRenderer && "hidden md:block")}>
        <Table>
        <TableHeader
          className={
            stickyHeader ? "sticky top-0 z-10 bg-card shadow-xs" : undefined
          }
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
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
              onClick={(event) => {
                if (!onRowClick || event.defaultPrevented) return;
                const target = event.target;
                if (
                  target instanceof Element &&
                  target.closest(
                    'a, button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="combobox"], [role="menuitem"], [contenteditable="true"], [data-row-interactive]',
                  )
                )
                  return;
                onRowClick(row.original);
              }}
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
      </div>
    </AsyncBoundary>
  );
}

export { DataTable };

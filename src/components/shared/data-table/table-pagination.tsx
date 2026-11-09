"use client";

import * as React from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGINATION_DEFAULTS } from "@/constants/ui";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  totalItems: number;
  pageParamKey?: string;
  pageSizeParamKey?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  fixedPageSize?: number;
}

function TablePagination({
  totalItems,
  pageParamKey = "page",
  pageSizeParamKey = "pageSize",
  onPageChange,
  onPageSizeChange,
  className,
  fixedPageSize,
}: TablePaginationProps) {
  const [page, setPage] = useQueryState(
    pageParamKey,
    parseAsInteger.withDefault(1),
  );
  const [pageSize, setPageSize] = useQueryState(
    pageSizeParamKey,
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE),
  );

  const currentPage = Math.max(1, page);
  const currentPageSize =
    fixedPageSize ?? (pageSize || PAGINATION_DEFAULTS.PAGE_SIZE);
  const totalPages = Math.ceil(totalItems / currentPageSize) || 1;

  const hasCurrentPage = totalItems > 0 && currentPage <= totalPages;
  const startItem = hasCurrentPage
    ? (currentPage - 1) * currentPageSize + 1
    : 0;
  const endItem = hasCurrentPage
    ? Math.min(currentPage * currentPageSize, totalItems)
    : 0;

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage === 1 ? null : validPage);
    onPageChange?.(validPage);
  };

  const handlePageSizeChange = (newSize: unknown) => {
    const sizeNum = Number(newSize as string);
    setPageSize(sizeNum === PAGINATION_DEFAULTS.PAGE_SIZE ? null : sizeNum);
    setPage(null);
    onPageSizeChange?.(sizeNum);
  };

  return (
    <div
      data-slot="table-pagination"
      className={cn(
        "flex min-w-0 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 text-xs text-muted-foreground">
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="tabular-nums"
        >
          Hiển thị <strong>{startItem}</strong>–<strong>{endItem}</strong> trên{" "}
          <strong>{totalItems}</strong> dòng
        </span>

        {!fixedPageSize && (
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">Hàng/trang:</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger
                aria-label="Số dòng mỗi trang"
                className="h-11 w-20 text-xs rounded-xl sm:h-9"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGINATION_DEFAULTS.PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Pagination aria-label="Phân trang bảng" className="w-auto mx-0 shrink-0">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              aria-label="Trang trước"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-11 rounded-xl px-3 sm:h-9"
              leftIcon={
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              }
            >
              Trước
            </Button>
          </PaginationItem>
          <PaginationItem
            aria-label={`Trang ${currentPage} trên ${totalPages}`}
            className="text-xs font-semibold tabular-nums px-2 text-foreground"
          >
            {currentPage} / {totalPages}
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              aria-label="Trang sau"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-11 rounded-xl px-3 sm:h-9"
              rightIcon={
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              }
            >
              Sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export { TablePagination };

"use client"

import * as React from "react"
import { useQueryState, parseAsInteger } from "nuqs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGINATION_DEFAULTS } from "@/constants/ui"

export interface TablePaginationProps {
  totalItems: number
  pageParamKey?: string
  pageSizeParamKey?: string
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

function TablePagination({
  totalItems,
  pageParamKey = "page",
  pageSizeParamKey = "pageSize",
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const [page, setPage] = useQueryState(
    pageParamKey,
    parseAsInteger.withDefault(1)
  )
  const [pageSize, setPageSize] = useQueryState(
    pageSizeParamKey,
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const currentPage = Math.max(1, page)
  const currentPageSize = pageSize || PAGINATION_DEFAULTS.PAGE_SIZE
  const totalPages = Math.ceil(totalItems / currentPageSize) || 1

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * currentPageSize + 1
  const endItem = Math.min(currentPage * currentPageSize, totalItems)

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    setPage(validPage === 1 ? null : validPage)
    onPageChange?.(validPage)
  }

  const handlePageSizeChange = (newSize: unknown) => {
    const sizeNum = Number(newSize as string)
    setPageSize(sizeNum === PAGINATION_DEFAULTS.PAGE_SIZE ? null : sizeNum)
    setPage(null)
    onPageSizeChange?.(sizeNum)
  }

  return (
    <div
      data-slot="table-pagination"
      className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Hiển thị <strong>{startItem}</strong>–<strong>{endItem}</strong> trên{" "}
          <strong>{totalItems}</strong> dòng
        </span>

        <div className="flex items-center gap-1.5">
          <span>Hàng/trang:</span>
          <Select
            value={String(currentPageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-7 w-16 text-xs rounded-xl">
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
      </div>

      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage <= 1 ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>
          <PaginationItem className="text-xs font-semibold px-2 text-foreground">
            {currentPage} / {totalPages}
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage >= totalPages ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export { TablePagination }

"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DEBOUNCE } from "@/constants/ui"
import { ACTION_LABEL } from "@/constants/messages"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, FilterIcon, Cancel01Icon } from "@hugeicons/core-free-icons"

export interface FilterBarProps {
  searchPlaceholder?: string
  searchParamKey?: string
  children?: React.ReactNode
  onClearFilters?: () => void
  showClearButton?: boolean
  className?: string
}

function FilterBar({
  searchPlaceholder = "Tìm kiếm...",
  searchParamKey = "search",
  children,
  onClearFilters,
  showClearButton = true,
  className,
}: FilterBarProps) {
  const [querySearch, setQuerySearch] = useQueryState(
    searchParamKey,
    parseAsString.withDefault("")
  )
  const [inputValue, setInputValue] = React.useState(querySearch)
  const [prevQuerySearch, setPrevQuerySearch] = React.useState(querySearch)

  // Đồng bộ state nội bộ khi query URL đổi từ bên ngoài (vd: reset filter ở nơi khác).
  // Tính trong render thay vì effect để tránh cascading render (react-hooks/set-state-in-effect).
  if (querySearch !== prevQuerySearch) {
    setPrevQuerySearch(querySearch)
    setInputValue(querySearch)
  }

  // Debounced update to URL parameter using DEBOUNCE.SEARCH
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== querySearch) {
        setQuerySearch(inputValue || null)
      }
    }, DEBOUNCE.SEARCH)

    return () => clearTimeout(timer)
  }, [inputValue, querySearch, setQuerySearch])

  const handleClear = () => {
    setInputValue("")
    setQuerySearch(null)
    onClearFilters?.()
  }

  const hasActiveFilters = Boolean(inputValue || querySearch)

  return (
    <div
      data-slot="filter-bar"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-72">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={searchPlaceholder}
            prefixIcon={<HugeiconsIcon icon={Search01Icon} className="size-4" />}
            suffixIcon={
              inputValue ? (
                <button
                  type="button"
                  onClick={() => setInputValue("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                </button>
              ) : null
            }
          />
        </div>

        {children}

        {showClearButton && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground rounded-full gap-1"
          >
            <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
            <span>{ACTION_LABEL.CLEAR_FILTER}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export { FilterBar }

"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { UserCell } from "@/components/shared/display/user-cell"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { DEBOUNCE } from "@/constants/ui"
import { cn } from "cn"

export interface EntityOption {
  id: string
  name: string
  sub?: string
  avatarUrl?: string
}

export interface EntityPickerProps {
  /** Query function that receives search term and returns options */
  fetcher: (search: string) => Promise<EntityOption[]>
  /** TanStack Query cache key (must be unique per entity type) */
  queryKey: string
  value?: string | null
  /** Optional full entity details of the selected item for chip display */
  selectedEntity?: EntityOption | null
  onChange: (id: string, entity: EntityOption) => void
  onClear?: () => void
  placeholder?: string
  /** Label shown above the picker */
  label?: string
  /** Validation error message */
  error?: string
  className?: string
}

/**
 * Decoupled entity search picker — accepts a `fetcher` prop so `shared/`
 * never imports feature-level services directly.
 *
 * Displays search input, loading skeleton, search results, selected entity chip, and validation error.
 */
function EntityPicker({
  fetcher,
  queryKey,
  value,
  selectedEntity,
  onChange,
  onClear,
  placeholder = "Tìm kiếm...",
  label,
  error,
  className,
}: EntityPickerProps) {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE.SEARCH)
    return () => clearTimeout(t)
  }, [search])

  const { data: options = [], isLoading } = useQuery({
    queryKey: [queryKey, debouncedSearch],
    queryFn: () => fetcher(debouncedSearch),
    enabled: isOpen || debouncedSearch.length > 0,
    staleTime: 30_000,
  })

  const handleSelect = (opt: EntityOption) => {
    onChange(opt.id, opt)
    setIsOpen(false)
  }

  const handleClear = () => {
    onClear?.()
    setSearch("")
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Selected Entity Chip view */}
      {value && selectedEntity ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-2.5">
          <UserCell
            name={selectedEntity.name}
            sub={selectedEntity.sub}
            avatarUrl={selectedEntity.avatarUrl}
          />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClear}
            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Xóa lựa chọn"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (!isOpen) setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={cn("h-9 text-sm pr-8", error && "border-destructive focus-visible:ring-destructive")}
            />
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute right-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none"
            />
          </div>

          {/* Results dropdown panel */}
          {isOpen && (
            <div className="mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-popover shadow-md z-10">
              {isLoading ? (
                <div className="flex flex-col gap-2 p-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-xl" />
                  ))}
                </div>
              ) : options.length === 0 ? (
                <EmptyState variant="no-result" className="py-4" />
              ) : (
                <ul role="listbox" className="p-1">
                  {options.map((opt) => (
                    <li key={opt.id} role="option" aria-selected={value === opt.id}>
                      <Button
                        type="button"
                        variant={value === opt.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start rounded-xl h-auto py-2 px-3 text-left",
                          value === opt.id && "font-semibold bg-accent"
                        )}
                        onClick={() => handleSelect(opt)}
                      >
                        <UserCell name={opt.name} sub={opt.sub} avatarUrl={opt.avatarUrl} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation error message */}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

export { EntityPicker }

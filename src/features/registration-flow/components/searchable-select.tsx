"use client";
import { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  /** Dòng phụ dưới tên. */
  description?: string;
  disabled?: boolean;
  /** Lý do tắt, hiện thay dòng phụ. */
  disabledReason?: string;
}
export interface SearchableChoice {
  id: string;
  label: string;
}
export interface SearchState {
  query: string;
  filters: string[];
  sort: string;
}

/**
 * Ô chọn có tìm kiếm, chip lọc và menu sắp xếp (Base UI Combobox). Việc tìm/lọc/sắp do `search`
 * của nơi dùng làm (hàm thuần trong `class-create-plan.ts`), ô này chỉ hiển thị. Dòng "không chọn"
 * (`noneLabel`, giá trị rỗng) luôn nằm đầu danh sách.
 */
export function SearchableSelect({
  id,
  ariaLabel,
  value,
  selectedLabel,
  onChange,
  search,
  filters = [],
  sorts = [],
  noneLabel,
  placeholder = "Chọn…",
  searchPlaceholder = "Tìm theo tên…",
  emptyText = "Không có kết quả phù hợp.",
  invalid,
  disabled,
}: {
  id?: string;
  ariaLabel: string;
  /** Giá trị đang chọn; chuỗi rỗng = chưa chọn. */
  value: string;
  /** Tên hiển thị của giá trị đang chọn (kể cả khi nó không còn trong kết quả lọc). */
  selectedLabel?: string;
  onChange: (value: string) => void;
  search: (state: SearchState) => SearchableOption[];
  filters?: SearchableChoice[];
  sorts?: SearchableChoice[];
  noneLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState(sorts[0]?.id ?? "");
  const [sortOpen, setSortOpen] = useState(false);

  const found = search({ query, filters: active, sort });
  const items: SearchableOption[] = [
    ...(noneLabel ? [{ value: "", label: noneLabel }] : []),
    ...found,
  ];
  const selected: SearchableOption | null = value
    ? { value, label: selectedLabel ?? value }
    : noneLabel
      ? { value: "", label: noneLabel }
      : null;
  const currentSort = sorts.find((item) => item.id === sort);

  return (
    <Combobox.Root<SearchableOption>
      items={items}
      filter={null}
      value={selected}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setSortOpen(false);
        }
      }}
      inputValue={query}
      onInputValueChange={(next, details) => {
        if (details.reason === "input-change") setQuery(next);
      }}
      onValueChange={(next) => {
        if (next) onChange(next.value);
      }}
      isItemEqualToValue={(item, current) => item.value === current.value}
      itemToStringLabel={(item) => item.label}
      disabled={disabled}
    >
      <Combobox.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-1 text-left text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        )}
      >
        <span
          className={cn("truncate", !selected && "text-muted-foreground")}
        >
          {selected?.label ?? placeholder}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className="w-(--anchor-width) min-w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none">
            <div className="space-y-2 border-b border-border p-2">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Combobox.Input
                  aria-label={`${ariaLabel}: ${searchPlaceholder}`}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              {(filters.length > 0 || sorts.length > 1) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {filters.map((filter) => {
                    const on = active.includes(filter.id);
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setActive((prev) =>
                            on
                              ? prev.filter((item) => item !== filter.id)
                              : [...prev, filter.id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          on
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                  {sorts.length > 1 && (
                    <button
                      type="button"
                      aria-expanded={sortOpen}
                      onClick={() => setSortOpen((prev) => !prev)}
                      className="ml-auto flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                    >
                      Sắp xếp: {currentSort?.label}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="size-3"
                      />
                    </button>
                  )}
                </div>
              )}
              {sortOpen && (
                <div aria-label="Sắp xếp" role="group" className="flex flex-wrap gap-1.5">
                  {sorts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={item.id === sort}
                      onClick={() => {
                        setSort(item.id);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-1 text-xs transition-colors",
                        item.id === sort
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {found.length === 0 && (
              <p role="status" className="px-3 py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            )}
            <Combobox.List className="max-h-64 overflow-y-auto p-1">
              {(item: SearchableOption) => (
                <Combobox.Item
                  key={item.value || "__none"}
                  value={item}
                  disabled={item.disabled}
                  className="relative flex w-full cursor-pointer select-none flex-col rounded-xl py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <Combobox.ItemIndicator className="absolute left-2 top-2 flex size-4 items-center justify-center">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="size-4 text-primary"
                    />
                  </Combobox.ItemIndicator>
                  <span className="font-medium">{item.label}</span>
                  {(item.disabled && item.disabledReason
                    ? item.disabledReason
                    : item.description) && (
                    <span className="text-xs text-muted-foreground">
                      {item.disabled && item.disabledReason
                        ? item.disabledReason
                        : item.description}
                    </span>
                  )}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

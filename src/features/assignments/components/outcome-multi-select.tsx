"use client";
import { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface OutcomeOption {
  id: string;
  code: string;
  title: string;
}

/** Bỏ dấu và hạ chữ thường để gõ "hieu" vẫn ra "Hiểu". */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
const labelOf = (item: OutcomeOption) => `${item.code} · ${item.title}`;

/**
 * Ô chọn nhiều CLO cho cả bài (Base UI Combobox `multiple`). Gõ để tìm theo mã hoặc tên, không
 * phân biệt dấu. Chỉ dùng trong trình soạn bài tập; dạng chọn một có tìm kiếm là
 * `SearchableSelect` của luồng đăng ký.
 */
export function OutcomeMultiSelect({
  ariaLabel,
  options,
  value,
  onChange,
  placeholder = "Chọn mục tiêu…",
  searchPlaceholder = "Tìm theo mã hoặc tên mục tiêu…",
  emptyText = "Không có mục tiêu phù hợp.",
  disabled,
}: {
  ariaLabel: string;
  options: OutcomeOption[];
  /** Id các CLO đang chọn. */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = value.map(
    (id) =>
      options.find((item) => item.id === id) ?? {
        id,
        code: id,
        title: "",
      },
  );
  return (
    <Combobox.Root<OutcomeOption, true>
      multiple
      items={options}
      value={selected}
      onValueChange={(next) => onChange(next.map((item) => item.id))}
      inputValue={query}
      onInputValueChange={(next, details) => {
        if (details.reason === "input-change") setQuery(next);
        if (details.reason === "input-clear") setQuery("");
      }}
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
      filter={(item, text) => fold(labelOf(item)).includes(fold(text.trim()))}
      isItemEqualToValue={(item, current) => item.id === current.id}
      itemToStringLabel={labelOf}
      disabled={disabled}
    >
      <Combobox.Chips className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-2 py-1 text-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        {selected.map((item) => (
          <Combobox.Chip
            key={item.id}
            className="flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary"
          >
            <span className="truncate" title={item.title}>
              {item.code}
            </span>
            <Combobox.ChipRemove
              aria-label={`Bỏ ${item.code}`}
              className="flex size-5 items-center justify-center rounded-full hover:bg-primary/20"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
            </Combobox.ChipRemove>
          </Combobox.Chip>
        ))}
        {!selected.length && (
          <span className="pl-1 text-muted-foreground">{placeholder}</span>
        )}
        <Combobox.Trigger
          aria-label={ariaLabel}
          className="ml-auto flex size-7 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 text-muted-foreground"
          />
        </Combobox.Trigger>
      </Combobox.Chips>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className="w-(--anchor-width) min-w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none">
            <div className="border-b border-border p-2">
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
            </div>
            <Combobox.Empty
              role="status"
              className={cn(
                "px-3 py-4 text-center text-sm text-muted-foreground empty:hidden",
              )}
            >
              {emptyText}
            </Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto p-1">
              {(item: OutcomeOption) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  className="relative flex w-full cursor-pointer select-none flex-col rounded-xl py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <Combobox.ItemIndicator className="absolute left-2 top-2 flex size-4 items-center justify-center">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="size-4 text-primary"
                    />
                  </Combobox.ItemIndicator>
                  <span className="font-medium">{item.code}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.title}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

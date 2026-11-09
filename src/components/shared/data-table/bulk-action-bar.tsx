"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  children?: React.ReactNode;
}

function BulkActionBar({
  selectedCount,
  onClearSelection,
  children,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      data-slot="bulk-action-bar"
      role="region"
      aria-label="Thao tác cho dòng đã chọn"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-popover px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-5 motion-reduce:animate-none sm:rounded-full sm:px-5"
    >
      <div className="flex items-center gap-2 border-border sm:border-r sm:pr-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-foreground">Đã chọn</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClearSelection}
          className="ml-1 size-11 rounded-full text-muted-foreground hover:text-foreground sm:size-6"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          <span className="sr-only">Bỏ chọn</span>
        </Button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
        {children}
      </div>
    </div>
  );
}

export { BulkActionBar };

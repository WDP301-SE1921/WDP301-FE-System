"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";

/**
 * Nút đóng có icon và tên cho Sheet. Nút mặc định của `SheetContent` truyền icon qua children,
 * mà `Button` cỡ icon chỉ vẽ `leftIcon`, nên dùng `showCloseButton={false}` kèm nút này.
 */
export function SheetCloseButton({ label = "Đóng" }: { label?: string }) {
  return (
    <SheetClose
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="absolute right-4 top-4 rounded-full"
          leftIcon={<HugeiconsIcon icon={Cancel01Icon} className="size-4" />}
        />
      }
    />
  );
}

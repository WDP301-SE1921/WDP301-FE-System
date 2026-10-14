"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNavMenu } from "@/constants/menu";
import type { WebRole } from "@/constants/roles";

function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

export function GlobalSearch({ role }: { role: WebRole }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      getNavMenu(role).flatMap((group) =>
        group.items.map((item) => ({ ...item, group: group.groupTitle })),
      ),
    [role],
  );
  const words = searchText(query.trim()).split(/\s+/).filter(Boolean);
  const results = items.filter((item) =>
    words.every((word) =>
      searchText(`${item.title} ${item.group ?? ""}`).includes(word),
    ),
  );
  function changeOpen(value: boolean) {
    setOpen(value);
    if (!value) setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => changeOpen(true)}
        aria-label="Tìm màn hình và tác vụ"
        className="rounded-full sm:w-full sm:justify-start sm:bg-muted/40"
        leftIcon={<HugeiconsIcon icon={Search01Icon} className="size-4" />}
      >
        <span className="hidden min-w-0 truncate text-muted-foreground sm:inline">
          Tìm màn hình, tác vụ…
        </span>
        <kbd className="ml-auto hidden rounded-xl border border-border px-1.5 text-xs text-muted-foreground lg:inline">
          Ctrl/⌘ K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent size="xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Đi đến màn hình</DialogTitle>
            <DialogDescription>
              Tìm các mục và tác vụ bạn được phép sử dụng.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Tên màn hình hoặc tác vụ"
            placeholder="Ví dụ: lịch học, giáo trình…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <nav
            aria-label="Kết quả tìm màn hình"
            className="max-h-80 space-y-1 overflow-y-auto"
          >
            {results.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onNavigate={() => changeOpen(false)}
                className="flex flex-col gap-1 rounded-xl p-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.group}
                </span>
              </Link>
            ))}
            {results.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground" role="status">
                Không tìm thấy màn hình phù hợp. Thử tên khác.
              </p>
            )}
          </nav>
          <DialogFooter>
            <Button variant="outline" onClick={() => changeOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

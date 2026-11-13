"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Delta } from "../metrics";

/**
 * Bộ khung dashboard theo canvas "Dashboard 4 vai trò" (13/11/2026):
 * không câu mô tả dưới tiêu đề (giải thích nằm trong ⓘ), hàng thẻ cao bằng nhau,
 * cam chỉ cho chỗ vượt ngưỡng.
 */

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={text}
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{text}</TooltipContent>
    </Tooltip>
  );
}

const TONE: Record<Delta["tone"], string> = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-red-700 dark:text-red-400",
  neutral: "text-muted-foreground",
};

export function DeltaText({ delta, base }: { delta?: Delta; base?: string }) {
  // Mốc so sánh chỉ có nghĩa khi có delta; không có số thì không hiện "so …" đứng một mình.
  if (!delta) return null;
  return (
    <p className="text-xs tabular-nums">
      {delta && <span className={cn("font-medium", TONE[delta.tone])}>{delta.text}</span>}
      {base && <span className="text-muted-foreground"> {base}</span>}
    </p>
  );
}

/** Thẻ KPI: nhãn, số lớn, delta + mốc so sánh (hoặc dòng phụ). `warn` tô cam dòng phụ. */
export function KpiCard({
  label,
  value,
  tip,
  delta,
  base,
  sub,
  warn,
  isLoading,
  isError,
  onRetry,
}: {
  label: string;
  value: ReactNode;
  tip?: string;
  delta?: Delta;
  base?: string;
  sub?: ReactNode;
  warn?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex min-h-30 min-w-0 flex-col gap-1.5 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {tip && <InfoTip text={tip} />}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-3 w-36 rounded-xl" />
        </>
      ) : isError ? (
        <>
          <p className="text-2xl font-semibold tabular-nums">—</p>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-red-700 dark:text-red-400">Không tải được</span>
            {onRetry && (
              <Button size="xs" variant="outline" onClick={onRetry}>
                Thử lại
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <DeltaText delta={delta} base={base} />
          {sub && (
            <p
              className={cn(
                "text-xs tabular-nums",
                warn
                  ? "font-medium text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {sub}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Chỉ số chính"
      data-dashboard-kpis
      className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4"
    >
      {children}
    </section>
  );
}

export interface AttentionItem {
  key: string;
  label: string;
  count: number;
  href: string;
  /** Vượt ngưỡng → chip cam. */
  warn?: boolean;
}

/** Dải "Cần xử lý": chỉ hiện mục có số > 0. */
export function AttentionStrip({
  items,
  isLoading,
}: {
  items: AttentionItem[];
  isLoading?: boolean;
}) {
  const shown = items.filter((item) => item.count > 0);
  return (
    <section aria-label="Cần xử lý" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Cần xử lý</span>
      {shown.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            item.warn
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
              : "border-border bg-card hover:bg-muted",
          )}
        >
          <span className="tabular-nums font-semibold">{item.count}</span>
          {item.label}
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 opacity-70" />
        </Link>
      ))}
      {!shown.length && (
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Đang kiểm tra…" : "Không có việc tồn"}
        </span>
      )}
    </section>
  );
}

/** Khung một khối: tiêu đề + ⓘ + vùng hành động, không câu mô tả. Cao bằng các khối cùng hàng. */
export function Panel({
  title,
  tip,
  actions,
  children,
  className,
}: {
  title: string;
  tip?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full min-w-0 flex-col gap-4 rounded-2xl p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          {title}
          {tip && <InfoTip text={tip} />}
        </h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">{children}</div>
    </Card>
  );
}

export interface RankItem {
  key: string;
  label: ReactNode;
  value: string;
  /** 0–100, độ dài thanh. */
  pct: number;
  meta?: string;
  warn?: boolean;
}

/** Hàng xếp hạng: nhãn, số, thanh mảnh 3 px dưới đáy. */
export function RankList({ rows, empty }: { rows: RankItem[]; empty?: string }) {
  if (!rows.length)
    return <p className="text-sm text-muted-foreground">{empty ?? "Chưa có dữ liệu"}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{row.label}</span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                row.warn && "font-semibold text-amber-700 dark:text-amber-400",
              )}
            >
              {row.value}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className={cn("h-1 rounded-full", row.warn ? "bg-amber-500" : "bg-primary")}
              style={{ width: `${Math.max(0, Math.min(100, row.pct))}%` }}
            />
          </div>
          {row.meta && <p className="text-xs tabular-nums text-muted-foreground">{row.meta}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Ô vuông chữ cái đầu cho người (phụ huynh, giáo viên). */
export function Initials({ name }: { name: string }) {
  const letters = (name.includes("@") ? name.split("@")[0] : name)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {letters || "?"}
    </span>
  );
}

/** Thông báo trong khối khi API lỗi, có nút thử lại. */
export function PanelError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-sm">
      <span className="text-red-700 dark:text-red-400">Không tải được số liệu</span>
      {onRetry && (
        <Button size="xs" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

/** Ký hiệu tiền gọn cho thẻ/xếp hạng: 186,4 Tr · 950 N. Số đủ đặt trong tooltip/bảng. */
export function shortMoney(value: number) {
  if (Math.abs(value) >= 1e9)
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value / 1e9)} Tỷ`;
  if (Math.abs(value) >= 1e6)
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1e6)} Tr`;
  if (Math.abs(value) >= 1e3)
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value / 1e3)} N`;
  return new Intl.NumberFormat("vi-VN").format(value);
}

export const percentText = (ratio: number | null | undefined, digits = 0) =>
  ratio === null || ratio === undefined
    ? "—"
    : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(ratio * 100)}%`;

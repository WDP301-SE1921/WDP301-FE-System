"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

/**
 * Trạng thái một bước của luồng nghiệp vụ, tính từ dữ liệu BE (PLAN_GUIDED_WORKFLOWS.md, N1–N2):
 * - `done`: đã xong.
 * - `current`: bước nên làm bây giờ.
 * - `available`: làm được rồi nhưng chưa phải bước chính (vd chấm bài khi học sinh còn đang nộp).
 * - `waiting`: đang chờ một vai trò khác (ghi trong `waitingFor`).
 * - `todo`: chưa tới lượt.
 */
export type FlowStepStatus =
  "done" | "current" | "available" | "waiting" | "todo";

export interface FlowStep {
  key: string;
  title: string;
  status: FlowStepStatus;
  /** Một dòng ngắn: tiến độ hoặc việc còn lại, vd "Đã nộp 12/20". */
  summary?: string;
  /** Vai trò đang phải làm khi `status` là `waiting`, vd "Giáo viên". */
  waitingFor?: string;
}

const STATUS_TEXT: Record<Exclude<FlowStepStatus, "waiting">, string> = {
  done: "Xong",
  current: "Đang làm",
  available: "Làm được",
  todo: "Chưa tới",
};

/**
 * Thanh bước ở đầu màn hình của một luồng: mỗi bước một ô có số thứ tự, tên, trạng thái và một
 * dòng tiến độ. Màn hẹp thì xếp dọc, màn rộng thì xếp ngang. Bấm được vào bước không phải
 * "Chưa tới" khi có `onSelect`, để xem lại hoặc làm trước.
 */
export function FlowSteps({
  steps,
  activeKey,
  onSelect,
  label = "Các bước",
  className,
}: {
  steps: FlowStep[];
  /** Bước đang mở bên dưới thanh; mặc định là bước `current` đầu tiên. */
  activeKey?: string;
  onSelect?: (key: string) => void;
  label?: string;
  className?: string;
}) {
  const active =
    activeKey ?? steps.find((step) => step.status === "current")?.key;
  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      {/* Màn vừa (có sidebar) không đủ chỗ cho 5–6 ô một hàng: xếp 2–3 cột, từ xl mới một hàng. */}
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-flow-col xl:auto-cols-fr xl:grid-cols-none">
        {steps.map((step, index) => {
          const isActive = step.key === active;
          const isClickable = !!onSelect && step.status !== "todo" && !isActive;
          const statusText =
            step.status === "waiting"
              ? `Chờ ${step.waitingFor ?? "người khác"}`
              : STATUS_TEXT[step.status];
          const body = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  step.status === "done"
                    ? "bg-primary text-primary-foreground"
                    : isActive || step.status === "current"
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground",
                )}
              >
                {step.status === "done" ? (
                  <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 flex-1 space-y-0.5 text-left">
                <span className="block text-sm font-medium">{step.title}</span>
                <span
                  className={cn(
                    "block text-xs",
                    step.status === "current"
                      ? "font-medium text-primary"
                      : step.status === "waiting"
                        ? "font-medium text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground",
                  )}
                >
                  {statusText}
                  {step.summary && ` · ${step.summary}`}
                </span>
              </span>
            </>
          );
          const itemClass = cn(
            "flex h-full w-full items-start gap-3 rounded-2xl border p-3",
            isActive ? "border-primary bg-primary/5" : "border-border bg-card",
            step.status === "todo" && "opacity-70",
          );
          return (
            <li key={step.key} aria-current={isActive ? "step" : undefined}>
              {isClickable ? (
                <button
                  type="button"
                  className={cn(
                    itemClass,
                    "transition-colors hover:bg-muted/60",
                  )}
                  onClick={() => onSelect(step.key)}
                >
                  {body}
                </button>
              ) : (
                <div className={itemClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

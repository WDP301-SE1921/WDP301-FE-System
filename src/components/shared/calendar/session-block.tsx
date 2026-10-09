"use client";

import * as React from "react";
import { SUBJECT_MAP, FALLBACK_SUBJECT } from "@/constants/subjects";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Location01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";

export type SessionStatus =
  "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUBSTITUTE";

export interface SessionBlockProps {
  id: string;
  title: string;
  subject: string; // e.g. "MATH", "PHYS", "CHEM", "BIOL"
  time: string;
  room?: string;
  teacherName?: string;
  status?: SessionStatus;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  SessionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "danger" | "warning";
  }
> = {
  SCHEDULED: { label: "Sắp diễn ra", variant: "default" },
  COMPLETED: { label: "Đã xong", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "danger" },
  SUBSTITUTE: { label: "Dạy thay", variant: "warning" },
};

/**
 * Class session card block rendered within ScheduleCalendar cells.
 * Color-coded by subject with status badge and metadata.
 */
function SessionBlock({
  title,
  subject,
  time,
  room,
  teacherName,
  status = "SCHEDULED",
  onClick,
  compact = false,
  className,
}: SessionBlockProps) {
  const subjectConfig = SUBJECT_MAP[subject] ?? FALLBACK_SUBJECT;
  const statusMeta = STATUS_CONFIG[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full min-w-0 text-left rounded-xl p-2.5 transition-all border text-xs shadow-2xs hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring bg-card",
        className,
      )}
    >
      <div className="mb-2 space-y-2">
        <span className="block break-words font-bold text-xs text-foreground">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={subjectConfig.badgeVariant}
            className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium"
          >
            {SUBJECT_MAP[subject]?.name ?? (subject || FALLBACK_SUBJECT.name)}
          </Badge>
          <Badge
            variant={statusMeta.variant}
            className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium"
          >
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      <div
        className={cn(
          "flex gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium mt-1.5",
          compact ? "flex-col items-start" : "flex-wrap items-center",
        )}
      >
        <span className="flex min-w-0 items-center gap-1">
          <HugeiconsIcon
            icon={Clock01Icon}
            className="size-3 text-muted-foreground"
          />
          {time}
        </span>
        {room && (
          <span className="flex min-w-0 items-center gap-1">
            <HugeiconsIcon
              icon={Location01Icon}
              className="size-3 text-muted-foreground"
            />
            {room}
          </span>
        )}
        {!compact && teacherName && (
          <span className="flex items-center gap-1 truncate">
            <HugeiconsIcon
              icon={UserIcon}
              className="size-3 text-muted-foreground"
            />
            {teacherName}
          </span>
        )}
      </div>
    </button>
  );
}

export { SessionBlock };

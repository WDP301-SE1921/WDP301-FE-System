"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { academicApi } from "@/features/academic/api";
import { ROUTES } from "@/constants/routes";
import type { WebRole } from "@/constants/roles";

export function NotificationBell({ role }: { role: WebRole }) {
  const [open, setOpen] = useState(false);
  const query = useLiveQuery(
    ["header-announcements"],
    (signal) => academicApi.recentAnnouncements(signal),
    open,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Thông báo mới nhất"
            className="rounded-full text-muted-foreground"
            leftIcon={
              <HugeiconsIcon icon={Notification01Icon} className="size-5" />
            }
          />
        }
      />
      <PopoverContent
        align="end"
        aria-label="Thông báo mới nhất"
        className="w-80 max-w-full p-4"
      >
        <p className="mb-3 font-heading text-sm font-semibold">
          Thông báo mới nhất
        </p>
        <AsyncBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          data={query.data}
          emptyProps={{ title: "Chưa có thông báo" }}
        >
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {query.data?.map((item) => (
              <Link
                key={item.id}
                href={
                  role === "teacher"
                    ? ROUTES.TEACHER.CLASS_DETAIL(item.classId)
                    : ROUTES.MANAGER.NOTIFICATIONS
                }
                onNavigate={() => setOpen(false)}
                className="block space-y-1 rounded-xl p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="break-words text-sm font-medium">{item.title}</p>
                <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                  {item.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayMoment(item.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </AsyncBoundary>
      </PopoverContent>
    </Popover>
  );
}

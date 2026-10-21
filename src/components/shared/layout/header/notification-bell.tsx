"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  TickDouble02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import type { NotificationItem } from "@/features/notifications/api";
import { useNotificationSocket } from "@/features/notifications/hooks/use-notification-socket";
import {
  useNotificationActions,
  useNotificationList,
  useUnreadNotificationCount,
  type NotificationTab,
} from "@/features/notifications/hooks/use-notifications";
import {
  isTodayInVietnam,
  NOTIFICATION_CATEGORY,
  notificationCategory,
  notificationHref,
  notificationTime,
} from "@/features/notifications/presentation";
import type { WebRole } from "@/constants/roles";
import { cn } from "@/lib/utils";

/** Chuông thông báo trên topbar: hộp thư thông báo của tài khoản (`/notifications`). */
export function NotificationBell({ role }: { role: WebRole }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>("all");
  // Socket mở cùng topbar trên mọi trang; mất kết nối thì quay về làm mới định kỳ.
  const realtime = useNotificationSocket();
  const unread = useUnreadNotificationCount(realtime === "live");
  const unreadCount = unread.data ?? 0;
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"
            }
            className={cn(
              "relative rounded-full text-muted-foreground",
              open && "bg-primary/10 text-primary",
            )}
          >
            {/* Icon đi qua children: nút cỡ icon không vẽ children khi có leftIcon, sẽ mất badge. */}
            <HugeiconsIcon icon={Notification01Icon} className="size-5" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[0.625rem] leading-none font-bold text-white"
              >
                {badge}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        aria-label="Thông báo"
        className="flex max-h-[min(40rem,calc(100dvh-5rem))] w-100 max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0"
      >
        {open && (
          <NotificationPanel
            role={role}
            tab={tab}
            onTabChange={setTab}
            unreadCount={unreadCount}
            live={realtime === "live"}
            onNavigate={() => setOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationPanel({
  role,
  tab,
  onTabChange,
  unreadCount,
  live,
  onNavigate,
}: {
  role: WebRole;
  tab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  unreadCount: number;
  live: boolean;
  onNavigate: () => void;
}) {
  const list = useNotificationList(tab, true);
  const { markRead, readAll } = useNotificationActions();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = [
    {
      label: "Hôm nay",
      items: items.filter((item) => isTodayInVietnam(item.createdAt)),
    },
    {
      label: "Trước đó",
      items: items.filter((item) => !isTodayInVietnam(item.createdAt)),
    },
  ].filter((group) => group.items.length);

  return (
    <>
      <div className="space-y-3 border-b border-border p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold">Thông báo</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount
                ? `${unreadCount} thông báo chưa đọc`
                : "Bạn đã xem hết"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            disabled={!unreadCount}
            isLoading={readAll.isPending}
            onClick={() => readAll.mutate()}
            leftIcon={<HugeiconsIcon icon={TickDouble02Icon} />}
          >
            Đánh dấu đã đọc tất cả
          </Button>
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(value as NotificationTab)}
        >
          <TabsList aria-label="Lọc thông báo">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="unread">
              Chưa đọc
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {list.isPending ? (
          <div className="space-y-4 p-3" aria-label="Đang tải thông báo">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <div className="p-3">
            <ApiFeedback error={list.error} retry={() => void list.refetch()} />
          </div>
        ) : !groups.length ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <HugeiconsIcon
                icon={tab === "unread" ? TickDouble02Icon : Notification01Icon}
                className="size-5"
              />
            </span>
            <p className="text-sm font-semibold">
              {tab === "unread" ? "Bạn đã xem hết" : "Chưa có thông báo nào"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === "unread"
                ? "Không còn thông báo chưa đọc."
                : "Thông báo về lịch học, đơn nghỉ, bài nộp, giáo trình… sẽ hiện ở đây."}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NotificationRow
                      item={item}
                      href={notificationHref(item, role)}
                      onOpen={() => {
                        if (!item.readAt) markRead.mutate(item.id);
                      }}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {live && (
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-emerald-500"
            />
          )}
          {live
            ? "Đang nhận thông báo tức thì"
            : "Tự cập nhật mỗi 30 giây và khi quay lại tab"}
        </span>
        {list.hasNextPage && (
          <Button
            variant="outline"
            size="xs"
            isLoading={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            Xem thêm
          </Button>
        )}
      </div>
    </>
  );
}

function NotificationRow({
  item,
  href,
  onOpen,
  onNavigate,
}: {
  item: NotificationItem;
  href: string | null;
  onOpen: () => void;
  onNavigate: () => void;
}) {
  const category = NOTIFICATION_CATEGORY[notificationCategory(item.type)];
  const unread = !item.readAt;
  const className = cn(
    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    unread && "bg-primary/5 hover:bg-primary/10",
  );
  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          category.className,
        )}
      >
        <HugeiconsIcon icon={category.icon} className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm leading-snug break-words",
            unread ? "font-semibold" : "font-medium text-foreground/80",
          )}
        >
          {item.title}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed break-words text-muted-foreground">
          {item.body}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {category.label} · {notificationTime(item.createdAt)}
        </span>
      </span>
      {unread && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
          <span className="sr-only">Chưa đọc</span>
        </span>
      )}
    </>
  );
  return href ? (
    <Link
      href={href}
      className={className}
      onClick={onOpen}
      onNavigate={onNavigate}
    >
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={onOpen}>
      {content}
    </button>
  );
}

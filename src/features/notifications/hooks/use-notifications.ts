"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-role";
import {
  notificationsApi,
  NOTIFICATION_PAGE_SIZE,
  type NotificationPage,
} from "../api";

/** Số chưa đọc được làm mới định kỳ khi tab đang mở (BE có Socket.IO, Web chưa nối — xem docs). */
const UNREAD_REFRESH_MS = 30_000;

export type NotificationTab = "all" | "unread";

function notificationKeys(userId: string | undefined) {
  const base = ["web-api", userId, "notifications"] as const;
  return {
    base,
    unread: [...base, "unread-count"] as const,
    list: (tab: NotificationTab) => [...base, "list", tab] as const,
  };
}

export function useUnreadNotificationCount() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: notificationKeys(user?.id).unread,
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    select: (data) => data.unreadCount,
    enabled: !!user,
    retry: false,
    refetchInterval: UNREAD_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationList(tab: NotificationTab, enabled: boolean) {
  const user = useCurrentUser();
  return useInfiniteQuery({
    queryKey: notificationKeys(user?.id).list(tab),
    queryFn: ({ pageParam, signal }) =>
      notificationsApi.list(
        { page: pageParam, unreadOnly: tab === "unread" },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last: NotificationPage) =>
      last.page * NOTIFICATION_PAGE_SIZE < last.total ? last.page + 1 : undefined,
    enabled: !!user && enabled,
    retry: false,
    // Mỗi lần mở popover đều lấy lại để không hiện trạng thái đọc cũ.
    staleTime: 0,
  });
}

/** Đánh dấu đã đọc: cập nhật ngay trên danh sách rồi đồng bộ lại với BE. */
export function useNotificationActions() {
  const user = useCurrentUser();
  const client = useQueryClient();
  const keys = notificationKeys(user?.id);
  const markLocal = (match: (id: string) => boolean) => {
    const readAt = new Date().toISOString();
    client.setQueriesData<InfiniteData<NotificationPage>>(
      { queryKey: [...keys.base, "list"] },
      (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              !item.readAt && match(item.id) ? { ...item, readAt } : item,
            ),
          })),
        },
    );
  };
  const refresh = () => client.invalidateQueries({ queryKey: keys.base });
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) => markLocal((itemId) => itemId === id),
    onSettled: refresh,
  });
  const readAll = useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onMutate: () => markLocal(() => true),
    onSettled: refresh,
  });
  return { markRead, readAll };
}

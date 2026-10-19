"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { useCurrentUser } from "@/hooks/use-current-role";
import { apiRequest } from "@/lib/api/client";

/** live: đang nhận sự kiện tức thì · offline: đang thử kết nối lại · unavailable: chỉ làm mới định kỳ. */
export type RealtimeStatus = "connecting" | "live" | "offline" | "unavailable";

interface RealtimeTicket {
  token: string;
  expiresIn: number;
  /** Origin của socket, BFF lấy từ cấu hình server (REALTIME_PUBLIC_URL / BACKEND_API_URL). */
  url: string;
}

const RETRY_MS = 30_000;
/** Lỗi cấu hình (Web chưa có trong CORS_ORIGINS của BE): thử lại cũng vô ích. */
const FATAL_ERRORS = new Set(["ORIGIN_NOT_ALLOWED"]);

const requestTicket = () =>
  apiRequest<RealtimeTicket>("auth/realtime-ticket", { method: "POST" });

/**
 * Socket.IO `/notifications` của BE. Access token nằm trong cookie httpOnly nên trình duyệt
 * xin vé 60 giây qua BFF cho mỗi lần kết nối. Sự kiện chỉ báo "có thay đổi": hộp thư và số
 * chưa đọc luôn được đọc lại bằng REST (theo docs/notifications-api.md của BE).
 */
export function useNotificationSocket(): RealtimeStatus {
  const user = useCurrentUser();
  const client = useQueryClient();
  const userId = user?.id;
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let socket: Socket | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // Gom nhiều sự kiện liền nhau thành một lần đọc lại.
    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(
        () =>
          void client.invalidateQueries({
            queryKey: ["web-api", userId, "notifications"],
          }),
        150,
      );
    };
    const retryLater = () => {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!stopped) socket?.connect();
      }, RETRY_MS);
    };

    void (async () => {
      let first: RealtimeTicket | null;
      try {
        first = await requestTicket();
      } catch {
        // BE chưa có API vé hoặc lỗi mạng: giữ cơ chế làm mới định kỳ.
        if (!stopped) setStatus("unavailable");
        return;
      }
      const { io } = await import("socket.io-client");
      if (stopped) return;
      socket = io(`${first.url}/notifications`, {
        path: "/socket.io",
        transports: ["websocket"],
        autoConnect: false,
        reconnectionDelayMax: RETRY_MS,
        // Chạy ở mỗi lần kết nối / kết nối lại: dùng vé đầu tiên một lần, sau đó xin vé mới.
        auth: (callback) => {
          const ticket = first;
          first = null;
          (ticket ? Promise.resolve(ticket) : requestTicket()).then(
            (value) => callback({ token: value.token }),
            () => callback({}),
          );
        },
      });
      socket.on("connect", () => {
        setStatus("live");
        refresh();
      });
      socket.on("notification.created", refresh);
      socket.on("notifications.read-changed", refresh);
      socket.on("disconnect", (reason) => {
        if (stopped) return;
        setStatus("offline");
        // BE ngắt khi hết thời hạn phiên socket: kết nối lại ngay bằng vé mới.
        if (reason === "io server disconnect") socket?.connect();
      });
      socket.on("connect_error", (error) => {
        if (stopped) return;
        if (FATAL_ERRORS.has(error.message)) {
          setStatus("unavailable");
          return;
        }
        setStatus("offline");
        // Bị middleware từ chối (vé hết hạn, giới hạn kết nối…) thì client không tự thử lại.
        if (!socket?.active) retryLater();
      });
      socket.connect();
    })();

    return () => {
      stopped = true;
      clearTimeout(refreshTimer);
      clearTimeout(retryTimer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [userId, client]);

  return userId ? status : "unavailable";
}

import { apiRequest } from "@/lib/api/client";

/** Loại thông báo BE trả về (`notifications.dto.ts`); loại mới chưa biết vẫn hiển thị được. */
export type NotificationType =
  | "ANNOUNCEMENT"
  | "ASSIGNMENT_PUBLISHED"
  | "ASSIGNMENT_REOPENED"
  | "ANSWERS_PUBLISHED"
  | "SUBMISSION_RECEIVED"
  | "GRADE_PUBLISHED"
  | "ATTENDANCE_FINALIZED"
  | "SESSIONS_GENERATED"
  | "SESSION_RESCHEDULED"
  | "SESSION_CANCELLED"
  | "TEACHER_CHANGED"
  | "SUBSTITUTE_ASSIGNED"
  | "LEAVE_REQUESTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_CANCELLED"
  | "LEAVE_ENDED_EARLY"
  | "MAKEUP_BOOKED"
  | "MAKEUP_CANCELLED"
  | "MAKEUP_RESCHEDULED"
  | "MAKEUP_COMPLETED"
  | "MAKEUP_MISSED"
  | "ENROLLMENT_TRANSFERRED"
  | "ENROLLMENT_ENDED"
  | "BILL_CREATED"
  | "BILL_CANCELLED"
  | "PAYMENT_CONFIRMED"
  | "TUITION_REMINDER"
  | "CURRICULUM_SUBMITTED"
  | "CURRICULUM_CHANGES_REQUESTED"
  | "CURRICULUM_APPROVED"
  | "FEEDBACK_CREATED"
  | "FEEDBACK_RESOLVED";

export type NotificationTargetKind =
  | "ASSIGNMENT"
  | "SUBMISSION"
  | "SESSION"
  | "CLASS"
  | "LEAVE"
  | "MAKEUP"
  | "ENROLLMENT"
  | "REGISTRATION"
  | "CURRICULUM_UNIT"
  | "FEEDBACK";

export interface NotificationItem {
  id: string;
  type: NotificationType | (string & {});
  title: string;
  body: string;
  target: { kind: NotificationTargetKind | (string & {}); id: string };
  context: { classId?: string; studentIds: string[] };
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
}

export const NOTIFICATION_PAGE_SIZE = 20;

/** Hộp thư thông báo của chính người đang đăng nhập; BE tự lọc theo tài khoản. */
export const notificationsApi = {
  list: (
    params: { page: number; unreadOnly?: boolean },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(NOTIFICATION_PAGE_SIZE),
    });
    if (params.unreadOnly) query.set("unreadOnly", "true");
    return apiRequest<NotificationPage>(`notifications?${query}`, { signal });
  },
  unreadCount: (signal?: AbortSignal) =>
    apiRequest<{ unreadCount: number }>("notifications/unread-count", {
      signal,
    }),
  markRead: (id: string) =>
    apiRequest<NotificationItem>(
      `notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
    ),
  readAll: () =>
    apiRequest<{ updatedCount: number; unreadCount: number }>(
      "notifications/read-all",
      { method: "POST" },
    ),
};

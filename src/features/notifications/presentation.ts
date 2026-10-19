import {
  BookOpen01Icon,
  Calendar03Icon,
  CalendarRemove01Icon,
  Invoice01Icon,
  Megaphone01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { ROUTES } from "@/constants/routes";
import { canAccessPath } from "@/constants/role-access";
import { ROLES, type WebRole } from "@/constants/roles";
import { todayInVietnam } from "@/lib/calendar-date";
import type { NotificationItem } from "./api";

export type NotificationCategory =
  | "schedule"
  | "absence"
  | "assignment"
  | "tuition"
  | "curriculum"
  | "announcement";

/** Nhóm hiển thị (nhãn, icon, màu) của từng loại thông báo; API chỉ lọc một `type` nên không làm tab theo nhóm. */
export const NOTIFICATION_CATEGORY: Record<
  NotificationCategory,
  { label: string; icon: typeof Calendar03Icon; className: string }
> = {
  schedule: {
    label: "Lịch học",
    icon: Calendar03Icon,
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  absence: {
    label: "Nghỉ & học bù",
    icon: CalendarRemove01Icon,
    className:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  assignment: {
    label: "Bài tập & điểm",
    icon: Task01Icon,
    className:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  },
  tuition: {
    label: "Học phí & ghi danh",
    icon: Invoice01Icon,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  curriculum: {
    label: "Giáo trình",
    icon: BookOpen01Icon,
    className: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  },
  announcement: {
    label: "Thông báo lớp",
    icon: Megaphone01Icon,
    className: "bg-muted text-foreground",
  },
};

export function notificationCategory(type: string): NotificationCategory {
  if (type.startsWith("LEAVE_") || type.startsWith("MAKEUP_")) return "absence";
  if (
    type.startsWith("ASSIGNMENT_") ||
    type === "ANSWERS_PUBLISHED" ||
    type === "SUBMISSION_RECEIVED" ||
    type === "GRADE_PUBLISHED"
  )
    return "assignment";
  if (
    type.startsWith("BILL_") ||
    type.startsWith("ENROLLMENT_") ||
    type === "PAYMENT_CONFIRMED" ||
    type === "TUITION_REMINDER"
  )
    return "tuition";
  if (type.startsWith("CURRICULUM_") || type.startsWith("FEEDBACK_"))
    return "curriculum";
  if (type === "ANNOUNCEMENT") return "announcement";
  return "schedule";
}

/**
 * Màn mở ra khi bấm thông báo, theo `target.kind` và vai trò.
 * Trả `null` khi vai trò không vào được màn đó: khi ấy chỉ đánh dấu đã đọc.
 */
export function notificationHref(
  item: NotificationItem,
  role: WebRole,
): string | null {
  const { kind, id } = item.target;
  const studentId = item.context.studentIds[0];
  const classId = item.context.classId;
  const teacher = role === ROLES.TEACHER;
  const staff = role === ROLES.STAFF;
  let href: string | null = null;
  switch (kind) {
    case "ASSIGNMENT":
      href = teacher ? ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(id) : null;
      break;
    case "SUBMISSION":
      href = teacher ? ROUTES.TEACHER.GRADING_DETAIL(id) : null;
      break;
    case "SESSION":
      href = `${teacher ? ROUTES.TEACHER.SCHEDULE : staff ? ROUTES.STAFF.SCHEDULE : ROUTES.MANAGER.SCHEDULE}?session=${encodeURIComponent(id)}`;
      break;
    case "CLASS": {
      const target = classId ?? id;
      href = teacher
        ? ROUTES.TEACHER.CLASS_DETAIL(target)
        : staff
          ? ROUTES.STAFF.CLASSES
          : ROUTES.MANAGER.CLASS_DETAIL(target);
      break;
    }
    case "LEAVE":
    case "MAKEUP":
    case "ENROLLMENT":
      href = teacher
        ? classId
          ? ROUTES.TEACHER.CLASS_DETAIL(classId)
          : ROUTES.TEACHER.SCHEDULE
        : !studentId
          ? null
          : staff
            ? ROUTES.STAFF.STUDENT_ACTION({
                studentId,
                action: kind === "ENROLLMENT" ? "change" : "makeup",
              })
            : ROUTES.MANAGER.STUDENT_DETAIL(studentId);
      break;
    case "REGISTRATION":
      href = staff
        ? ROUTES.STAFF.PAYMENTS
        : studentId
          ? ROUTES.MANAGER.STUDENT_DETAIL(studentId)
          : null;
      break;
    case "CURRICULUM_UNIT":
      href = teacher
        ? ROUTES.TEACHER.CURRICULUM_UNIT(id)
        : ROUTES.MANAGER.CURRICULUM_UNIT(id);
      break;
    case "FEEDBACK":
      href = teacher
        ? `${ROUTES.TEACHER.CURRICULUM}?tab=feedback`
        : `${ROUTES.MANAGER.CURRICULUM}?tab=feedback`;
      break;
  }
  return href && canAccessPath(role, href.split("?")[0]) ? href : null;
}

const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "5 phút trước", "14:20", "Hôm qua 21:10" hoặc "17/10" theo giờ Việt Nam. */
export function notificationTime(value: string, now = new Date()): string {
  const at = new Date(value);
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const day = todayInVietnam(at);
  const today = todayInVietnam(now);
  if (day === today) return timeFormat.format(at);
  if (day === todayInVietnam(new Date(now.getTime() - 86400000)))
    return `Hôm qua ${timeFormat.format(at)}`;
  return dateFormat.format(at);
}

export function isTodayInVietnam(value: string, now = new Date()): boolean {
  return todayInVietnam(new Date(value)) === todayInVietnam(now);
}

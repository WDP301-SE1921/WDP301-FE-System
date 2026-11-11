import { ROUTES } from "./routes";
import { AREA, canAccessArea, canAccessPath, type Area } from "./role-access";
import { ROLES, type WebRole } from "./roles";

/**
 * Key của badge đếm số trên menu. menu.ts chỉ khai báo item nào CÓ badge,
 * số thật do nơi render Sidebar truyền vào qua prop `badgeCounts`.
 */
export const MENU_BADGE_KEYS = {
  FAILED_EMAILS: "failedEmails",
  UNMARKED_SESSIONS_TODAY: "unmarkedSessionsToday",
  UNGRADED_SUBMISSIONS: "ungradedSubmissions",
  PENDING_AI_REVIEW: "pendingAiReview",
  PENDING_REGISTRATIONS: "pendingRegistrations",
  CHAT_UNREAD: "chatUnread",
} as const;

export type MenuBadgeKey =
  (typeof MENU_BADGE_KEYS)[keyof typeof MENU_BADGE_KEYS];

export type MenuBadgeCounts = Partial<Record<MenuBadgeKey, number>>;

export interface MenuItem {
  title: string;
  href: string;
  iconName: string;
  /** Area của item — sidebar chỉ hiện item mà role hiện tại vào được (`role-access.ts`). */
  area: Area;
  /** Chỉ các vai trò này thấy mục (ngoài kiểm area), vd. tổng quan riêng của Thiết kế giáo trình. */
  roles?: readonly WebRole[];
  badgeKey?: MenuBadgeKey;
  subItems?: MenuItem[];
}

export interface MenuGroup {
  groupTitle?: string;
  items: MenuItem[];
}

/**
 * Menu chung của khu back-office `/manager/*`; mỗi role thấy phần giao với `ROLE_AREAS`.
 * Thứ tự theo mức dùng: Tổng quan → việc hằng ngày → liên lạc → đào tạo → học phí → quản trị.
 * Các mục Đăng ký học và Lịch sử thanh toán chỉ vai trò `admin` vào được (BE không có admin)
 * nên giữ nguyên. Nghỉ/học bù nằm trong panel "Xử lý" của Nhân viên (`/staff/students`).
 */
export const MENU_BACK_OFFICE: MenuGroup[] = [
  {
    items: [
      {
        title: "Tổng quan",
        href: ROUTES.MANAGER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
        area: AREA.DASHBOARD,
      },
      {
        title: "Tổng quan",
        href: ROUTES.MANAGER.CURRICULUM_OVERVIEW,
        iconName: "DashboardSquare01Icon",
        area: AREA.CATALOG,
        roles: [ROLES.CURRICULUM_DESIGNER],
      },
    ],
  },
  {
    groupTitle: "HẰNG NGÀY",
    items: [
      {
        // Đổi giờ, hủy buổi và xếp dạy thay nằm trong Sheet buổi học.
        title: "Lịch học",
        href: ROUTES.MANAGER.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
      {
        // Gồm tab Phòng học (`?tab=rooms`) cho vai trò có quyền phòng.
        title: "Lớp học",
        href: ROUTES.MANAGER.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
      {
        // Gồm tab Học sinh và tab Phụ huynh (`?tab=parents`).
        title: "Học sinh & phụ huynh",
        href: ROUTES.MANAGER.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
      },
    ],
  },
  {
    groupTitle: "LIÊN LẠC",
    items: [
      {
        title: "Tin nhắn",
        href: ROUTES.MANAGER.CHAT,
        iconName: "BubbleChatIcon",
        area: AREA.CHAT,
        badgeKey: MENU_BADGE_KEYS.CHAT_UNREAD,
      },
      {
        title: "Thông báo",
        href: ROUTES.MANAGER.NOTIFICATIONS,
        iconName: "Megaphone01Icon",
        area: AREA.NOTIFICATIONS,
        badgeKey: MENU_BADGE_KEYS.FAILED_EMAILS,
      },
    ],
  },
  {
    groupTitle: "ĐÀO TẠO",
    items: [
      {
        // Quản lý: khóa học, môn học, phản hồi. Thiết kế giáo trình: giáo trình, phản hồi.
        title: "Khóa học & giáo trình",
        href: ROUTES.MANAGER.CURRICULUM,
        iconName: "LibraryIcon",
        area: AREA.CATALOG,
      },
    ],
  },
  {
    groupTitle: "HỌC PHÍ",
    items: [
      {
        title: "Đăng ký học",
        href: ROUTES.STAFF.ENROLLMENT_NEW,
        iconName: "UserAdd01Icon",
        area: AREA.ENROLLMENTS,
      },
      {
        title: "Lịch sử thanh toán",
        href: ROUTES.STAFF.PAYMENTS,
        iconName: "Invoice01Icon",
        area: AREA.PAYMENTS,
      },
    ],
  },
  {
    groupTitle: "QUẢN TRỊ",
    items: [
      {
        title: "Nhân sự",
        href: ROUTES.MANAGER.PEOPLE,
        iconName: "UserSettings01Icon",
        area: AREA.STAFF_ACCOUNTS,
      },
      {
        title: "Lịch sử thay đổi",
        href: ROUTES.MANAGER.AUDIT_LOGS,
        iconName: "HistoryIcon",
        area: AREA.AUDIT_LOGS,
      },
    ],
  },
];

/** Menu Nhân viên: việc quầy hằng ngày lên đầu, rồi lịch/lớp, cuối là liên lạc. */
export const MENU_STAFF: MenuGroup[] = [
  {
    items: [
      {
        title: "Tổng quan",
        href: ROUTES.STAFF.DASHBOARD,
        iconName: "DashboardSquare01Icon",
        area: AREA.DASHBOARD,
      },
    ],
  },
  {
    groupTitle: "HẰNG NGÀY",
    items: [
      {
        // Gồm cả tab Phụ huynh và panel Xử lý nghỉ học, học bù, đổi lớp, nghỉ hẳn.
        title: "Học sinh & phụ huynh",
        href: ROUTES.STAFF.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
      },
      {
        title: "Đăng ký học",
        href: ROUTES.STAFF.ENROLLMENT_NEW,
        iconName: "UserAdd01Icon",
        area: AREA.ENROLLMENTS,
      },
      {
        title: "Đăng ký & biên lai",
        href: ROUTES.STAFF.PAYMENTS,
        iconName: "Invoice01Icon",
        area: AREA.PAYMENTS,
        badgeKey: MENU_BADGE_KEYS.PENDING_REGISTRATIONS,
      },
      {
        title: "Lịch học",
        href: ROUTES.STAFF.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
      {
        title: "Lớp học",
        href: ROUTES.STAFF.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
    ],
  },
  {
    groupTitle: "LIÊN LẠC",
    items: [
      {
        title: "Tin nhắn",
        href: ROUTES.STAFF.CHAT,
        iconName: "BubbleChatIcon",
        area: AREA.CHAT,
        badgeKey: MENU_BADGE_KEYS.CHAT_UNREAD,
      },
    ],
  },
];

/** Menu Giáo viên: việc hằng ngày (dạy, chấm, nhắn tin) trước, lớp và tài liệu sau. */
export const MENU_TEACHER: MenuGroup[] = [
  {
    items: [
      {
        title: "Tổng quan",
        href: ROUTES.TEACHER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
        area: AREA.TEACHER_PORTAL,
      },
    ],
  },
  {
    groupTitle: "HẰNG NGÀY",
    items: [
      {
        title: "Lịch dạy & điểm danh",
        href: ROUTES.TEACHER.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.TEACHER_PORTAL,
        badgeKey: MENU_BADGE_KEYS.UNMARKED_SESSIONS_TODAY,
      },
      {
        title: "Bài tập & chấm bài",
        href: ROUTES.TEACHER.ASSIGNMENTS,
        iconName: "AssignmentsIcon",
        area: AREA.TEACHER_PORTAL,
        badgeKey: MENU_BADGE_KEYS.UNGRADED_SUBMISSIONS,
      },
      {
        title: "Tin nhắn",
        href: ROUTES.TEACHER.CHAT,
        iconName: "BubbleChatIcon",
        area: AREA.CHAT,
        badgeKey: MENU_BADGE_KEYS.CHAT_UNREAD,
      },
    ],
  },
  {
    groupTitle: "LỚP & TÀI LIỆU",
    items: [
      {
        title: "Lớp của tôi",
        href: ROUTES.TEACHER.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Giáo trình",
        href: ROUTES.TEACHER.CURRICULUM,
        iconName: "LibraryIcon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Báo cáo học tập",
        href: ROUTES.TEACHER.REPORTS,
        iconName: "Analytics01Icon",
        area: AREA.TEACHER_PORTAL,
      },
    ],
  },
];

/** Menu của một role: menu theo khu (back-office hoặc giáo viên), chỉ giữ item role đó vào được. */
export function getNavMenu(role: WebRole): MenuGroup[] {
  const source =
    role === ROLES.STAFF
      ? MENU_STAFF
      : role === ROLES.TEACHER
        ? MENU_TEACHER
        : MENU_BACK_OFFICE;
  return source
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.roles || item.roles.includes(role)) &&
          canAccessArea(role, item.area) &&
          canAccessPath(role, item.href),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/** Chỉ menu có đường dẫn khớp dài nhất được đánh dấu đang mở. */
export function getActiveMenuHref(
  pathname: string,
  groups: readonly MenuGroup[],
): string | null {
  let activeHref: string | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (
        (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
        (!activeHref || item.href.length > activeHref.length)
      ) {
        activeHref = item.href;
      }
    }
  }
  return activeHref;
}

export interface QuickCreateItem {
  title: string;
  href: string;
  iconName: string;
  area: Area;
}

/** Các lối tắt của nút "Tạo nhanh" trên header (chỉ back-office). */
export const QUICK_CREATE_ITEMS: QuickCreateItem[] = [
  {
    title: "Đăng ký học mới",
    href: ROUTES.STAFF.ENROLLMENT_NEW,
    iconName: "UserAdd01Icon",
    area: AREA.ENROLLMENTS,
  },
  {
    title: "Tạo lớp học mới",
    href: ROUTES.MANAGER.CLASS_NEW,
    iconName: "SchoolIcon",
    area: AREA.CLASSES,
  },
];

export function getQuickCreateItems(role: WebRole): QuickCreateItem[] {
  return QUICK_CREATE_ITEMS.filter(
    (item) => canAccessArea(role, item.area) && canAccessPath(role, item.href),
  );
}

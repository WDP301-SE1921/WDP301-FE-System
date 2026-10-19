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
  badgeKey?: MenuBadgeKey;
  subItems?: MenuItem[];
}

export interface MenuGroup {
  groupTitle?: string;
  items: MenuItem[];
}

/**
 * Menu chung của khu back-office `/manager/*`; mỗi role thấy phần giao với `ROLE_AREAS`.
 * Quản lý trung tâm thấy 8 mục; các mục Đăng ký học, Lịch sử thanh toán và nghỉ/học bù
 * chỉ vai trò `admin` vào được (BE không có admin) nên giữ nguyên.
 */
export const MENU_BACK_OFFICE: MenuGroup[] = [
  {
    groupTitle: "TỔNG QUAN",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.MANAGER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
        area: AREA.DASHBOARD,
      },
    ],
  },
  {
    groupTitle: "HỌC SINH",
    items: [
      {
        // Gồm tab Học sinh và tab Phụ huynh (`?tab=parents`).
        title: "Học sinh & phụ huynh",
        href: ROUTES.MANAGER.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
      },
      {
        title: "Đăng ký học",
        href: ROUTES.STAFF.ENROLLMENT_NEW,
        iconName: "UserAdd01Icon",
        area: AREA.ENROLLMENTS,
      },
    ],
  },
  {
    groupTitle: "THANH TOÁN",
    items: [
      {
        title: "Lịch sử thanh toán",
        href: ROUTES.STAFF.PAYMENTS,
        iconName: "Invoice01Icon",
        area: AREA.PAYMENTS,
      },
    ],
  },
  {
    groupTitle: "LỚP HỌC & LỊCH",
    items: [
      {
        // Gồm tab Phòng học (`?tab=rooms`) cho vai trò có quyền phòng.
        title: "Lớp học",
        href: ROUTES.MANAGER.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
      {
        // Đổi giờ, hủy buổi và xếp dạy thay nằm trong Sheet buổi học.
        title: "Lịch học",
        href: ROUTES.MANAGER.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
    ],
  },
  {
    groupTitle: "NGHỈ HỌC & HỌC BÙ",
    items: [
      {
        title: "Học bù",
        href: ROUTES.MANAGER.MAKEUP,
        iconName: "CalendarCheckIn01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Đổi buổi",
        href: ROUTES.MANAGER.SWAP_SESSION,
        iconName: "Exchange01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Đổi lịch cố định",
        href: ROUTES.MANAGER.CHANGE_CLASS,
        iconName: "RepeatIcon",
        area: AREA.ABSENCES,
      },
      {
        title: "Nghỉ dài hạn",
        href: ROUTES.MANAGER.LONG_LEAVE,
        iconName: "CalendarBlock01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Nghỉ môn / Nghỉ hẳn",
        href: ROUTES.MANAGER.WITHDRAW,
        iconName: "UserRemove01Icon",
        area: AREA.ABSENCES,
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
    groupTitle: "TRUNG TÂM",
    items: [
      {
        title: "Nhân sự",
        href: ROUTES.MANAGER.PEOPLE,
        iconName: "UserSettings01Icon",
        area: AREA.STAFF_ACCOUNTS,
      },
      {
        title: "Thông báo",
        href: ROUTES.MANAGER.NOTIFICATIONS,
        iconName: "Megaphone01Icon",
        area: AREA.NOTIFICATIONS,
        badgeKey: MENU_BADGE_KEYS.FAILED_EMAILS,
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

export const MENU_STAFF: MenuGroup[] = [
  {
    groupTitle: "HỌC SINH",
    items: [
      {
        // Gồm cả tab Phụ huynh và panel Xử lý nghỉ học, học bù, đổi lớp, nghỉ hẳn.
        title: "Học sinh & phụ huynh",
        href: ROUTES.STAFF.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
      },
    ],
  },
  {
    groupTitle: "LỚP HỌC & LỊCH",
    items: [
      {
        title: "Lớp học",
        href: ROUTES.STAFF.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
      {
        title: "Lịch học",
        href: ROUTES.STAFF.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
    ],
  },
  {
    groupTitle: "ĐĂNG KÝ & HỌC PHÍ",
    items: [
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
      },
    ],
  },
];

export const MENU_TEACHER: MenuGroup[] = [
  {
    groupTitle: "TỔNG QUAN",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.TEACHER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
        area: AREA.TEACHER_PORTAL,
      },
    ],
  },
  {
    groupTitle: "GIẢNG DẠY",
    items: [
      {
        title: "Lịch dạy",
        href: ROUTES.TEACHER.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Lớp của tôi",
        href: ROUTES.TEACHER.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Thẩm định giáo trình",
        href: ROUTES.TEACHER.CURRICULUM,
        iconName: "AssignmentsIcon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Điểm danh",
        href: ROUTES.TEACHER.ATTENDANCE,
        iconName: "CheckListIcon",
        area: AREA.TEACHER_PORTAL,
        badgeKey: MENU_BADGE_KEYS.UNMARKED_SESSIONS_TODAY,
      },
    ],
  },
  {
    groupTitle: "BÀI TẬP & KIỂM TRA",
    items: [
      {
        title: "Bài tập / Đề kiểm tra",
        href: ROUTES.TEACHER.ASSIGNMENTS,
        iconName: "AssignmentsIcon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Bài nộp của học sinh",
        href: ROUTES.TEACHER.SUBMISSIONS,
        iconName: "InboxIcon",
        area: AREA.TEACHER_PORTAL,
        badgeKey: MENU_BADGE_KEYS.UNGRADED_SUBMISSIONS,
      },
    ],
  },
  {
    groupTitle: "CHẤM BÀI AI",
    items: [
      {
        title: "Chấm bài",
        href: ROUTES.TEACHER.GRADING,
        iconName: "AiBrain01Icon",
        area: AREA.TEACHER_PORTAL,
        badgeKey: MENU_BADGE_KEYS.PENDING_AI_REVIEW,
      },
    ],
  },
  {
    groupTitle: "BÁO CÁO",
    items: [
      {
        title: "Báo cáo",
        href: ROUTES.TEACHER.REPORTS,
        iconName: "Analytics01Icon",
        area: AREA.TEACHER_PORTAL,
      },
      {
        title: "Phản hồi giáo trình",
        href: ROUTES.TEACHER.FEEDBACK,
        iconName: "AssignmentsIcon",
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
          canAccessArea(role, item.area) && canAccessPath(role, item.href),
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

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

/** Menu chung của khu back-office `/manager/*`; mỗi role thấy phần giao với `ROLE_AREAS`. */
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
    groupTitle: "HỌC SINH & PHỤ HUYNH",
    items: [
      {
        title: "Học sinh",
        href: ROUTES.MANAGER.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
      },
      {
        title: "Phụ huynh",
        href: ROUTES.MANAGER.PARENTS,
        iconName: "UserGroupIcon",
        area: AREA.PARENTS,
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
        title: "Lớp học",
        href: ROUTES.MANAGER.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
      {
        title: "Lịch học tổng",
        href: ROUTES.MANAGER.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
      {
        title: "Xếp lịch & buổi học",
        href: ROUTES.MANAGER.SESSIONS,
        iconName: "Clock01Icon",
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
    groupTitle: "GIÁO VIÊN",
    items: [
      {
        title: "Danh sách giáo viên",
        href: ROUTES.MANAGER.TEACHERS,
        iconName: "TeacherIcon",
        area: AREA.TEACHERS,
      },
      {
        title: "Lời mời & duyệt",
        href: ROUTES.MANAGER.TEACHER_INVITATIONS,
        iconName: "MailAdd01Icon",
        area: AREA.TEACHERS,
      },
      {
        title: "Dạy thay",
        href: ROUTES.MANAGER.TEACHER_SUBSTITUTES,
        iconName: "UserSwitchIcon",
        area: AREA.TEACHERS,
      },
    ],
  },
  {
    groupTitle: "DANH MỤC ĐÀO TẠO",
    items: [
      {
        title: "Giáo trình",
        href: ROUTES.MANAGER.CURRICULUM,
        iconName: "LibraryIcon",
        area: AREA.CATALOG,
      },
      {
        title: "Danh mục",
        href: ROUTES.MANAGER.CATALOG,
        iconName: "LibraryIcon",
        area: AREA.CATALOG,
      },
      {
        title: "Phản hồi giáo trình",
        href: ROUTES.MANAGER.CURRICULUM_FEEDBACK,
        iconName: "AssignmentsIcon",
        area: AREA.CATALOG,
      },
      {
        title: "Phòng học",
        href: ROUTES.MANAGER.ROOMS,
        iconName: "Door01Icon",
        area: AREA.ROOMS,
      },
    ],
  },
  {
    groupTitle: "THÔNG BÁO",
    items: [
      {
        title: "Lịch sử email",
        href: ROUTES.MANAGER.EMAIL_LOGS,
        iconName: "Mail01Icon",
        area: AREA.NOTIFICATIONS,
        badgeKey: MENU_BADGE_KEYS.FAILED_EMAILS,
      },
      {
        title: "Gửi thông báo",
        href: ROUTES.MANAGER.SEND_NOTIFICATION,
        iconName: "Megaphone01Icon",
        area: AREA.NOTIFICATIONS,
      },
    ],
  },
  {
    groupTitle: "HỆ THỐNG",
    items: [
      {
        title: "Nhân sự trung tâm",
        href: ROUTES.MANAGER.STAFF_ACCOUNTS,
        iconName: "UserSettings01Icon",
        area: AREA.STAFF_ACCOUNTS,
      },
      {
        title: "Quản lý trung tâm",
        href: ROUTES.MANAGER.MANAGERS,
        iconName: "UserGroupIcon",
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

export const MENU_STAFF: MenuGroup[] = [
  {
    groupTitle: "NGHỈ HỌC & XẾP LỚP",
    items: [
      {
        title: "Nghỉ học và học bù",
        href: ROUTES.STAFF.MAKEUP,
        iconName: "CalendarCheckIn01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Đổi một buổi học",
        href: ROUTES.STAFF.SWAP_SESSION,
        iconName: "Exchange01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Đổi lớp và lịch cố định",
        href: ROUTES.STAFF.CHANGE_CLASS,
        iconName: "RepeatIcon",
        area: AREA.ABSENCES,
      },
      {
        title: "Nghỉ dài hạn",
        href: ROUTES.STAFF.LONG_LEAVE,
        iconName: "CalendarBlock01Icon",
        area: AREA.ABSENCES,
      },
      {
        title: "Nghỉ môn / Nghỉ hẳn",
        href: ROUTES.STAFF.WITHDRAW,
        iconName: "UserRemove01Icon",
        area: AREA.ABSENCES,
      },
    ],
  },
  {
    groupTitle: "LỚP HỌC & LỊCH",
    items: [
      {
        title: "Lớp học / thêm học sinh",
        href: ROUTES.STAFF.CLASSES,
        iconName: "SchoolIcon",
        area: AREA.CLASSES,
      },
      {
        title: "Buổi học",
        href: ROUTES.STAFF.SCHEDULE,
        iconName: "Calendar03Icon",
        area: AREA.SCHEDULE,
      },
    ],
  },
  {
    groupTitle: "ĐĂNG KÝ & THU HỌC PHÍ",
    items: [
      {
        title: "Đăng ký học",
        href: ROUTES.STAFF.ENROLLMENT_NEW,
        iconName: "UserAdd01Icon",
        area: AREA.ENROLLMENTS,
      },
      {
        title: "Phụ huynh",
        href: ROUTES.STAFF.PARENTS,
        iconName: "UserGroupIcon",
        area: AREA.PARENTS,
      },
      {
        title: "Hồ sơ con",
        href: ROUTES.STAFF.STUDENTS,
        iconName: "StudentsIcon",
        area: AREA.STUDENTS,
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
          canAccessArea(role, item.area) &&
          canAccessPath(role, item.href) &&
          !(
            role === ROLES.CURRICULUM_DESIGNER &&
            item.href === ROUTES.MANAGER.CATALOG
          ),
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

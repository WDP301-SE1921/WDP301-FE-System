import { ROUTES } from "./routes"
import { ROLES, type Role } from "./roles"

/**
 * Key của badge đếm số trên menu. menu.ts chỉ khai báo item nào CÓ badge,
 * số thật do nơi render Sidebar truyền vào qua prop `badgeCounts`.
 */
export const MENU_BADGE_KEYS = {
  PENDING_LINK_CODES: "pendingLinkCodes",
  FAILED_EMAILS: "failedEmails",
  UNMARKED_SESSIONS_TODAY: "unmarkedSessionsToday",
  UNGRADED_SUBMISSIONS: "ungradedSubmissions",
  PENDING_AI_REVIEW: "pendingAiReview",
} as const

export type MenuBadgeKey = (typeof MENU_BADGE_KEYS)[keyof typeof MENU_BADGE_KEYS]

export type MenuBadgeCounts = Partial<Record<MenuBadgeKey, number>>

export interface MenuItem {
  title: string
  href: string
  iconName: string
  badgeKey?: MenuBadgeKey
  subItems?: MenuItem[]
}

export interface MenuGroup {
  groupTitle?: string
  items: MenuItem[]
}

export const MENU_MANAGER: MenuGroup[] = [
  {
    groupTitle: "TỔNG QUAN",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.MANAGER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
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
      },
      {
        title: "Phụ huynh",
        href: ROUTES.MANAGER.PARENTS,
        iconName: "UserGroupIcon",
      },
      {
        title: "Đăng ký học",
        href: ROUTES.MANAGER.ENROLLMENT_NEW,
        iconName: "UserAdd01Icon",
      },
      {
        title: "Link / mã liên kết",
        href: ROUTES.MANAGER.LINK_CODES,
        iconName: "Link01Icon",
        badgeKey: MENU_BADGE_KEYS.PENDING_LINK_CODES,
      },
    ],
  },
  {
    groupTitle: "THANH TOÁN",
    items: [
      {
        title: "Lịch sử thanh toán",
        href: ROUTES.MANAGER.PAYMENTS,
        iconName: "Invoice01Icon",
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
      },
      {
        title: "Lịch học tổng",
        href: ROUTES.MANAGER.SCHEDULE,
        iconName: "Calendar03Icon",
      },
      {
        title: "Buổi học",
        href: ROUTES.MANAGER.SESSIONS,
        iconName: "Clock01Icon",
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
      },
      {
        title: "Đổi buổi",
        href: ROUTES.MANAGER.SWAP_SESSION,
        iconName: "Exchange01Icon",
      },
      {
        title: "Đổi lịch cố định",
        href: ROUTES.MANAGER.CHANGE_CLASS,
        iconName: "RepeatIcon",
      },
      {
        title: "Nghỉ dài hạn",
        href: ROUTES.MANAGER.LONG_LEAVE,
        iconName: "CalendarBlock01Icon",
      },
      {
        title: "Nghỉ môn / Nghỉ hẳn",
        href: ROUTES.MANAGER.WITHDRAW,
        iconName: "UserRemove01Icon",
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
      },
      {
        title: "Lời mời & duyệt",
        href: ROUTES.MANAGER.TEACHER_INVITATIONS,
        iconName: "MailAdd01Icon",
      },
      {
        title: "Dạy thay",
        href: ROUTES.MANAGER.TEACHER_SUBSTITUTES,
        iconName: "UserSwitchIcon",
      },
    ],
  },
  {
    groupTitle: "DANH MỤC ĐÀO TẠO",
    items: [
      {
        title: "Danh mục",
        href: ROUTES.MANAGER.CATALOG,
        iconName: "LibraryIcon",
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
        badgeKey: MENU_BADGE_KEYS.FAILED_EMAILS,
      },
      {
        title: "Gửi thông báo",
        href: ROUTES.MANAGER.SEND_NOTIFICATION,
        iconName: "Megaphone01Icon",
      },
    ],
  },
  {
    groupTitle: "HỆ THỐNG",
    items: [
      {
        title: "Quản lý viên",
        href: ROUTES.MANAGER.MANAGERS,
        iconName: "UserSettings01Icon",
      },
      {
        title: "Lịch sử thay đổi",
        href: ROUTES.MANAGER.AUDIT_LOGS,
        iconName: "HistoryIcon",
      },
    ],
  },
]

export const MENU_TEACHER: MenuGroup[] = [
  {
    groupTitle: "TỔNG QUAN",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.TEACHER.DASHBOARD,
        iconName: "DashboardSquare01Icon",
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
      },
      {
        title: "Lớp của tôi",
        href: ROUTES.TEACHER.CLASSES,
        iconName: "SchoolIcon",
      },
      {
        title: "Điểm danh",
        href: ROUTES.TEACHER.ATTENDANCE,
        iconName: "CheckListIcon",
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
      },
      {
        title: "Bài nộp của học sinh",
        href: ROUTES.TEACHER.SUBMISSIONS,
        iconName: "InboxIcon",
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
      },
    ],
  },
]

export const NAV_MENU: Record<Extract<Role, "manager" | "teacher">, MenuGroup[]> = {
  [ROLES.MANAGER]: MENU_MANAGER,
  [ROLES.TEACHER]: MENU_TEACHER,
}

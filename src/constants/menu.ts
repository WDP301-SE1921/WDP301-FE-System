import { ROUTES } from "./routes"
import { ROLES, type Role } from "./roles"

export interface MenuItem {
  title: string
  href: string
  iconName: string
  badge?: number | string
  subItems?: MenuItem[]
}

export interface MenuGroup {
  groupTitle?: string
  items: MenuItem[]
}

export const NAV_MENU: Record<Extract<Role, "manager" | "teacher">, MenuGroup[]> = {
  [ROLES.MANAGER]: [
    {
      groupTitle: "Tổng quan",
      items: [
        {
          title: "Bảng điều khiển",
          href: ROUTES.MANAGER.DASHBOARD,
          iconName: "DashboardSquare01Icon",
        },
      ],
    },
    {
      groupTitle: "Quản lý đào tạo",
      items: [
        {
          title: "Lớp học & Lịch",
          href: ROUTES.MANAGER.CLASSES,
          iconName: "TeacherIcon",
        },
        {
          title: "Giáo viên",
          href: ROUTES.MANAGER.TEACHERS,
          iconName: "UserGroupIcon",
        },
        {
          title: "Học sinh & Phụ huynh",
          href: ROUTES.MANAGER.STUDENTS,
          iconName: "UserIcon",
        },
      ],
    },
    {
      groupTitle: "Tài chính & Học phí",
      items: [
        {
          title: "Thanh toán",
          href: ROUTES.MANAGER.PAYMENTS,
          iconName: "Invoice01Icon",
        },
      ],
    },
  ],
  [ROLES.TEACHER]: [
    {
      groupTitle: "Giảng dạy",
      items: [
        {
          title: "Lịch dạy",
          href: ROUTES.TEACHER.SCHEDULE,
          iconName: "Calendar01Icon",
        },
        {
          title: "Điểm danh",
          href: ROUTES.TEACHER.ATTENDANCE,
          iconName: "Task01Icon",
        },
        {
          title: "Chấm điểm",
          href: ROUTES.TEACHER.GRADING,
          iconName: "PencilEdit01Icon",
        },
        {
          title: "Báo cáo học tập",
          href: ROUTES.TEACHER.REPORTS,
          iconName: "Analytics01Icon",
        },
      ],
    },
  ],
}

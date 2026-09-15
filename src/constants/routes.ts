export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    ABOUT: "/about",
  },
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
    ACTIVATE: "/activate",
  },
  MANAGER: {
    DASHBOARD: "/manager/dashboard",
    CLASSES: "/manager/classes",
    TEACHERS: "/manager/teachers",
    STUDENTS: "/manager/students",
    PAYMENTS: "/manager/payments",
  },
  TEACHER: {
    SCHEDULE: "/teacher/schedule",
    ATTENDANCE: "/teacher/attendance",
    GRADING: "/teacher/grading",
    REPORTS: "/teacher/reports",
  },
} as const

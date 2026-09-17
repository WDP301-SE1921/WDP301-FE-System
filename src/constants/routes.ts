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

    STUDENTS: "/manager/students",
    PARENTS: "/manager/parents",
    ENROLLMENT_NEW: "/manager/enrollments/new",
    LINK_CODES: "/manager/link-codes",

    PAYMENTS: "/manager/payments",

    CLASSES: "/manager/classes",
    SCHEDULE: "/manager/schedule",
    SESSIONS: "/manager/sessions",

    MAKEUP: "/manager/absences/makeup",
    SWAP_SESSION: "/manager/absences/swap",
    CHANGE_CLASS: "/manager/absences/change-class",
    LONG_LEAVE: "/manager/absences/long-leave",
    WITHDRAW: "/manager/absences/withdraw",

    TEACHERS: "/manager/teachers",
    TEACHER_INVITATIONS: "/manager/teachers/invitations",
    TEACHER_SUBSTITUTES: "/manager/teachers/substitutes",

    CATALOG: "/manager/catalog",

    EMAIL_LOGS: "/manager/notifications/emails",
    SEND_NOTIFICATION: "/manager/notifications/send",

    MANAGERS: "/manager/system/managers",
    AUDIT_LOGS: "/manager/system/audit-logs",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",

    SCHEDULE: "/teacher/schedule",
    CLASSES: "/teacher/classes",
    ATTENDANCE: "/teacher/attendance",

    ASSIGNMENTS: "/teacher/assignments",
    SUBMISSIONS: "/teacher/submissions",

    GRADING: "/teacher/grading",

    REPORTS: "/teacher/reports",
  },
} as const

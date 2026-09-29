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
    STUDENT_DETAIL: (id: string) => `/manager/students/${id}`,
    PARENTS: "/manager/parents",
    PARENT_DETAIL: (id: string) => `/manager/parents/${id}`,
    ENROLLMENT_NEW: "/manager/enrollments/new",
    LINK_CODES: "/manager/link-codes",

    PAYMENTS: "/manager/payments",

    CLASSES: "/manager/classes",
    CLASS_NEW: "/manager/classes/new",
    CLASS_DETAIL: (id: string) => `/manager/classes/${id}`,
    SCHEDULE: "/manager/schedule",
    SESSIONS: "/manager/sessions",

    MAKEUP: "/manager/absences/makeup",
    SWAP_SESSION: "/manager/absences/swap",
    CHANGE_CLASS: "/manager/absences/change-class",
    LONG_LEAVE: "/manager/absences/long-leave",
    WITHDRAW: "/manager/absences/withdraw",

    TEACHERS: "/manager/teachers",
    TEACHER_DETAIL: (id: string) => `/manager/teachers/${id}`,
    TEACHER_INVITATIONS: "/manager/teachers/invitations",
    TEACHER_SUBSTITUTES: "/manager/teachers/substitutes",

    CATALOG: "/manager/catalog",
    CATALOG_PROGRAM_DETAIL: (id: string) => `/manager/catalog/programs/${id}`,

    EMAIL_LOGS: "/manager/notifications/emails",
    SEND_NOTIFICATION: "/manager/notifications/send",

    MANAGERS: "/manager/system/managers",
    AUDIT_LOGS: "/manager/system/audit-logs",

    PROFILE: "/manager/profile",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",

    SCHEDULE: "/teacher/schedule",
    CLASSES: "/teacher/classes",
    CLASS_DETAIL: (id: string) => `/teacher/classes/${id}`,
    ATTENDANCE: "/teacher/attendance",
    ATTENDANCE_SESSION: (id: string) => `/teacher/attendance/${id}`,

    ASSIGNMENTS: "/teacher/assignments",
    ASSIGNMENT_NEW: "/teacher/assignments/new",
    ASSIGNMENT_EDIT: (id: string) => `/teacher/assignments/${id}/edit`,
    ASSIGNMENT_SUBMISSIONS: (id: string) => `/teacher/assignments/${id}/submissions`,
    SUBMISSIONS: "/teacher/submissions",

    GRADING: "/teacher/grading",
    GRADING_DETAIL: (submissionId: string) => `/teacher/grading/${submissionId}`,

    REPORTS: "/teacher/reports",

    PROFILE: "/teacher/profile",
  },
} as const

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
    /** Mở wizard đăng ký với phụ huynh / hồ sơ con đã chọn sẵn (`?parentId=&studentId=`). */
    ENROLLMENT_NEW_FOR: (params: { parentId?: string; studentId?: string }) => {
      const query = new URLSearchParams()
      if (params.parentId) query.set("parentId", params.parentId)
      if (params.studentId) query.set("studentId", params.studentId)
      const queryString = query.toString()
      return queryString
        ? `/manager/enrollments/new?${queryString}`
        : "/manager/enrollments/new"
    },

    PAYMENTS: "/manager/payments",

    CLASSES: "/manager/classes",
    /** Danh sách lớp đã lọc các lớp chưa có giáo viên — điểm vào để gán giáo viên. */
    CLASSES_UNASSIGNED: "/manager/classes?teacher=unassigned",
    CLASS_NEW: "/manager/classes/new",
    CLASS_DETAIL: (id: string) => `/manager/classes/${id}`,
    SCHEDULE: "/manager/schedule",
    SESSIONS: "/manager/sessions",

    MAKEUP: "/manager/absences/makeup",
    /** Mở luồng xếp học bù với học sinh + buổi nghỉ chọn sẵn (`?studentId=&sessionId=`). */
    MAKEUP_FOR: (params: { studentId: string; sessionId: string }) =>
      `/manager/absences/makeup?studentId=${params.studentId}&sessionId=${params.sessionId}`,
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

    STAFF_ACCOUNTS: "/manager/system/staff",
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

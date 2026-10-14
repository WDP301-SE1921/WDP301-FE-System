export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    ABOUT: "/about",
  },
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    ACCEPT_INVITATION: "/accept-invitation",
    REGISTER: "/register",
  },
  MANAGER: {
    DASHBOARD: "/manager/dashboard",

    STUDENTS: "/manager/students",
    STUDENT_DETAIL: (id: string) => `/manager/students/${id}`,
    PARENTS: "/manager/parents",
    PARENT_DETAIL: (id: string) => `/manager/parents/${id}`,
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
    ROOMS: "/manager/rooms",
    CURRICULUM: "/manager/curriculum",
    CURRICULUM_FEEDBACK: "/manager/curriculum/feedback",
    CURRICULUM_UNIT: (id: string) => `/manager/curriculum/${id}`,
    CLASS_SESSIONS: (id: string) => `/manager/classes/${id}/sessions`,

    EMAIL_LOGS: "/manager/notifications/emails",
    SEND_NOTIFICATION: "/manager/notifications/send",

    STAFF_ACCOUNTS: "/manager/system/staff",
    MANAGERS: "/manager/system/managers",
    AUDIT_LOGS: "/manager/system/audit-logs",

    PROFILE: "/manager/profile",
  },
  STAFF: {
    ENROLLMENT_NEW: "/staff/enrollments/new",
    /** Mở wizard đăng ký với phụ huynh / hồ sơ con đã chọn sẵn (`?parentId=&studentId=`). */
    ENROLLMENT_NEW_FOR: (params: {
      parentId?: string;
      studentId?: string;
      email?: string;
      classId?: string;
    }) => {
      const query = new URLSearchParams();
      if (params.parentId) query.set("parentId", params.parentId);
      if (params.studentId) query.set("studentId", params.studentId);
      if (params.email) query.set("email", params.email);
      if (params.classId) query.set("classId", params.classId);
      const queryString = query.toString();
      return queryString
        ? `/staff/enrollments/new?${queryString}`
        : "/staff/enrollments/new";
    },

    PAYMENTS: "/staff/payments",

    PARENTS: "/staff/parents",
    STUDENTS: "/staff/students",
    STUDENT_DETAIL: (id: string) => `/staff/students/${id}`,
    MAKEUP: "/staff/absences/makeup",
    SWAP_SESSION: "/staff/absences/swap",
    CHANGE_CLASS: "/staff/absences/change-class",
    LONG_LEAVE: "/staff/absences/long-leave",
    WITHDRAW: "/staff/absences/withdraw",
    PROFILE: "/staff/profile",
    CLASSES: "/staff/classes",
    SCHEDULE: "/staff/schedule",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",

    SCHEDULE: "/teacher/schedule",
    CLASSES: "/teacher/classes",
    CURRICULUM: "/teacher/curriculum",
    CURRICULUM_UNIT: (id: string) => `/teacher/curriculum/${id}`,
    CLASS_DETAIL: (id: string) => `/teacher/classes/${id}`,
    ATTENDANCE: "/teacher/attendance",
    ATTENDANCE_SESSION: (id: string) => `/teacher/attendance/${id}`,

    ASSIGNMENTS: "/teacher/assignments",
    ASSIGNMENT_NEW: "/teacher/assignments/new",
    ASSIGNMENT_EDIT: (id: string) => `/teacher/assignments/${id}/edit`,
    ASSIGNMENT_SUBMISSIONS: (id: string) =>
      `/teacher/assignments/${id}/submissions`,
    SUBMISSIONS: "/teacher/submissions",

    GRADING: "/teacher/grading",
    GRADING_DETAIL: (submissionId: string) =>
      `/teacher/grading/${submissionId}`,

    REPORTS: "/teacher/reports",
    FEEDBACK: "/teacher/feedback",

    PROFILE: "/teacher/profile",
  },
} as const;

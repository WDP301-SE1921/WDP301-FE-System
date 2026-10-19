export const AUDIT_ACTION_LABELS: Record<string, string> = {
  DEMO_SEED_CREATED: "Tạo dữ liệu demo",
  REGISTRATION_CONFIRM_PAYMENT: "Xác nhận thanh toán",
  REGISTRATION_CANCEL_DRAFT: "Hủy đăng ký nháp",
  ENROLLMENT_END: "Kết thúc môn học",
  STUDENT_END_STUDY: "Nghỉ hẳn",
  STUDENT_REACTIVATE: "Cho học lại",
  LEAVE_END_EARLY: "Kết thúc nghỉ dài hạn sớm",
  MAKEUP_RESCHEDULE: "Đổi buổi học bù",
  CLASS_TEACHER_ASSIGNED: "Đổi giáo viên phụ trách",
  SESSION_SUBSTITUTE_ASSIGNED: "Xếp giáo viên dạy thay",
  CLASS_SCHEDULE_CONFIRMED: "Xác nhận lịch lớp",
  CLASS_SCHEDULE_UNLOCKED: "Mở khóa lịch lớp",
  CLASS_SESSIONS_GENERATED: "Sinh buổi học",
  CLASS_SESSION_RESCHEDULED: "Đổi giờ buổi học",
  CLASS_SESSION_CANCELLED: "Hủy buổi học",
  CURRICULUM_UNIT_SUBMITTED: "Gửi duyệt giáo trình",
  CURRICULUM_UNIT_CHANGES_REQUESTED: "Yêu cầu sửa giáo trình",
  CURRICULUM_UNIT_APPROVED: "Duyệt giáo trình",
  CURRICULUM_TECHNICAL_REVIEW_APPROVED: "Duyệt chuyên môn giáo trình",
  CURRICULUM_TECHNICAL_CHANGES_REQUESTED: "Yêu cầu sửa nội dung chuyên môn",
  PROGRAM_DELETE: "Xóa khóa học",
  PROFILE_UPDATED: "Cập nhật hồ sơ",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  PASSWORD_RESET: "Đặt lại mật khẩu",
  LEAVE_APPROVED: "Duyệt đơn nghỉ",
  PARENT_ACCOUNT_UPDATE: "Cập nhật tài khoản phụ huynh",
  PARENT_ACCOUNT_DELETE: "Xóa tài khoản phụ huynh",
  STUDENT_PROFILE_UPDATED: "Sửa hồ sơ học sinh",
  STAFF_ACCOUNT_CREATE: "Tạo tài khoản nhân viên",
  STAFF_ACCOUNT_UPDATE: "Cập nhật tài khoản nhân viên",
  TEACHER_ACCOUNT_CREATE: "Tạo tài khoản giáo viên",
  TEACHER_ACCOUNT_UPDATE: "Cập nhật tài khoản giáo viên",
  CURRICULUM_DESIGNER_ACCOUNT_CREATE: "Tạo tài khoản thiết kế giáo trình",
  CURRICULUM_DESIGNER_ACCOUNT_UPDATE: "Cập nhật tài khoản thiết kế giáo trình",
  MANAGER_ACCOUNT_CREATE: "Tạo tài khoản quản lý",
  MANAGER_ACCOUNT_UPDATE: "Cập nhật tài khoản quản lý",
  ACCOUNT_INVITATION_APPROVED: "Duyệt tài khoản được mời",
  ACCOUNT_INVITATION_REJECTED: "Từ chối tài khoản được mời",
};
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  DemoDataset: "Dữ liệu demo",
  RegistrationOrder: "Đăng ký",
  Enrollment: "Ghi danh",
  StudentProfile: "Hồ sơ học sinh",
  LeaveRequest: "Đơn nghỉ",
  MakeupBooking: "Học bù",
  Class: "Lớp",
  ClassSession: "Buổi học",
  ScheduleGeneration: "Đợt sinh lịch",
  CurriculumUnit: "Giáo trình",
  Program: "Khóa học",
  User: "Tài khoản",
  AccountInvitation: "Lời mời",
};

export function auditActionLabel(action: string): string {
  return Object.hasOwn(AUDIT_ACTION_LABELS, action)
    ? AUDIT_ACTION_LABELS[action]
    : "Cập nhật thông tin";
}

export function auditEntityLabel(entityType: string): string {
  return Object.hasOwn(AUDIT_ENTITY_LABELS, entityType)
    ? AUDIT_ENTITY_LABELS[entityType]
    : "Đối tượng khác";
}

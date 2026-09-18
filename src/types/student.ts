/**
 * Học sinh, phụ huynh, đăng ký học, thanh toán, điểm danh.
 * Tên field bám theo `.claude/rules/data-contracts.md`.
 *
 * Field TÍNH ĐƯỢC (tỷ lệ đi học, số con, hạn gói gần nhất) cố tình KHÔNG nằm trong
 * các interface này — chúng được derive ở `src/features/<domain>/selectors.ts`.
 */

export type StudentStatus = "active" | "paused" | "withdrawn" | "pending_link"
export type ParentAccountStatus = "activated" | "pending_link"
export type EnrollmentStatus = "active" | "reserved" | "dropped"
export type PaymentStatus = "succeeded" | "pending" | "failed"
export type AttendanceStatus = "present" | "absent" | "made_up" | "excused"
export type LinkCodeStatus = "active" | "used" | "expired"
export type EmailStatus = "sent" | "pending" | "failed"

/** Contract: id, email, phone. `email` là email đăng nhập, duy nhất. */
export interface ParentAccount {
  id: string
  email: string
  /** Chỉ dùng để liên hệ, không duy nhất. */
  phone: string
  status: ParentAccountStatus
  createdAt: string
  activatedAt?: string
}

/** Contract: id, parentAccountId, name. */
export interface StudentProfile {
  id: string
  parentAccountId: string
  name: string
  /** Mã hồ sơ hiển thị, vd "HS-2024-0012". */
  code: string
  grade: number
  status: StudentStatus
  createdAt: string
}

/** Contract: id, studentProfileId, subjectId, classId, months, status. */
export interface Enrollment {
  id: string
  studentProfileId: string
  subjectId: string
  classId: string
  /** Số tháng đăng ký, 1–12 (`BUSINESS_RULES.ENROLLMENT_MONTHS_*`). */
  months: number
  status: EnrollmentStatus
  startDate: string
  endDate: string
  tuitionAmount: number
  /** Số bài đã học của chương trình, dùng cho thanh tiến độ. */
  completedLessons: number
}

export type PaymentMethod =
  | "cash"
  | "qr_vcb"
  | "qr_mbbank"
  | "qr_bidv"
  | "qr_techcombank"
  | "vnpay"

/** Contract: id, enrollmentId, confirmedAt, confirmedBy. */
export interface Payment {
  id: string
  enrollmentId: string
  confirmedAt: string
  /** Id của quản lý đã xác nhận. */
  confirmedBy: string
  amount: number
  status: PaymentStatus
  /** Mã giao dịch hiển thị, vd "TXN-20260915-081". */
  code: string
  /** Mã biên lai hiển thị, vd "BL-20260915-0012". */
  receiptCode: string
  method: PaymentMethod
}

/** Contract: id, enrollmentId, token, expiresAt, usedAt. */
export interface ActivationLink {
  id: string
  enrollmentId: string
  /**
   * Credential dùng một lần — KHÔNG BAO GIỜ render ra UI hay log.
   * Phần hiển thị cho quản lý là `code`.
   */
  token: string
  /** Mã ngắn để quản lý đọc cho phụ huynh, vd "EDU-BA-KHANG06". */
  code: string
  expiresAt: string
  usedAt?: string
}

/** Contract: id, classSessionId, studentProfileId, status. */
export interface AttendanceRecord {
  id: string
  classSessionId: string
  studentProfileId: string
  status: AttendanceStatus
  note?: string
}

export interface EmailLog {
  id: string
  parentAccountId: string
  category: string
  subject: string
  status: EmailStatus
  sentAt: string
  actorName: string
}

export interface AuditLogEntry {
  id: string
  studentProfileId?: string
  parentAccountId?: string
  actorName: string
  label: string
  description: string
  createdAt: string
  variant: "default" | "success" | "warning" | "danger" | "info"
}

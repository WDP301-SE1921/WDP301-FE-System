import { findClass, findProgram } from "@/mocks/data/catalog"
import { findParent } from "@/mocks/data/parents"
import { MOCK_PAYMENTS } from "@/mocks/data/payments"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import type { EnrollmentInput } from "@/lib/validators/enrollment"
import type { EmailStatus } from "@/types/student"

/**
 * Đăng ký học giả lập cho giai đoạn MOCK-ONLY, theo `.claude/skills/enrollment-flow`:
 * phụ huynh và hồ sơ con đã có sẵn (tạo trên app mobile), nhân viên chọn phụ huynh (tìm Gmail) → chọn con →
 * chọn lớp → thu tiền. Sinh Payment → Enrollment (`active`, gắn thẳng vào hồ sơ con) →
 * gửi email biên lai. Không tạo phụ huynh/hồ sơ con và không có link/mã liên kết.
 *
 * Xóa file này trong cùng PR nối endpoint đăng ký thật.
 */

export interface CreateEnrollmentRequest extends EnrollmentInput {
  /** Id nhân viên xác nhận thu tiền (người đang đăng nhập). */
  confirmedBy: string
}

export interface EnrollmentResult {
  studentProfileId: string
  studentName: string
  parentEmail: string
  enrollmentId: string
  /** Id giao dịch, dùng để dựng biên lai qua cùng selector với màn Thanh toán. */
  paymentId: string
  receiptCode: string
  amount: number
  confirmedAt: string
  emailStatus: EmailStatus
}

let sequence = 0

function nextSequence(): number {
  sequence += 1
  return sequence
}

function stamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

function buildReceiptCode(date: Date, seed: number): string {
  return `BL-${stamp(date)}-${String(seed).padStart(4, "0")}`
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  next.setDate(next.getDate() - 1)
  return next
}

export function mockCreateEnrollment(input: CreateEnrollmentRequest): EnrollmentResult {
  const classRecord = findClass(input.classId)
  const program = findProgram(classRecord?.programId ?? "")
  const student = findStudent(input.studentProfileId)
  const parent = findParent(input.parentAccountId)

  if (!classRecord || !program || !student || !parent) {
    throw new MockError(ERROR_MSG.NOT_FOUND)
  }

  // Hồ sơ con phải thuộc đúng phụ huynh đã tra cứu, và tài khoản chưa bị khóa.
  if (student.parentAccountId !== parent.id) {
    throw new MockError(ENROLLMENT_MSG.CHILD_NOT_OF_PARENT)
  }
  if (parent.status === "disabled") {
    throw new MockError(ENROLLMENT_MSG.PARENT_DISABLED)
  }

  const seed = nextSequence()
  const now = new Date()
  const enrollmentId = `enr-new-${seed}`
  const total = program.monthlyFee * input.months

  MOCK_ENROLLMENTS.push({
    id: enrollmentId,
    studentProfileId: student.id,
    subjectId: input.subjectId,
    classId: input.classId,
    months: input.months,
    status: "active",
    startDate: now.toISOString().slice(0, 10),
    endDate: addMonths(now, input.months).toISOString().slice(0, 10),
    tuitionAmount: total,
    completedLessons: 0,
  })

  const receiptCode = buildReceiptCode(now, seed)
  const paymentId = `pay-new-${seed}`

  MOCK_PAYMENTS.push({
    id: paymentId,
    enrollmentId,
    confirmedAt: now.toISOString(),
    confirmedBy: input.confirmedBy,
    amount: total,
    status: "succeeded",
    code: `TXN-${stamp(now)}-${String(seed).padStart(3, "0")}`,
    receiptCode,
    method: "cash",
  })

  return {
    studentProfileId: student.id,
    studentName: student.name,
    parentEmail: parent.email,
    enrollmentId,
    paymentId,
    receiptCode,
    amount: total,
    confirmedAt: now.toISOString(),
    // Mỗi lần thứ 3 giả lập email lỗi để dựng được biến thể "Gửi thất bại".
    emailStatus: seed % 3 === 0 ? "failed" : "sent",
  }
}

export function mockResendEnrollmentEmail(enrollmentId: string): EmailStatus {
  const exists = MOCK_ENROLLMENTS.some((item) => item.id === enrollmentId)
  if (!exists) throw new MockError(ERROR_MSG.NOT_FOUND)
  return "sent"
}

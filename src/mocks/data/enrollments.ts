import { BUSINESS_RULES } from "@/constants/business-rules"
import { findClass, findProgram } from "@/mocks/data/catalog"
import { MOCK_PARENTS, findParent } from "@/mocks/data/parents"
import { MOCK_ACTIVATION_LINKS, MOCK_PAYMENTS } from "@/mocks/data/payments"
import { MOCK_ENROLLMENTS, MOCK_STUDENTS, findStudent } from "@/mocks/data/students"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import {
  REGISTRATION_TYPE,
  type EnrollmentInput,
} from "@/lib/validators/enrollment"
import type { EmailStatus } from "@/types/student"

/**
 * Tạo đăng ký học giả lập cho giai đoạn MOCK-ONLY, theo đúng 3 luồng mô tả ở
 * `.claude/skills/enrollment-flow`: A1 con đầu tiên, A2 thêm con cho phụ huynh đã
 * có, A3 thêm môn cho con cũ. Cả 3 luồng đều sinh Payment → Enrollment → mã liên kết
 * → gửi email.
 *
 * Xóa file này trong cùng PR nối endpoint đăng ký thật.
 */

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
  /** Mã ngắn để quản lý đọc cho phụ huynh. */
  linkCode: string
  linkExpiresAt: string
  emailStatus: EmailStatus
}

/** Bảng chữ cái bỏ ký tự dễ nhầm (0/O, 1/I) khi quản lý đọc mã qua điện thoại. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

let sequence = 0

function nextSequence(): number {
  sequence += 1
  return sequence
}

/** Mã tất định theo số thứ tự, không dùng random để demo ổn định. */
function buildLinkCode(seed: number): string {
  let code = ""
  let value = seed * 2654435761

  for (let index = 0; index < 8; index += 1) {
    code += CODE_ALPHABET[Math.abs(value) % CODE_ALPHABET.length]
    value = Math.floor(value / CODE_ALPHABET.length) + seed * (index + 7)
  }

  return code
}

function stamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

function buildReceiptCode(date: Date, seed: number): string {
  return `BL-${stamp(date)}-${String(seed).padStart(4, "0")}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  next.setDate(next.getDate() - 1)
  return next
}

export function mockCreateEnrollment(input: EnrollmentInput): EnrollmentResult {
  const classRecord = findClass(input.classId)
  const program = findProgram(classRecord?.programId ?? "")

  if (!classRecord || !program) {
    throw new MockError(ERROR_MSG.NOT_FOUND)
  }

  const seed = nextSequence()
  const now = new Date()

  // --- Xác định / tạo phụ huynh và học sinh theo từng luồng ---
  let parentAccountId: string
  let studentProfileId: string
  let studentName: string

  if (input.registrationType === REGISTRATION_TYPE.ADDITIONAL_SUBJECT) {
    // A3 — học sinh đã có hồ sơ, không tạo mới gì.
    const student = findStudent(input.studentProfileId)
    if (!student) throw new MockError(ERROR_MSG.NOT_FOUND)

    parentAccountId = student.parentAccountId
    studentProfileId = student.id
    studentName = student.name
  } else {
    if (input.registrationType === REGISTRATION_TYPE.ADDITIONAL_CHILD) {
      // A2 — phụ huynh đã có, chỉ tạo hồ sơ con mới.
      const parent = findParent(input.parentAccountId)
      if (!parent) throw new MockError(ERROR_MSG.NOT_FOUND)
      parentAccountId = parent.id
    } else {
      // A1 — tạo cả tài khoản phụ huynh mới.
      const normalizedEmail = input.parentEmail.trim().toLowerCase()
      const existing = MOCK_PARENTS.find(
        (item) => item.email.toLowerCase() === normalizedEmail
      )

      if (existing) {
        parentAccountId = existing.id
      } else {
        parentAccountId = `par-new-${seed}`
        MOCK_PARENTS.push({
          id: parentAccountId,
          email: input.parentEmail.trim(),
          phone: input.parentPhone.trim(),
          status: "pending_link",
          createdAt: now.toISOString().slice(0, 10),
        })
      }
    }

    studentProfileId = `stu-new-${seed}`
    studentName = input.studentName.trim()
    MOCK_STUDENTS.push({
      id: studentProfileId,
      parentAccountId,
      name: studentName,
      code: `HS-${now.getFullYear()}-${String(seed).padStart(4, "0")}`,
      grade: Number(input.grade),
      status: "pending_link",
      createdAt: now.toISOString().slice(0, 10),
    })
  }

  // --- Payment → Enrollment → ActivationLink (thứ tự theo enrollment-flow) ---
  const enrollmentId = `enr-new-${seed}`
  const total = program.monthlyFee * input.months

  MOCK_ENROLLMENTS.push({
    id: enrollmentId,
    studentProfileId,
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
    confirmedBy: "mgr-001",
    amount: total,
    status: "succeeded",
    code: `TXN-${stamp(now)}-${String(seed).padStart(3, "0")}`,
    receiptCode,
    method: "cash",
  })

  const linkCode = buildLinkCode(seed)
  const linkExpiresAt = addDays(now, BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS)
    .toISOString()
    .slice(0, 10)

  MOCK_ACTIVATION_LINKS.push({
    id: `lnk-new-${seed}`,
    enrollmentId,
    token: `mock-token-${seed}`,
    code: linkCode,
    expiresAt: linkExpiresAt,
  })

  const parentEmail = findParent(parentAccountId)?.email ?? input.parentEmail.trim()

  return {
    studentProfileId,
    studentName,
    parentEmail,
    enrollmentId,
    paymentId,
    receiptCode,
    amount: total,
    confirmedAt: now.toISOString(),
    linkCode,
    linkExpiresAt,
    // Mỗi lần thứ 3 giả lập email lỗi để dựng được biến thể "Gửi thất bại".
    emailStatus: seed % 3 === 0 ? "failed" : "sent",
  }
}

export function mockResendEnrollmentEmail(enrollmentId: string): EmailStatus {
  const exists = MOCK_ENROLLMENTS.some((item) => item.id === enrollmentId)
  if (!exists) throw new MockError(ERROR_MSG.NOT_FOUND)
  return "sent"
}

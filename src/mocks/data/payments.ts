import { BUSINESS_RULES } from "@/constants/business-rules"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import type {
  ActivationLink,
  AuditLogEntry,
  EmailLog,
  Payment,
  PaymentMethod,
} from "@/types/student"

/**
 * Thanh toán, link liên kết, email và lịch sử thay đổi giả lập cho MOCK-ONLY.
 * Phần khối lượng lớn được sinh tất định (không random) để số liệu demo ổn định
 * giữa các lần render. Xóa file này trong cùng PR nối endpoint thật.
 */

/** Ngày "hôm nay" của bộ mock, khớp `MOCK_TODAY` trong `catalog.ts`. */
const TODAY = "2026-09-15"

export interface Manager {
  id: string
  name: string
}

export const MOCK_MANAGERS: Manager[] = [
  { id: "mgr-001", name: "Nguyễn Thị Lan" },
  { id: "mgr-002", name: "Trần Văn Đức" },
  { id: "mgr-003", name: "Hoàng Tuấn" },
]

const PAYMENT_METHODS: PaymentMethod[] = [
  "qr_vcb",
  "vnpay",
  "cash",
  "qr_mbbank",
  "qr_bidv",
  "qr_techcombank",
]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  qr_vcb: "QR VCB",
  qr_mbbank: "QR MBBank",
  qr_bidv: "QR BIDV",
  qr_techcombank: "QR Techcombank",
  vnpay: "VNPAY",
}

function shiftDate(days: number): Date {
  const date = new Date(TODAY)
  date.setDate(date.getDate() + days)
  return date
}

function stamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

/**
 * Sinh giao dịch cho mọi enrollment, lùi dần từ hôm nay. Mỗi ngày tối đa 6 giao
 * dịch để thẻ tổng "Hôm nay" ra đúng con số trong thiết kế.
 */
function buildPayments(): Payment[] {
  const payments: Payment[] = []
  const perDay = 6

  MOCK_ENROLLMENTS.forEach((enrollment, index) => {
    const dayOffset = -Math.floor(index / perDay)
    const date = shiftDate(dayOffset)
    const hour = 8 + (index % 10)
    const minute = (index * 7) % 60

    date.setHours(hour, minute, 0, 0)

    const sequence = 81 - index

    payments.push({
      id: `pay-${enrollment.id}`,
      enrollmentId: enrollment.id,
      confirmedAt: date.toISOString(),
      confirmedBy: MOCK_MANAGERS[index % MOCK_MANAGERS.length].id,
      amount: enrollment.tuitionAmount,
      status: "succeeded",
      code: `TXN-${stamp(date)}-${String(Math.abs(sequence)).padStart(3, "0")}`,
      receiptCode: `BL-${stamp(date)}-${String(index + 12).padStart(4, "0")}`,
      method: PAYMENT_METHODS[index % PAYMENT_METHODS.length],
    })
  })

  return payments.sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
}

export const MOCK_PAYMENTS: Payment[] = buildPayments()

/**
 * Mã liên kết: mỗi enrollment một mã. Trạng thái chia theo chỉ số để có đủ cả 3
 * tab — chưa dùng, đã dùng, hết hạn.
 */
function buildActivationLinks(): ActivationLink[] {
  return MOCK_ENROLLMENTS.map((enrollment, index) => {
    const createdOffset = -Math.floor(index / 2)
    const expires = shiftDate(
      createdOffset + BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS
    )

    // 0 → hết hạn, 1–3 → chưa dùng, còn lại → đã dùng.
    const bucket = index % 7
    const isExpired = bucket === 0
    const isUnused = bucket >= 1 && bucket <= 3

    const link: ActivationLink = {
      id: `lnk-${enrollment.id}`,
      enrollmentId: enrollment.id,
      token: `mock-token-${enrollment.id}`,
      code: `EDU-${String(index + 1).padStart(2, "0")}-${enrollment.id
        .replace("enr-", "")
        .toUpperCase()}`,
      expiresAt: (isExpired ? shiftDate(createdOffset - 3) : expires)
        .toISOString()
        .slice(0, 10),
    }

    if (!isExpired && !isUnused) {
      link.usedAt = shiftDate(createdOffset + 1).toISOString()
    }

    return link
  })
}

export const MOCK_ACTIVATION_LINKS: ActivationLink[] = buildActivationLinks()

export const MOCK_EMAIL_LOGS: EmailLog[] = [
  { id: "eml-001", parentAccountId: "par-001", category: "Biên lai học phí", subject: "Xác nhận nộp học phí tháng 09/2026 cho 2 con", status: "sent", sentAt: "2026-09-14T14:32:00", actorName: "Hệ thống thanh toán" },
  { id: "eml-002", parentAccountId: "par-001", category: "Báo cáo tuần", subject: "Phiếu đánh giá tuần 2 tháng 9 — Nguyễn Minh Khang", status: "sent", sentAt: "2026-09-12T09:15:00", actorName: "Thầy Trần Văn Minh" },
  { id: "eml-003", parentAccountId: "par-001", category: "Lịch học bù", subject: "Xác nhận chuyển ca học môn Hóa 8B ngày 12/09", status: "sent", sentAt: "2026-09-07T18:20:00", actorName: "Nguyễn Thị Lan" },
  { id: "eml-004", parentAccountId: "par-001", category: "Mã liên kết", subject: "Hướng dẫn cài đặt ứng dụng phụ huynh EduGrade", status: "sent", sentAt: "2026-08-01T10:25:00", actorName: "Hệ thống" },
  { id: "eml-005", parentAccountId: "par-001", category: "Nhắc nhở nộp phí", subject: "Thông báo học phí tháng 8 sắp đến hạn", status: "failed", sentAt: "2026-07-28T17:00:00", actorName: "Hệ thống" },
  { id: "eml-006", parentAccountId: "par-004", category: "Mã liên kết", subject: "Mã kích hoạt tài khoản phụ huynh EduGrade", status: "failed", sentAt: "2026-09-10T08:00:00", actorName: "Hệ thống" },
]

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-001",
    studentProfileId: "stu-009",
    parentAccountId: "par-001",
    actorName: "Nguyễn Thị Lan",
    label: "Xác nhận thanh toán Hóa 9B – 3 tháng",
    description: "Đã thu 1.500.000 ₫ bằng chuyển khoản, biên lai gửi tới phuhuynh.khang@gmail.com",
    createdAt: "2026-09-14T14:32:00",
    variant: "success",
  },
  {
    id: "log-002",
    studentProfileId: "stu-009",
    parentAccountId: "par-001",
    actorName: "Nguyễn Thị Lan",
    label: "Xếp học bù buổi 10/09 sang Toán 8B 12/09",
    description: "Lý do nghỉ: phụ huynh báo con ốm. Đã thông báo tới giáo viên phụ trách.",
    createdAt: "2026-09-10T16:05:00",
    variant: "info",
  },
  {
    id: "log-003",
    studentProfileId: "stu-009",
    parentAccountId: "par-001",
    actorName: "Trần Văn Minh",
    label: "Đổi lịch cố định từ Toán 8A sang Toán 8C",
    description: "Áp dụng từ 01/09/2026, giữ nguyên chương trình Toán 8 cơ bản.",
    createdAt: "2026-08-28T09:40:00",
    variant: "warning",
  },
  {
    id: "log-004",
    studentProfileId: "stu-009",
    parentAccountId: "par-001",
    actorName: "Nguyễn Thị Lan",
    label: "Nghỉ dài hạn 01/07 – 15/07",
    description: "Phụ huynh đăng ký nghỉ hè, bảo lưu toàn bộ gói học phí đang hoạt động.",
    createdAt: "2026-06-28T11:20:00",
    variant: "danger",
  },
  {
    id: "log-005",
    studentProfileId: "stu-009",
    parentAccountId: "par-001",
    actorName: "Hệ thống",
    label: "Kích hoạt tài khoản phụ huynh",
    description: "Phụ huynh hoàn tất kích hoạt qua mã liên kết EDU-BA-KHANG06.",
    createdAt: "2026-08-01T10:24:00",
    variant: "default",
  },
]

export function findManager(managerId: string): Manager | undefined {
  return MOCK_MANAGERS.find((item) => item.id === managerId)
}

export function findPayment(paymentId: string): Payment | undefined {
  return MOCK_PAYMENTS.find((item) => item.id === paymentId)
}

export function findPaymentsByEnrollments(enrollmentIds: string[]): Payment[] {
  return MOCK_PAYMENTS.filter((item) => enrollmentIds.includes(item.enrollmentId))
}

export function findActivationLinksByEnrollments(
  enrollmentIds: string[]
): ActivationLink[] {
  return MOCK_ACTIVATION_LINKS.filter((item) =>
    enrollmentIds.includes(item.enrollmentId)
  )
}

export function findEmailLogsByParent(parentAccountId: string): EmailLog[] {
  return MOCK_EMAIL_LOGS.filter((item) => item.parentAccountId === parentAccountId)
}

export function findAuditLogsByStudent(studentProfileId: string): AuditLogEntry[] {
  return MOCK_AUDIT_LOGS.filter((item) => item.studentProfileId === studentProfileId)
}

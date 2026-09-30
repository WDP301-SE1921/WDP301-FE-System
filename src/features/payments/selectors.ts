import {
  MOCK_PAYMENTS,
  PAYMENT_METHOD_LABEL,
} from "@/mocks/data/payments"
import { findStaffAccount } from "@/mocks/data/staff"
import { findClass, findProgram, findSubject } from "@/mocks/data/catalog"
import { findEnrollment, findStudent } from "@/mocks/data/students"
import { findParent } from "@/mocks/data/parents"
import { PAYMENT_MSG } from "@/constants/messages/events/payment"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { formatDate, formatDateTime } from "@/lib/format"
import type { ReceiptProps } from "@/components/shared/display/receipt"
import type {
  Enrollment,
  ParentAccount,
  Payment,
  StudentProfile,
} from "@/types/student"
import type { ClassRecord, Program } from "@/types/catalog"

/**
 * Field TÍNH ĐƯỢC của thanh toán derive tại đây — xem
 * `.claude/rules/data-contracts.md`. Các hàm này chạy trong `queryFn`, không chạy
 * lúc render, nên được phép đọc thời gian hiện tại.
 */

export interface PaymentRow {
  payment: Payment
  enrollment?: Enrollment
  student?: StudentProfile
  parent?: ParentAccount
  classRecord?: ClassRecord
  program?: Program
  subjectCode: string
  confirmedByName: string
  methodLabel: string
}

function toPaymentRow(payment: Payment): PaymentRow {
  const enrollment = findEnrollment(payment.enrollmentId)
  const student = enrollment ? findStudent(enrollment.studentProfileId) : undefined
  const classRecord = findClass(enrollment?.classId ?? "")

  return {
    payment,
    enrollment,
    student,
    parent: findParent(student?.parentAccountId ?? ""),
    classRecord,
    program: findProgram(classRecord?.programId ?? ""),
    subjectCode: findSubject(enrollment?.subjectId ?? "")?.code ?? "",
    confirmedByName: findStaffAccount(payment.confirmedBy)?.name ?? "—",
    methodLabel: PAYMENT_METHOD_LABEL[payment.method],
  }
}

export function getPaymentRows(): PaymentRow[] {
  return MOCK_PAYMENTS.map(toPaymentRow)
}

export function findPaymentRow(paymentId: string): PaymentRow | null {
  const payment = MOCK_PAYMENTS.find((item) => item.id === paymentId)
  return payment ? toPaymentRow(payment) : null
}

export interface PaymentTotals {
  todayCount: number
  todayAmount: number
  monthCount: number
  monthAmount: number
  monthsSold: number
  averageMonths: number
}

/** Tổng hợp theo ngày "hôm nay" của bộ mock, truyền vào để test được. */
export function getPaymentTotals(
  rows: PaymentRow[],
  today = "2026-09-15"
): PaymentTotals {
  const monthPrefix = today.slice(0, 7)

  const todayRows = rows.filter((row) => row.payment.confirmedAt.startsWith(today))
  const monthRows = rows.filter((row) =>
    row.payment.confirmedAt.startsWith(monthPrefix)
  )

  const monthsSold = monthRows.reduce(
    (sum, row) => sum + (row.enrollment?.months ?? 0),
    0
  )

  return {
    todayCount: todayRows.length,
    todayAmount: todayRows.reduce((sum, row) => sum + row.payment.amount, 0),
    monthCount: monthRows.length,
    monthAmount: monthRows.reduce((sum, row) => sum + row.payment.amount, 0),
    monthsSold,
    averageMonths:
      monthRows.length === 0
        ? 0
        : Math.round((monthsSold / monthRows.length) * 10) / 10,
  }
}

/**
 * Dựng props cho `<Receipt />` từ một giao dịch. Đặt ở selector (không phải
 * component) để wizard Đăng ký học và màn Lịch sử thanh toán render ra cùng một
 * tờ biên lai — theo `.claude/skills/enrollment-flow`.
 */
export function buildReceiptProps(row: PaymentRow): ReceiptProps {
  const { payment, enrollment, student, parent, classRecord, program } = row

  const period = enrollment
    ? `${formatDate(enrollment.startDate)} – ${formatDate(enrollment.endDate)}`
    : "—"

  return {
    code: payment.receiptCode,
    issuedAt: formatDateTime(payment.confirmedAt),
    statusLabel: PAYMENT_MSG.RECEIPT_PAID,
    centerName: PAYMENT_MSG.CENTER_NAME,
    centerAddress: PAYMENT_MSG.CENTER_ADDRESS,
    centerContact: PAYMENT_MSG.CENTER_CONTACT,
    parties: [
      {
        label: STUDENT_MSG.COL_STUDENT,
        value: student?.name ?? "—",
        sub: student ? STUDENT_MSG.GRADE_LABEL(student.grade) : undefined,
      },
      { label: "Mã hồ sơ học sinh", value: student?.code ?? "—" },
      { label: PARENT_MSG.COL_EMAIL, value: parent?.email ?? "—" },
      { label: PARENT_MSG.COL_PHONE, value: parent?.phone ?? "—" },
    ],
    courseInfo: [
      { label: PAYMENT_MSG.COL_SUBJECT, value: classRecord?.name ?? "—" },
      { label: "Chương trình", value: program?.name ?? "—" },
      {
        label: "Lịch học",
        value: classRecord
          ? `${classRecord.weekdays.join(" - ")} · ${classRecord.startTime}–${classRecord.endTime}`
          : "—",
        sub: classRecord?.room,
      },
      { label: "Thời gian học", value: period },
    ],
    lines: [
      {
        id: "tuition",
        label: PAYMENT_MSG.RECEIPT_LINE_TUITION(classRecord?.name ?? ""),
        note: PAYMENT_MSG.RECEIPT_LINE_TUITION_NOTE(period),
        quantity: PAYMENT_MSG.MONTHS_UNIT(enrollment?.months ?? 0),
        unitPrice: program?.monthlyFee ?? 0,
        amount: payment.amount,
      },
      {
        id: "material",
        label: PAYMENT_MSG.RECEIPT_LINE_MATERIAL,
        note: PAYMENT_MSG.RECEIPT_LINE_MATERIAL_NOTE,
        quantity: PAYMENT_MSG.RECEIPT_MATERIAL_QUANTITY,
        unitPrice: 0,
        amount: 0,
      },
    ],
    total: payment.amount,
    methodLabel: row.methodLabel,
    payerName: student?.name ?? "—",
    confirmedByName: row.confirmedByName,
    confirmedByRole: PAYMENT_MSG.RECEIPT_CONFIRMER_ROLE,
    confirmedAt: formatDateTime(payment.confirmedAt),
  }
}

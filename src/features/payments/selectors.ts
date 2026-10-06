import {
  MOCK_PAYMENTS,
  PAYMENT_METHOD_LABEL,
} from "@/mocks/data/payments"
import { findStaffAccount } from "@/mocks/data/staff"
import { findClass, findProgram, findSubject } from "@/mocks/data/catalog"
import { findEnrollment, findStudent } from "@/mocks/data/students"
import { findParent } from "@/mocks/data/parents"
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

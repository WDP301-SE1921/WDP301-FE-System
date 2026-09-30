import { MOCK_AUDIT_LOG } from "@/mocks/data/system"
import { MOCK_STAFF_ACCOUNTS, findStaffAccount } from "@/mocks/data/staff"
import { CURRENT_TEACHER_ID, findTeacher } from "@/mocks/data/catalog"
import type { StaffAccount, SystemAuditLogEntry } from "@/types/system"
import type { Teacher } from "@/types/catalog"

/**
 * Selector cho domain "Hệ thống" (nhân sự trung tâm + lịch sử thay đổi). Lọc theo
 * search/loại thao tác/người thực hiện/khoảng ngày được xử lý ở view (giống
 * `features/teachers/components/teachers-view.tsx`), không đưa vào đây.
 */

export function getStaffAccounts(): StaffAccount[] {
  return [...MOCK_STAFF_ACCOUNTS]
}

export interface StaffTotals {
  active: number
  pending: number
}

export function getStaffTotals(rows: StaffAccount[]): StaffTotals {
  return {
    active: rows.filter((row) => row.status === "active").length,
    pending: rows.filter((row) => row.status === "pending").length,
  }
}

export function getAuditLogEntries(): SystemAuditLogEntry[] {
  return [...MOCK_AUDIT_LOG].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Tài khoản nhân sự của người đang đăng nhập (id lấy từ phiên). */
export function getStaffAccount(id: string): StaffAccount | undefined {
  return findStaffAccount(id)
}

/** "Giáo viên đang đăng nhập" cho màn Tài khoản cá nhân giáo viên (PROMPT T8). */
export function getCurrentTeacher(): Teacher | undefined {
  return findTeacher(CURRENT_TEACHER_ID)
}

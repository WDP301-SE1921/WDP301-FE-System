import {
  CURRENT_MANAGER_ID,
  MOCK_AUDIT_LOG,
  MOCK_MANAGER_ACCOUNTS,
} from "@/mocks/data/system"
import { CURRENT_TEACHER_ID, findTeacher } from "@/mocks/data/catalog"
import type { ManagerAccount, SystemAuditLogEntry } from "@/types/system"
import type { Teacher } from "@/types/catalog"

/**
 * Selector cho domain "Hệ thống" (quản lý viên + lịch sử thay đổi). Lọc theo
 * search/loại thao tác/người thực hiện/khoảng ngày được xử lý ở view (giống
 * `features/teachers/components/teachers-view.tsx`), không đưa vào đây.
 */

export function getManagerAccounts(): ManagerAccount[] {
  return [...MOCK_MANAGER_ACCOUNTS]
}

export interface ManagerTotals {
  active: number
  pending: number
}

export function getManagerTotals(rows: ManagerAccount[]): ManagerTotals {
  return {
    active: rows.filter((row) => row.status === "active").length,
    pending: rows.filter((row) => row.status === "pending").length,
  }
}

export function getAuditLogEntries(): SystemAuditLogEntry[] {
  return [...MOCK_AUDIT_LOG].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getCurrentManager(): ManagerAccount | undefined {
  return MOCK_MANAGER_ACCOUNTS.find((item) => item.id === CURRENT_MANAGER_ID)
}

/** "Giáo viên đang đăng nhập" cho màn Tài khoản cá nhân giáo viên (PROMPT T8). */
export function getCurrentTeacher(): Teacher | undefined {
  return findTeacher(CURRENT_TEACHER_ID)
}

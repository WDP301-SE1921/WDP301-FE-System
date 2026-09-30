import { ROUTES } from "@/constants/routes"
import { ERROR_MSG } from "@/constants/messages/error"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { ACCOUNT_MANAGE_TARGETS } from "@/constants/role-access"
import type { BackOfficeRole } from "@/constants/roles"
import { MOCK_ACCOUNTS } from "@/mocks/data/auth"
import { MOCK_STAFF_ACCOUNTS, findStaffAccount } from "@/mocks/data/staff"
import { MockError } from "@/mocks/utils/mock-query"
import type { StaffAccount, SystemAuditLogEntry } from "@/types/system"

/**
 * Nhân sự trung tâm + lịch sử thay đổi giả lập cho giai đoạn MOCK-ONLY. Danh sách tài khoản
 * nằm ở `mocks/data/staff.ts`; "người đang đăng nhập" lấy từ phiên (`useCurrentUser`), không
 * hard-code ở đây. Xóa file này trong cùng PR nối endpoint hệ thống thật.
 */

let auditSequence = 0

export interface AppendAuditInput {
  actorId: string
  actionType: SystemAuditLogEntry["actionType"]
  targetLabel: string
  targetHref?: string
  reason?: string
  effectiveDate?: string
  /** Mốc thời gian theo `MOCK_NOW` do nơi gọi truyền vào. */
  createdAt: string
}

/** Ghi thêm một dòng vào Lịch sử thay đổi — dùng bởi các mutation giả lập cần dấu vết (hủy buổi, ghi nhận công…). */
export function appendAuditLog(input: AppendAuditInput): SystemAuditLogEntry {
  auditSequence += 1

  const entry: SystemAuditLogEntry = {
    id: `log-new-${auditSequence}`,
    createdAt: input.createdAt,
    actorId: input.actorId,
    actionType: input.actionType,
    targetLabel: input.targetLabel,
    targetHref: input.targetHref,
    reason: input.reason,
    effectiveDate: input.effectiveDate,
    ip: "127.0.0.1",
  }

  MOCK_AUDIT_LOG.unshift(entry)

  return entry
}

export interface InviteStaffInput {
  email: string
  name: string
  role: Extract<BackOfficeRole, "center_manager" | "curriculum_designer" | "staff">
  /** Role người mời — dùng để kiểm tra `ACCOUNT_MANAGE_TARGETS`. */
  inviterRole: BackOfficeRole
}

let staffSequence = MOCK_STAFF_ACCOUNTS.length

export function mockInviteStaff(input: InviteStaffInput): StaffAccount {
  const email = input.email.trim()
  const allowedRoles = ACCOUNT_MANAGE_TARGETS[input.inviterRole] ?? []
  if (!allowedRoles.includes(input.role)) throw new MockError(SYSTEM_MSG.INVITE_ROLE_FORBIDDEN)

  const exists = MOCK_STAFF_ACCOUNTS.some(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  )
  if (exists) throw new MockError(SYSTEM_MSG.INVITE_EMAIL_EXISTS(email))

  staffSequence += 1

  const account: StaffAccount = {
    id: `stf-new-${staffSequence}`,
    name: input.name.trim(),
    email,
    role: input.role,
    status: "pending",
    joinedAt: new Date().toISOString().slice(0, 10),
  }

  MOCK_STAFF_ACCOUNTS.unshift(account)

  return account
}

export function mockResendStaffInvite(id: string): StaffAccount {
  const account = findStaffAccount(id)
  if (!account) throw new MockError(ERROR_MSG.NOT_FOUND)

  return account
}

export interface DeactivateStaffInput {
  id: string
  /** Id người đang thao tác — không được tự vô hiệu hóa chính mình. */
  actorId: string
}

export function mockDeactivateStaff({ id, actorId }: DeactivateStaffInput): StaffAccount {
  if (id === actorId) throw new MockError(SYSTEM_MSG.CANNOT_DEACTIVATE_SELF)

  const account = findStaffAccount(id)
  if (!account) throw new MockError(ERROR_MSG.NOT_FOUND)

  account.status = "disabled"

  return account
}

export interface UpdateStaffProfileInput {
  id: string
  name: string
  phone: string
}

export function mockUpdateStaffProfile(input: UpdateStaffProfileInput): StaffAccount {
  const account = findStaffAccount(input.id)
  if (!account) throw new MockError(ERROR_MSG.NOT_FOUND)

  account.name = input.name.trim()
  account.phone = input.phone.trim()

  return account
}

export interface ChangePasswordInput {
  email: string
  currentPassword: string
  newPassword: string
}

/** Đổi mật khẩu theo email trong `MOCK_ACCOUNTS` — không phân biệt role nên dùng chung cho nhân sự và giáo viên. */
export function mockChangePassword(input: ChangePasswordInput): { success: true } {
  const account = MOCK_ACCOUNTS.find(
    (item) => item.email.toLowerCase() === input.email.trim().toLowerCase()
  )

  if (!account || account.password !== input.currentPassword) {
    throw new MockError(AUTH_MSG.INVALID_CREDENTIALS)
  }

  account.password = input.newPassword

  return { success: true }
}

/**
 * 20 dòng tất định, phủ đủ 11 `AuditActionType`, trải trong 15 ngày trước `MOCK_TODAY`
 * ("2026-09-16", xem `mocks/data/catalog.ts`). Cặp lớp `cls-math-8a` ↔ `cls-math-8c`
 * (Toán 8A / 8C) là 2 lớp duy nhất cùng `programId` trong bộ mock — dùng cho ví dụ
 * `change_class`, xem ghi chú trong `mocks/data/absences.ts`.
 */
export const MOCK_AUDIT_LOG: SystemAuditLogEntry[] = [
  {
    id: "log-001",
    createdAt: "2026-09-16T08:15:00",
    actorId: "stf-001",
    actionType: "confirm_payment",
    targetLabel: "Nguyễn Hoàng Nam",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-001"),
    ip: "118.70.12.85",
  },
  {
    id: "log-002",
    createdAt: "2026-09-15T14:30:00",
    actorId: "stf-001",
    actionType: "change_class",
    targetLabel: "Trần Mai Anh",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-002"),
    changeBefore: "Toán 8A",
    changeAfter: "Toán 8C",
    reason: "Lịch học mới của phụ huynh không còn phù hợp khung giờ cũ",
    effectiveDate: "2026-09-20",
    ip: "27.72.98.11",
  },
  {
    id: "log-003",
    createdAt: "2026-09-15T09:00:00",
    actorId: "mgr-001",
    actionType: "substitute",
    targetLabel: "Toán 8A",
    targetHref: ROUTES.MANAGER.CLASS_DETAIL("cls-math-8a"),
    changeBefore: "Trần Văn Minh",
    changeAfter: "Đặng Văn Đức",
    reason: "Giáo viên chính báo nghỉ đột xuất",
    effectiveDate: "2026-09-15",
    ip: "42.113.55.20",
  },
  {
    id: "log-004",
    createdAt: "2026-09-14T16:45:00",
    actorId: "mgr-001",
    actionType: "change_teacher",
    targetLabel: "Hóa 9B",
    targetHref: ROUTES.MANAGER.CLASS_DETAIL("cls-chem-9b"),
    changeBefore: "Lê Thu Hà",
    changeAfter: "Nguyễn Thùy Trang",
    reason: "Giáo viên chính tập trung ôn thi đội tuyển",
    effectiveDate: "2026-09-20",
    ip: "14.161.34.9",
  },
  {
    id: "log-005",
    createdAt: "2026-09-14T10:20:00",
    actorId: "stf-001",
    actionType: "assign_makeup",
    targetLabel: "Vũ Quốc Đạt",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-007"),
    reason: "Học sinh nghỉ ốm buổi chính khóa",
    effectiveDate: "2026-09-16",
    ip: "118.70.12.85",
  },
  {
    id: "log-006",
    createdAt: "2026-09-13T11:00:00",
    actorId: "stf-004",
    actionType: "swap_session",
    targetLabel: "Đỗ Minh Quân",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-005"),
    reason: "Phụ huynh xin đổi lịch tuần này",
    effectiveDate: "2026-09-13",
    ip: "203.113.65.44",
  },
  {
    id: "log-007",
    createdAt: "2026-09-13T08:30:00",
    actorId: "stf-004",
    actionType: "long_leave",
    targetLabel: "Hoàng Thảo My",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-006"),
    reason: "Gia đình về quê dài ngày",
    effectiveDate: "2026-09-15",
    ip: "42.113.55.20",
  },
  {
    id: "log-008",
    createdAt: "2026-09-12T15:10:00",
    actorId: "stf-001",
    actionType: "withdraw_subject",
    targetLabel: "Phạm Khánh Linh",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-004"),
    reason: "Học sinh chuyển sang trung tâm khác học môn Hóa",
    effectiveDate: "2026-09-30",
    ip: "118.70.12.85",
  },
  {
    id: "log-009",
    createdAt: "2026-09-12T09:45:00",
    actorId: "stf-004",
    actionType: "withdraw_full",
    targetLabel: "Lê Bảo Long",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-003"),
    reason: "Gia đình chuyển nơi ở",
    effectiveDate: "2026-09-30",
    ip: "14.161.34.9",
  },
  {
    id: "log-010",
    createdAt: "2026-09-11T13:25:00",
    actorId: "stf-001",
    actionType: "reenroll",
    targetLabel: "Bùi Gia Hân",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-008"),
    reason: "Phụ huynh đăng ký học lại sau kỳ nghỉ",
    effectiveDate: "2026-09-12",
    ip: "203.113.65.44",
  },
  {
    id: "log-011",
    createdAt: "2026-09-11T08:00:00",
    actorId: "mgr-001",
    actionType: "edit_ai_grading",
    targetLabel: "Nguyễn Hoàng Nam",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-001"),
    reason: "Điều chỉnh điểm câu 5 do AI chấm sai đáp án",
    ip: "118.70.12.85",
  },
  {
    id: "log-012",
    createdAt: "2026-09-10T17:00:00",
    actorId: "stf-004",
    actionType: "confirm_payment",
    targetLabel: "Trần Mai Anh",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-002"),
    ip: "42.113.55.20",
  },
  {
    id: "log-013",
    createdAt: "2026-09-10T10:30:00",
    actorId: "stf-004",
    actionType: "change_class",
    targetLabel: "Đỗ Minh Quân",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-005"),
    changeBefore: "Toán 8C",
    changeAfter: "Toán 8A",
    reason: "Đổi sang khung giờ tối phù hợp hơn",
    effectiveDate: "2026-09-14",
    ip: "14.161.34.9",
  },
  {
    id: "log-014",
    createdAt: "2026-09-09T14:15:00",
    actorId: "mgr-001",
    actionType: "substitute",
    targetLabel: "Lý 7A",
    targetHref: ROUTES.MANAGER.CLASS_DETAIL("cls-phys-7a"),
    changeBefore: "Hoàng Thị Phương",
    changeAfter: "Lê Mai Trang",
    reason: "Tham dự tập huấn phương pháp STEM",
    effectiveDate: "2026-09-10",
    ip: "203.113.65.44",
  },
  {
    id: "log-015",
    createdAt: "2026-09-08T09:00:00",
    actorId: "stf-001",
    actionType: "assign_makeup",
    targetLabel: "Hoàng Thảo My",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-006"),
    reason: "Xếp lịch học bù sau đợt nghỉ ốm",
    effectiveDate: "2026-09-09",
    ip: "118.70.12.85",
  },
  {
    id: "log-016",
    createdAt: "2026-09-07T16:20:00",
    actorId: "stf-004",
    actionType: "confirm_payment",
    targetLabel: "Vũ Quốc Đạt",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-007"),
    ip: "42.113.55.20",
  },
  {
    id: "log-017",
    createdAt: "2026-09-06T11:10:00",
    actorId: "stf-001",
    actionType: "swap_session",
    targetLabel: "Bùi Gia Hân",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-008"),
    reason: "Đổi buổi do trùng lịch học chính khóa ở trường",
    effectiveDate: "2026-09-07",
    ip: "14.161.34.9",
  },
  {
    id: "log-018",
    createdAt: "2026-09-04T14:00:00",
    actorId: "stf-004",
    actionType: "long_leave",
    targetLabel: "Đỗ Minh Quân",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-005"),
    reason: "Đi du lịch cùng gia đình",
    effectiveDate: "2026-09-18",
    ip: "203.113.65.44",
  },
  {
    id: "log-019",
    createdAt: "2026-09-02T08:40:00",
    actorId: "mgr-001",
    actionType: "change_teacher",
    targetLabel: "Hóa 8B",
    targetHref: ROUTES.MANAGER.CLASS_DETAIL("cls-chem-8b"),
    changeBefore: "Lê Thu Hà",
    changeAfter: "Đỗ Tuấn Anh",
    reason: "Giáo viên chính nghỉ thai sản dài hạn",
    effectiveDate: "2026-09-05",
    ip: "118.70.12.85",
  },
  {
    id: "log-020",
    createdAt: "2026-09-01T10:00:00",
    actorId: "stf-004",
    actionType: "withdraw_subject",
    targetLabel: "Nguyễn Hoàng Nam",
    targetHref: ROUTES.MANAGER.STUDENT_DETAIL("stu-001"),
    reason: "Học sinh chỉ tập trung ôn thi môn Toán",
    effectiveDate: "2026-09-15",
    ip: "42.113.55.20",
  },
]

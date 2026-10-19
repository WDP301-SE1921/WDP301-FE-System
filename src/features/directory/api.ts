import { apiRequest, ApiError } from "@/lib/api/client";
import {
  accountCreateSchema,
  accountUpdateSchema,
  invitationSchema,
  parentUpdateSchema,
  reviewInvitationSchema,
  studentUpdateSchema,
} from "@/lib/validators/web-workflows";
import { queryPath, readDirectoryPages } from "@/features/academic/api";
import type {
  BackendUser,
  PaginatedList,
  ParentLookup,
  RegistrationOrder,
  StudentListItem,
  StudentProfile,
} from "@/types/backend";
import type {
  AccountInvitation,
  AuditLogRecord,
  EnrollmentRecord,
  StudentSchedule,
} from "@/types/academic-workflows";

/** Path prefix of the invitation endpoints: `/teacher-invitations`, `/manager-invitations`. */
export type InvitationKind = "teacher" | "manager";
/** Đường dẫn tài khoản nội bộ; Thiết kế giáo trình có API riêng (BE-10). */
export type AccountKind = "staff" | "teachers" | "curriculum-designers";

/** API tài khoản theo vai trò BE của tài khoản (`STAFF`, `TEACHER`, `CURRICULUM_DESIGNER`). */
export function accountKindOf(account: Pick<BackendUser, "role">): AccountKind {
  return account.role === "CURRICULUM_DESIGNER"
    ? "curriculum-designers"
    : account.role === "TEACHER"
      ? "teachers"
      : "staff";
}

export interface DashboardRecord {
  range: { fromDate: string; toDate: string };
  tuition: { confirmedAmount: string; currency: string; paymentCount: number };
  counts: {
    activeStudents: number;
    studyingStudents: number;
    activeParents: number;
    activeTeachers: number;
    activeStaff: number;
  };
  registrations: { draft: number; completed: number; cancelled: number };
}
export interface PaymentRecord {
  id: string;
  amount: string | number;
  receiptNumber: string;
  confirmedAt: string;
  confirmedByManager: { id: string; displayName: string | null; email: string };
  registrationOrder: {
    id: string;
    parentEmail: string;
    studentFullName: string;
    class: { id: string; name: string };
  };
}
export type DirectoryFilters = Record<string, string | number | undefined>;
export const directoryApi = {
  accounts: (
    kind: AccountKind,
    filters: DirectoryFilters,
    signal?: AbortSignal,
  ) =>
    apiRequest<PaginatedList<BackendUser>>(queryPath(kind, filters), {
      signal,
    }),
  /** Đọc hết các trang (danh sách Nhân viên, Thiết kế giáo trình ngắn). */
  allAccounts: (
    kind: AccountKind,
    filters: DirectoryFilters,
    signal?: AbortSignal,
  ) => readDirectoryPages<BackendUser>(kind, filters, signal),
  account: (kind: AccountKind, id: string, signal?: AbortSignal) =>
    apiRequest<BackendUser>(`${kind}/${encodeURIComponent(id)}`, { signal }),
  createAccount: (kind: Exclude<AccountKind, "teachers">, body: unknown) =>
    apiRequest<BackendUser>(kind, {
      method: "POST",
      body: accountCreateSchema.parse(body),
    }),
  updateAccount: (kind: AccountKind, id: string, body: unknown) =>
    apiRequest<BackendUser>(`${kind}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: accountUpdateSchema.parse(body),
    }),
  parent: (id: string, signal?: AbortSignal) =>
    apiRequest<ParentLookup>(`parents/${encodeURIComponent(id)}`, { signal }),
  updateParent: (id: string, body: unknown) =>
    apiRequest<ParentLookup>(`parents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: parentUpdateSchema.parse(body),
    }),
  /** Xóa hẳn tài khoản chưa dùng; còn hồ sơ con, đăng ký hay hoạt động thì 409 `PARENT_IN_USE`. */
  deleteParent: (id: string) =>
    apiRequest<{ id: string; deleted: true }>(
      `parents/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  updateStudent: (id: string, body: unknown) =>
    apiRequest<StudentProfile>(`students/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: studentUpdateSchema.parse(body),
    }),
  students: (signal?: AbortSignal) =>
    readDirectoryPages<StudentListItem>("students", {}, signal),
  student: async (id: string, signal?: AbortSignal) => {
    for (let page = 1; page <= 1000; page++) {
      const batch = await apiRequest<PaginatedList<StudentListItem>>(
        queryPath("students", { page, limit: 100 }),
        { signal },
      );
      const student = batch.items.find((item) => item.id === id);
      if (student) return student;
      if (page * batch.limit >= batch.total) break;
    }
    throw new ApiError(
      "STUDENT_NOT_FOUND",
      "Không tìm thấy hồ sơ học sinh.",
      404,
    );
  },
  studentEnrollments: (id: string, signal?: AbortSignal) =>
    apiRequest<EnrollmentRecord[]>(
      `students/${encodeURIComponent(id)}/enrollments`,
      { signal },
    ),
  studentSchedule: (id: string, signal?: AbortSignal) =>
    apiRequest<StudentSchedule[]>(
      `students/${encodeURIComponent(id)}/schedule`,
      { signal },
    ),
  dashboard: (filters: DirectoryFilters, signal?: AbortSignal) =>
    apiRequest<DashboardRecord>(queryPath("dashboard", filters), { signal }),
  registrations: (filters: DirectoryFilters, signal?: AbortSignal) =>
    apiRequest<PaginatedList<RegistrationOrder>>(
      queryPath("registrations", filters),
      { signal },
    ),
  payments: (filters: DirectoryFilters, signal?: AbortSignal) =>
    apiRequest<PaginatedList<PaymentRecord> & { totalAmount: string }>(
      queryPath("payments", filters),
      { signal },
    ),
  managers: (filters: DirectoryFilters, signal?: AbortSignal) =>
    apiRequest<PaginatedList<BackendUser>>(queryPath("managers", filters), {
      signal,
    }),
  invitations: (
    kind: InvitationKind,
    filters: DirectoryFilters,
    signal?: AbortSignal,
  ) =>
    apiRequest<PaginatedList<AccountInvitation>>(
      queryPath(`${kind}-invitations`, filters),
      { signal },
    ),
  invite: (kind: InvitationKind, body: unknown) =>
    apiRequest<AccountInvitation>(`${kind}-invitations`, {
      method: "POST",
      body: invitationSchema.parse(body),
    }),
  reviewInvitation: (id: string, body: unknown) =>
    apiRequest<AccountInvitation>(
      `account-invitations/${encodeURIComponent(id)}/review`,
      { method: "POST", body: reviewInvitationSchema.parse(body) },
    ),
  revokeInvitation: (id: string) =>
    apiRequest<AccountInvitation>(
      `account-invitations/${encodeURIComponent(id)}/revoke`,
      { method: "POST" },
    ),
  resendInvitation: (id: string) =>
    apiRequest<AccountInvitation>(
      `account-invitations/${encodeURIComponent(id)}/resend`,
      { method: "POST" },
    ),
  auditLogs: (filters: DirectoryFilters, signal?: AbortSignal) =>
    apiRequest<PaginatedList<AuditLogRecord>>(
      queryPath("audit-logs", filters),
      { signal },
    ),
  /**
   * Các lần xếp dạy thay tạo đến `to` (ISO). BE chỉ cho xếp dạy thay buổi tương lai, nên mọi lần
   * xếp cho buổi bắt đầu trước `to` đều nằm trong danh sách này.
   */
  substituteAudits: (to: string, signal?: AbortSignal) =>
    readDirectoryPages<AuditLogRecord>(
      "audit-logs",
      { action: "SESSION_SUBSTITUTE_ASSIGNED", to },
      signal,
    ),
};

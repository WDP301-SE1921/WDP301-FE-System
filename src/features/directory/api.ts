import { apiRequest, ApiError } from "@/lib/api/client";
import {
  accountCreateSchema,
  accountUpdateSchema,
  invitationSchema,
  parentUpdateSchema,
  reviewInvitationSchema,
} from "@/lib/validators/web-workflows";
import { queryPath, readDirectoryPages } from "@/features/academic/api";
import type {
  BackendUser,
  PaginatedList,
  ParentLookup,
  RegistrationOrder,
  StudentListItem,
} from "@/types/backend";
import type {
  AccountInvitation,
  AuditLogRecord,
  EnrollmentRecord,
  StudentSchedule,
} from "@/types/academic-workflows";

/** Path prefix of the invitation endpoints: `/teacher-invitations`, `/manager-invitations`. */
export type InvitationKind = "teacher" | "manager";

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
    kind: "staff" | "teachers",
    filters: DirectoryFilters,
    signal?: AbortSignal,
  ) =>
    apiRequest<PaginatedList<BackendUser>>(queryPath(kind, filters), {
      signal,
    }),
  account: (kind: "staff" | "teachers", id: string, signal?: AbortSignal) =>
    apiRequest<BackendUser>(`${kind}/${encodeURIComponent(id)}`, { signal }),
  createAccount: (kind: "staff", body: unknown) =>
    apiRequest<BackendUser>(kind, {
      method: "POST",
      body: accountCreateSchema.parse(body),
    }),
  updateAccount: (kind: "staff" | "teachers", id: string, body: unknown) =>
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
};

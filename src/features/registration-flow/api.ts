import { apiRequest, ApiError } from "@/lib/api/client";
import type {
  ParentLookup,
  ParentSuggestion,
  PaginatedList,
  DirectoryListFilters,
  ParentListItem,
  StudentListItem,
  RegistrationClass,
  RegistrationOrder,
  RegistrationProgram,
  RegistrationReceipt,
  RegistrationBill,
  AcademicSubject,
  AcademicTeacher,
} from "@/types/backend";
import { registrationBillSchema } from "@/lib/validators/registration-bill";
import {
  parentSearchSchema,
  parentSuggestionsSchema,
  parentEmailSchema,
  type RegistrationInput,
} from "./schemas";

async function allPages<T>(
  path: string,
  filters: Record<string, string> = {},
  signal?: AbortSignal,
) {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({
      ...filters,
      page: String(page),
      limit: "100",
    });
    const batch = await apiRequest<T[]>(`${path}?${query}`, { signal });
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
}
function directoryPage<T>(
  path: "parents" | "students",
  filters: DirectoryListFilters,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return apiRequest<PaginatedList<T>>(`${path}?${query}`, { signal });
}
export const registrationApi = {
  parents: (filters: DirectoryListFilters, signal?: AbortSignal) =>
    directoryPage<ParentListItem>("parents", filters, signal),
  students: (filters: DirectoryListFilters, signal?: AbortSignal) =>
    directoryPage<StudentListItem>("students", filters, signal),
  searchParents: async (
    email: string,
    signal?: AbortSignal,
  ): Promise<ParentSuggestion[]> => {
    const input = parentSearchSchema.parse({ email });
    try {
      const data = await apiRequest<unknown>(
        `parents/search?${new URLSearchParams({ email: input.email, limit: "10" })}`,
        { signal },
      );
      const parsed = parentSuggestionsSchema.safeParse(data);
      if (!parsed.success)
        throw new ApiError(
          "INVALID_API_RESPONSE",
          "Máy chủ trả danh sách phụ huynh không đúng hợp đồng.",
          502,
        );
      return parsed.data;
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        ![404, 405, 501].includes(error.status)
      )
        throw error;
      // Existing BE only supports exact-email lookup. Never invent suggested accounts.
      if (!parentEmailSchema.safeParse(input).success)
        throw new ApiError(
          "PARENT_SEARCH_UNAVAILABLE",
          "Máy chủ chưa hỗ trợ gợi ý email. Nhập email đầy đủ để tra cứu tài khoản hiện có.",
          501,
        );
      try {
        return [await registrationApi.lookup(input.email, signal)];
      } catch (lookupError) {
        if (
          lookupError instanceof ApiError &&
          lookupError.code === "PARENT_NOT_FOUND"
        )
          return [];
        throw lookupError;
      }
    }
  },
  lookup: (email: string, signal?: AbortSignal) =>
    apiRequest<ParentLookup>(
      `parents/lookup?${new URLSearchParams({ email: email.trim().toLowerCase() })}`,
      { signal },
    ),
  programs: () => allPages<RegistrationProgram>("programs"),
  programsFiltered: (filters: Record<string, string>, signal?: AbortSignal) =>
    allPages<RegistrationProgram>("programs", filters, signal),
  program: (id: string, signal?: AbortSignal) =>
    apiRequest<RegistrationProgram>(`programs/${encodeURIComponent(id)}`, {
      signal,
    }),
  subjects: (search = "", signal?: AbortSignal) =>
    apiRequest<AcademicSubject[]>(
      `subjects?${new URLSearchParams({ search })}`,
      { signal },
    ),
  teachers: async (signal?: AbortSignal) => {
    const items: AcademicTeacher[] = [];
    for (let page = 1; ; page++) {
      const batch = await apiRequest<PaginatedList<AcademicTeacher>>(
        `teachers?status=ACTIVE&limit=100&page=${page}`,
        { signal },
      );
      items.push(...batch.items);
      if (page * batch.limit >= batch.total) return { ...batch, items };
    }
  },
  classes: (filters: Record<string, string> = {}) =>
    allPages<RegistrationClass>("classes", filters),
  class: (id: string, page = 1, signal?: AbortSignal) =>
    apiRequest<RegistrationClass>(
      `classes/${encodeURIComponent(id)}?${new URLSearchParams({ page: String(page), limit: "20" })}`,
      { signal },
    ),
  schedules: (id: string, signal?: AbortSignal) =>
    apiRequest<RegistrationClass["weeklySchedules"]>(
      `classes/${encodeURIComponent(id)}/schedules`,
      { signal },
    ),
  saveSchedules: (
    id: string,
    body: { schedules: RegistrationClass["weeklySchedules"] },
  ) =>
    apiRequest<RegistrationClass>(
      `classes/${encodeURIComponent(id)}/schedules`,
      { method: "PUT", body },
    ),
  updateSchedule: (
    id: string,
    scheduleId: string,
    body: Omit<RegistrationClass["weeklySchedules"][number], "id">,
  ) =>
    apiRequest<unknown>(
      `classes/${encodeURIComponent(id)}/schedules/${encodeURIComponent(scheduleId)}`,
      { method: "PATCH", body },
    ),
  deleteSchedule: (id: string, scheduleId: string) =>
    apiRequest<unknown>(
      `classes/${encodeURIComponent(id)}/schedules/${encodeURIComponent(scheduleId)}`,
      { method: "DELETE" },
    ),
  draft: (input: RegistrationInput, key?: string) =>
    apiRequest<RegistrationOrder>("registrations", {
      method: "POST",
      idempotencyKey: key,
      body: {
        targetStudentId: input.targetStudentId,
        classId: input.classId,
        startDate: input.startDate,
        packageMonths: input.packageMonths,
      },
    }),
  get: (id: string) =>
    apiRequest<RegistrationOrder>(`registrations/${encodeURIComponent(id)}`),
  bill: async (id: string, signal?: AbortSignal): Promise<RegistrationBill> => {
    const data = await apiRequest<unknown>(
      `registrations/${encodeURIComponent(id)}/bill`,
      { signal },
    );
    const parsed = registrationBillSchema.safeParse(data);
    if (!parsed.success || parsed.data.registrationId !== id)
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Máy chủ trả bill không hợp lệ. Vui lòng tải lại trước khi thu tiền.",
        502,
      );
    return parsed.data;
  },
  cancel: (id: string) =>
    apiRequest<RegistrationOrder>(
      `registrations/${encodeURIComponent(id)}/cancel`,
      { method: "POST" },
    ),
  receipt: (id: string) =>
    apiRequest<RegistrationReceipt>(
      `registrations/${encodeURIComponent(id)}/receipt`,
    ),
  confirm: async (
    id: string,
    key: string,
    body: { receiptNumber?: string },
  ) => {
    try {
      return await apiRequest<RegistrationReceipt>(
        `registrations/${encodeURIComponent(id)}/confirm-payment`,
        { method: "POST", body, idempotencyKey: key },
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 0 ||
          error.status >= 500 ||
          error.code === "REGISTRATION_NOT_DRAFT")
      ) {
        const order = await registrationApi.get(id).catch(() => null);
        if (order?.status === "COMPLETED") return registrationApi.receipt(id);
      }
      throw error;
    }
  },
};

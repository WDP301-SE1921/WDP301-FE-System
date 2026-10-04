import { apiRequest, ApiError } from "@/lib/api/client";
import type {
  ParentLookup,
  ParentSuggestion,
  RegistrationClass,
  RegistrationOrder,
  RegistrationProgram,
  RegistrationReceipt,
} from "@/types/backend";
import {
  parentSearchSchema,
  parentSuggestionsSchema,
  parentEmailSchema,
  type RegistrationInput,
} from "./schemas";

async function allPages<T>(path: string, filters: Record<string, string> = {}) {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({
      ...filters,
      page: String(page),
      limit: "100",
    });
    const batch = await apiRequest<T[]>(`${path}?${query}`);
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
}
export const registrationApi = {
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
  classes: (filters: Record<string, string> = {}) =>
    allPages<RegistrationClass>("classes", filters),
  draft: (input: RegistrationInput) =>
    apiRequest<RegistrationOrder>("registrations", {
      method: "POST",
      body: {
        targetStudentId: input.targetStudentId,
        classId: input.classId,
        startDate: input.startDate,
        packageMonths: input.packageMonths,
      },
    }),
  get: (id: string) =>
    apiRequest<RegistrationOrder>(`registrations/${encodeURIComponent(id)}`),
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

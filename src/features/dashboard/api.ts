import { apiRequest, ApiError } from "@/lib/api/client";
import { emitSessionExpired } from "@/lib/auth-events";
import { queryPath } from "@/features/academic/api";
import type { ApiEnvelope } from "@/types/backend";
import type { AnalyticsFilters, OperationsAnalytics } from "./types";

export const dashboardApi = {
  analytics: (filters: AnalyticsFilters, signal?: AbortSignal) =>
    apiRequest<OperationsAnalytics>(
      queryPath("academic/analytics", { ...filters }),
      { signal },
    ),
  export: async (filters: AnalyticsFilters) => {
    const response = await fetch(
      `/api/backend/${queryPath("academic/analytics/export", { ...filters })}`,
      { credentials: "same-origin", cache: "no-store" },
    ).catch(() => {
      throw new ApiError(
        "NETWORK_ERROR",
        "Không kết nối được máy chủ. Vui lòng thử lại.",
        0,
      );
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || contentType.includes("application/json")) {
      const envelope = (await response.json().catch(() => undefined)) as
        ApiEnvelope<never> | undefined;
      if (response.status === 401) emitSessionExpired();
      throw new ApiError(
        envelope?.error?.code ?? "DOWNLOAD_FAILED",
        envelope?.error?.message ??
          "Không tải được thống kê. Vui lòng thử lại.",
        response.status,
        envelope?.error?.requestId,
      );
    }
    if (
      !contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    )
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Máy chủ không trả file Excel. Vui lòng thử lại.",
        502,
      );
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `edugrade-thong-ke-${filters.from.slice(0, 10)}-${filters.to.slice(0, 10)}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

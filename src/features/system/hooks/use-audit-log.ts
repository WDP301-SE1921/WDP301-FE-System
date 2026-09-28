"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import { getAuditLogEntries } from "@/features/system/selectors"
import type { SystemAuditLogEntry } from "@/types/system"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useAuditLog() {
  return useQuery<SystemAuditLogEntry[]>({
    queryKey: ["audit-log"],
    queryFn: () => mockQuery(() => getAuditLogEntries()),
  })
}

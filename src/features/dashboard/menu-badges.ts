"use client";

import { useQuery } from "@tanstack/react-query";
import { MENU_BADGE_KEYS, type MenuBadgeCounts } from "@/constants/menu";
import type { WebRole } from "@/constants/roles";
import { academicApi } from "@/features/academic/api";
import { directoryApi } from "@/features/directory/api";
import { submissionSummary } from "@/features/assignments/submission-selectors";
import { readAssignmentWorkspaces } from "@/features/assignments/workspace-api";
import { useCurrentUser } from "@/hooks/use-current-role";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";

/** Buổi đã kết thúc trong khoảng này mà chưa chốt điểm danh thì tính vào badge. */
const UNMARKED_LOOKBACK_DAYS = 30;
const REFRESH_MS = 2 * 60 * 1000;

/**
 * Số trên badge menu theo vai trò. Mỗi vai trò chỉ gọi API mình được phép (mục 4.6):
 * Quản lý — email lỗi; Nhân viên — đơn chờ thu; Giáo viên — bài chưa chấm, buổi chưa điểm danh.
 * Khóa query nằm dưới `["web-api", userId]` để thao tác ghi làm mới số.
 */
export function useMenuBadgeCounts(role: WebRole): MenuBadgeCounts {
  const user = useCurrentUser();
  const base = ["web-api", user?.id] as const;
  const options = {
    enabled: !!user,
    retry: false,
    staleTime: REFRESH_MS / 2,
    refetchInterval: REFRESH_MS,
  } as const;
  const failedEmails = useQuery({
    ...options,
    enabled: options.enabled && role === "center_manager",
    queryKey: [...base, "menu-badges", "failed-emails"],
    queryFn: ({ signal }) =>
      academicApi.emailDeliveries(1, 1, signal, "FAILED"),
  });
  const pendingRegistrations = useQuery({
    ...options,
    enabled: options.enabled && role === "staff",
    queryKey: [...base, "menu-badges", "pending-registrations"],
    queryFn: ({ signal }) =>
      directoryApi.registrations({ status: "DRAFT", page: 1, limit: 1 }, signal),
  });
  // Cùng khóa với bảng Bài tập & chấm bài nên không gọi lại khi đã mở bảng.
  const workspaces = useQuery({
    ...options,
    enabled: options.enabled && role === "teacher",
    queryKey: [...base, "teacher-assignment-workspaces"],
    queryFn: ({ signal }) => readAssignmentWorkspaces(signal),
    select: (rows) =>
      rows.reduce(
        (sum, row) =>
          sum + submissionSummary(row.assignment, row.submissions).ungraded,
        0,
      ),
  });
  const today = todayInVietnam();
  const sessions = useQuery({
    ...options,
    enabled: options.enabled && role === "teacher",
    queryKey: [...base, "menu-badges", "teacher-sessions", today],
    queryFn: ({ signal }) =>
      academicApi.sessions(
        {
          fromDate: addCalendarDays(today, -UNMARKED_LOOKBACK_DAYS),
          toDate: today,
        },
        signal,
      ),
    select: (rows) =>
      rows.filter(
        (session) =>
          session.status === "SCHEDULED" &&
          Date.parse(session.endsAt) <= Date.now(),
      ).length,
  });
  if (role === "center_manager")
    return { [MENU_BADGE_KEYS.FAILED_EMAILS]: failedEmails.data?.total };
  if (role === "staff")
    return {
      [MENU_BADGE_KEYS.PENDING_REGISTRATIONS]: pendingRegistrations.data?.total,
    };
  if (role === "teacher")
    return {
      [MENU_BADGE_KEYS.UNGRADED_SUBMISSIONS]: workspaces.data,
      [MENU_BADGE_KEYS.UNMARKED_SESSIONS_TODAY]: sessions.data,
    };
  return {};
}

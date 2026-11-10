"use client";
import { useQuery } from "@tanstack/react-query";
import { curriculumApi } from "../api";
import type { ClosureRange } from "../center-closures";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ngày nghỉ trung tâm trong khoảng ngày (đọc đủ mọi trang). Lỗi tải thì trả danh sách rỗng:
 * ước tính số bài vẫn chạy như trước khi có ngày nghỉ.
 */
export function useCenterClosures(
  fromDate: string,
  toDate: string,
  enabled = true,
) {
  const valid = DAY.test(fromDate.slice(0, 10)) && DAY.test(toDate.slice(0, 10));
  const query = useQuery({
    queryKey: ["curriculum", "closures", fromDate.slice(0, 10), toDate.slice(0, 10)],
    queryFn: ({ signal }) =>
      curriculumApi.centerClosures(
        { fromDate: fromDate.slice(0, 10), toDate: toDate.slice(0, 10) },
        signal,
      ),
    enabled: enabled && valid,
    retry: false,
  });
  const closures: readonly ClosureRange[] = query.data ?? [];
  return { closures, query };
}

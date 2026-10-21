"use client";
import { parseAsStringLiteral, useQueryState } from "nuqs";

/**
 * Tab đang mở của một màn gộp (`?tab=`). Giá trị thiếu hoặc không thuộc danh sách thì về tab đầu.
 * Thanh tab và từng thân tab (có thể thuộc các feature khác nhau) cùng đọc hook này,
 * nên trang chỉ cần ghép các thành phần lại.
 */
export function useHubTab<T extends string>(tabs: readonly T[]) {
  return useQueryState("tab", parseAsStringLiteral(tabs).withDefault(tabs[0]));
}

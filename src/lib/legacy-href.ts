export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Đường dẫn mới cho một route cũ đã gộp vào màn khác. Query cố định đứng trước, các query cũ
 * được giữ (có thể đổi tên khóa) để link cũ, bookmark và link trong email vẫn mở đúng chỗ.
 */
export function legacyHref(
  path: string,
  fixed: Record<string, string>,
  searchParams: SearchParams = {},
  rename: Record<string, string> = {},
): string {
  const query = new URLSearchParams(fixed);
  for (const [key, value] of Object.entries(searchParams)) {
    const target = rename[key] ?? key;
    if (value === undefined || Object.hasOwn(fixed, target)) continue;
    for (const entry of Array.isArray(value) ? value : [value]) {
      query.append(target, entry);
    }
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

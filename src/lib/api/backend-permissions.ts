import type { WebRole } from "@/constants/roles";

/** Quyền tại BFF cho các API giáo trình; BE vẫn kiểm tra quyền và sở hữu dữ liệu. */
export function academicRoles(
  method: string,
  path: string,
): readonly WebRole[] | null {
  if (!path.startsWith("academic/")) return null;
  if (method === "GET")
    return path === "academic/scheduled-sessions"
      ? ["center_manager", "staff", "teacher"]
      : ["center_manager", "curriculum_designer", "teacher"];
  if (/\/approve$|^academic\/classes\//.test(path)) return ["center_manager"];
  return ["curriculum_designer"];
}

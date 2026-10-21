/** Tab của màn Lớp học (`/manager/classes?tab=`). Nhân viên không có quyền phòng nên không có tab. */
export const CLASS_HUB_LABELS = {
  classes: "Lớp học",
  rooms: "Phòng học",
} as const;
export type ClassHubTab = keyof typeof CLASS_HUB_LABELS;

export const MANAGER_CLASS_TABS = [
  "classes",
  "rooms",
] as const satisfies readonly ClassHubTab[];

/** Query riêng của tab Lớp học; đổi tab thì xóa. */
export const CLASS_HUB_RESET_KEYS = [
  "search",
  "subject",
  "grade",
  "status",
  "teacher",
  "view",
] as const;

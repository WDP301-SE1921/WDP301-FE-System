/** Tab của màn Khóa học & giáo trình (`/manager/curriculum?tab=`), theo vai trò. */
export const CURRICULUM_HUB_LABELS = {
  programs: "Khóa học & giáo trình",
  subjects: "Danh mục môn",
  curriculum: "Giáo trình",
  outcomes: "Mục tiêu khóa học",
  feedback: "Phản hồi giáo trình",
} as const;
export type CurriculumHubTab = keyof typeof CURRICULUM_HUB_LABELS;

/** Quản lý: tạo khóa học và duyệt áp dụng giáo trình; danh mục môn để cuối. Không tạo giáo trình. */
export const MANAGER_CURRICULUM_TABS = [
  "programs",
  "feedback",
  "subjects",
] as const satisfies readonly CurriculumHubTab[];
/** Thiết kế giáo trình: soạn giáo trình và xử lý phản hồi; không thấy Môn học / Khóa học. */
export const DESIGNER_CURRICULUM_TABS = [
  "curriculum",
  "outcomes",
  "feedback",
] as const satisfies readonly CurriculumHubTab[];

/** Query riêng của các tab; đổi tab thì xóa. */
export const CURRICULUM_HUB_RESET_KEYS = [
  "search",
  "page",
  "pageSize",
  "status",
  "grade",
  "subject",
  "subjectId",
  "catalogPage",
  "programFilter",
  "program",
  "programTab",
  "editProgram",
  "returnTo",
  "outcomeProgram",
  "outcomeMatrix",
] as const;

/** Tab của màn Khóa học & giáo trình (`/manager/curriculum?tab=`), theo vai trò. */
export const CURRICULUM_HUB_LABELS = {
  programs: "Khóa học & giáo trình",
  subjects: "Môn học",
  curriculum: "Giáo trình",
  outcomes: "Chuẩn đầu ra (CLO)",
  feedback: "Phản hồi giáo trình",
} as const;
export type CurriculumHubTab = keyof typeof CURRICULUM_HUB_LABELS;

/** Quản lý: tạo khóa học, môn học và duyệt giáo trình; không tạo giáo trình. */
export const MANAGER_CURRICULUM_TABS = [
  "programs",
  "subjects",
  "feedback",
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
  "outcomeProgram",
] as const;

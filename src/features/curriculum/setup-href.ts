import { ROUTES } from "@/constants/routes";
import type { ContentStepKey } from "./content-setup";

export interface CurriculumSetupHrefInput {
  programId: string;
  unitId?: string | null;
  step?: ContentStepKey;
  /** Hộp soạn mở sẵn: lesson, import, submit, revision... */
  editor?: string;
}

/** Đường dẫn trang giáo trình một trang: `?programId=…[&unitId][&step][&editor]`. */
export function curriculumSetupHref({
  programId,
  unitId,
  step,
  editor,
}: CurriculumSetupHrefInput) {
  const params = new URLSearchParams({ programId });
  if (unitId) params.set("unitId", unitId);
  if (step) params.set("step", step);
  if (editor) params.set("editor", editor);
  return `${ROUTES.MANAGER.CURRICULUM_SETUP}?${params.toString()}`;
}

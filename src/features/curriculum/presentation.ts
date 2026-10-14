import type { CurriculumUnit } from "@/types/curriculum";

/** Review stages are presentation labels; the API still uses PENDING_REVIEW. */
export function curriculumStage(
  unit: Pick<CurriculumUnit, "status" | "technicalReviewedAt">,
) {
  if (unit.status !== "PENDING_REVIEW") return unit.status;
  return unit.technicalReviewedAt
    ? "PENDING_MANAGER_CONFIRMATION"
    : "PENDING_TECHNICAL_REVIEW";
}

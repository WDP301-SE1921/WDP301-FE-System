"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { CurriculumTechnicalReviewForm } from "../curriculum-review-forms";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitTeacherDecision({ ws }: { ws: UnitWorkspace }) {
  const router = useRouter();
  const {
    unit,
    canTechnicalReview,
    setFormState,
    companions,
    outcomesUnready,
    setNotice,
    reportFollowUp,
  } = ws;
  if (!unit || !canTechnicalReview) return null;
  return (
    <section id="curriculum-decision" className="scroll-mt-24">
      <CurriculumTechnicalReviewForm
        unit={unit}
        onStateChange={setFormState}
        companions={companions}
        outcomesUnready={outcomesUnready}
        onSaved={(approved, failures) => {
          if (approved) {
            setNotice("Đã duyệt nội dung giáo trình.");
            reportFollowUp(failures);
          } else router.push(ROUTES.TEACHER.CURRICULUM);
        }}
      />
    </section>
  );
}

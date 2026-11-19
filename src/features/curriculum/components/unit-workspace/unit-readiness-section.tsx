"use client";

import { CurriculumReadinessCards } from "../curriculum-readiness";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitReadinessSection({ ws }: { ws: UnitWorkspace }) {
  const { unit, canEdit, readiness, regular, checks, renumber, reorder } = ws;
  if (!unit || !canEdit) return null;
  return (
    <div id="curriculum-submit-checklist">
      <CurriculumReadinessCards
        unit={unit}
        readiness={readiness}
        lessonCount={regular.length}
        checks={checks}
        onRenumber={renumber}
        renumbering={reorder.isPending}
      />
    </div>
  );
}

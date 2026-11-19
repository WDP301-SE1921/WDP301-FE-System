"use client";

import { actsAsManager } from "@/constants/roles";
import { approvalPlan } from "@/features/outcomes/two-stage-approval";
import { UnitOutcomesSection } from "../unit-outcomes-section";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitOutcomes({ ws }: { ws: UnitWorkspace }) {
  const {
    unit,
    role,
    companions,
    keptVersion,
    canApproveSets,
    approveOneSet,
    approvingSetId,
  } = ws;
  if (!unit || !(role === "teacher" || actsAsManager(role))) return null;
  return (
    <UnitOutcomesSection
      unit={unit}
      companions={companions}
      keptVersion={keptVersion}
      canApproveSet={(set) =>
        canApproveSets && approvalPlan("teacher", [set]).approvable.length > 0
      }
      approveLabel="Duyệt bộ mục tiêu"
      onApproveSet={(set) => void approveOneSet(set)}
      approvingSetId={approvingSetId}
    />
  );
}

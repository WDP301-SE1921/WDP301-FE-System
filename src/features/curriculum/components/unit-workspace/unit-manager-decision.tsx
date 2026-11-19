"use client";

import { Button } from "@/components/ui/button";
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitManagerDecision({ ws }: { ws: UnitWorkspace }) {
  const { canConfirm, busy, outcomesUnready, openEditor, setConfirmApply } = ws;
  if (!canConfirm) return null;
  return (
    <StickyFormFooter>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => openEditor({ kind: "request-changes" })}
      >
        Trả lại để sửa
      </Button>
      <Button
        disabled={busy || outcomesUnready}
        onClick={() => setConfirmApply(true)}
      >
        Duyệt áp dụng
      </Button>
    </StickyFormFooter>
  );
}

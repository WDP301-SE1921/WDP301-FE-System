"use client";

import { useEffect } from "react";
import { useUnsavedChanges } from "@/components/shared/feedback/unsaved-changes-guard";

export interface CurriculumFormState {
  dirty: boolean;
  busy: boolean;
}

export function useCurriculumFormState(
  dirty: boolean,
  busy: boolean,
  onStateChange?: (state: CurriculumFormState) => void,
) {
  useUnsavedChanges(dirty);
  useEffect(() => {
    onStateChange?.({ dirty, busy });
  }, [dirty, busy, onStateChange]);
}

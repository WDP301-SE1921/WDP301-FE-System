import { ApiError } from "@/lib/api/client";
import type { ScheduleRangeInput } from "@/lib/validators/curriculum";
import type { CurriculumUnit, SessionPreview } from "@/types/curriculum";
import type { GenerationAttempt } from "./generation-storage";

export interface ClassGenerationResult {
  input: ScheduleRangeInput;
  preview?: SessionPreview;
  attempt?: GenerationAttempt;
  error?: unknown;
  generated?: number;
}
export function sameGenerationInput(
  a: ScheduleRangeInput,
  b: ScheduleRangeInput,
) {
  return (
    a.curriculumUnitId === b.curriculumUnitId &&
    a.fromDate === b.fromDate &&
    a.toDate === b.toDate
  );
}
export function applicableUnits(
  units: CurriculumUnit[],
  fromDate: string,
  toDate: string,
) {
  if (!fromDate || !toDate || fromDate > toDate) return [];
  return units.filter(
    (unit) =>
      unit.status === "APPROVED" &&
      unit.fromDate.slice(0, 10) <= fromDate &&
      unit.toDate.slice(0, 10) >= toDate,
  );
}
export function generationReady(
  result: ClassGenerationResult | undefined,
  input: ScheduleRangeInput,
  now: number,
): result is ClassGenerationResult {
  return (
    !!result &&
    result.generated === undefined &&
    (!!result.attempt ||
      (sameGenerationInput(result.input, input) &&
        !!result.preview?.slots.length &&
        Date.parse(result.preview.expiresAt) > now &&
        !result.preview.slots.some((slot) => slot.conflicts.length)))
  );
}
interface GenerationDependencies {
  getAttempt: (id: string, input: ScheduleRangeInput) => GenerationAttempt;
  clearAttempt: (id: string) => void;
  generate: (
    id: string,
    input: ScheduleRangeInput,
    key: string,
  ) => Promise<{ sessions: unknown[] }>;
  onResult: (id: string, result: ClassGenerationResult) => void;
  now: () => number;
}
/** Execute sequentially. An uncertain request retains exactly its body/key for a later retry. */
export async function generateSelectedClasses(
  classIds: string[],
  results: Record<string, ClassGenerationResult>,
  input: ScheduleRangeInput,
  deps: GenerationDependencies,
) {
  let succeeded = 0,
    failed = 0;
  for (const id of classIds) {
    const row = results[id];
    if (!generationReady(row, input, deps.now())) continue;
    let operation = row.attempt;
    try {
      operation ??= deps.getAttempt(id, {
        ...row.input,
        previewId: row.preview!.previewId,
      });
      deps.onResult(id, { ...row, attempt: operation, error: undefined });
      const generated = await deps.generate(id, operation.body, operation.key);
      let cleanupError: unknown;
      try {
        deps.clearAttempt(id);
      } catch (error) {
        cleanupError = error;
      }
      succeeded++;
      deps.onResult(id, {
        input: operation.body,
        generated: generated.sessions.length,
        error: cleanupError,
      });
    } catch (error) {
      failed++;
      const definitive =
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        ![401, 403, 408, 429].includes(error.status) &&
        error.code !== "IDEMPOTENCY_CONFLICT";
      let cleared = false;
      if (definitive) {
        try {
          deps.clearAttempt(id);
          cleared = true;
        } catch {
          /* Retain the known attempt if storage is unavailable. */
        }
      }
      deps.onResult(id, {
        ...row,
        preview: definitive ? undefined : row.preview,
        attempt: cleared ? undefined : operation,
        error,
      });
    }
  }
  return { succeeded, failed };
}

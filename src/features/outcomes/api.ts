import { apiRequest } from "@/lib/api/client";
import { academicApi } from "@/features/academic/api";
import {
  learningOutcomeSchema,
  lessonOutcomeSchema,
  outcomeChangeRequestSchema,
  outcomeSetCreateSchema,
  outcomeSetUpdateSchema,
  sourceReviewSchema,
} from "@/lib/validators/outcomes";
import type { LearningOutcome, OutcomeSet } from "@/types/outcomes";

const setPath = (id: string) =>
  `academic/outcome-sets/${encodeURIComponent(id)}`;
const post = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body });

/** Vòng đời bộ CLO: Thiết kế GT soạn → Giáo viên của khóa xác minh → Quản lý duyệt. */
export const outcomeApi = {
  sets: (programId: string, signal?: AbortSignal) =>
    academicApi.outcomeSets(programId, {}, signal),
  getSet: (setId: string, signal?: AbortSignal) =>
    apiRequest<OutcomeSet>(setPath(setId), { signal }),
  createSet: (body: unknown) =>
    post<OutcomeSet>("academic/outcome-sets", outcomeSetCreateSchema.parse(body)),
  updateSet: (setId: string, body: unknown) =>
    apiRequest<OutcomeSet>(setPath(setId), {
      method: "PATCH",
      body: outcomeSetUpdateSchema.parse(body),
    }),
  deleteSet: (setId: string) =>
    apiRequest<{ id: string; deleted: boolean }>(setPath(setId), {
      method: "DELETE",
    }),
  deleteOutcome: (setId: string, outcomeId: string) =>
    apiRequest<{ id: string; deleted: boolean }>(
      `${setPath(setId)}/outcomes/${encodeURIComponent(outcomeId)}`,
      { method: "DELETE" },
    ),
  saveOutcome: (setId: string, body: unknown, outcomeId?: string) =>
    apiRequest<LearningOutcome>(
      outcomeId
        ? `${setPath(setId)}/outcomes/${encodeURIComponent(outcomeId)}`
        : `${setPath(setId)}/outcomes`,
      {
        method: outcomeId ? "PATCH" : "POST",
        body: learningOutcomeSchema.parse(body),
      },
    ),
  mapLesson: (lessonId: string, outcomeIds: string[]) =>
    apiRequest<{ lessonId: string; outcomeIds: string[] }>(
      `academic/lessons/${encodeURIComponent(lessonId)}/outcomes`,
      { method: "PATCH", body: lessonOutcomeSchema.parse({ outcomeIds }) },
    ),
  verifySource: (outcomeId: string, body: unknown) =>
    post<LearningOutcome>(
      `academic/outcomes/${encodeURIComponent(outcomeId)}/verify-source`,
      sourceReviewSchema.parse(body),
    ),
  technicalApprove: (setId: string) =>
    post<OutcomeSet>(`${setPath(setId)}/technical-approve`),
  approve: (setId: string) => post<OutcomeSet>(`${setPath(setId)}/approve`),
  requestChanges: (setId: string, body: unknown) =>
    post<OutcomeSet>(
      `${setPath(setId)}/request-changes`,
      outcomeChangeRequestSchema.parse(body),
    ),
};

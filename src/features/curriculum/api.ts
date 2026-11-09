import { apiRequest } from "@/lib/api/client";
import { readArrayPages } from "@/features/academic/api";
import {
  curriculumUnitSchema,
  curriculumLessonSchema,
  curriculumSubmitSchema,
  curriculumTechnicalReviewSchema,
  curriculumRevisionSchema,
  scheduleRangeSchema,
  type CurriculumUnitInput,
  type CurriculumLessonInput,
  type CurriculumSubmitInput,
  type CurriculumTechnicalReviewInput,
  type CurriculumRevisionInput,
  type ScheduleRangeInput,
  importCommitSchema,
  reviewReasonSchema,
  lessonOrderSchema,
  sessionRescheduleSchema,
  sessionCancelSchema,
  type ImportCommitInput,
  type SessionRescheduleInput,
  type SessionCancelInput,
} from "@/lib/validators/curriculum";
import type {
  CurriculumUnit,
  CurriculumUnitDetail,
  CurriculumLesson,
  SessionPreview,
  SessionGeneration,
  ScheduledSession,
  ScheduledSessionDetail,
  SessionMutationResult,
  CurriculumFilters,
  CurriculumValidation,
  ImportPreview,
  CurriculumReviewer,
} from "@/types/curriculum";
import type { PaginatedList } from "@/types/backend";

const unitsPath = "academic/curriculum-units";
const unitPath = (id: string) => `${unitsPath}/${encodeURIComponent(id)}`;
export const curriculumApi = {
  /** BE luôn phân trang danh sách giáo trình (mặc định 20) nên đọc hết các trang. */
  units: (programId?: string, signal?: AbortSignal) =>
    readArrayPages<CurriculumUnit>(unitsPath, { programId }, signal),
  unit: (id: string, signal?: AbortSignal) =>
    apiRequest<CurriculumUnitDetail>(unitPath(id), { signal }),
  create: (input: CurriculumUnitInput) =>
    apiRequest<CurriculumUnitDetail>(unitsPath, {
      method: "POST",
      body: curriculumUnitSchema.parse(input),
    }),
  unitPage: async (filters: CurriculumFilters, signal?: AbortSignal) => {
    const query = new URLSearchParams({
      paginated: "true",
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 20),
    });
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && value !== "") query.set(key, String(value));
    const data = await apiRequest<
      PaginatedList<CurriculumUnit> | CurriculumUnit[]
    >(`${unitsPath}?${query}`, { signal });
    return Array.isArray(data)
      ? {
          items: data,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          total: data.length,
        }
      : data;
  },
  update: (
    id: string,
    input: CurriculumUnitInput,
    expectedRevision?: number,
  ) => {
    const { title, fromDate, toDate } = curriculumUnitSchema.parse(input);
    return apiRequest<CurriculumUnitDetail>(unitPath(id), {
      method: "PATCH",
      body: {
        title,
        fromDate,
        toDate,
        ...(expectedRevision === undefined ? {} : { expectedRevision }),
      },
    });
  },
  lesson: (
    id: string,
    input: CurriculumLessonInput,
    lessonId?: string,
    expectedRevision?: number,
  ) =>
    apiRequest<CurriculumLesson>(
      `${unitPath(id)}/lessons${lessonId ? `/${encodeURIComponent(lessonId)}` : ""}`,
      {
        method: lessonId ? "PATCH" : "POST",
        body: {
          ...curriculumLessonSchema.parse(input),
          ...(expectedRevision === undefined ? {} : { expectedRevision }),
        },
      },
    ),
  approve: (id: string) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/approve`, {
      method: "POST",
    }),
  revise: (id: string, input: CurriculumRevisionInput) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/revisions`, {
      method: "POST",
      body: curriculumRevisionSchema.parse(input),
    }),
  preview: (classId: string, input: ScheduleRangeInput) =>
    apiRequest<SessionPreview>(
      `academic/classes/${encodeURIComponent(classId)}/session-preview`,
      { method: "POST", body: scheduleRangeSchema.parse(input) },
    ),
  generate: (classId: string, input: ScheduleRangeInput, key: string) =>
    apiRequest<SessionGeneration>(
      `academic/classes/${encodeURIComponent(classId)}/session-generations`,
      {
        method: "POST",
        body: scheduleRangeSchema.parse(input),
        idempotencyKey: key,
      },
    ),
  validation: (id: string) =>
    apiRequest<CurriculumValidation>(`${unitPath(id)}/validation`, {
      method: "POST",
    }),
  reviewers: (id: string, signal?: AbortSignal) =>
    readArrayPages<CurriculumReviewer>(`${unitPath(id)}/reviewers`, {}, signal),
  submit: (id: string, input: CurriculumSubmitInput) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/submit`, {
      method: "POST",
      body: curriculumSubmitSchema.parse(input),
    }),
  technicalReview: (id: string, input: CurriculumTechnicalReviewInput) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/technical-review`, {
      method: "POST",
      body: curriculumTechnicalReviewSchema.parse(input),
    }),
  requestChanges: (id: string, reason: string) =>
    apiRequest<CurriculumUnit>(`${unitPath(id)}/request-changes`, {
      method: "POST",
      body: reviewReasonSchema.parse({ reason }),
    }),
  remove: (id: string) =>
    apiRequest<CurriculumUnit | { id: string; deleted: true }>(unitPath(id), {
      method: "DELETE",
    }),
  removeLesson: (id: string, lessonId: string) =>
    apiRequest<unknown>(
      `${unitPath(id)}/lessons/${encodeURIComponent(lessonId)}`,
      { method: "DELETE" },
    ),
  reorder: (id: string, orderedLessonIds: string[], expectedRevision: number) =>
    apiRequest<unknown>(`${unitPath(id)}/lesson-order`, {
      method: "PUT",
      body: lessonOrderSchema.parse({ orderedLessonIds, expectedRevision }),
    }),
  importPreview: (id: string, file: File, mode: "APPEND" | "REPLACE") => {
    const body = new FormData();
    body.set("file", file);
    body.set("mode", mode);
    return apiRequest<ImportPreview>(`${unitPath(id)}/import-preview`, {
      method: "POST",
      body,
    });
  },
  importCommit: (id: string, input: ImportCommitInput, key: string) =>
    apiRequest<{ unitId: string; revision: number; createdCount: number }>(
      `${unitPath(id)}/import-commit`,
      {
        method: "POST",
        body: importCommitSchema.parse(input),
        idempotencyKey: key,
      },
    ),
  generations: (classId: string, signal?: AbortSignal) =>
    readArrayPages<SessionGeneration>(
      `academic/classes/${encodeURIComponent(classId)}/session-generations`,
      {},
      signal,
    ),
  generation: (id: string, signal?: AbortSignal) =>
    apiRequest<SessionGeneration>(
      `academic/session-generations/${encodeURIComponent(id)}`,
      { signal },
    ),
  session: (id: string, signal?: AbortSignal) =>
    apiRequest<ScheduledSessionDetail>(
      `academic/scheduled-sessions/${encodeURIComponent(id)}`,
      { signal },
    ),
  reschedulePreview: (id: string, input: SessionRescheduleInput) =>
    apiRequest<{ sessionId: string; conflicts: unknown[] }>(
      `academic/sessions/${encodeURIComponent(id)}/reschedule-preview`,
      { method: "POST", body: sessionRescheduleSchema.parse(input) },
    ),
  reschedule: (id: string, input: SessionRescheduleInput, key: string) =>
    apiRequest<SessionMutationResult>(
      `academic/sessions/${encodeURIComponent(id)}/reschedule`,
      {
        method: "POST",
        body: sessionRescheduleSchema.parse(input),
        idempotencyKey: key,
      },
    ),
  cancelSession: (id: string, input: SessionCancelInput, key: string) =>
    apiRequest<SessionMutationResult>(
      `academic/sessions/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        body: sessionCancelSchema.parse(input),
        idempotencyKey: key,
      },
    ),
  sessions: async (
    classId: string,
    signal?: AbortSignal,
    range: { fromDate?: string; toDate?: string } = {},
  ) => {
    const rows: ScheduledSession[] = [];
    for (let page = 1; ; page++) {
      const batch = await apiRequest<ScheduledSession[]>(
        `academic/scheduled-sessions?${new URLSearchParams({ ...(classId ? { classId } : {}), ...range, page: String(page), limit: "100" })}`,
        { signal },
      );
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
  },
};

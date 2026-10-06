import { apiRequest } from "@/lib/api/client";
import {
  curriculumUnitSchema,
  curriculumLessonSchema,
  monthlyTestSchema,
  scheduleRangeSchema,
  type CurriculumUnitInput,
  type CurriculumLessonInput,
  type MonthlyTestInput,
  type ScheduleRangeInput,
} from "@/lib/validators/curriculum";
import type {
  CurriculumUnit,
  CurriculumUnitDetail,
  CurriculumLesson,
  SessionPreview,
  SessionGeneration,
  ScheduledSession,
} from "@/types/curriculum";

const unitsPath = "academic/curriculum-units";
const unitPath = (id: string) => `${unitsPath}/${encodeURIComponent(id)}`;
export const curriculumApi = {
  units: (programId?: string, signal?: AbortSignal) =>
    apiRequest<CurriculumUnit[]>(
      programId
        ? `${unitsPath}?${new URLSearchParams({ programId })}`
        : unitsPath,
      { signal },
    ),
  unit: (id: string, signal?: AbortSignal) =>
    apiRequest<CurriculumUnitDetail>(unitPath(id), { signal }),
  create: (input: CurriculumUnitInput) =>
    apiRequest<CurriculumUnitDetail>(unitsPath, {
      method: "POST",
      body: curriculumUnitSchema.parse(input),
    }),
  update: (id: string, input: CurriculumUnitInput) => {
    const { title, fromDate, toDate } = curriculumUnitSchema.parse(input);
    return apiRequest<CurriculumUnitDetail>(unitPath(id), {
      method: "PATCH",
      body: { title, fromDate, toDate },
    });
  },
  lesson: (id: string, input: CurriculumLessonInput, lessonId?: string) =>
    apiRequest<CurriculumLesson>(
      `${unitPath(id)}/lessons${lessonId ? `/${encodeURIComponent(lessonId)}` : ""}`,
      {
        method: lessonId ? "PATCH" : "POST",
        body: curriculumLessonSchema.parse(input),
      },
    ),
  monthlyTest: (id: string, input: MonthlyTestInput) =>
    apiRequest<CurriculumLesson>(`${unitPath(id)}/monthly-tests`, {
      method: "POST",
      body: monthlyTestSchema.parse(input),
    }),
  approve: (id: string) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/approve`, {
      method: "POST",
    }),
  revise: (id: string) =>
    apiRequest<CurriculumUnitDetail>(`${unitPath(id)}/revisions`, {
      method: "POST",
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
  sessions: async (classId: string, signal?: AbortSignal) => {
    const rows: ScheduledSession[] = [];
    for (let page = 1; ; page++) {
      const batch = await apiRequest<ScheduledSession[]>(
        `academic/scheduled-sessions?${new URLSearchParams({ classId, page: String(page), limit: "100" })}`,
        { signal },
      );
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
  },
};

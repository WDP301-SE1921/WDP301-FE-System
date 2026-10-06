import {
  scheduleRangeSchema,
  type ScheduleRangeInput,
} from "@/lib/validators/curriculum";

export interface GenerationAttempt {
  key: string;
  body: ScheduleRangeInput;
}
const storageKey = (userId: string, classId: string) =>
  `edugrade:session-generation:${userId}:${classId}`;

export function readGenerationAttempt(
  userId: string,
  classId: string,
): GenerationAttempt | null {
  const raw = sessionStorage.getItem(storageKey(userId, classId));
  if (!raw) return null;
  const stored = JSON.parse(raw);
  const body = scheduleRangeSchema.parse(stored.body);
  if (typeof stored.key !== "string" || !stored.key)
    throw new Error("Không đọc được khóa sinh lịch đã lưu.");
  return { key: stored.key, body };
}

export function getGenerationAttempt(
  userId: string,
  classId: string,
  body: ScheduleRangeInput,
): GenerationAttempt {
  const existing = readGenerationAttempt(userId, classId);
  if (existing) return existing;
  const attempt = {
    key: crypto.randomUUID(),
    body: scheduleRangeSchema.parse(body),
  };
  sessionStorage.setItem(storageKey(userId, classId), JSON.stringify(attempt));
  return attempt;
}

export function clearGenerationAttempt(userId: string, classId: string) {
  sessionStorage.removeItem(storageKey(userId, classId));
}

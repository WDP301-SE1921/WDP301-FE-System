import { z } from "zod";
import { ApiError } from "@/lib/api/client";

export interface AcademicAttempt<T> {
  key: string;
  body: T;
}
const keyFor = (userId: string, target: string) =>
  `edugrade:academic:${userId}:${target}`;
export function readAcademicAttempt<T>(
  userId: string,
  target: string,
  schema: z.ZodType<T>,
): AcademicAttempt<T> | null {
  const raw = sessionStorage.getItem(keyFor(userId, target));
  if (!raw) return null;
  const parsed = z
    .object({ key: z.string().min(1), body: schema })
    .parse(JSON.parse(raw));
  return parsed as AcademicAttempt<T>;
}
export function saveAcademicAttempt<T>(
  userId: string,
  target: string,
  schema: z.ZodType<T>,
  body: T,
): AcademicAttempt<T> {
  const previous = readAcademicAttempt(userId, target, schema);
  if (previous) return previous;
  const attempt = { key: crypto.randomUUID(), body: schema.parse(body) };
  sessionStorage.setItem(keyFor(userId, target), JSON.stringify(attempt));
  return attempt;
}
export function clearAcademicAttempt(userId: string, target: string) {
  sessionStorage.removeItem(keyFor(userId, target));
}
export function uncertainAcademicFailure(error: unknown) {
  return (
    !(error instanceof ApiError) ||
    error.status === 0 ||
    error.status >= 500 ||
    [401, 403, 408, 429].includes(error.status) ||
    ["IDEMPOTENCY_CONFLICT", "IDEMPOTENCY_KEY_CONFLICT"].includes(error.code)
  );
}

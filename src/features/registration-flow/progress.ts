import { z } from "zod";
import type { RegistrationInput } from "./schemas";

const progressSchema = z.object({
  version: z.literal(1),
  step: z.number().int().min(0).max(4),
  email: z.string().max(255),
  parentEmail: z.union([z.literal(""), z.string().email().max(255)]),
  registrationId: z.string().min(1).max(255).nullable(),
  values: z.object({
    targetStudentId: z.string().max(255),
    classId: z.string().max(255),
    startDate: z.string().max(10),
    // An empty number input is NaN in RHF and null in JSON. Keep incomplete forms.
    packageMonths: z.number().finite().nullable(),
    hasReceivedPayment: z.boolean(),
    receiptNumber: z.string().max(1000),
  }),
});

export interface RegistrationProgress {
  version: 1;
  step: number;
  email: string;
  parentEmail: string;
  registrationId: string | null;
  values: Omit<RegistrationInput, "packageMonths"> & {
    packageMonths: number | null;
  };
}

const memory = new Map<string, RegistrationProgress | null>();

function progressKey(userId: string) {
  return `edugrade:registration-progress:${userId}`;
}

export function readRegistrationProgress(
  userId: string,
): RegistrationProgress | null {
  if (memory.has(userId)) return memory.get(userId) ?? null;
  try {
    const raw = localStorage.getItem(progressKey(userId));
    if (!raw) return memory.get(userId) ?? null;
    const result = progressSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return memory.get(userId) ?? null;
  }
}

export function saveRegistrationProgress(
  userId: string,
  progress: RegistrationProgress,
): boolean {
  try {
    localStorage.setItem(progressKey(userId), JSON.stringify(progress));
    memory.delete(userId);
    return true;
  } catch {
    // Menu navigation can still restore the in-memory copy if browser storage fails.
    memory.set(userId, structuredClone(progress));
    return false;
  }
}

export function clearRegistrationProgress(userId: string): boolean {
  try {
    localStorage.removeItem(progressKey(userId));
    memory.delete(userId);
    return true;
  } catch {
    // Do not resurrect an old disk copy after a failed storage removal.
    memory.set(userId, null);
    return false;
  }
}

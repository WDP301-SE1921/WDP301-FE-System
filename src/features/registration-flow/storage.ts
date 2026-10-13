export interface PaymentAttempt {
  key: string;
  body: { receiptNumber?: string };
}
export interface RegistrationHistoryEntry {
  id: string;
  createdAt: string;
}
export function getDraftAttempt(
  userId: string,
  body: {
    targetStudentId: string;
    classId: string;
    startDate: string;
    packageMonths: number;
  },
): string {
  const key = `edugrade:registration-draft:${userId}`;
  const fingerprint = JSON.stringify(body);
  const raw = sessionStorage.getItem(key);
  const stored = raw ? JSON.parse(raw) : null;
  if (
    stored?.fingerprint === fingerprint &&
    typeof stored.key === "string" &&
    stored.key
  )
    return stored.key;
  const attempt = { key: crypto.randomUUID(), fingerprint };
  sessionStorage.setItem(key, JSON.stringify(attempt));
  return attempt.key;
}

export function clearDraftAttempt(userId: string) {
  sessionStorage.removeItem(`edugrade:registration-draft:${userId}`);
}
function storageKey(userId: string) {
  return `edugrade:registrations:${userId}`;
}
export function recentRegistrations(
  userId: string,
): RegistrationHistoryEntry[] {
  try {
    const rows: unknown = JSON.parse(
      sessionStorage.getItem(storageKey(userId)) ?? "[]",
    );
    if (!Array.isArray(rows)) return [];
    return rows
      .filter(
        (row): row is RegistrationHistoryEntry =>
          !!row &&
          typeof row.id === "string" &&
          /^[a-zA-Z0-9_-]+$/.test(row.id) &&
          typeof row.createdAt === "string",
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}
export function rememberRegistration(userId: string, id: string) {
  const rows = recentRegistrations(userId).filter((entry) => entry.id !== id);
  sessionStorage.setItem(
    storageKey(userId),
    JSON.stringify(
      [{ id, createdAt: new Date().toISOString() }, ...rows].slice(0, 30),
    ),
  );
  window.dispatchEvent(new Event("edugrade:registrations-changed"));
}
export function readPaymentAttempt(
  userId: string,
  id: string,
): PaymentAttempt | null {
  const attempt = JSON.parse(
    sessionStorage.getItem(`${storageKey(userId)}:${id}:payment`) ?? "null",
  );
  if (attempt === null) return null;
  if (!(
    attempt &&
    typeof attempt.key === "string" &&
    attempt.key.length > 0 &&
    attempt.body &&
    typeof attempt.body === "object" &&
    !Array.isArray(attempt.body) &&
    Object.keys(attempt.body).every((field) => field === "receiptNumber") &&
    (attempt.body.receiptNumber === undefined ||
      (typeof attempt.body.receiptNumber === "string" &&
        attempt.body.receiptNumber.length <= 191))
  ))
    throw new Error(
      "Không đọc được thao tác thu tiền đã lưu. Kiểm tra lại bill trước khi tiếp tục.",
    );
  return attempt;
}
export function getPaymentAttempt(
  userId: string,
  id: string,
  receiptNumber: string,
): PaymentAttempt {
  const existing = readPaymentAttempt(userId, id);
  if (existing) return existing;
  const attempt = {
    key: crypto.randomUUID(),
    body: receiptNumber.trim() ? { receiptNumber: receiptNumber.trim() } : {},
  };
  // Save before sending. If storage is unavailable, refuse the payment rather than lose its retry key.
  sessionStorage.setItem(
    `${storageKey(userId)}:${id}:payment`,
    JSON.stringify(attempt),
  );
  return attempt;
}

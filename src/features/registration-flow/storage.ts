export interface PaymentAttempt {
  key: string;
  body: { receiptNumber?: string };
}
export interface RegistrationHistoryEntry {
  id: string;
  createdAt: string;
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
  try {
    const attempt = JSON.parse(
      sessionStorage.getItem(`${storageKey(userId)}:${id}:payment`) ?? "null",
    );
    return attempt &&
      typeof attempt.key === "string" &&
      attempt.key.length > 0 &&
      attempt.body &&
      typeof attempt.body === "object" &&
      (attempt.body.receiptNumber === undefined ||
        typeof attempt.body.receiptNumber === "string")
      ? attempt
      : null;
  } catch {
    return null;
  }
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

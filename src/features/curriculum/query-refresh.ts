/** Existing queries only: invalidation never grants another role access to an API. */
export function isCurriculumQuery(key: readonly unknown[]) {
  return ["curriculum", "registration-programs", "academic-program", "registration-class", "registration-classes", "academic-schedules"].includes(String(key[0])) ||
    (key[0] === "web-api" && key.some((part) => typeof part === "string" && /dashboard.*units|curriculum/.test(part)));
}

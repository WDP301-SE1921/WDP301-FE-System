import type { WebRole } from "@/constants/roles";

const manager = ["center_manager"] as const;
const designer = ["curriculum_designer"] as const;
const contentReaders = [
  "center_manager",
  "curriculum_designer",
  "teacher",
] as const;
const sessionReaders = ["center_manager", "staff", "teacher"] as const;
const catalogReaders = [...sessionReaders, "curriculum_designer"] as const;
const staff = ["staff"] as const;
const teacher = ["teacher"] as const;

// BE also enforces ownership and state; unmatched method/path pairs are denied.
const rules: {
  method: string;
  path: RegExp;
  roles: readonly WebRole[] | null;
}[] = [
  { method: "GET", path: /^dashboard$/, roles: manager },
  { method: "GET", path: /^staff(?:\/[^/]+)?$/, roles: manager },
  { method: "POST", path: /^(staff|teachers)$/, roles: manager },
  {
    method: "PATCH",
    path: /^(staff|teachers|parents)\/[^/]+$/,
    roles: manager,
  },
  {
    method: "GET",
    path: /^parents\/(?!lookup$|search$)[^/]+$/,
    roles: manager,
  },
  {
    method: "GET",
    path: /^students\/[^/]+\/(enrollments|schedule)$/,
    roles: ["center_manager", "staff"],
  },
  { method: "GET", path: /^(registrations|payments)$/, roles: staff },
  {
    method: "GET",
    path: /^academic\/(enrollments|sessions)$/,
    roles: sessionReaders,
  },
  {
    method: "GET",
    path: /^academic\/sessions\/[^/]+\/roster$/,
    roles: sessionReaders,
  },
  {
    method: "POST",
    path: /^academic\/sessions\/[^/]+\/(roster|finalize-attendance)$/,
    roles: teacher,
  },
  {
    method: "GET",
    path: /^academic\/(leaves|makeup-sources|makeups)$/,
    roles: staff,
  },
  {
    method: "GET",
    path: /^academic\/participants\/[^/]+\/makeup-candidates$/,
    roles: staff,
  },
  { method: "POST", path: /^academic\/(leaves|makeups)$/, roles: staff },
  {
    method: "POST",
    path: /^academic\/leaves\/[^/]+\/(decide|cancel)$/,
    roles: staff,
  },
  { method: "POST", path: /^academic\/makeups\/[^/]+\/cancel$/, roles: staff },
  {
    method: "POST",
    path: /^academic\/enrollments\/[^/]+\/(transfer|end)$/,
    roles: staff,
  },
  {
    method: "POST",
    path: /^academic\/students\/[^/]+\/end-study$/,
    roles: staff,
  },
  {
    method: "GET",
    path: /^academic\/assignments(?:\/[^/]+(?:\/submissions)?)?$/,
    roles: teacher,
  },
  {
    method: "POST",
    path: /^academic\/assignments(?:\/[^/]+\/(publish|close|reopen|publish-answers))?$/,
    roles: teacher,
  },
  { method: "PATCH", path: /^academic\/assignments\/[^/]+$/, roles: teacher },
  {
    method: "POST",
    path: /^academic\/submissions\/[^/]+\/(grades|grade-objective|grade-ai)$/,
    roles: teacher,
  },
  { method: "GET", path: /^academic\/grading-jobs\/[^/]+$/, roles: teacher },
  {
    method: "POST",
    path: /^academic\/grades\/[^/]+\/(approve|publish)$/,
    roles: teacher,
  },
  {
    method: "GET",
    path: /^academic\/reports(?:\/[^/]+\/download)?$/,
    roles: teacher,
  },
  { method: "POST", path: /^academic\/reports$/, roles: teacher },
  { method: "GET", path: /^academic\/files\/[^/]+\/download$/, roles: teacher },
  {
    method: "GET",
    path: /^academic\/(lessons|feedback)$/,
    roles: contentReaders,
  },
  {
    method: "POST",
    path: /^academic\/lessons\/[^/]+\/feedback$/,
    roles: teacher,
  },
  {
    method: "POST",
    path: /^academic\/feedback\/[^/]+\/resolve$/,
    roles: [...manager, ...designer],
  },
  {
    method: "GET",
    path: /^academic\/announcements$/,
    roles: [...manager, ...teacher],
  },
  {
    method: "POST",
    path: /^academic\/announcements(?:\/[^/]+\/send-email)?$|^academic\/tuition-reminders\/send-email$/,
    roles: manager,
  },
  { method: "GET", path: /^auth\/me$/, roles: null },
  { method: "POST", path: /^auth\/(login|logout|register)$/, roles: null },
  {
    method: "GET",
    path: /^parents\/search$|^registrations\/[^/]+(?:\/(bill|receipt))?$/,
    roles: ["staff"],
  },
  {
    method: "POST",
    path: /^registrations(?:\/[^/]+\/(cancel|confirm-payment))?$/,
    roles: ["staff"],
  },
  {
    method: "GET",
    path: /^parents(?:\/lookup)?$|^students$/,
    roles: ["center_manager", "staff"],
  },
  {
    method: "GET",
    path: /^(subjects|programs)(?:\/[^/]+)?$/,
    roles: catalogReaders,
  },
  { method: "POST", path: /^(subjects|programs|classes)$/, roles: manager },
  {
    method: "PATCH",
    path: /^(subjects|programs|classes)\/[^/]+$/,
    roles: manager,
  },
  {
    method: "DELETE",
    path: /^(subjects|programs|classes)\/[^/]+$/,
    roles: manager,
  },
  {
    method: "GET",
    path: /^teachers(?:\/[^/]+)?$/,
    roles: ["center_manager", "staff"],
  },
  {
    method: "GET",
    path: /^classes(?:\/[^/]+(?:\/schedules)?)?$/,
    roles: sessionReaders,
  },
  { method: "POST", path: /^classes\/[^/]+\/schedules$/, roles: manager },
  { method: "PUT", path: /^classes\/[^/]+\/schedules$/, roles: manager },
  {
    method: "PATCH",
    path: /^classes\/[^/]+\/schedules\/[^/]+$/,
    roles: manager,
  },
  {
    method: "DELETE",
    path: /^classes\/[^/]+\/schedules\/[^/]+$/,
    roles: manager,
  },
  {
    method: "GET",
    path: /^academic\/curriculum-units(?:\/[^/]+)?$/,
    roles: contentReaders,
  },
  {
    method: "POST",
    path: /^academic\/curriculum-units\/[^/]+\/validation$/,
    roles: contentReaders,
  },
  {
    method: "POST",
    path: /^academic\/curriculum-units(?:\/[^/]+\/(lessons|monthly-tests|submit|revisions|import-preview|import-commit))?$/,
    roles: designer,
  },
  {
    method: "PATCH",
    path: /^academic\/curriculum-units\/[^/]+(?:\/lessons\/[^/]+)?$/,
    roles: designer,
  },
  {
    method: "PUT",
    path: /^academic\/curriculum-units\/[^/]+\/lesson-order$/,
    roles: designer,
  },
  {
    method: "DELETE",
    path: /^academic\/curriculum-units\/[^/]+\/lessons\/[^/]+$/,
    roles: designer,
  },
  {
    method: "DELETE",
    path: /^academic\/curriculum-units\/[^/]+$/,
    roles: [...manager, ...designer],
  },
  {
    method: "POST",
    path: /^academic\/curriculum-units\/[^/]+\/(approve|request-changes)$/,
    roles: manager,
  },
  {
    method: "POST",
    path: /^academic\/classes\/[^/]+\/(session-preview|session-generations)$/,
    roles: manager,
  },
  {
    method: "GET",
    path: /^academic\/(scheduled-sessions(?:\/[^/]+)?|classes\/[^/]+\/session-generations|session-generations\/[^/]+)$/,
    roles: sessionReaders,
  },
  {
    method: "POST",
    path: /^academic\/sessions\/[^/]+\/(reschedule-preview|reschedule|cancel)$/,
    roles: manager,
  },
];

export function backendRule(method: string, path: string) {
  return rules.find((rule) => rule.method === method && rule.path.test(path));
}
export function academicRoles(
  method: string,
  path: string,
): readonly WebRole[] | null {
  return path.startsWith("academic/")
    ? (backendRule(method, path)?.roles ?? null)
    : null;
}

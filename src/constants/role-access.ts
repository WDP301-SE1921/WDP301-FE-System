import { ROUTES } from "./routes";
import { ROLES, isWebRole, type BackOfficeRole, type WebRole } from "./roles";

/**
 * Nguồn duy nhất cho "role nào vào được màn nào". Sidebar (`getNavMenu`), `src/proxy.ts`
 * (`canAccessPath`) và các nút chéo role (`useRoleAccess`) đều đọc bảng này.
 *
 * Chỉ phân quyền ở mức MÀN HÌNH theo role — không có quyền con trong 1 role. Trang mới của
 * `(manager)` phải được thêm vào `ROUTE_AREAS`, nếu không proxy trả 403 cho mọi role.
 */
export const AREA = {
  DASHBOARD: "dashboard",
  STUDENTS: "students",
  PARENTS: "parents",
  ENROLLMENTS: "enrollments",
  PAYMENTS: "payments",
  ABSENCES: "absences",
  CLASSES: "classes",
  SCHEDULE: "schedule",
  TEACHERS: "teachers",
  CATALOG: "catalog",
  ROOMS: "rooms",
  NOTIFICATIONS: "notifications",
  STAFF_ACCOUNTS: "staff_accounts",
  AUDIT_LOGS: "audit_logs",
  PROFILE: "profile",
  TEACHER_PORTAL: "teacher_portal",
} as const;

export type Area = (typeof AREA)[keyof typeof AREA];

interface RouteArea {
  prefix: string;
  area: Area;
}

const M = ROUTES.MANAGER;
const S = ROUTES.STAFF;

/** Tiền tố route → area. Khớp tiền tố dài nhất (`/a/b` thắng `/a`). */
const ROUTE_AREAS: readonly RouteArea[] = [
  { prefix: M.DASHBOARD, area: AREA.DASHBOARD },
  { prefix: M.STUDENTS, area: AREA.STUDENTS },
  { prefix: M.PARENTS, area: AREA.PARENTS },
  { prefix: S.ENROLLMENT_NEW, area: AREA.ENROLLMENTS },
  { prefix: S.PAYMENTS, area: AREA.PAYMENTS },
  { prefix: S.PARENTS, area: AREA.PARENTS },
  { prefix: S.STUDENTS, area: AREA.STUDENTS },
  { prefix: S.PROFILE, area: AREA.PROFILE },
  { prefix: S.CLASSES, area: AREA.CLASSES },
  { prefix: S.SCHEDULE, area: AREA.SCHEDULE },
  { prefix: "/staff/absences", area: AREA.ABSENCES },
  { prefix: "/manager/absences", area: AREA.ABSENCES },
  { prefix: M.CLASSES, area: AREA.CLASSES },
  { prefix: M.SCHEDULE, area: AREA.SCHEDULE },
  { prefix: M.SESSIONS, area: AREA.SCHEDULE },
  { prefix: M.TEACHERS, area: AREA.TEACHERS },
  { prefix: M.CATALOG, area: AREA.CATALOG },
  { prefix: M.ROOMS, area: AREA.ROOMS },
  { prefix: M.CURRICULUM, area: AREA.CATALOG },
  { prefix: "/manager/notifications", area: AREA.NOTIFICATIONS },
  { prefix: M.STAFF_ACCOUNTS, area: AREA.STAFF_ACCOUNTS },
  { prefix: M.MANAGERS, area: AREA.STAFF_ACCOUNTS },
  { prefix: M.AUDIT_LOGS, area: AREA.AUDIT_LOGS },
  { prefix: M.PROFILE, area: AREA.PROFILE },
  { prefix: "/teacher", area: AREA.TEACHER_PORTAL },
];

const ALL_BACK_OFFICE_AREAS: readonly Area[] = [
  AREA.DASHBOARD,
  AREA.STUDENTS,
  AREA.PARENTS,
  AREA.ENROLLMENTS,
  AREA.PAYMENTS,
  AREA.ABSENCES,
  AREA.CLASSES,
  AREA.SCHEDULE,
  AREA.TEACHERS,
  AREA.CATALOG,
  AREA.ROOMS,
  AREA.NOTIFICATIONS,
  AREA.STAFF_ACCOUNTS,
  AREA.AUDIT_LOGS,
  AREA.PROFILE,
];

export const ROLE_AREAS: Record<WebRole, readonly Area[]> = {
  [ROLES.ADMIN]: ALL_BACK_OFFICE_AREAS,
  [ROLES.CENTER_MANAGER]: [
    AREA.DASHBOARD,
    AREA.STUDENTS,
    AREA.PARENTS,
    AREA.CLASSES,
    AREA.SCHEDULE,
    AREA.TEACHERS,
    AREA.CATALOG,
    AREA.ROOMS,
    AREA.NOTIFICATIONS,
    AREA.STAFF_ACCOUNTS,
    AREA.AUDIT_LOGS,
    AREA.PROFILE,
  ],
  [ROLES.CURRICULUM_DESIGNER]: [AREA.CATALOG, AREA.PROFILE],
  [ROLES.STAFF]: [
    AREA.DASHBOARD,
    AREA.STUDENTS,
    AREA.PARENTS,
    AREA.ENROLLMENTS,
    AREA.PAYMENTS,
    AREA.ABSENCES,
    AREA.CLASSES,
    AREA.SCHEDULE,
    AREA.NOTIFICATIONS,
    AREA.PROFILE,
  ],
  [ROLES.TEACHER]: [AREA.TEACHER_PORTAL],
};

/** Trang chủ sau đăng nhập / nút "Về Dashboard" theo role. */
export const ROLE_HOME_ROUTE: Record<WebRole, string> = {
  [ROLES.ADMIN]: ROUTES.MANAGER.DASHBOARD,
  [ROLES.CENTER_MANAGER]: ROUTES.MANAGER.DASHBOARD,
  [ROLES.CURRICULUM_DESIGNER]: ROUTES.MANAGER.CURRICULUM,
  [ROLES.STAFF]: ROUTES.STAFF.ENROLLMENT_NEW,
  [ROLES.TEACHER]: ROUTES.TEACHER.DASHBOARD,
};

/** Role nào được mời/tạo tài khoản nhân sự của role nào (ngoại lệ duy nhất của "không quyền con"). */
export type InvitableStaffRole = Extract<
  BackOfficeRole,
  "center_manager" | "curriculum_designer" | "staff"
>;

export const ACCOUNT_MANAGE_TARGETS: Partial<
  Record<WebRole, readonly InvitableStaffRole[]>
> = {
  [ROLES.ADMIN]: [ROLES.CENTER_MANAGER, ROLES.CURRICULUM_DESIGNER, ROLES.STAFF],
  [ROLES.CENTER_MANAGER]: [ROLES.STAFF],
};

/** Role được tạo/khóa tài khoản cấp dưới (nhân sự, phụ huynh, giáo viên) — admin và quản lý trung tâm. */
export function canManageAccounts(role: string | null | undefined): boolean {
  return isWebRole(role) && ACCOUNT_MANAGE_TARGETS[role] !== undefined;
}

export function getAreaForPath(pathname: string): Area | null {
  let best: RouteArea | null = null;
  for (const entry of ROUTE_AREAS) {
    const matches =
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`);
    if (matches && (!best || entry.prefix.length > best.prefix.length))
      best = entry;
  }
  return best?.area ?? null;
}

export function canAccessArea(
  role: string | null | undefined,
  area: Area,
): boolean {
  return isWebRole(role) && ROLE_AREAS[role].includes(area);
}

/** Đường dẫn thuộc khu cần đăng nhập (`/manager/*`, `/teacher/*`) mà role không vào được → false. */
export function canAccessPath(
  role: string | null | undefined,
  pathname: string,
): boolean {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    if (role !== ROLES.STAFF) return false;
  } else if (
    role === ROLES.STAFF &&
    (pathname === "/manager" || pathname.startsWith("/manager/"))
  )
    return false;
  const area = getAreaForPath(pathname);
  if (!area) return false;
  return canAccessArea(role, area);
}

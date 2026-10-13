import type { WebRole } from "@/constants/roles";

export interface BackendUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: "ACTIVE" | "DISABLED";
  emailVerifiedAt: string | null;
}
export interface BackendTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}
export interface BackendAuth {
  user: BackendUser;
  tokens: BackendTokens;
}
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}
export const BACKEND_ROLE_MAP: Record<string, WebRole | undefined> = {
  MANAGER: "center_manager",
  STAFF: "staff",
  TEACHER: "teacher",
  CURRICULUM_DESIGNER: "curriculum_designer",
};
export interface StudentProfile {
  id: string;
  fullName: string;
  grade: number;
  dateOfBirth: string | null;
  status: "ACTIVE" | "INACTIVE";
}
export interface ParentLookup {
  id: string;
  email: string;
  displayName: string | null;
  status: "ACTIVE" | "DISABLED";
  emailVerifiedAt: string | null;
  parentProfile: {
    id: string;
    phone: string | null;
    students: StudentProfile[];
  } | null;
}
export interface ParentSuggestion {
  id: string;
  email: string;
  displayName: string | null;
  status: "ACTIVE" | "DISABLED";
}
export interface PaginatedList<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
export interface DirectoryListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  grade?: number;
  parentUserId?: string;
}
export interface ParentListItem extends BackendUser {
  createdAt: string;
  parentProfile: {
    id: string;
    phone: string | null;
    _count: { students: number };
  } | null;
}
export interface StudentListItem extends StudentProfile {
  parentProfile: {
    phone: string | null;
    user: { id: string; email: string; displayName: string | null };
  };
}
export interface RegistrationProgram {
  id: string;
  name: string;
  subject: string;
  grade: number;
  subjectId?: string | null;
  isActive?: boolean;
  subjectRecord?: AcademicSubject | null;
  classes?: { id: string; name: string; isActive: boolean; isOpen: boolean }[];
  curriculumUnits?: {
    id: string;
    title: string;
    version: number;
    status: string;
    fromDate: string;
    toDate: string;
  }[];
}
export interface AcademicSubject {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  _count?: { programs: number };
}
export interface AcademicTeacher {
  id: string;
  displayName: string | null;
  email: string;
  status: "ACTIVE" | "DISABLED";
}
export interface WeeklySchedule {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}
export interface RegistrationClass {
  id: string;
  name: string;
  programId: string;
  program: RegistrationProgram;
  teacherId: string | null;
  capacity: number;
  monthlyFee: number | string;
  isOpen: boolean;
  isActive?: boolean;
  scheduleLocked?: boolean;
  roomId?: string | null;
  room?: {
    id: string;
    name: string;
    capacity: number;
    isActive: boolean;
  } | null;
  rosterCount?: number;
  pendingTeacher?: Pick<AcademicTeacher, "id" | "displayName" | "email"> | null;
  pendingTeacherFrom?: string | null;
  /** Set when the assigned teacher confirmed ("set cứng") the weekly schedule. */
  scheduleConfirmedAt?: string | null;
  rosterAt?: string;
  teacher?: Pick<AcademicTeacher, "id" | "displayName" | "email"> | null;
  enrollments?: PaginatedList<{
    id: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    studentProfile: { id: string; fullName: string; grade: number };
  }>;
  weeklySchedules: WeeklySchedule[];
  _count?: { enrollments: number };
  availableSeats?: number;
  isEligible?: boolean;
  ineligibleReason?: string | null;
  ineligibleMessage?: string | null;
}
export interface RegistrationOrder {
  id: string;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  targetStudentId: string;
  parentEmail: string;
  studentFullName: string;
  studentGrade: number;
  classId: string;
  class: RegistrationClass;
  packageMonths: number;
  quotedAmount: number | string;
  currency: string;
  startDate: string;
  endDate: string;
  targetStudent: { id: string; fullName: string; grade: number };
}
export interface RegistrationReceipt {
  registrationId: string;
  status: string;
  parentEmail: string;
  student: { fullName: string; grade: number };
  class: {
    id: string;
    name: string;
    subject: string;
    grade: number;
    schedules: WeeklySchedule[];
  };
  term: {
    packageMonths: number;
    startDate: string;
    endDate: string;
    label: string;
  };
  payment: {
    id: string;
    receiptNumber: string;
    amount: number;
    currency: string;
    confirmedAt: string;
  };
  enrollment: { id: string; status: string };
  quotedAmount: number;
  currency: string;
}
export interface RegistrationBill {
  billNumber: string;
  registrationId: string;
  status: "UNPAID" | "PAID" | "CANCELLED";
  issuedAt: string;
  parent: { displayName: string | null; email: string; phone: string | null };
  student: { id: string | null; fullName: string; grade: number };
  class: {
    id: string;
    name: string;
    subject: string;
    grade: number;
    schedules: WeeklySchedule[];
  };
  term: {
    packageMonths: number;
    startDate: string | null;
    endDate: string | null;
  };
  pricing: {
    monthlyFee: string;
    packageMonths: number;
    total: string;
    currency: "VND";
  };
  payment: {
    receiptNumber: string;
    paidAmount: string;
    confirmedAt: string;
  } | null;
}

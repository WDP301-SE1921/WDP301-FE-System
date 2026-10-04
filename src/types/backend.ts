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
export interface RegistrationProgram {
  id: string;
  name: string;
  subject: string;
  grade: number;
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
  weeklySchedules: WeeklySchedule[];
  _count?: { enrollments: number };
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

import type { Enrollment, StudentProfile } from "@/types/student"

/**
 * Học sinh + đăng ký học giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint học sinh thật.
 */
export const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: "stu-001",
    parentAccountId: "par-007",
    name: "Nguyễn Hoàng Nam",
    code: "HS-2024-0011",
    grade: 8,
    status: "active",
    createdAt: "2025-10-02",
  },
  {
    id: "stu-002",
    parentAccountId: "par-008",
    name: "Trần Mai Anh",
    code: "HS-2024-0089",
    grade: 9,
    status: "active",
    createdAt: "2025-06-19",
  },
  {
    id: "stu-003",
    parentAccountId: "par-009",
    name: "Lê Bảo Long",
    code: "HS-2023-0941",
    grade: 9,
    status: "active",
    createdAt: "2025-05-31",
  },
  {
    id: "stu-004",
    parentAccountId: "par-010",
    name: "Phạm Khánh Linh",
    code: "HS-2022-0314",
    grade: 9,
    status: "active",
    createdAt: "2025-04-12",
  },
  {
    id: "stu-005",
    parentAccountId: "par-011",
    name: "Đỗ Minh Quân",
    code: "HS-2024-0105",
    grade: 8,
    status: "active",
    createdAt: "2026-01-21",
  },
  {
    id: "stu-006",
    parentAccountId: "par-012",
    name: "Hoàng Thảo My",
    code: "HS-2023-0518",
    grade: 7,
    status: "paused",
    createdAt: "2026-02-15",
  },
  {
    id: "stu-007",
    parentAccountId: "par-013",
    name: "Vũ Quốc Đạt",
    code: "HS-2024-0331",
    grade: 7,
    status: "active",
    createdAt: "2026-03-09",
  },
  {
    id: "stu-008",
    parentAccountId: "par-014",
    name: "Bùi Gia Hân",
    code: "HS-2024-0819",
    grade: 6,
    status: "active",
    createdAt: "2026-09-12",
  },
  {
    id: "stu-009",
    parentAccountId: "par-001",
    name: "Nguyễn Minh Khang",
    code: "HS-2024-0012",
    grade: 8,
    status: "active",
    createdAt: "2025-08-12",
  },
  {
    id: "stu-010",
    parentAccountId: "par-001",
    name: "Nguyễn Bảo Ngọc",
    code: "HS-2024-0085",
    grade: 6,
    status: "active",
    createdAt: "2025-08-12",
  },
  {
    id: "stu-011",
    parentAccountId: "par-002",
    name: "Lê Bảo Long",
    code: "HS-2023-0942",
    grade: 9,
    status: "active",
    createdAt: "2025-09-06",
  },
  {
    id: "stu-012",
    parentAccountId: "par-003",
    name: "Trần Minh Anh",
    code: "HS-2024-0090",
    grade: 9,
    status: "active",
    createdAt: "2025-07-23",
  },
  {
    id: "stu-013",
    parentAccountId: "par-003",
    name: "Trần Đức Huy",
    code: "HS-2024-0091",
    grade: 7,
    status: "active",
    createdAt: "2025-07-23",
  },
  {
    id: "stu-014",
    parentAccountId: "par-003",
    name: "Trần Gia Linh",
    code: "HS-2024-0092",
    grade: 6,
    status: "paused",
    createdAt: "2025-07-23",
  },
  {
    id: "stu-015",
    parentAccountId: "par-004",
    name: "Đỗ Minh Quân",
    code: "HS-2024-0106",
    grade: 8,
    status: "active",
    createdAt: "2026-09-10",
  },
  {
    id: "stu-016",
    parentAccountId: "par-004",
    name: "Đỗ Minh Châu",
    code: "HS-2024-0107",
    grade: 6,
    status: "active",
    createdAt: "2026-09-10",
  },
  {
    id: "stu-017",
    parentAccountId: "par-005",
    name: "Nguyễn Khánh Linh",
    code: "HS-2022-0315",
    grade: 9,
    status: "withdrawn",
    createdAt: "2025-11-29",
  },
  {
    id: "stu-018",
    parentAccountId: "par-006",
    name: "Bùi Gia Hân",
    code: "HS-2024-0820",
    grade: 6,
    status: "active",
    createdAt: "2026-09-15",
  },
]

export const MOCK_ENROLLMENTS: Enrollment[] = [
  // Nguyễn Hoàng Nam — Toán 8A, Hóa 8B
  { id: "enr-001", studentProfileId: "stu-001", subjectId: "subj-math", classId: "cls-math-8a", months: 3, status: "active", startDate: "2026-08-15", endDate: "2026-11-15", tuitionAmount: 1500000, completedLessons: 12 },
  { id: "enr-002", studentProfileId: "stu-001", subjectId: "subj-chem", classId: "cls-chem-8b", months: 3, status: "active", startDate: "2026-08-15", endDate: "2026-11-15", tuitionAmount: 1500000, completedLessons: 9 },
  // Trần Mai Anh — Hóa 9B, Lý 9A
  { id: "enr-003", studentProfileId: "stu-002", subjectId: "subj-chem", classId: "cls-chem-9b", months: 1, status: "active", startDate: "2026-08-19", endDate: "2026-09-19", tuitionAmount: 600000, completedLessons: 6 },
  { id: "enr-004", studentProfileId: "stu-002", subjectId: "subj-phys", classId: "cls-phys-9a", months: 1, status: "active", startDate: "2026-08-19", endDate: "2026-09-19", tuitionAmount: 600000, completedLessons: 5 },
  // Lê Bảo Long — Lý 9 Chuyên, Toán 9 Ôn thi
  { id: "enr-005", studentProfileId: "stu-003", subjectId: "subj-phys", classId: "cls-phys-9c", months: 2, status: "active", startDate: "2026-08-30", endDate: "2026-10-30", tuitionAmount: 1200000, completedLessons: 11 },
  { id: "enr-006", studentProfileId: "stu-003", subjectId: "subj-math", classId: "cls-math-11a", months: 2, status: "active", startDate: "2026-08-30", endDate: "2026-10-30", tuitionAmount: 1200000, completedLessons: 10 },
  // Phạm Khánh Linh — Sinh 9A, Hóa 9B
  { id: "enr-007", studentProfileId: "stu-004", subjectId: "subj-biol", classId: "cls-biol-9a", months: 1, status: "active", startDate: "2026-08-20", endDate: "2026-09-20", tuitionAmount: 600000, completedLessons: 8 },
  { id: "enr-008", studentProfileId: "stu-004", subjectId: "subj-chem", classId: "cls-chem-9b", months: 1, status: "active", startDate: "2026-08-20", endDate: "2026-09-20", tuitionAmount: 600000, completedLessons: 7 },
  // Đỗ Minh Quân — Toán 8A
  { id: "enr-009", studentProfileId: "stu-005", subjectId: "subj-math", classId: "cls-math-8a", months: 3, status: "active", startDate: "2026-09-12", endDate: "2026-12-12", tuitionAmount: 1500000, completedLessons: 4 },
  // Hoàng Thảo My — Toán 7A, Lý 7A (tạm nghỉ)
  { id: "enr-010", studentProfileId: "stu-006", subjectId: "subj-math", classId: "cls-math-7a", months: 1, status: "reserved", startDate: "2026-08-10", endDate: "2026-09-10", tuitionAmount: 600000, completedLessons: 9 },
  { id: "enr-011", studentProfileId: "stu-006", subjectId: "subj-phys", classId: "cls-phys-7a", months: 1, status: "reserved", startDate: "2026-08-10", endDate: "2026-09-10", tuitionAmount: 600000, completedLessons: 8 },
  // Vũ Quốc Đạt — Toán 7A
  { id: "enr-012", studentProfileId: "stu-007", subjectId: "subj-math", classId: "cls-math-7a", months: 2, status: "active", startDate: "2026-09-28", endDate: "2026-11-28", tuitionAmount: 1200000, completedLessons: 16 },
  // Bùi Gia Hân — Toán 6A, Sinh 6A
  { id: "enr-013", studentProfileId: "stu-008", subjectId: "subj-math", classId: "cls-math-10a", months: 3, status: "active", startDate: "2026-09-16", endDate: "2026-12-16", tuitionAmount: 1500000, completedLessons: 0 },
  { id: "enr-014", studentProfileId: "stu-008", subjectId: "subj-biol", classId: "cls-biol-6a", months: 3, status: "active", startDate: "2026-09-16", endDate: "2026-12-16", tuitionAmount: 1500000, completedLessons: 0 },
  // Nguyễn Minh Khang — Toán 8A, Hóa 8B (hồ sơ chi tiết chính)
  { id: "enr-015", studentProfileId: "stu-009", subjectId: "subj-math", classId: "cls-math-8a", months: 3, status: "active", startDate: "2026-08-01", endDate: "2026-11-15", tuitionAmount: 1500000, completedLessons: 12 },
  { id: "enr-016", studentProfileId: "stu-009", subjectId: "subj-chem", classId: "cls-chem-8b", months: 3, status: "active", startDate: "2026-08-01", endDate: "2026-10-30", tuitionAmount: 1500000, completedLessons: 10 },
  // Nguyễn Bảo Ngọc — Sinh 6A
  { id: "enr-017", studentProfileId: "stu-010", subjectId: "subj-biol", classId: "cls-biol-6a", months: 3, status: "active", startDate: "2026-09-20", endDate: "2026-12-20", tuitionAmount: 1500000, completedLessons: 6 },
  // Lê Bảo Long (par-002) — Lý 9 Chuyên
  { id: "enr-018", studentProfileId: "stu-011", subjectId: "subj-phys", classId: "cls-phys-9c", months: 2, status: "active", startDate: "2026-08-30", endDate: "2026-10-30", tuitionAmount: 1200000, completedLessons: 11 },
  // Trần Minh Anh — Hóa 9B
  { id: "enr-019", studentProfileId: "stu-012", subjectId: "subj-chem", classId: "cls-chem-9b", months: 1, status: "active", startDate: "2026-08-19", endDate: "2026-09-19", tuitionAmount: 600000, completedLessons: 6 },
  // Trần Đức Huy — Toán 7A
  { id: "enr-020", studentProfileId: "stu-013", subjectId: "subj-math", classId: "cls-math-7a", months: 2, status: "active", startDate: "2026-08-05", endDate: "2026-10-05", tuitionAmount: 1200000, completedLessons: 14 },
  // Trần Gia Linh — Sinh 6A (bảo lưu)
  { id: "enr-021", studentProfileId: "stu-014", subjectId: "subj-biol", classId: "cls-biol-6a", months: 1, status: "reserved", startDate: "2026-07-01", endDate: "2026-08-01", tuitionAmount: 600000, completedLessons: 5 },
  // Đỗ Minh Quân (par-004) — Toán 8C
  { id: "enr-022", studentProfileId: "stu-015", subjectId: "subj-math", classId: "cls-math-8c", months: 3, status: "active", startDate: "2026-09-14", endDate: "2026-12-14", tuitionAmount: 1500000, completedLessons: 0 },
  // Đỗ Minh Châu — Sinh 6A
  { id: "enr-023", studentProfileId: "stu-016", subjectId: "subj-biol", classId: "cls-biol-6a", months: 3, status: "active", startDate: "2026-09-14", endDate: "2026-12-14", tuitionAmount: 1500000, completedLessons: 0 },
  // Nguyễn Khánh Linh — đã nghỉ hẳn
  { id: "enr-024", studentProfileId: "stu-017", subjectId: "subj-math", classId: "cls-math-11a", months: 1, status: "dropped", startDate: "2026-06-01", endDate: "2026-07-01", tuitionAmount: 600000, completedLessons: 12 },
  // Bùi Gia Hân (par-006) — Toán 6A
  { id: "enr-025", studentProfileId: "stu-018", subjectId: "subj-math", classId: "cls-math-10a", months: 3, status: "active", startDate: "2026-09-16", endDate: "2026-12-16", tuitionAmount: 1500000, completedLessons: 0 },
]

export function findStudent(studentProfileId: string): StudentProfile | undefined {
  return MOCK_STUDENTS.find((item) => item.id === studentProfileId)
}

export function findEnrollmentsByStudent(studentProfileId: string): Enrollment[] {
  return MOCK_ENROLLMENTS.filter((item) => item.studentProfileId === studentProfileId)
}

export function findStudentsByParent(parentAccountId: string): StudentProfile[] {
  return MOCK_STUDENTS.filter((item) => item.parentAccountId === parentAccountId)
}

export function findEnrollment(enrollmentId: string): Enrollment | undefined {
  return MOCK_ENROLLMENTS.find((item) => item.id === enrollmentId)
}

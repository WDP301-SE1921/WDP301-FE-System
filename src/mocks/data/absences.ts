import { MOCK_TODAY, findClass, findClassSession } from "@/mocks/data/catalog"
import { MOCK_ATTENDANCE } from "@/mocks/data/attendance"
import { MOCK_ENROLLMENTS, findEnrollment, findStudent } from "@/mocks/data/students"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import type {
  ClassChangeRequest,
  LongLeave,
  MakeupAssignment,
  MakeupKind,
  WithdrawalKind,
  WithdrawalRecord,
} from "@/types/absence"
import type { AttendanceStatus } from "@/types/student"

/**
 * Nghỉ học & học bù giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint thật.
 *
 * Chỉ có 2 lớp dùng chung chương trình `prg-math-8` (Toán 8A, Toán 8C) trong bộ
 * mock hiện tại, nên đây là cặp lớp duy nhất luôn có buổi học bù/đổi buổi hợp lệ
 * (cùng `programId` + cùng `lessonId`). Học sinh của mọi lớp khác sẽ luôn rơi vào
 * nhánh empty-state (PROMPT 10B) — đây là hành vi ĐÚNG theo dữ liệu thật, không
 * phải thiếu sót.
 */

const ACTOR_ID = "mgr-001"

/** Số chỗ còn lại của một buổi = sĩ số lớp - số HS đã đăng ký lớp đó - số buổi học bù đã xếp vào buổi này. */
export function getAvailableSlots(sessionId: string): number {
  const session = findClassSession(sessionId)
  if (!session) return 0

  const enrolled = MOCK_ENROLLMENTS.filter(
    (item) => item.classId === session.classId && item.status === "active"
  ).length

  const booked = MOCK_MAKEUP_ASSIGNMENTS.filter(
    (item) => item.makeupSessionId === sessionId && item.status !== "missed"
  ).length

  return Math.max(0, session.capacity - enrolled - booked)
}

export const MOCK_MAKEUP_ASSIGNMENTS: MakeupAssignment[] = [
  {
    id: "mk-001",
    kind: "makeup",
    studentProfileId: "stu-009",
    originalSessionId: "ses-cls-math-8a-19",
    makeupSessionId: "ses-cls-math-8c-19",
    status: "pending",
    markOriginalAbsent: true,
    note: "Học sinh bị ốm, xin nghỉ buổi chính khóa",
    assignedBy: ACTOR_ID,
    assignedAt: "2026-09-14T09:00:00",
  },
  {
    id: "mk-002",
    kind: "makeup",
    studentProfileId: "stu-015",
    originalSessionId: "ses-cls-math-8c-9",
    makeupSessionId: "ses-cls-math-8a-9",
    status: "done",
    markOriginalAbsent: true,
    note: "Gia đình có việc bận đột xuất",
    assignedBy: ACTOR_ID,
    assignedAt: "2026-08-20T10:00:00",
  },
  {
    id: "mk-003",
    kind: "makeup",
    studentProfileId: "stu-005",
    originalSessionId: "ses-cls-math-8a-8",
    makeupSessionId: "ses-cls-math-8c-8",
    status: "missed",
    markOriginalAbsent: true,
    note: "Không đến học bù theo lịch đã xếp",
    assignedBy: ACTOR_ID,
    assignedAt: "2026-08-15T14:00:00",
  },
  {
    id: "mk-004",
    kind: "swap",
    studentProfileId: "stu-009",
    originalSessionId: "ses-cls-math-8a-22",
    makeupSessionId: "ses-cls-math-8c-22",
    status: "pending",
    markOriginalAbsent: true,
    note: "Đi du lịch cùng gia đình, xin đổi sang lớp khác cùng bài học",
    assignedBy: ACTOR_ID,
    assignedAt: "2026-09-15T16:20:00",
  },
]

export const MOCK_CLASS_CHANGE_REQUESTS: ClassChangeRequest[] = []

/**
 * 24 bản ghi nghỉ dài hạn, khớp đúng số đếm 3 tab của PROMPT 10E:
 * Đang nghỉ (4) · Sắp tới (2) · Đã kết thúc (18) tính theo `MOCK_TODAY`.
 */
export const MOCK_LONG_LEAVES: LongLeave[] = [
  // Đã kết thúc (18) — mỗi học sinh 1 đợt nghỉ đã qua.
  { id: "ll-001", studentProfileId: "stu-001", subjectIds: [], startDate: "2026-08-01", endDate: "2026-08-07", reason: "Về quê giỗ ông", createdBy: ACTOR_ID, createdAt: "2026-07-28T09:00:00" },
  { id: "ll-002", studentProfileId: "stu-002", subjectIds: ["subj-chem"], startDate: "2026-08-03", endDate: "2026-08-10", reason: "Đi du lịch cùng gia đình", createdBy: ACTOR_ID, createdAt: "2026-07-30T09:00:00" },
  { id: "ll-003", studentProfileId: "stu-003", subjectIds: [], startDate: "2026-08-05", endDate: "2026-08-12", reason: "Ốm dài ngày, có xác nhận bệnh viện", createdBy: ACTOR_ID, createdAt: "2026-08-01T09:00:00" },
  { id: "ll-004", studentProfileId: "stu-004", subjectIds: ["subj-biol"], startDate: "2026-08-06", endDate: "2026-08-09", reason: "Thi năng khiếu", createdBy: ACTOR_ID, createdAt: "2026-08-02T09:00:00" },
  { id: "ll-005", studentProfileId: "stu-006", subjectIds: [], startDate: "2026-08-08", endDate: "2026-08-20", reason: "Chuyển nhà, tạm nghỉ chờ ổn định", createdBy: ACTOR_ID, createdAt: "2026-08-03T09:00:00" },
  { id: "ll-006", studentProfileId: "stu-007", subjectIds: [], startDate: "2026-08-10", endDate: "2026-08-14", reason: "Về quê nghỉ hè", createdBy: ACTOR_ID, createdAt: "2026-08-04T09:00:00" },
  { id: "ll-007", studentProfileId: "stu-008", subjectIds: [], startDate: "2026-08-11", endDate: "2026-08-13", reason: "Gia đình có việc riêng", createdBy: ACTOR_ID, createdAt: "2026-08-05T09:00:00" },
  { id: "ll-008", studentProfileId: "stu-010", subjectIds: [], startDate: "2026-08-12", endDate: "2026-08-18", reason: "Ốm, nghỉ theo chỉ định bác sĩ", createdBy: ACTOR_ID, createdAt: "2026-08-06T09:00:00" },
  { id: "ll-009", studentProfileId: "stu-012", subjectIds: ["subj-chem"], startDate: "2026-08-13", endDate: "2026-08-16", reason: "Thi chứng chỉ ngoại ngữ", createdBy: ACTOR_ID, createdAt: "2026-08-07T09:00:00" },
  { id: "ll-010", studentProfileId: "stu-013", subjectIds: [], startDate: "2026-08-15", endDate: "2026-08-22", reason: "Đi du lịch hè cùng gia đình", createdBy: ACTOR_ID, createdAt: "2026-08-08T09:00:00" },
  { id: "ll-011", studentProfileId: "stu-014", subjectIds: [], startDate: "2026-08-16", endDate: "2026-08-19", reason: "Việc gia đình đột xuất", createdBy: ACTOR_ID, createdAt: "2026-08-09T09:00:00" },
  { id: "ll-012", studentProfileId: "stu-016", subjectIds: [], startDate: "2026-08-18", endDate: "2026-08-24", reason: "Ốm dài ngày", createdBy: ACTOR_ID, createdAt: "2026-08-10T09:00:00" },
  { id: "ll-013", studentProfileId: "stu-018", subjectIds: [], startDate: "2026-08-19", endDate: "2026-08-21", reason: "Về quê có việc gia đình", createdBy: ACTOR_ID, createdAt: "2026-08-11T09:00:00" },
  { id: "ll-014", studentProfileId: "stu-001", subjectIds: ["subj-math"], startDate: "2026-08-22", endDate: "2026-08-26", reason: "Thi đấu thể thao cấp trường", createdBy: ACTOR_ID, createdAt: "2026-08-12T09:00:00" },
  { id: "ll-015", studentProfileId: "stu-003", subjectIds: [], startDate: "2026-08-24", endDate: "2026-08-28", reason: "Đi khám sức khỏe định kỳ dài ngày", createdBy: ACTOR_ID, createdAt: "2026-08-14T09:00:00" },
  { id: "ll-016", studentProfileId: "stu-007", subjectIds: [], startDate: "2026-08-27", endDate: "2026-08-31", reason: "Gia đình chuyển chỗ ở tạm thời", createdBy: ACTOR_ID, createdAt: "2026-08-16T09:00:00" },
  { id: "ll-017", studentProfileId: "stu-010", subjectIds: [], startDate: "2026-08-29", endDate: "2026-09-02", reason: "Về quê nghỉ lễ cùng gia đình", createdBy: ACTOR_ID, createdAt: "2026-08-19T09:00:00" },
  { id: "ll-018", studentProfileId: "stu-013", subjectIds: [], startDate: "2026-09-01", endDate: "2026-09-05", reason: "Ốm, có giấy xác nhận của trạm y tế", createdBy: ACTOR_ID, createdAt: "2026-08-22T09:00:00" },

  // Đang nghỉ (4) — khoảng nghỉ trùm qua MOCK_TODAY (2026-09-16).
  { id: "ll-019", studentProfileId: "stu-002", subjectIds: [], startDate: "2026-09-10", endDate: "2026-09-20", reason: "Ốm, bác sĩ chỉ định nghỉ ngơi 10 ngày", createdBy: ACTOR_ID, createdAt: "2026-09-09T09:00:00" },
  { id: "ll-020", studentProfileId: "stu-005", subjectIds: ["subj-math"], startDate: "2026-09-12", endDate: "2026-09-19", reason: "Gia đình có việc hiếu", createdBy: ACTOR_ID, createdAt: "2026-09-11T09:00:00" },
  { id: "ll-021", studentProfileId: "stu-009", subjectIds: ["subj-chem"], startDate: "2026-09-14", endDate: "2026-09-21", reason: "Bó bột tay do tai nạn nhẹ, tạm nghỉ Hóa", createdBy: ACTOR_ID, createdAt: "2026-09-13T09:00:00" },
  { id: "ll-022", studentProfileId: "stu-016", subjectIds: [], startDate: "2026-09-15", endDate: "2026-09-25", reason: "Theo gia đình đi công tác nước ngoài", createdBy: ACTOR_ID, createdAt: "2026-09-12T09:00:00" },

  // Sắp tới (2) — startDate sau MOCK_TODAY.
  { id: "ll-023", studentProfileId: "stu-004", subjectIds: [], startDate: "2026-09-25", endDate: "2026-10-05", reason: "Ra nước ngoài thăm gia đình", createdBy: ACTOR_ID, createdAt: "2026-09-15T09:00:00" },
  { id: "ll-024", studentProfileId: "stu-011", subjectIds: ["subj-phys"], startDate: "2026-09-20", endDate: "2026-09-27", reason: "Ôn thi học sinh giỏi cấp trường, tạm nghỉ Lý", createdBy: ACTOR_ID, createdAt: "2026-09-16T09:00:00" },
]

/** Chỉ có 1 học sinh nghỉ hẳn sẵn trong bộ mock (`stu-017`) — seed khớp đúng record đó. */
export const MOCK_WITHDRAWAL_RECORDS: WithdrawalRecord[] = [
  {
    id: "wd-001",
    studentProfileId: "stu-017",
    kind: "full",
    enrollmentIds: ["enr-024"],
    effectiveDate: "2026-07-01",
    reason: "Chuyển sang trung tâm gần nhà hơn",
    createdBy: ACTOR_ID,
    createdAt: "2026-06-28T09:00:00",
  },
]

// ---------------------------------------------------------------------------
// Xếp học bù / Đổi buổi (PROMPT 10, 10B, 10C)
// ---------------------------------------------------------------------------

export interface AssignMakeupInput {
  kind: MakeupKind
  studentProfileId: string
  originalSessionId: string
  makeupSessionId: string
  markOriginalAbsent: boolean
  note?: string
}

let makeupSequence = MOCK_MAKEUP_ASSIGNMENTS.length

function upsertAttendance(
  classSessionId: string,
  studentProfileId: string,
  status: AttendanceStatus,
  note?: string
) {
  const existing = MOCK_ATTENDANCE.find(
    (item) =>
      item.classSessionId === classSessionId && item.studentProfileId === studentProfileId
  )

  if (existing) {
    existing.status = status
    existing.note = note
    return
  }

  MOCK_ATTENDANCE.push({
    id: `att-mk-${classSessionId}-${studentProfileId}`,
    classSessionId,
    studentProfileId,
    status,
    note,
  })
}

export function mockAssignMakeup(input: AssignMakeupInput): MakeupAssignment {
  const original = findClassSession(input.originalSessionId)
  const makeup = findClassSession(input.makeupSessionId)
  if (!original || !makeup) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findStudent(input.studentProfileId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  makeupSequence += 1

  const assignment: MakeupAssignment = {
    id: `mk-new-${makeupSequence}`,
    kind: input.kind,
    studentProfileId: input.studentProfileId,
    originalSessionId: input.originalSessionId,
    makeupSessionId: input.makeupSessionId,
    status: "pending",
    markOriginalAbsent: input.markOriginalAbsent,
    note: input.note?.trim() || undefined,
    assignedBy: ACTOR_ID,
    assignedAt: new Date(`${MOCK_TODAY}T08:00:00`).toISOString(),
  }

  MOCK_MAKEUP_ASSIGNMENTS.unshift(assignment)

  if (input.markOriginalAbsent || input.kind === "swap") {
    upsertAttendance(
      input.originalSessionId,
      input.studentProfileId,
      input.kind === "swap" ? "excused" : "absent",
      input.kind === "swap" ? "Đổi sang buổi khác cùng chương trình" : "Báo nghỉ, chờ xếp học bù"
    )
  }

  return assignment
}

export interface MarkAbsentOnlyInput {
  originalSessionId: string
  studentProfileId: string
  note?: string
}

/** PROMPT 10B — không có buổi học bù phù hợp, chỉ đánh dấu Vắng buổi gốc. */
export function mockMarkAbsentOnly(input: MarkAbsentOnlyInput): void {
  if (!findClassSession(input.originalSessionId)) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findStudent(input.studentProfileId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  upsertAttendance(
    input.originalSessionId,
    input.studentProfileId,
    "absent",
    input.note?.trim() || "Không có buổi học bù phù hợp"
  )
}

export function mockChangeMakeupSession(
  assignmentId: string,
  newMakeupSessionId: string
): MakeupAssignment {
  const assignment = MOCK_MAKEUP_ASSIGNMENTS.find((item) => item.id === assignmentId)
  if (!assignment) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findClassSession(newMakeupSessionId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  assignment.makeupSessionId = newMakeupSessionId
  return assignment
}

export function mockCancelMakeup(assignmentId: string): void {
  const index = MOCK_MAKEUP_ASSIGNMENTS.findIndex((item) => item.id === assignmentId)
  if (index === -1) throw new MockError(ERROR_MSG.NOT_FOUND)

  const [removed] = MOCK_MAKEUP_ASSIGNMENTS.splice(index, 1)

  const attendanceIndex = MOCK_ATTENDANCE.findIndex(
    (item) =>
      item.classSessionId === removed.originalSessionId &&
      item.studentProfileId === removed.studentProfileId &&
      item.id.startsWith("att-mk-")
  )
  if (attendanceIndex !== -1) MOCK_ATTENDANCE.splice(attendanceIndex, 1)
}

// ---------------------------------------------------------------------------
// Đổi lịch cố định / chuyển lớp (PROMPT 10D)
// ---------------------------------------------------------------------------

export interface ChangeClassInput {
  studentProfileId: string
  enrollmentId: string
  toClassId: string
  effectiveDate: string
  reason: string
}

let changeClassSequence = 0

export function mockChangeClass(input: ChangeClassInput): ClassChangeRequest {
  const enrollment = findEnrollment(input.enrollmentId)
  if (!enrollment || enrollment.studentProfileId !== input.studentProfileId) {
    throw new MockError(ERROR_MSG.NOT_FOUND)
  }
  const toClass = findClass(input.toClassId)
  if (!toClass) throw new MockError(ERROR_MSG.NOT_FOUND)

  const fromClassId = enrollment.classId
  enrollment.classId = input.toClassId

  changeClassSequence += 1

  const request: ClassChangeRequest = {
    id: `cc-new-${changeClassSequence}`,
    studentProfileId: input.studentProfileId,
    enrollmentId: input.enrollmentId,
    fromClassId,
    toClassId: input.toClassId,
    effectiveDate: input.effectiveDate,
    reason: input.reason.trim(),
    createdBy: ACTOR_ID,
    createdAt: new Date(`${MOCK_TODAY}T08:00:00`).toISOString(),
  }

  MOCK_CLASS_CHANGE_REQUESTS.unshift(request)
  return request
}

// ---------------------------------------------------------------------------
// Nghỉ dài hạn (PROMPT 10E)
// ---------------------------------------------------------------------------

export interface CreateLongLeaveInput {
  studentProfileId: string
  subjectIds: string[]
  startDate: string
  endDate: string
  reason: string
}

let longLeaveSequence = MOCK_LONG_LEAVES.length

export function mockEndLongLeaveEarly(id: string): LongLeave {
  const leave = MOCK_LONG_LEAVES.find((item) => item.id === id)
  if (!leave) throw new MockError(ERROR_MSG.NOT_FOUND)

  leave.endDate = MOCK_TODAY
  return leave
}

export function mockCreateLongLeave(input: CreateLongLeaveInput): LongLeave {
  if (!findStudent(input.studentProfileId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  longLeaveSequence += 1

  const longLeave: LongLeave = {
    id: `ll-new-${longLeaveSequence}`,
    studentProfileId: input.studentProfileId,
    subjectIds: input.subjectIds,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason.trim(),
    createdBy: ACTOR_ID,
    createdAt: new Date(`${MOCK_TODAY}T08:00:00`).toISOString(),
  }

  MOCK_LONG_LEAVES.unshift(longLeave)
  return longLeave
}

// ---------------------------------------------------------------------------
// Nghỉ môn / Nghỉ hẳn (PROMPT 10F)
// ---------------------------------------------------------------------------

export interface WithdrawInput {
  studentProfileId: string
  kind: WithdrawalKind
  /** Bắt buộc khi kind = "subject"; bỏ qua khi kind = "full" (kết thúc toàn bộ). */
  enrollmentIds?: string[]
  effectiveDate: string
  reason: string
}

let withdrawalSequence = MOCK_WITHDRAWAL_RECORDS.length

export function mockWithdraw(input: WithdrawInput): WithdrawalRecord {
  const student = findStudent(input.studentProfileId)
  if (!student) throw new MockError(ERROR_MSG.NOT_FOUND)

  const activeEnrollments = MOCK_ENROLLMENTS.filter(
    (item) => item.studentProfileId === input.studentProfileId && item.status === "active"
  )

  const targetIds =
    input.kind === "full"
      ? activeEnrollments.map((item) => item.id)
      : (input.enrollmentIds ?? [])

  activeEnrollments
    .filter((item) => targetIds.includes(item.id))
    .forEach((item) => {
      item.status = "dropped"
      item.endDate = input.effectiveDate
    })

  if (input.kind === "full") {
    student.status = "withdrawn"
  }

  withdrawalSequence += 1

  const record: WithdrawalRecord = {
    id: `wd-new-${withdrawalSequence}`,
    studentProfileId: input.studentProfileId,
    kind: input.kind,
    enrollmentIds: targetIds,
    effectiveDate: input.effectiveDate,
    reason: input.reason.trim(),
    createdBy: ACTOR_ID,
    createdAt: new Date(`${MOCK_TODAY}T08:00:00`).toISOString(),
  }

  MOCK_WITHDRAWAL_RECORDS.unshift(record)
  return record
}

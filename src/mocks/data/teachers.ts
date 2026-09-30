import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  MOCK_NOW,
  MOCK_TEACHERS,
  MOCK_TODAY,
  findClass,
  findClassSession,
  findTeacher,
  resolveSessionLabel,
} from "@/mocks/data/catalog"
import { MOCK_ATTENDANCE } from "@/mocks/data/attendance"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import { appendAuditLog } from "@/mocks/data/system"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import { TEACHER_ABSENCE_MSG } from "@/constants/messages/events/teacher-absence"
import { ROUTES } from "@/constants/routes"
import type {
  SubstituteAssignment,
  TeacherAbsenceReport,
  TeacherInvitation,
  WorkCreditAdjustment,
} from "@/types/teacher"

/**
 * Lời mời giáo viên + lịch sử dạy thay giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint giáo viên thật.
 */

export const MOCK_TEACHER_INVITATIONS: TeacherInvitation[] = [
  {
    id: "inv-tch-001",
    email: "haidang.do@edugrade.vn",
    name: "Đỗ Hải Đăng",
    phone: "0988 214 556",
    subjectIds: ["subj-phys"],
    status: "pending_review",
    createdAt: "2026-09-14T14:30:00",
    grades: [7, 8, 9],
    source: "Cơ sở Trần Đại Nghĩa & Đống Đa",
    experienceNote:
      "5 năm luyện thi Đại học khối A, nguyên GV chuyên Amsterdam",
    cvFileName: "CV_DoHaiDang_2026.pdf",
  },
  {
    id: "inv-tch-002",
    email: "linh.pham@edugrade.vn",
    name: "Phạm Thùy Linh",
    phone: "0973 882 109",
    subjectIds: ["subj-chem"],
    status: "pending_review",
    createdAt: "2026-09-13T09:15:00",
    grades: [8, 9],
    source: "Cơ sở Cầu Giấy (đăng ký dạy online & offline)",
    experienceNote: "Chứng chỉ sư phạm Hóa, 3 năm giảng dạy học thuật tại ACET",
    cvFileName: "ChungChi_PhamThuyLinh.pdf",
  },
  {
    id: "inv-tch-003",
    email: "tuan.nguyen.math@edugrade.vn",
    name: "Nguyễn Văn Tuấn",
    phone: "0915 667 223",
    subjectIds: ["subj-math"],
    status: "pending_review",
    createdAt: "2026-09-12T17:00:00",
    grades: [6, 7],
    source: "Cơ sở chính (Trần Đại Nghĩa)",
    experienceNote:
      "Tốt nghiệp ĐH Sư Phạm Hà Nội khoa Toán, 2 năm kèm cặp đội tuyển học sinh giỏi cấp quận",
    cvFileName: "HoSo_NguyenVanTuan_Toan.pdf",
  },
  {
    id: "inv-tch-004",
    email: "mai.tran@edugrade.vn",
    name: "Trần Thị Mai",
    phone: "0903 556 778",
    subjectIds: ["subj-biol"],
    status: "sent",
    createdAt: "2026-09-10T10:00:00",
    grades: [6, 7, 8],
  },
  {
    id: "inv-tch-005",
    email: "khanh.vu@edugrade.vn",
    name: "Vũ Duy Khánh",
    phone: "0918 334 221",
    subjectIds: ["subj-math"],
    status: "sent",
    createdAt: "2026-09-09T15:40:00",
    grades: [8, 9],
  },
  {
    id: "inv-tch-006",
    email: "ngoc.bui@edugrade.vn",
    name: "Bùi Bảo Ngọc",
    phone: "0936 112 445",
    subjectIds: ["subj-chem"],
    status: "sent",
    createdAt: "2026-09-08T08:20:00",
    grades: [9],
  },
  {
    id: "inv-tch-007",
    email: "son.le@edugrade.vn",
    name: "Lê Thanh Sơn",
    phone: "0977 665 443",
    subjectIds: ["subj-phys"],
    status: "sent",
    createdAt: "2026-09-06T13:10:00",
    grades: [7, 8],
  },
  {
    id: "inv-tch-008",
    email: "ha.nguyen.bio@edugrade.vn",
    name: "Nguyễn Thu Hà",
    phone: "0945 221 336",
    subjectIds: ["subj-biol"],
    status: "sent",
    createdAt: "2026-09-04T11:45:00",
    grades: [6],
  },
]

export const MOCK_SUBSTITUTES: SubstituteAssignment[] = [
  {
    id: "sub-001",
    classSessionId: "ses-cls-math-8a-10",
    mainTeacherId: "tch-001",
    substituteTeacherId: "tch-011",
    reason: "Đi công tác đột xuất theo triệu tập của Sở GD",
    assignedBy: "mgr-001",
    assignedAt: "2026-09-14T11:20:00",
    status: "confirmed",
  },
  {
    id: "sub-002",
    classSessionId: "ses-cls-chem-9b-8",
    mainTeacherId: "tch-002",
    substituteTeacherId: "tch-009",
    reason: "Lý do việc gia đình có đơn xin phép",
    assignedBy: "mgr-001",
    assignedAt: "2026-09-11T16:45:00",
    status: "confirmed",
  },
  {
    id: "sub-003",
    classSessionId: "ses-cls-phys-7a-6",
    mainTeacherId: "tch-006",
    substituteTeacherId: "tch-013",
    reason: "Tham dự tập huấn phương pháp STEM",
    assignedBy: "mgr-001",
    assignedAt: "2026-09-10T09:15:00",
    status: "confirmed",
  },
  {
    id: "sub-004",
    classSessionId: "ses-cls-chem-8b-9",
    mainTeacherId: "tch-002",
    substituteTeacherId: "tch-008",
    reason: "Lịch họp hội đồng tuyển sinh đột xuất",
    assignedBy: "mgr-001",
    assignedAt: "2026-09-15T08:30:00",
    status: "pending_confirm",
  },
]

export interface AssignSubstituteInput {
  classSessionId: string
  substituteTeacherId: string
  reason: string
  /** Id nhân sự xếp dạy thay (người đang đăng nhập); mặc định quản lý trung tâm mẫu. */
  assignedBy?: string
  /** Gửi SMS/Email thông báo cho giáo viên dạy thay. */
  notifyTeacher: boolean
  /** Gửi thông báo cho phụ huynh / học sinh của lớp. */
  notifyParents: boolean
}

let substituteSequence = MOCK_SUBSTITUTES.length

export function mockAssignSubstitute(
  input: AssignSubstituteInput
): SubstituteAssignment {
  const session = findClassSession(input.classSessionId)
  if (!session) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findTeacher(input.substituteTeacherId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  substituteSequence += 1

  const assignment: SubstituteAssignment = {
    id: `sub-new-${substituteSequence}`,
    classSessionId: input.classSessionId,
    mainTeacherId: session.teacherId ?? "",
    substituteTeacherId: input.substituteTeacherId,
    reason: input.reason.trim(),
    assignedBy: input.assignedBy ?? "mgr-001",
    assignedAt: new Date().toISOString(),
    status: "confirmed",
  }

  MOCK_SUBSTITUTES.unshift(assignment)

  // Buổi học nhận giáo viên dạy thay ngay để lịch tổng không còn báo thiếu GV.
  session.teacherId = input.substituteTeacherId

  // Giáo viên đã báo nghỉ buổi này được coi là đã có người dạy thay.
  const pendingReport = MOCK_TEACHER_ABSENCES.find(
    (item) => item.classSessionId === input.classSessionId && item.status === "pending"
  )
  if (pendingReport) {
    pendingReport.status = "covered"
    pendingReport.resolvedBy = assignment.assignedBy
    pendingReport.resolvedAt = MOCK_NOW
  }

  return assignment
}

export interface ChangeClassTeacherInput {
  classId: string
  teacherId: string
  /** Áp dụng từ ngày này trở đi, các buổi trước giữ nguyên giáo viên cũ. */
  effectiveFrom: string
  reason: string
  notifyTeacher: boolean
  notifyParents: boolean
}

export interface ChangeClassTeacherResult {
  classId: string
  /** Số buổi học đã được chuyển sang giáo viên mới. */
  affectedSessions: number
}

export function mockChangeClassTeacher(
  input: ChangeClassTeacherInput
): ChangeClassTeacherResult {
  const classRecord = MOCK_CLASSES.find((item) => item.id === input.classId)
  if (!classRecord) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findTeacher(input.teacherId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  classRecord.teacherId = input.teacherId

  const affected = MOCK_CLASS_SESSIONS.filter(
    (session) => session.classId === input.classId && session.date >= input.effectiveFrom
  )
  affected.forEach((session) => {
    session.teacherId = input.teacherId
  })

  return { classId: input.classId, affectedSessions: affected.length }
}

export interface InviteTeacherInput {
  email: string
  name: string
  phone: string
  subjectIds: string[]
}

let invitationSequence = MOCK_TEACHER_INVITATIONS.length

export function mockInviteTeacher(input: InviteTeacherInput): TeacherInvitation {
  invitationSequence += 1

  const invitation: TeacherInvitation = {
    id: `inv-tch-new-${invitationSequence}`,
    email: input.email.trim(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    subjectIds: input.subjectIds,
    status: "sent",
    createdAt: new Date().toISOString(),
    grades: [],
  }

  MOCK_TEACHER_INVITATIONS.unshift(invitation)

  return invitation
}

/** Duyệt hồ sơ → tạo giáo viên thật trong danh sách. */
export function mockApproveInvitation(invitationId: string): TeacherInvitation {
  const invitation = MOCK_TEACHER_INVITATIONS.find((item) => item.id === invitationId)
  if (!invitation) throw new MockError(ERROR_MSG.NOT_FOUND)

  invitation.status = "approved"

  MOCK_TEACHERS.push({
    id: `tch-new-${invitation.id}`,
    name: invitation.name,
    email: invitation.email,
    phone: invitation.phone,
    code: `GV-NEW${MOCK_TEACHERS.length + 1}`,
    subjectIds: invitation.subjectIds,
    status: "active",
    yearsExperience: 0,
    rating: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
  })

  return invitation
}

export function mockRejectInvitation(invitationId: string): TeacherInvitation {
  const invitation = MOCK_TEACHER_INVITATIONS.find((item) => item.id === invitationId)
  if (!invitation) throw new MockError(ERROR_MSG.NOT_FOUND)

  invitation.status = "rejected"

  return invitation
}

// ---------------------------------------------------------------------------
// Công giáo viên: báo nghỉ, hủy buổi, ghi nhận công thủ công (PROMPT P5)
// ---------------------------------------------------------------------------

export const MOCK_TEACHER_ABSENCES: TeacherAbsenceReport[] = []
export const MOCK_WORK_ADJUSTMENTS: WorkCreditAdjustment[] = []

/**
 * Dựng dữ liệu demo cho công giáo viên, chạy một lần lúc nạp module:
 * - buổi đã có giáo viên dạy thay xác nhận → giáo viên dạy thay là người dạy (và điểm danh);
 * - một buổi đã qua của Sinh 6A để ở trạng thái "chưa chốt công";
 * - hai báo nghỉ đang chờ xử lý (một đột xuất, một báo trước).
 */
function seedWorkCreditDemo() {
  MOCK_SUBSTITUTES.filter((item) => item.status === "confirmed").forEach((item) => {
    const session = findClassSession(item.classSessionId)
    if (!session) return

    session.teacherId = item.substituteTeacherId
    if (session.attendanceMarkedAt) session.attendanceMarkedBy = item.substituteTeacherId
  })

  const lastPastBiology = MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.classId === "cls-biol-6a" &&
      session.kind === "lesson" &&
      session.date < MOCK_TODAY &&
      session.attendanceMarkedAt
  ).at(-1)
  if (lastPastBiology) {
    lastPastBiology.attendanceMarkedAt = undefined
    lastPastBiology.attendanceMarkedBy = undefined
  }

  const urgentSession = MOCK_CLASS_SESSIONS.find(
    (session) =>
      session.date === "2026-09-17" && session.teacherId === "tch-003" && session.kind === "lesson"
  )
  if (urgentSession) {
    MOCK_TEACHER_ABSENCES.push({
      id: "abs-001",
      classSessionId: urgentSession.id,
      teacherId: "tch-003",
      reason: "Sốt cao, bác sĩ chỉ định nghỉ ngơi",
      reportedAt: "2026-09-16T18:30:00",
      status: "pending",
    })
  }

  const advanceSession = MOCK_CLASS_SESSIONS.find(
    (session) =>
      session.date > "2026-09-20" && session.teacherId === "tch-002" && session.kind === "lesson"
  )
  if (advanceSession) {
    MOCK_TEACHER_ABSENCES.push({
      id: "abs-002",
      classSessionId: advanceSession.id,
      teacherId: "tch-002",
      reason: "Tham dự hội nghị chuyên đề đã đăng ký từ trước",
      reportedAt: "2026-09-15T10:00:00",
      status: "pending",
    })
  }
}

seedWorkCreditDemo()

let absenceSequence = MOCK_TEACHER_ABSENCES.length

function sessionTargetLabel(sessionId: string): { label: string; href?: string } {
  const session = findClassSession(sessionId)
  const classRecord = findClass(session?.classId ?? "")
  if (!session || !classRecord) return { label: sessionId }

  return {
    label: `${classRecord.name} · ${resolveSessionLabel(session)} (${session.date})`,
    href: ROUTES.MANAGER.CLASS_DETAIL(classRecord.id),
  }
}

export interface ReportTeacherAbsenceInput {
  classSessionId: string
  teacherId: string
  reason: string
}

/** Giáo viên báo nghỉ một buổi của mình. Chỉ báo được buổi chưa diễn ra, chưa điểm danh, chưa hủy. */
export function mockReportTeacherAbsence(input: ReportTeacherAbsenceInput): TeacherAbsenceReport {
  const session = findClassSession(input.classSessionId)
  if (!session) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (session.teacherId !== input.teacherId) {
    throw new MockError(TEACHER_ABSENCE_MSG.NOT_YOUR_SESSION)
  }
  if (session.date < MOCK_TODAY || session.attendanceMarkedAt || session.cancelledAt) {
    throw new MockError(TEACHER_ABSENCE_MSG.SESSION_NOT_REPORTABLE)
  }
  if (
    MOCK_TEACHER_ABSENCES.some(
      (item) => item.classSessionId === input.classSessionId && item.status === "pending"
    )
  ) {
    throw new MockError(TEACHER_ABSENCE_MSG.ALREADY_REPORTED)
  }

  absenceSequence += 1

  const report: TeacherAbsenceReport = {
    id: `abs-new-${absenceSequence}`,
    classSessionId: input.classSessionId,
    teacherId: input.teacherId,
    reason: input.reason.trim(),
    reportedAt: MOCK_NOW,
    status: "pending",
  }

  MOCK_TEACHER_ABSENCES.unshift(report)

  const target = sessionTargetLabel(input.classSessionId)
  appendAuditLog({
    actorId: input.teacherId,
    actionType: "teacher_absence",
    targetLabel: target.label,
    targetHref: target.href,
    reason: report.reason,
    createdAt: MOCK_NOW,
  })

  return report
}

export interface CancelSessionInput {
  classSessionId: string
  reason: string
  /** Id nhân sự hủy buổi (người đang đăng nhập). */
  cancelledBy: string
}

export interface CancelSessionResult {
  classSessionId: string
  /** Số học sinh đã được ghi nhận nghỉ có phép và cần xếp học bù. */
  affectedStudents: number
}

/**
 * Hủy một buổi học: gắn `cancelledAt`, đóng báo nghỉ đang chờ, ghi nhận cả lớp nghỉ có phép
 * (để nhân viên xếp học bù qua luồng học bù sẵn có). Giáo viên không được tính công buổi này.
 */
export function mockCancelSession(input: CancelSessionInput): CancelSessionResult {
  const session = findClassSession(input.classSessionId)
  if (!session) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (session.attendanceMarkedAt || session.cancelledAt) {
    throw new MockError(TEACHER_ABSENCE_MSG.CANCEL_NOT_ALLOWED)
  }

  session.cancelledAt = MOCK_NOW
  session.cancelReason = input.reason.trim()

  const pendingReport = MOCK_TEACHER_ABSENCES.find(
    (item) => item.classSessionId === input.classSessionId && item.status === "pending"
  )
  if (pendingReport) {
    pendingReport.status = "cancelled"
    pendingReport.resolvedBy = input.cancelledBy
    pendingReport.resolvedAt = MOCK_NOW
  }

  const students = MOCK_ENROLLMENTS.filter(
    (item) => item.classId === session.classId && item.status === "active"
  )
  students.forEach((enrollment) => {
    const existing = MOCK_ATTENDANCE.find(
      (record) =>
        record.classSessionId === session.id &&
        record.studentProfileId === enrollment.studentProfileId
    )

    if (existing) {
      existing.status = "excused"
      existing.note = TEACHER_ABSENCE_MSG.CANCELLED_ATTENDANCE_NOTE
      return
    }

    MOCK_ATTENDANCE.push({
      id: `att-${session.id}-${enrollment.studentProfileId}`,
      classSessionId: session.id,
      studentProfileId: enrollment.studentProfileId,
      status: "excused",
      note: TEACHER_ABSENCE_MSG.CANCELLED_ATTENDANCE_NOTE,
    })
  })

  const target = sessionTargetLabel(input.classSessionId)
  appendAuditLog({
    actorId: input.cancelledBy,
    actionType: "cancel_session",
    targetLabel: target.label,
    targetHref: target.href,
    reason: session.cancelReason,
    effectiveDate: session.date,
    createdAt: MOCK_NOW,
  })

  return { classSessionId: session.id, affectedStudents: students.length }
}

export interface AdjustWorkCreditInput {
  classSessionId: string
  teacherId: string
  reason: string
  /** Id nhân sự ghi nhận (người đang đăng nhập). */
  adjustedBy: string
}

let adjustmentSequence = 0

/** Ghi nhận công thủ công cho buổi đã qua mà giáo viên chưa điểm danh. */
export function mockAdjustWorkCredit(input: AdjustWorkCreditInput): WorkCreditAdjustment {
  const session = findClassSession(input.classSessionId)
  if (!session || !findTeacher(input.teacherId)) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (
    session.date >= MOCK_TODAY ||
    session.attendanceMarkedAt ||
    session.cancelledAt ||
    MOCK_WORK_ADJUSTMENTS.some((item) => item.classSessionId === input.classSessionId)
  ) {
    throw new MockError(TEACHER_ABSENCE_MSG.ADJUST_NOT_ALLOWED)
  }

  adjustmentSequence += 1

  const adjustment: WorkCreditAdjustment = {
    id: `wca-new-${adjustmentSequence}`,
    classSessionId: input.classSessionId,
    teacherId: input.teacherId,
    reason: input.reason.trim(),
    adjustedBy: input.adjustedBy,
    adjustedAt: MOCK_NOW,
  }

  MOCK_WORK_ADJUSTMENTS.unshift(adjustment)

  const target = sessionTargetLabel(input.classSessionId)
  appendAuditLog({
    actorId: input.adjustedBy,
    actionType: "adjust_work_credit",
    targetLabel: `${findTeacher(input.teacherId)?.name ?? ""} — ${target.label}`,
    targetHref: target.href,
    reason: adjustment.reason,
    effectiveDate: session.date,
    createdAt: MOCK_NOW,
  })

  return adjustment
}

import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  MOCK_TEACHERS,
  findClassSession,
  findTeacher,
} from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import type { SubstituteAssignment, TeacherInvitation } from "@/types/teacher"

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
    assignedBy: "mgr-002",
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
    assignedBy: "mgr-001",
    assignedAt: new Date().toISOString(),
    status: "confirmed",
  }

  MOCK_SUBSTITUTES.unshift(assignment)

  // Buổi học nhận giáo viên dạy thay ngay để lịch tổng không còn báo thiếu GV.
  session.teacherId = input.substituteTeacherId

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

import {
  MOCK_CLASSES,
  MOCK_LESSONS,
  MOCK_PROGRAMS,
  MOCK_ROOMS,
  MOCK_SUBJECTS,
  findProgram,
  findSubject,
} from "@/mocks/data/catalog"
import type { Lesson, Program, Room, Subject } from "@/types/catalog"

/**
 * Danh mục đào tạo: mọi số đếm (số chương trình, số lớp đang dùng...) là field
 * TÍNH ĐƯỢC — derive tại đây thay vì lưu trên entity. Xem
 * `.claude/rules/data-contracts.md`.
 */

export interface ProgramRow {
  program: Program
  subjectCode: string
  /** Số lớp học đang dùng chương trình này. */
  classCount: number
}

function toProgramRow(program: Program): ProgramRow {
  return {
    program,
    subjectCode: findSubject(program.subjectId)?.code ?? "",
    classCount: MOCK_CLASSES.filter((item) => item.programId === program.id).length,
  }
}

export function getProgramRows(): ProgramRow[] {
  return MOCK_PROGRAMS.map(toProgramRow)
}

export function findProgramRow(programId: string): ProgramRow | null {
  const program = findProgram(programId)
  return program ? toProgramRow(program) : null
}

/** Bài học của một chương trình, sắp theo thứ tự hiển thị/học. */
export function getProgramLessons(programId: string): Lesson[] {
  return MOCK_LESSONS.filter((item) => item.programId === programId).sort(
    (a, b) => a.order - b.order
  )
}

export interface RoomRow {
  room: Room
  /** Số lớp học đang dùng phòng này (so khớp theo tên phòng). */
  classCount: number
}

export function getRoomRows(): RoomRow[] {
  return MOCK_ROOMS.map((room) => ({
    room,
    classCount: MOCK_CLASSES.filter((item) => item.room === room.name).length,
  }))
}

export interface SubjectRow {
  subject: Subject
  programCount: number
  classCount: number
}

export function getSubjectRows(): SubjectRow[] {
  return MOCK_SUBJECTS.map((subject) => ({
    subject,
    programCount: MOCK_PROGRAMS.filter((item) => item.subjectId === subject.id).length,
    classCount: MOCK_CLASSES.filter((item) => item.subjectId === subject.id).length,
  }))
}

export interface GradeRow {
  grade: number
  programCount: number
  classCount: number
}

/** Các khối đang có chương trình đào tạo, tăng dần. */
export function getGradeOptions(): number[] {
  return Array.from(new Set(MOCK_PROGRAMS.map((item) => item.grade))).sort((a, b) => a - b)
}

export function getGradeRows(): GradeRow[] {
  return getGradeOptions().map((grade) => ({
    grade,
    programCount: MOCK_PROGRAMS.filter((item) => item.grade === grade).length,
    classCount: MOCK_CLASSES.filter((item) => item.grade === grade).length,
  }))
}

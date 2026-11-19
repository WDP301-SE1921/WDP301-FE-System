// Tính toán cho wizard tạo lớp. Hàm thuần, chỉ import type để `node --test` nạp thẳng được.

export interface PlanSlot {
  weekday: number;
  startTime: string;
  endTime: string;
}
export interface PlanClass {
  id: string;
  name: string;
  isActive?: boolean;
  teacherId: string | null;
  roomId?: string | null;
  program: { subject: string; subjectId?: string | null };
  weeklySchedules?: PlanSlot[];
}
export interface PlanTeacher {
  id: string;
  displayName: string | null;
  email: string;
}
export interface ScheduleConflict {
  kind: "teacher" | "room";
  className: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export const DEFAULT_LESSON_MINUTES = 120;
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

/** Chữ cái đầu tiên chưa dùng làm đuôi tên lớp; quá Z thì đánh số thứ tự. */
export function suggestClassName(
  programName: string,
  existingNames: readonly string[],
): string {
  const base = programName.trim();
  if (!base) return "";
  const used = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  for (let code = 65; code <= 90; code++) {
    const candidate = `${base}${/\d$/.test(base) ? "" : " "}${String.fromCharCode(code)}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  for (let index = 27; ; index++) {
    const candidate = `${base} (${index})`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

/** Giờ kết thúc mặc định = bắt đầu + 2 giờ, không quá 23:59. Giờ sai định dạng thì trả chuỗi rỗng. */
export function defaultEndTime(
  startTime: string,
  minutes = DEFAULT_LESSON_MINUTES,
): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime);
  if (!match) return "";
  const end = Math.min(
    Number(match[1]) * 60 + Number(match[2]) + minutes,
    LAST_MINUTE_OF_DAY,
  );
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

/** "Toán" và "toán " là một môn; bỏ dấu để khớp cả khi gõ khác kiểu. */
export function normalizeSubject(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .trim()
    .toLowerCase();
}

function sameSubject(
  left: PlanClass["program"],
  right: { subject: string; subjectId?: string | null },
): boolean {
  if (left.subjectId && right.subjectId) return left.subjectId === right.subjectId;
  return normalizeSubject(left.subject) === normalizeSubject(right.subject);
}

/** Lớp đang hoạt động mà giáo viên phụ trách. */
export function teacherTeaching(
  teacherId: string,
  classes: readonly PlanClass[],
): PlanClass[] {
  return classes.filter(
    (classroom) => classroom.isActive !== false && classroom.teacherId === teacherId,
  );
}

export interface RankedTeacher<T extends PlanTeacher = PlanTeacher> {
  teacher: T;
  teaching: PlanClass[];
  /** Có lớp đang dạy cùng môn với khóa sắp tạo lớp. */
  sameSubject: boolean;
}

/** Giáo viên cùng môn lên đầu, trong mỗi nhóm xếp theo tên. */
export function rankTeachers<T extends PlanTeacher>(
  teachers: readonly T[],
  classes: readonly PlanClass[],
  program: { subject: string; subjectId?: string | null } | null,
): RankedTeacher<T>[] {
  const label = (teacher: PlanTeacher) => teacher.displayName || teacher.email;
  return teachers
    .map((teacher) => {
      const teaching = teacherTeaching(teacher.id, classes);
      return {
        teacher,
        teaching,
        sameSubject:
          !!program && teaching.some((classroom) => sameSubject(classroom.program, program)),
      };
    })
    .sort(
      (left, right) =>
        Number(right.sameSubject) - Number(left.sameSubject) ||
        label(left.teacher).localeCompare(label(right.teacher), "vi"),
    );
}

/** Hai khung giờ cùng thứ có chồng lên nhau không (giờ dạng "HH:mm"). */
export function slotsOverlap(left: PlanSlot, right: PlanSlot): boolean {
  return (
    left.weekday === right.weekday &&
    left.startTime < right.endTime &&
    right.startTime < left.endTime
  );
}

/**
 * Khung giờ đang soạn trùng lịch của lớp khác cùng giáo viên hoặc cùng phòng. Chỉ để cảnh báo:
 * dữ liệu lớp có thể cũ, BE vẫn kiểm cuối cùng. Khung giờ chưa hợp lệ bị bỏ qua.
 */
export function findConflicts(
  schedules: readonly PlanSlot[],
  classes: readonly PlanClass[],
  target: { teacherId?: string; roomId?: string },
): ScheduleConflict[] {
  const valid = schedules.filter(
    (slot) => slot.startTime && slot.endTime && slot.startTime < slot.endTime,
  );
  const conflicts: ScheduleConflict[] = [];
  for (const classroom of classes) {
    if (classroom.isActive === false) continue;
    const kinds: ScheduleConflict["kind"][] = [];
    if (target.teacherId && classroom.teacherId === target.teacherId) kinds.push("teacher");
    if (target.roomId && classroom.roomId === target.roomId) kinds.push("room");
    for (const kind of kinds)
      for (const existing of classroom.weeklySchedules ?? [])
        if (valid.some((slot) => slotsOverlap(slot, existing)))
          conflicts.push({
            kind,
            className: classroom.name,
            weekday: existing.weekday,
            startTime: existing.startTime,
            endTime: existing.endTime,
          });
  }
  return conflicts;
}

// ---- Ô chọn giáo viên / phòng: tìm, lọc, sắp xếp (hàm thuần) ----

/** Bỏ dấu tiếng Việt, hạ chữ thường, gọn khoảng trắng: "Nguyễn" khớp "nguyen". */
export function foldVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Mọi từ trong ô tìm đều có mặt trong chuỗi (không phân biệt dấu). Ô tìm trống thì khớp hết. */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = foldVietnamese(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const text = foldVietnamese(haystack);
  return words.every((word) => text.includes(word));
}

export interface TeacherOption {
  id: string;
  label: string;
  email: string;
  /** Số lớp đang dạy. */
  classCount: number;
  sameSubject: boolean;
  /** Lịch tuần đang soạn trùng giờ với lớp khác của giáo viên này. */
  busy: boolean;
}
export type TeacherFilter = "sameSubject" | "free";
export type TeacherSort = "best" | "name" | "load";

export function buildTeacherOptions(
  teachers: readonly PlanTeacher[],
  classes: readonly PlanClass[],
  program: { subject: string; subjectId?: string | null } | null,
  schedules: readonly PlanSlot[] = [],
): TeacherOption[] {
  return rankTeachers(teachers, classes, program).map(
    ({ teacher, teaching, sameSubject }) => ({
      id: teacher.id,
      label: teacher.displayName || teacher.email,
      email: teacher.email,
      classCount: teaching.length,
      sameSubject,
      busy:
        findConflicts(schedules, classes, { teacherId: teacher.id }).length > 0,
    }),
  );
}

export function filterTeacherOptions(
  options: readonly TeacherOption[],
  query: string,
  filters: readonly TeacherFilter[] = [],
): TeacherOption[] {
  return options.filter(
    (option) =>
      matchesQuery(`${option.label} ${option.email}`, query) &&
      (!filters.includes("sameSubject") || option.sameSubject) &&
      (!filters.includes("free") || !option.busy),
  );
}

export function sortTeacherOptions(
  options: readonly TeacherOption[],
  sort: TeacherSort,
): TeacherOption[] {
  const byName = (left: TeacherOption, right: TeacherOption) =>
    left.label.localeCompare(right.label, "vi");
  const compare =
    sort === "name"
      ? byName
      : sort === "load"
        ? (left: TeacherOption, right: TeacherOption) =>
            left.classCount - right.classCount || byName(left, right)
        : (left: TeacherOption, right: TeacherOption) =>
            Number(right.sameSubject) - Number(left.sameSubject) ||
            Number(left.busy) - Number(right.busy) ||
            left.classCount - right.classCount ||
            byName(left, right);
  return [...options].sort(compare);
}

export interface PlanRoom {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}
export interface RoomOption {
  id: string;
  label: string;
  capacity: number;
  /** Phòng đã có lớp khác vào giờ học của lớp này. */
  busy: boolean;
  busyWith: string[];
}
export type RoomSort = "capacity" | "name";

export function buildRoomOptions(
  rooms: readonly PlanRoom[],
  classes: readonly PlanClass[],
  schedules: readonly PlanSlot[],
): RoomOption[] {
  return rooms
    .filter((room) => room.isActive)
    .map((room) => {
      const names = findConflicts(schedules, classes, { roomId: room.id }).map(
        (conflict) => conflict.className,
      );
      return {
        id: room.id,
        label: room.name,
        capacity: room.capacity,
        busy: names.length > 0,
        busyWith: [...new Set(names)],
      };
    });
}

export function filterRoomOptions<T extends RoomOption>(
  options: readonly T[],
  query: string,
  onlyFree = false,
): T[] {
  return options.filter(
    (option) => matchesQuery(option.label, query) && (!onlyFree || !option.busy),
  );
}

export function sortRoomOptions<T extends RoomOption>(
  options: readonly T[],
  sort: RoomSort,
): T[] {
  const byName = (left: T, right: T) =>
    left.label.localeCompare(right.label, "vi");
  return [...options].sort(
    sort === "name"
      ? byName
      : (left, right) => left.capacity - right.capacity || byName(left, right),
  );
}

/** "(theo Phòng B201)": tên phòng đã bắt đầu bằng "Phòng" thì không thêm chữ "phòng" nữa. */
export function byRoomName(name: string): string {
  return /^phòng\b/i.test(name.trim()) ? `theo ${name}` : `theo phòng ${name}`;
}

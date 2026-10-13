import type {
  AttendanceCounts,
  AttendanceHistoryRow,
} from "@/types/academic-workflows";

export interface StudentAttendanceRow {
  studentId: string;
  fullName: string;
  counts: AttendanceCounts;
  attendancePercent: number | null;
}

/**
 * Groups the BE attendance history by child. Each row already carries the BE
 * `effectiveStatus`; this only adds up rows with the BE rule (SRS §5.5):
 * (present + made_up) / required, excused not required, no sessions → null.
 */
export function attendanceByStudent(
  history: AttendanceHistoryRow[],
): StudentAttendanceRow[] {
  const rows = new Map<string, StudentAttendanceRow>();
  for (const item of history) {
    const student = item.enrollment.studentProfile;
    if (!student) continue;
    const row = rows.get(student.id) ?? {
      studentId: student.id,
      fullName: student.fullName,
      counts: {
        present: 0,
        absent: 0,
        madeUp: 0,
        excused: 0,
        required: 0,
        attended: 0,
      },
      attendancePercent: null,
    };
    const { counts } = row;
    if (item.effectiveStatus === "EXCUSED") counts.excused++;
    else {
      counts.required++;
      if (item.effectiveStatus === "PRESENT") counts.present++;
      else if (item.effectiveStatus === "MADE_UP") counts.madeUp++;
      else counts.absent++;
      if (item.effectiveStatus !== "ABSENT") counts.attended++;
    }
    rows.set(student.id, row);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      attendancePercent: row.counts.required
        ? Math.round((row.counts.attended / row.counts.required) * 10000) / 100
        : null,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));
}

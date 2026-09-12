---
name: attendance-rules
description: Use when building attendance-marking UI, attendance-rate displays, or makeup-class (học bù) scheduling.
user-invocable: false
---

# Attendance & Makeup Rules

## Marking
Teacher marks each session: `present`, `absent`, `made_up`, `excused`. No bulk "mark all present" shortcut without a per-student confirm step.

## Rate calculation
`rate = (present + made_up) / totalRequiredSessions`. Recompute and refetch immediately after any mutation — don't do optimistic local math that could drift from server truth.

## Makeup class (học bù)
A replacement session must satisfy ALL of: same `programId`, same `lessonId`, date in the future, still has open capacity. Filter server-side, not client-side.

## Long-term leave (nghỉ dài hạn)
Only a manager sets a start/end date range. Sessions inside it become `excused` automatically and are excluded from `totalRequiredSessions`. A teacher's attendance UI must show these as locked/excused, not editable.

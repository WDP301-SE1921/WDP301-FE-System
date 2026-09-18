# Data Contracts

Keep FE types aligned with the backend's field names exactly — don't rename fields "to be cleaner" on the FE side; it just creates a mapping layer nobody asked for.

## Core entities (field names as used by the API)
- `ParentAccount`: `id`, `email` (login + notification email, unique), `phone` (contact only, not unique), `status` (`activated | pending_link`), `createdAt`, `activatedAt`.
- `StudentProfile`: `id`, `parentAccountId`, `name`, `code` (display id, e.g. `HS-2024-0012`), `grade` (6–9), `status` (`active | paused | withdrawn | pending_link`), `createdAt`.
- `Enrollment`: `id`, `studentProfileId`, `subjectId`, `classId`, `months` (1–12), `status` (`active | reserved | dropped`), `startDate`, `endDate`, `tuitionAmount`, `completedLessons`.
- `Payment`: `id`, `enrollmentId`, `confirmedAt`, `confirmedBy` (manager id), `amount`, `status` (`succeeded | pending | failed`), `code` (display id, e.g. `TXN-20260915-081`), `receiptCode` (e.g. `BL-20260915-0012`), `method` (`cash | qr_vcb | qr_mbbank | qr_bidv | qr_techcombank | vnpay`).
- `ActivationLink`: `id`, `enrollmentId`, `token`, `code` (short code the manager reads aloud), `expiresAt` (7 days), `usedAt`.
- `AttendanceRecord`: `id`, `classSessionId`, `studentProfileId`, `status` (`present | absent | made_up | excused`), `note`.
- `ClassSession`: `id`, `classId`, `lessonId`, `programId`, `date`, `capacity`, `startTime`, `endTime`, `teacherId`, `attendanceMarkedAt`.
- `Subject`: `id`, `code` (`MATH | PHYS | CHEM | BIOL`), `name`.
- `Program`: `id`, `subjectId`, `grade`, `name`, `totalLessons`, `monthlyFee`.
- `Lesson`: `id`, `programId`, `order`, `title`.
- `Teacher`: `id`, `name`, `email`, `phone`, `code` (display id, e.g. `GV-MAT01`), `subjectIds`, `status` (`active | on_leave | inactive`), `yearsExperience`, `rating`, `joinedAt`, `isHeadTeacher`, `specialty`.
- `TeacherInvitation`: `id`, `email`, `name`, `phone`, `subjectIds`, `status` (`pending_review | sent | approved | rejected`), `createdAt`, `grades`, `source`, `experienceNote`, `cvFileName`.
- `SubstituteAssignment`: `id`, `classSessionId`, `mainTeacherId`, `substituteTeacherId`, `reason`, `assignedBy` (manager id), `assignedAt`, `status` (`confirmed | pending_confirm | cancelled`).
- `ClassRecord`: `id`, `name`, `subjectId`, `programId`, `grade`, `teacherId`, `room`, `weekdays`, `startTime`, `endTime`, `capacity`, `status`.

## Rules
- Every Zod schema in `src/lib/validators/` must use these exact field names — this is the single source of truth for shape, reused by both forms and API request typing.
- `status` fields are string unions, never numeric enums (see `.claude/rules/frontend.md` — no enums project-wide). The values above are authoritative; `src/constants/status.ts` must use the same keys or `<StatusBadge />` silently falls back to the raw string.
- Never invent a field the backend doesn't return "for convenience" — derive it in a selector/hook instead, so there's one place to fix it if the derivation logic changes.

## Derived, never stored on the entity
These are computed in `src/features/<domain>/selectors.ts` and must NOT be added to the interfaces above:
- Tỷ lệ đi học / attendance breakdown → `features/students/selectors.ts` → `getAttendanceBreakdown()`
- Hạn gói học phí gần nhất → `getPackageEndDate()`, `getDaysRemaining()`
- Mã môn đang học của một học sinh → `getSubjectCodes()`
- Số con của một phụ huynh, trạng thái mã liên kết → `features/parents/selectors.ts`
- Sĩ số lớp, tổng học phí → `features/enrollments/selectors.ts` → `getEnrolledCount()`, `getTuitionBreakdown()`
- Tiến độ lớp, trạng thái buổi học, số học sinh học bù → `features/classes/selectors.ts`
- Map buổi học sang `CalendarEvent` của lịch → `features/schedule/selectors.ts`
- Tổng thu theo ngày/tháng, số tháng đã bán → `features/payments/selectors.ts` → `getPaymentTotals()`
- Trạng thái + ngày tạo của mã liên kết → `getLinkCodeRows()`, `getLinkCodeTotals()`
- Tải giảng dạy, số lớp/buổi/dạy thay của giáo viên, ứng viên dạy thay phù hợp → `features/teachers/selectors.ts`

Selectors run inside `queryFn`, not during render — so they may read `Date.now()`. Calling it during render trips the `react-hooks/purity` lint rule.

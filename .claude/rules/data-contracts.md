# Data Contracts

Keep FE types aligned with the backend's field names exactly — don't rename fields "to be cleaner" on the FE side; it just creates a mapping layer nobody asked for.

## Core entities (field names as used by the API)
- `ParentAccount`: `id`, `email` (login + notification email, unique), `phone` (contact only, not unique), `status` (`activated | disabled`), `createdAt`, `activatedAt`. Parents self-register on the mobile app — the web never creates a parent.
- `StudentProfile`: `id`, `parentAccountId`, `name`, `code` (display id, e.g. `HS-2024-0012`), `grade` (6–9), `status` (`active | paused | withdrawn`), `createdAt`. Created by the parent on mobile before the center can enroll the child.
- `Enrollment`: `id`, `studentProfileId`, `subjectId`, `classId`, `months` (1–12), `status` (`active | reserved | dropped`), `startDate`, `endDate`, `tuitionAmount`, `completedLessons`.
- `Payment`: `id`, `enrollmentId`, `confirmedAt`, `confirmedBy` (staff id), `amount`, `status` (`succeeded | pending | failed`), `code` (display id, e.g. `TXN-20260915-081`), `receiptCode` (e.g. `BL-20260915-0012`), `method` (`cash | qr_vcb | qr_mbbank | qr_bidv | qr_techcombank | vnpay`). The offline flow only records `cash` today.
- `AttendanceRecord`: `id`, `classSessionId`, `studentProfileId`, `status` (`present | absent | made_up | excused`), `note`.
- `ClassSession`: `id`, `classId`, `lessonId`, `programId`, `date`, `capacity`, `startTime`, `endTime`, `teacherId`, `attendanceMarkedAt`, `attendanceMarkedBy` (teacher id who marked — the substitute, when there is one), `kind` (`lesson | monthly_test`), `cancelledAt`, `cancelReason`.
- `Subject`: `id`, `code` (`MATH | PHYS | CHEM | BIOL`), `name`.
- `Program`: `id`, `subjectId`, `grade`, `name`, `totalLessons`, `monthlyFee`, `textbook`.
- `Lesson`: `id`, `programId`, `order`, `title`, `chapter`.
- `Teacher`: `id`, `name`, `email`, `phone`, `code` (display id, e.g. `GV-MAT01`), `subjectIds`, `status` (`active | on_leave | inactive`), `yearsExperience`, `rating`, `joinedAt`, `isHeadTeacher`, `specialty`.
- `TeacherInvitation`: `id`, `email`, `name`, `phone`, `subjectIds`, `status` (`pending_review | sent | approved | rejected`), `createdAt`, `grades`, `source`, `experienceNote`, `cvFileName`.
- `SubstituteAssignment`: `id`, `classSessionId`, `mainTeacherId`, `substituteTeacherId`, `reason`, `assignedBy` (center manager id), `assignedAt`, `status` (`confirmed | pending_confirm | cancelled`).
- `TeacherAbsenceReport`: `id`, `classSessionId`, `teacherId`, `reason`, `reportedAt`, `status` (`pending | covered | cancelled`), `resolvedBy`, `resolvedAt`.
- `WorkCreditAdjustment`: `id`, `classSessionId`, `teacherId`, `reason`, `adjustedBy` (center manager id), `adjustedAt`. A manual "credit this session" for a taught-but-unmarked session.
- `ClassRecord`: `id`, `name`, `subjectId`, `programId`, `grade`, `teacherId` (optional — a class may exist before a teacher is assigned), `room`, `weekdays`, `startTime`, `endTime`, `capacity`, `status`.
- `StaffAccount` (web back-office login): `id`, `name`, `email`, `phone`, `role` (`admin | center_manager | curriculum_designer | staff`), `status` (`active | pending | disabled`), `joinedAt`.

## Rules
- Every Zod schema in `src/lib/validators/` must use these exact field names — this is the single source of truth for shape, reused by both forms and API request typing.
- `status` fields are string unions, never numeric enums (see `.claude/rules/frontend.md` — no enums project-wide). The values above are authoritative; `src/constants/status.ts` must use the same keys or `<StatusBadge />` silently falls back to the raw string.
- Never invent a field the backend doesn't return "for convenience" — derive it in a selector/hook instead, so there's one place to fix it if the derivation logic changes.
- There is **no activation link / code / token for parents** and no `pending_link` status. A parent and child exist first (mobile); staff looks the parent up by email and the `Enrollment` attaches straight to the chosen `StudentProfile`. (Staff invitations for web accounts still use a one-time token — that is `Invitation` in `src/types/auth.ts`, unrelated to parents.)

## Derived, never stored on the entity
These are computed in `src/features/<domain>/selectors.ts` and must NOT be added to the interfaces above:
- Tỷ lệ đi học / attendance breakdown → `features/students/selectors.ts` → `getAttendanceBreakdown()`
- Hạn gói học phí gần nhất → `getPackageEndDate()`, `getDaysRemaining()`
- Mã môn đang học của một học sinh → `getSubjectCodes()`
- Số con của một phụ huynh → `features/parents/selectors.ts`
- Sĩ số lớp, tổng học phí → `features/enrollments/selectors.ts` → `getEnrolledCount()`, `getTuitionBreakdown()`
- Tiến độ lớp, trạng thái buổi học, số học sinh học bù → `features/classes/selectors.ts`
- Map buổi học sang `CalendarEvent` của lịch → `features/schedule/selectors.ts`
- Tổng thu theo ngày/tháng, số tháng đã bán → `features/payments/selectors.ts` → `getPaymentTotals()`
- Tải giảng dạy, số lớp/buổi/dạy thay của giáo viên, ứng viên dạy thay phù hợp → `features/teachers/selectors.ts`
- Công giáo viên (số buổi/giờ đã chốt, chưa chốt, dạy thay, nghỉ báo trước / đột xuất) → `features/work-credits/selectors.ts`. "Đột xuất" is derived from `reportedAt` vs the session start (`BUSINESS_RULES.TEACHER_ABSENCE_URGENT_HOURS`), never stored.
- Trùng lịch học của một học sinh khi chọn lớp → `features/enrollments/selectors.ts`
- Bài kiểm tra tháng KHÔNG nằm trong `Lesson`: buổi cuối của mỗi tháng lịch trong timeline lớp được sinh với `kind: "monthly_test"` khi tạo buổi học (`mocks/data/catalog.ts`, `mocks/data/classes.ts`).

Selectors run inside `queryFn`, not during render — so they may read `Date.now()`. Calling it during render trips the `react-hooks/purity` lint rule.

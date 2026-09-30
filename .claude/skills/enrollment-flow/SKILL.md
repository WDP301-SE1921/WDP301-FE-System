---
name: enrollment-flow
description: Use when implementing or modifying the student registration/enrollment screen (staff wizard) or anything that creates an Enrollment + Payment.
user-invocable: false
---

# Enrollment Flow

There is exactly **one** registration flow. The parent account and the child profile always exist *before* the center touches the registration — they are created by the parent on the mobile app. Staff never creates a parent or a child on the web.

## Order of the center's registration (staff / admin, `/manager/enrollments/new`)
Curriculum (giáo trình) → fixed-schedule classes (lịch học) already exist, then:
1. **Pick the parent** with the existing `ParentPicker` (search by Gmail or phone; locked accounts are not listed). Not found → the info alert tells the parent to register and create the child profile on the app first.
2. **Pick the child** with the existing `EntityPicker` (own `queryKey` per parent) — one of the parent's `StudentProfile`s. Parent has none → empty state with the same instruction.
3. **Pick grade → subject → class.** Grade defaults to the child's `grade` (options come from the catalog, not hard-coded). Class cards show the class's fixed schedule; warn (do not block) when it overlaps a class the child is already enrolled in.
4. **Months (1–12) + collect payment offline** ("câu chuyện off": cash; staff confirms received) → `Payment` (succeeded) → `Enrollment` (`active`) attached straight to the chosen `StudentProfile`.
5. **Done** — one `<Receipt />` (with Print) + receipt-email status with a resend button.

## Rules
- No activation link, code, token or `pending_link` — they were removed. Do not reintroduce them.
- Entry points may deep-link with `?parentId=&studentId=` (nuqs) to skip to step 3.
- The wizard is a staff/admin screen only (`canAccessPath`); the center manager cannot open it.
- Every enrollment ends on the same `<Receipt />` — reuse `shared/display/receipt.tsx` via `buildReceiptProps`.
- Email is the only automated channel; a failed receipt email surfaces a warning + resend, it never blocks the enrollment.

# Panel thao tác dạng so sánh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng lại 5 thao tác (tạm nghỉ dài hạn, chuyển lớp, kết thúc/học lại, dạy thay 1 buổi, đổi GV dài hạn) theo mẫu "Hiện tại → Sau khi xác nhận", ô lý do = chọn sẵn + "Khác…", không đổi logic.

**Architecture:** Mở rộng `ApiForm` (loại ô `reason`, `choices`, ô nửa cột, vùng xem trước theo giá trị đang nhập, bước xác nhận bằng hộp thoại) để mọi form giữ nguyên schema, validate và lời gọi API. Bảng so sánh là component dùng chung `CompareTable`. BE thêm 2 trường đọc/ghi không bắt buộc.

**Tech Stack:** Next.js App Router, React Hook Form + Zod, Shadcn (Maia), TanStack Query; NestJS + Prisma + Jest.

**Spec:** canvas https://claude.ai/artifact/5t5ZKtdM6fTHp78GSAKjn4 (16 artboard), ảnh hiện trạng `docs/screenshots/current-2026-11-09/`.

## Global Constraints

- Không đổi API, quyền, validate, điều kiện lọc (lớp chuyển: cùng program, đang mở, cùng `monthlyFee`; dạy thay: buổi SCHEDULED chưa bắt đầu).
- Ô lý do gửi đúng chuỗi `reason` như cũ: nhãn lý do đã chọn, hoặc chữ gõ khi chọn "Khác…".
- Design system dự án: tông xanh, Be Vietnam Pro, bo góc ≥ `rounded-xl`, dùng `src/components/ui` + `shared`; không thêm thư viện (không GSAP).
- BE: chỉ sửa local, KHÔNG push khi user chưa đồng ý.

## Review Focus

- Chọn "Khác…" rồi để trống → báo lỗi bắt buộc như ô lý do cũ, không gửi.
- Danh sách buổi chưa tải được / lỗi → form vẫn gửi được (xem trước không chặn), như hiện nay.
- Đổi ghi danh / tab giữa chừng → form và xem trước dựng lại sạch (key theo ghi danh).
- Kết thúc gọi BE cũ không có `reason` → BE mới nhận body rỗng vẫn chạy (reason không bắt buộc).
- Ứng viên dạy thay không có lớp nào → `subjects: []`, giao diện không vỡ.

---

### Task 1 (BE): lý do khi kết thúc ghi danh / nghỉ hẳn

**Files:** Modify `src/modules/academic/academic.dto.ts`, `academic.controller.ts`, `enrollment-workflows.service.ts`; Test `tests/unit/enrollment-end-reason.spec.ts`

**Interfaces:** Produces `OptionalReasonDto { reason?: string }` (≤2000); `endEnrollment(user, id, input?)`, `endStudent(user, studentId, input?)`; audit `afterData.reason` khi có.

- [ ] Test: gọi `endEnrollment` / `endStudent` với `{ reason: 'Chuyển trường' }` → `auditLog.create` nhận `afterData.reason === 'Chuyển trường'`; gọi không body → không có khóa `reason`.
- [ ] Chạy test → FAIL. Cài đặt. Chạy lại → PASS. Chạy toàn bộ unit test BE.

### Task 2 (BE): môn dạy trong substitute-candidates

**Files:** Modify `src/modules/registration-flow/registration-flow.service.ts`; Test `tests/unit/substitute-candidates.spec.ts`

**Interfaces:** mỗi ứng viên trả thêm `subjects: string[]` (môn của các lớp đang hoạt động họ phụ trách, không trùng, giữ thứ tự sắp xếp cũ).

- [ ] Test với db giả: 2 lớp cùng môn + 1 lớp khác môn → `subjects` 2 phần tử; không lớp → `[]`. FAIL → cài đặt → PASS.

### Task 3 (FE): component dùng chung

**Files:** Create `src/components/shared/forms/reason-select.tsx`, `src/components/shared/forms/choice-cards.tsx`, `src/components/shared/display/compare-table.tsx`, `src/constants/reason-presets.ts`; Modify `src/components/shared/forms/api-form.tsx`

**Interfaces:**
- `REASON_PRESETS: Record<"leave"|"endLeave"|"transfer"|"end"|"reactivate"|"substitute"|"teacher"|"approve"|"reject", readonly string[]>`
- `ApiFormField.type` thêm `"reason" | "choices"`; `options[].description?: string`, `half?: boolean`, `presets?: readonly string[]`
- `ApiForm` props thêm `preview?: (values) => ReactNode`, `summary?: (values) => ReactNode`, `confirm?: { title: string; description?: string; confirmText: string; destructive?: boolean }`, `submitVariant?: "default" | "destructive"`
- `CompareTable({ caption?, beforeLabel?, afterLabel?, rows: CompareRow[] })`, `CompareRow { label; before: ReactNode; after: ReactNode; state?: "same"|"changed"|"blocked"|"ok" }`
- `ChoiceCards({ value, onChange, options, ariaLabel, columns? })`

### Task 4 (FE): panel "Xử lý" của Nhân viên

**Files:** Modify `src/features/absences/components/live-staff-workflows.tsx`, `src/features/academic/api.ts` (endEnrollment/endStudent nhận body tùy chọn)

- [ ] Ghi danh chọn bằng `ChoiceCards`; tab thao tác có dòng phụ.
- [ ] Nghỉ dài hạn: ô ngày nửa cột, `reason`; xem trước = so sánh + buổi trong khoảng (từ `academicApi.sessions({classId})`), câu tóm tắt.
- [ ] Chuyển lớp: lớp mới bằng `choices` (lịch tuần, chỗ trống); so sánh lịch/GV/phòng/sĩ số/học phí.
- [ ] Kết thúc: chọn "Một môn" / "Nghỉ hẳn"; so sánh; lý do; hộp xác nhận thay checkbox.
- [ ] Cho học lại: so sánh + lý do chọn sẵn; lịch sử đơn thành bảng, nút trên dòng mở hộp thoại.

### Task 5 (FE): dạy thay + đổi GV dài hạn

**Files:** Modify `src/features/teachers/components/substitute-form.tsx`, `src/features/registration-flow/components/class-editor.tsx`, `src/types/academic-workflows.ts`

- [ ] Dạy thay: ứng viên bằng `choices` (cùng môn lên trước), so sánh GV buổi này, lý do chọn sẵn.
- [ ] Đổi GV: so sánh GV hiện tại → mới, danh sách buổi trước/sau ngày hiệu lực, lý do chọn sẵn; hủy phân công chờ giữ nguyên.

### Task 6: kiểm tra

- [ ] BE: `npx jest tests/unit`; FE: `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack`.
- [ ] Chạy harness ui-roles, chụp 5 panel mới, thử gửi từng thao tác trên DB test.
- [ ] Impeccable detect trên file UI đã đổi; review cuối.

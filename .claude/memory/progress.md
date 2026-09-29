# Progress

- **2026-09** — Repo scaffolded (`WDP301-FE-System`), Next.js App Router + TypeScript + Tailwind + Shadcn (Maia preset).
- **2026-09** — Role-based folder structure set up: `(public)`, `(auth)`, `(manager)`, `(teacher)` route groups, `features/`, `lib/`, `hooks/`. Note: `(parent)` route group is mobile-only / not used on web frontend.
- **2026-09** — Design system defined (rounded corners everywhere, color tokens) — `.claude/rules/ui.md` / `docs/DESIGN.md`.
- **2026-09** — `.claude/` agentic setup added: agents (blueprint, frontend, reviewer), commands (feature, fix, forget, review, verify), rules, skills, project memory.
- **2026-09-12** — Shared theme wired up in `src/app/globals.css`: `--primary`/`--ring` set to brand blue `#2563EB`, `--brand-accent`/`--brand-accent-foreground` set to amber `#F59E0B`.
- **2026-09-12** — Font swapped in `src/app/layout.tsx` to Be Vietnam Pro (`latin` + `vietnamese` subsets).
- **2026-09-15 (Phase 0 & 1 UI Primitives)** — Upgraded 8 existing components in `src/components/ui/` (`button`, `badge`, `input`, `dialog`, `table`, `tabs`, `card`, `avatar`) and created 21 missing UI primitives (`spinner`, `skeleton`, `label`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `tooltip`, `dropdown-menu`, `toast` via Sonner, `alert`, `sheet`, `popover`, `separator`, `scroll-area`, `progress`, `breadcrumb`, `pagination`, `command`, `calendar`).
- **2026-09-15 (Phase 1 Shared Components)** — Completed Phase 1:
  - Installed `@tanstack/react-table` (v9.2.4).
  - Built Constants System in `src/constants/`: `ui.ts` (with `DEBOUNCE.SEARCH` and `TOAST_DURATION` map), `routes.ts`, `roles.ts`, `storage-keys.ts`, `menu.ts` (manager & teacher web menus), `status.ts` (12 domain status categories), `subjects.ts` (`MATH`, `PHYS`, `CHEM`, `BIOL`), and `messages/` (`common.ts`, `error.ts`, `validation.ts`, `confirm.ts`, `empty.ts`, `index.ts`). *Note: `messages/events/` subfolder will be created when implementing domain features.*
  - Built Utilities & Providers: `src/lib/format.ts` (currency VND & date formatters), `src/lib/auth-events.ts` (401 session expiry event emitter), `src/providers/providers.tsx` (`QueryClientProvider`, `NuqsAdapter`, `Toaster`), `src/proxy.ts` (App Router role protection).
  - Built Layout Components in `src/components/shared/layout/`: `app-shell.tsx`, `sidebar.tsx`, `page-header.tsx`, `page-container.tsx`, `auth-layout.tsx`, `role-guard.tsx`, and `header/` (`header.tsx`, `user-menu.tsx`, `quick-create-menu.tsx`, `global-search.tsx`, `notification-bell.tsx`).
  - Built Feedback Components in `src/components/shared/feedback/`: `status-badge.tsx`, `confirm-dialog.tsx`, `empty-state.tsx`, `error-state.tsx`, `error-page.tsx`, `error-boundary.tsx`, `loading-overlay.tsx`, `skeleton-presets.tsx`, `async-boundary.tsx`, `session-expired-modal.tsx`, `unsaved-changes-guard.tsx`.
  - Integrated App Router Error Pages: `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/(manager)/error.tsx`.
  - Created Dev Showcase Page at `src/app/dev/components/page.tsx` displaying Phase 1 components in development mode.
- **2026-09-15 (Phase 2 Data-Table & Core Display Components)** — Completed Phase 2:
  - Built Data-Table system in `src/components/shared/data-table/`: `data-table.tsx` (using `@tanstack/react-table` v9.2.4 legacy API compat layer), `filter-bar.tsx` (URL-synced via `nuqs`), `status-tabs.tsx`, `row-actions.tsx`, `bulk-action-bar.tsx`, `table-pagination.tsx`, `active-filter-chips.tsx`.
  - Built Core Display components in `src/components/shared/display/`: `user-cell.tsx`, `subject-tag.tsx`, `schedule-text.tsx`, `money-text.tsx`, `date-text.tsx`, `progress-stat.tsx`, `countdown-badge.tsx`, `avatar-group-display.tsx`, `attendance-summary.tsx`, `detail-header.tsx`.
- **2026-09-15 (Phase 3 Action & Display Components)** — Completed Phase 3:
  - Built Display components in `src/components/shared/display/`: `kpi-card.tsx`, `section-card.tsx`, `description-list.tsx`, `timeline.tsx`, `change-diff.tsx`, `code-display.tsx`.
  - Built Action components in `src/components/shared/actions/`: `copy-button.tsx`, `export-button.tsx`, `print-layout.tsx`.
- **2026-09-15 (Phase 4 Workflows & Pickers Components)** — Completed Phase 4 & Fixes:
  - Built Pickers in `src/components/shared/pickers/`: `selectable-card.tsx`, `entity-picker.tsx` (with selected entity chip view, dropdown toggle, error state), `entity-picker-presets.tsx` (`StudentPicker`, `TeacherPicker`, `ClassPicker`, `ParentPicker`), `class-option-card.tsx`, `session-option-list.tsx`, `condition-chips.tsx` (refactored to read-only criteria pass/fail indicator).
  - Built Workflows in `src/components/shared/workflows/`: `stepper.tsx`, `wizard-layout.tsx` (with optional 2/3 content + 1/3 sticky summary panel layout), `sticky-form-footer.tsx`.
- **2026-09-15 (Phase 5 Calendar & Schedule Components)** — Completed Phase 5:
  - Built Calendar components in `src/components/shared/calendar/`: `session-block.tsx` (subject-coded class cards with status badges), `session-drawer.tsx` (slide-over Sheet with room, teacher, attendance stats, absent list & quick actions), `schedule-calendar.tsx` (supports View: **Ngày | Tuần** and GroupBy: **Thời gian | Phòng**).
  - Updated Dev Showcase Page at `src/app/dev/components/page.tsx` showcasing all Phase 1–5 components.
- **2026-09-17 (Landing page & Đăng nhập)** — Hai màn thật đầu tiên:
  - Landing page công khai tại `src/app/(public)/page.tsx` + `(public)/layout.tsx` (header/footer dùng chung). Boilerplate `src/app/page.tsx` của create-next-app đã bị xóa — root `/` giờ do route group `(public)` phục vụ.
  - Components landing (đặc thù một trang, không promote lên `shared/`) ở `src/features/landing/components/`: `landing-logo`, `landing-header`, `hero-section`, `subjects-section`, `benefits-section`, `cta-section`, `landing-footer`. Copy marketing tách riêng ở `src/features/landing/content.ts` (`LANDING_CONTENT`, `LANDING_NAV`), không hardcode trong JSX. Chưa có ảnh hero WebP — minh họa dựng bằng Card + Hugeicons.
  - **PROMPT 1 — Đăng nhập** tại `src/app/(auth)/login/page.tsx`, dùng lại `shared/layout/auth-layout.tsx`. Form ở `src/features/auth/components/login-form.tsx` (react-hook-form + `Controller`; tránh `watch()` vì React Compiler báo incompatible-library).
  - Constants mới: `src/constants/validation.ts` (`REGEX`, `FIELD_LIMITS`) và `src/constants/messages/events/auth.ts` (`AUTH_MSG`) — file đầu tiên của thư mục `messages/events/`. Thêm `STORAGE_KEYS.ROLE_COOKIE`, `src/proxy.ts` đọc qua constant thay vì chuỗi cứng.
  - Validator `src/lib/validators/auth.ts` (`loginSchema`); type `src/types/auth.ts` (`AuthUser`, `LoginResult`).
  - **Hạ tầng mock chốt ở `src/mocks/`** (theo `.claude/rules/implement-ui.md`; `.claude/rules/mock-data.md` đã sửa cho khớp, trước đó hai rule mâu thuẫn): `src/mocks/utils/mock-query.ts` (`mockQuery`, `mockMutation`, `MockError`) + `src/mocks/data/auth.ts` (`MOCK_ACCOUNTS`, `mockLogin`). Hook `src/features/auth/hooks/use-login.ts`.
  - **Fix primitive hỏng**: `src/components/ui/label.tsx` trước đây bọc `Field.Label` của Base UI — primitive này throw (Base UI error #28) nếu không nằm trong `<Field.Root>`, làm SSR crash. Đổi sang render `<label>` thuần, giữ nguyên API (`required`, `htmlFor`, `className`). `<Label>` chưa được dùng ở đâu trước đó nên không ảnh hưởng màn nào.
  - **Nợ kỹ thuật**: 2 lint error có sẵn chưa xử lý: `src/app/dev/components/page.tsx:105` (react-hooks/purity), `src/components/shared/data-table/filter-bar.tsx:37` (react-hooks/set-state-in-effect).
- **2026-09-17 (PROMPT 1B & 1C — Quên mật khẩu, Kích hoạt tài khoản)**:
  - **PROMPT 1B — Quên mật khẩu** tại `src/app/(auth)/forgot-password/page.tsx` (khớp `ROUTES.AUTH.FORGOT_PASSWORD`). Form `features/auth/components/forgot-password-form.tsx`, có trạng thái thành công (Alert success + nút đổi sang "Gửi lại link").
  - **PROMPT 1C — Kích hoạt tài khoản** tại `src/app/(auth)/activate/page.tsx`. **Route dùng `/activate` theo `ROUTES.AUTH.ACTIVATE` của repo, khác docs (`(auth)/accept-invite`)**. Page là Server Component đọc `searchParams.token` rồi truyền xuống form; token không bao giờ render ra UI (rule security). Form xử lý 3 nhánh: skeleton khi đang giải mã lời mời, `ErrorState` khi token sai/hết hạn/đã dùng, và form đầy đủ khi hợp lệ.
  - `src/app/(auth)/register/` vẫn là placeholder rỗng, chưa dùng tới.
  - **`shared/layout/auth-layout.tsx` thêm 2 prop optional** `illustration?` và `footerLink?` (không phá API cũ). Trang Login đã backfill để 3 màn `(auth)` đồng bộ panel trái.
  - Component mới: `features/auth/components/auth-illustration.tsx` (card minh họa nền trắng, dùng chung cho cả 3 màn auth nhưng chỉ trong phạm vi feature auth nên không đặt vào `shared/`).
  - Constants mới: `src/constants/business-rules.ts` (`BUSINESS_RULES` + `WEEKDAYS`; `PASSWORD_RESET_EXPIRY_MINUTES: 30`, `ACTIVATION_LINK_EXPIRY_DAYS: 7`), `REGEX.PASSWORD_STRONG`, `ROLE_LABEL` trong `roles.ts`, và 3 message validate mới (`PASSWORD_WEAK`, `PASSWORD_NOT_MATCH`, `TERMS_REQUIRED`). `AUTH_MSG` mở rộng cho 2 màn.
  - Validator: `forgotPasswordSchema`, `activateAccountSchema` (dùng `z.boolean().refine()` cho checkbox điều khoản — `z.literal(true)` làm kiểu input của form thành `true` và vỡ type của `defaultValues`).
  - Mock: `mockGetInvitation`, `mockActivateAccount`, `mockRequestPasswordReset` + `MOCK_INVITATIONS`. Token demo: `demo-manager` (hợp lệ), `demo-expired` (hết hạn), `demo-used` (đã dùng). Hook: `use-forgot-password.ts`, `use-invitation.ts`, `use-activate-account.ts`. Type `Invitation` thêm vào `src/types/auth.ts`.
- **2026-09-18 (PROMPT 2, 3, 3B–3D, 4, 4B — Dashboard, Học sinh, Phụ huynh)**:
  - **Đổi cấu trúc route manager**: route group `(manager)` không sinh segment URL nên `/students` không khớp `ROUTES.MANAGER.STUDENTS = "/manager/students"` và matcher `/manager/:path*` của `src/proxy.ts`. Đã chuyển page vào `src/app/(manager)/manager/<domain>/` — giữ route group để scope layout theo role, đồng thời sinh đúng URL `/manager/*`. `ROUTES` và `proxy.ts` không đổi. **Màn manager mới phải đặt trong `(manager)/manager/`.**
  - `src/app/(manager)/layout.tsx` bọc `AppShell` (trước đó chưa có).
  - Trang: `manager/dashboard`, `manager/students`, `manager/students/[id]` (tab qua nuqs `?tab=`), `manager/parents`, `manager/parents/[id]`.
  - **Mọi page dùng nuqs phải bọc `<Suspense>`** — `useQueryState` gọi `useSearchParams()`, không có Suspense thì `npm run build` fail ở bước prerender với "should be wrapped in a suspense boundary".
  - Types theo contract: `src/types/catalog.ts` (Subject, Program, Lesson, Teacher, ClassRecord, ClassSession), `src/types/student.ts` (ParentAccount, StudentProfile, Enrollment, Payment, ActivationLink, AttendanceRecord, EmailLog, AuditLogEntry).
  - Mock: `src/mocks/data/` + `catalog.ts`, `parents.ts` (14 PH), `students.ts` (18 HS, 25 enrollment), `attendance.ts` (sinh buổi + điểm danh tất định, không random), `payments.ts` (thanh toán, mã liên kết, email log, audit log).
  - **Field tính được KHÔNG nằm trong entity** — derive ở `features/<domain>/selectors.ts`. Đã ghi rõ danh sách vào `.claude/rules/data-contracts.md` mục "Derived, never stored on the entity".
  - `STATUS_MAP.attendance` sửa `makeup`→`made_up`, `permitted_leave`→`excused` cho khớp contract; thêm category `student` và `payment`. Thêm `ROLE_LABEL` vào `roles.ts`, `BUSINESS_RULES.PACKAGE_EXPIRY_WARNING_DAYS` + `ATTENDANCE_RATE_TARGET`.
  - Biểu đồ "Tỷ lệ đi học 7 ngày" dựng bằng div + Tailwind (`features/dashboard/components/attendance-bar-chart.tsx`), không thêm thư viện chart.
  - Messages mới: `messages/events/dashboard.ts`, `student.ts`, `parent.ts`.
- **2026-09-18 (PROMPT 5–5E — Wizard Đăng ký học)**:
  - `manager/enrollments/new` — wizard 5 bước, `?step=` qua nuqs, một `useForm` chung + `trigger()` theo `ENROLLMENT_STEP_FIELDS` từng bước.
  - Theo đúng 3 luồng của skill `enrollment-flow`: A1 con đầu tiên (tạo PH + HS mới), A2 thêm con cho PH đã có, A3 thêm môn cho HS cũ. Bước 2 đổi form theo loại; cảnh báo A1→A2 khi email đã tồn tại.
  - `src/lib/validators/enrollment.ts` — một schema, field bắt buộc khác nhau theo `registrationType` qua `superRefine`. **Không dùng `.default("")` trong schema** — nó làm input type optional và lệch kiểu với `zodResolver`.
  - `src/mocks/data/enrollments.ts` — `mockCreateEnrollment` sinh Payment → Enrollment → ActivationLink → email (đúng thứ tự skill). Mã liên kết tất định theo seed, bảng chữ cái bỏ ký tự dễ nhầm. Cứ lần thứ 3 giả lập email lỗi để dựng được biến thể "Gửi thất bại".
  - `features/enrollments/components/enrollment-receipt.tsx` — biên lai dùng chung cho cả 3 luồng (skill yêu cầu 1 component). Chuyển lên `shared/` khi PROMPT 7B cần.
  - Dùng `useWatch({ control })` thay `watch()` — `watch()` bị lint `react-hooks/incompatible-library`.
- **2026-09-18 (PROMPT 6, 7, 7B — Link/mã liên kết, Lịch sử thanh toán, Biên lai)**:
  - Trang `manager/link-codes` và `manager/payments`; biên lai là modal trên trang thanh toán.
  - **`<Receipt />` được nâng lên `src/components/shared/display/receipt.tsx`** (trước ở `features/enrollments/`). Lý do: skill `enrollment-flow` yêu cầu "reuse one `<Receipt />`", và `shared-component-architecture.md` yêu cầu promote khi feature thứ hai cần. `features/enrollments/components/enrollment-receipt.tsx` **đã xóa**; wizard bước 5 giờ render chung `<Receipt />`.
  - Props biên lai dựng bằng `buildReceiptProps(row)` trong `features/payments/selectors.ts` — đặt ở selector chứ không phải component để enrollments dùng lại mà không import component chéo feature. `StepDone` lấy `findPaymentRow(result.paymentId)`, nên wizard và màn thanh toán ra **đúng một tờ biên lai giống nhau**.
  - **`DateRangePicker` mới** ở `src/components/shared/pickers/date-range-picker.tsx` (bọc `ui/calendar` + `ui/popover`), state qua nuqs `?from=&to=`. Dùng ở cả link-codes và payments; tái sử dụng được cho PROMPT 9, 13.
  - `lib/format.ts` thêm `formatMoneyInWords()` — đọc số tiền VND thành chữ cho dòng "Bằng chữ" của biên lai (xử lý đúng "lẻ", "mốt", "lăm").
  - `Payment` thêm field thật `code` (TXN-...), `receiptCode` (BL-...), `method` + type `PaymentMethod`. Đã ghi vào `.claude/rules/data-contracts.md`.
  - `src/mocks/data/payments.ts` viết lại: sinh giao dịch và mã liên kết **tất định** từ `MOCK_ENROLLMENTS` (không random) — mỗi ngày tối đa 6 giao dịch, mã liên kết chia bucket để đủ cả 3 tab chưa dùng / đã dùng / hết hạn. Thêm `MOCK_MANAGERS` (người xác nhận thu) và `PAYMENT_METHOD_LABEL`.
  - Selector `features/payments/selectors.ts` dùng chung cho cả hai màn: `getPaymentRows/getPaymentTotals` và `getLinkCodeRows/getLinkCodeTotals`.
  - Messages mới: `messages/events/link-code.ts`, `messages/events/payment.ts`.
  - Mã liên kết chỉ render `code`, không bao giờ render `token` (rule security).
- **2026-09-18 (PROMPT 8, 8B, 8C, 9, 9B — Lớp học & Lịch học tổng)**:
  - Trang: `manager/classes`, `manager/classes/new`, `manager/classes/[id]`, `manager/schedule` (9B là cùng trang, `?groupBy=room&view=day`).
  - **Đổi mô hình buổi học**: trước đây `attendance.ts` sinh buổi theo ENROLLMENT (sai mô hình — buổi học thuộc về LỚP). Giờ `catalog.ts` sinh `MOCK_CLASS_SESSIONS` theo từng lớp từ lịch cố định, còn `attendance.ts` chỉ sinh bản ghi điểm danh của học sinh trên các buổi lớp đó. `MOCK_SESSIONS_TODAY` giờ derive từ đó thay vì hard-code.
  - **`MOCK_TODAY` đổi từ 2026-09-15 (T3) sang 2026-09-16 (T4)**. Lý do: docs mâu thuẫn — Dashboard nói Toán 8A / Hóa 9B / Lý 7A cùng học Thứ 3, nhưng PROMPT 8C nói Toán 8A học T2-T4-T6. Giữ lịch cố định của 8C, dời "hôm nay" sang T4 để cả 3 lớp cùng có buổi. Hóa 9B đổi lịch sang T2-T4-T6 (docs không pin lịch lớp này). `TODAY` trong `mocks/data/payments.ts` và default của `getPaymentTotals` phải giữ đồng bộ với `MOCK_TODAY`.
  - `getAttendanceBreakdown(studentId, classId?)` — tham số thứ 2 đổi từ `enrollmentId` sang `classId` do buổi học giờ thuộc lớp.
  - Selectors mới: `features/classes/selectors.ts` (sĩ số, tiến độ, trạng thái buổi, học bù đến) và `features/schedule/selectors.ts` (map buổi → `CalendarEvent`, tóm tắt tuần, chi tiết buổi cho drawer).
  - `mocks/data/classes.ts`: `previewSessions()` dùng chung cho card "Xem trước" và lúc tạo lớp thật nên hai bên luôn khớp; `findRoomConflict()` + `findAvailableRooms()` cho cảnh báo trùng phòng ở PROMPT 8B.
  - Validator `src/lib/validators/class.ts` (`classFormSchema`), messages `events/class.ts` + `events/schedule.ts`, `BUSINESS_RULES.CLASS_CAPACITY_MAX = 20`, routes `CLASS_NEW` / `CLASS_DETAIL(id)`.
  - Lịch học tổng dùng lại `shared/calendar/schedule-calendar.tsx` + `session-drawer.tsx`; view/groupBy/session đồng bộ qua nuqs. **Không làm view Tháng** theo đúng ghi chú trong docs.
- **2026-09-18 (PROMPT 11, 11B–11E — Giáo viên, Chi tiết GV, Lời mời & duyệt, Dạy thay, Đổi GV phụ trách)**:
  - Trang: `manager/teachers`, `manager/teachers/[id]`, `manager/teachers/invitations`, `manager/teachers/substitutes`. PROMPT 11E là modal (`ChangeClassTeacherDialog`) gắn vào nút "Đổi giáo viên" đã có sẵn trên `manager/classes/[id]` — trước đó nút này chỉ điều hướng sang trang Dạy thay, giờ mở đúng modal theo docs.
  - **Mở rộng `Teacher`** (`types/catalog.ts`): thêm `email`, `phone`, `code`, `yearsExperience`, `rating`, `joinedAt`, `isHeadTeacher?`, `specialty?`. Thay toàn bộ `MOCK_TEACHERS` (5 → 16 giáo viên, đủ dữ liệu cho danh sách + lọc theo môn + trạng thái `active/inactive`).
  - Type mới `types/teacher.ts`: `TeacherInvitation` (lời mời & duyệt), `SubstituteAssignment` (lịch sử dạy thay). Mock `mocks/data/teachers.ts`: `MOCK_TEACHER_INVITATIONS` (8 hồ sơ), `MOCK_SUBSTITUTES` (4 lượt), cùng `mockInviteTeacher` / `mockApproveInvitation` / `mockRejectInvitation` / `mockAssignSubstitute` / `mockChangeClassTeacher`.
  - Selector `features/teachers/selectors.ts`: tải giảng dạy theo tuần (`CURRENT_WEEK` derive từ `MOCK_TODAY`), `getSubstituteCandidates()` và `getClassTeacherCandidates()` cùng xếp hạng theo cùng-môn + không-trùng-lịch (trùng lịch tính bằng giao khoảng thời gian trên cùng thứ/ngày, không phải so chuỗi).
  - Validator `lib/validators/teacher.ts`: `inviteTeacherSchema`, `assignSubstituteSchema`, `changeClassTeacherSchema`. Route `TEACHER_DETAIL(id)` thêm vào `constants/routes.ts`.
  - Messages `events/teacher.ts` (dài — 4 màn dùng chung 1 file domain theo đúng skill `constants-architecture`).
- **2026-09-23 (PROMPT 10, 10B–10F — Nghỉ học & học bù)**:
  - Trang: `manager/absences/makeup` (10 + 10B cùng route, nhánh empty-state là selector trả về 0 kết quả chứ không phải route riêng), `manager/absences/swap` (10C), `manager/absences/change-class` (10D), `manager/absences/long-leave` (10E), `manager/absences/withdraw` (10F, 3 tab qua nuqs `?tab=`, mặc định "full" khớp trạng thái đang chọn trong docs).
  - Type nghiệp vụ mới `src/types/absence.ts` (không có trong data-contracts gốc, theo đúng tiền lệ `TeacherInvitation`/`SubstituteAssignment`): `MakeupAssignment` (kind `makeup`/`swap`, status khớp `STATUS_MAP.makeup`), `ClassChangeRequest`, `LongLeave`, `WithdrawalRecord`. Mọi hành động vẫn tác động lên entity gốc (`Enrollment.classId/status/endDate`, `AttendanceRecord`, `StudentProfile.status`) thay vì dựng mô hình song song.
  - Mock `src/mocks/data/absences.ts`: **chỉ có 2 lớp dùng chung `programId` (`cls-math-8a`/`cls-math-8c`, cùng `prg-math-8`)** trong toàn bộ catalog hiện có, nên đây là cặp lớp DUY NHẤT luôn có buổi học bù/đổi buổi hợp lệ theo đúng rule "cùng programId + cùng lessonId + chưa diễn ra + còn chỗ" (skill `attendance-rules`) — học sinh mọi lớp khác sẽ luôn rơi vào nhánh PROMPT 10B (empty state), đây là hành vi ĐÚNG theo dữ liệu thật chứ không phải thiếu data. 24 bản ghi `LongLeave` được seed khớp chính xác số đếm 3 tab trong docs (Đang nghỉ 4 / Sắp tới 2 / Đã kết thúc 18) tính theo `MOCK_TODAY`.
  - Selector `src/features/absences/selectors.ts`: sĩ số/chỗ trống buổi học bù, tiến độ lớp (đếm `attendanceMarkedAt`) cho cảnh báo chênh bài ở 10D, buổi bị ảnh hưởng bởi nghỉ dài hạn tính trực tiếp từ lịch cố định (dùng chung cho preview trước khi lưu và cột "Số buổi nghỉ có phép" sau khi lưu) — không lưu field tính được lên entity.
  - Validator `src/lib/validators/absence.ts` (`assignMakeupSchema`, `changeClassFormSchema`, `createLongLeaveSchema`, `withdrawSchema`), messages `messages/events/absence.ts` (`ABSENCE_MSG`, export ở `events/index.ts`). Thêm `STATUS_MAP.longLeave` (active/upcoming/ended) vào `constants/status.ts`, thêm `END_DATE_AFTER_START`/`SESSION_REQUIRED`/`ENROLLMENTS_REQUIRED` vào `VALIDATION_MSG`.
  - **Fix nhỏ ở `features/enrollments/selectors.ts`**: `getStudentOptions()` (picker luồng A3) trước đây lọc bỏ học sinh `status: "withdrawn"`, khiến nút "Đăng ký lại" ở PROMPT 10F không thể chọn lại đúng học sinh đó qua wizard có sẵn — bỏ filter này thay vì viết lại wizard.
  - Component ở `src/features/absences/components/`: `makeup-workflow-view.tsx` dùng chung cho cả PROMPT 10/10B và 10C qua prop `mode`, `pending-makeup-table.tsx` + `change-makeup-session-dialog.tsx` (hành động Đổi ca/Hủy), `change-class-view.tsx`, `long-leave-view.tsx` + `create-long-leave-dialog.tsx`, `withdraw-view.tsx` + `withdraw-subject-tab.tsx`/`withdraw-full-tab.tsx`/`reenroll-tab.tsx`. Không thêm component nào vào `components/shared/` — toàn bộ đặc thù riêng domain này.
  - Dùng lại nguyên trạng (không sửa): `shared/pickers/session-option-list.tsx`, `condition-chips.tsx`, `class-option-card.tsx`, `entity-picker-presets.tsx` (`StudentPicker` — lần đầu thực sự được dùng trong repo), `shared/data-table/*`, `shared/feedback/confirm-dialog.tsx` (kể cả `requireTypedText` cho dialog "Cho nghỉ hẳn").
- **2026-09-23 (PROMPT 12, 12B, 12C — Danh mục đào tạo)**:
  - Trang: `manager/catalog` (4 tab qua nuqs `?tab=`: Môn học, Khối, Chương trình, Phòng học — Chương trình là tab mặc định) và `manager/catalog/programs/[id]` (12B, route mới `ROUTES.MANAGER.CATALOG_PROGRAM_DETAIL`, theo đúng pattern `STUDENT_DETAIL`/`CLASS_DETAIL`/`TEACHER_DETAIL`).
  - **Mở rộng entity đã có thay vì dựng song song** (`types/catalog.ts`): `Program` thêm `description?` và `isActive` (Switch "Đang sử dụng" ở 12C); `Lesson` thêm `description?` ("mô tả ngắn" ở 12B). `Program.totalLessons` **giữ nguyên là field lưu trữ độc lập** (không đổi thành đếm từ danh sách Lesson) — nó điều khiển `buildSessionsForClass()` sinh buổi học ở `catalog.ts`, đổi ngữ nghĩa sẽ vỡ toàn bộ lịch buổi học của lớp đã có. Chương trình mới tạo qua modal (không có field "Số bài học") khởi tạo `totalLessons: 0`.
  - **Entity mới `Room`** (`{ id, name, capacity, isActive }`) — `ClassRecord.room` vẫn giữ nguyên là chuỗi tên phòng (không refactor sang `roomId` để tránh vỡ các màn Lớp học/Lịch học đã có); "Số lớp đang dùng" của phòng derive bằng so khớp `ClassRecord.room === room.name`.
  - Mock mở rộng trong `mocks/data/catalog.ts` (đúng tiền lệ — mock danh mục nằm chung 1 file): thêm `description`/`isActive` cho toàn bộ `MOCK_PROGRAMS` (đúng 1 chương trình `prg-math-9` không gắn lớp nào → đặt `isActive: false` để có dữ liệu cho trạng thái "Ngừng sử dụng"), mở rộng bài học `prg-math-8` (chương trình ví dụ trong docs) thành 10 bài liền mạch order 1–8 + 12–13 để demo kéo-thả có ý nghĩa, thêm `MOCK_ROOMS` (13 phòng, 1 phòng `P.301` không gắn lớp nào + `isActive: false`). Thêm mutation `mockCreateProgram/mockUpdateProgram/mockAddLesson/mockUpdateLesson/mockDeleteLesson/mockReorderLessons/mockUpdateRoom` + `findRoom`.
  - Selector `features/catalog/selectors.ts`: `getProgramRows/findProgramRow` (số lớp đang dùng theo `programId`), `getProgramLessons`, `getRoomRows` (số lớp theo tên phòng), `getSubjectRows`/`getGradeRows`/`getGradeOptions` (khối "đang có chương trình", derive từ `MOCK_PROGRAMS.grade` thay vì hard-code `[6,7,8,9]` như `classes-view.tsx` — an toàn hơn khi thêm chương trình khối mới).
  - Validator `lib/validators/catalog.ts` (`programFormSchema`, `lessonFormSchema`, `roomFormSchema`). Lỗi tên chương trình dùng đúng câu của docs qua `VALIDATION_MSG.PROGRAM_NAME_REQUIRED` ("Vui lòng nhập tên chương trình"), không hardcode trong component. Messages `messages/events/catalog.ts` (`CATALOG_MSG`, export ở `events/index.ts`). Thêm 2 status category mới `program`/`room` vào `constants/status.ts` (theo đúng tiền lệ 1 category/entity dù ngữ nghĩa trùng "Đang sử dụng"/"Ngừng sử dụng").
  - **Component ở `src/features/catalog/components/`**: `catalog-view.tsx` (shell 4 tab) + `subjects-tab.tsx`/`grades-tab.tsx` (bảng tham chiếu tối giản, không có filter/phân trang — đúng theo docs không mô tả CRUD cho 2 tab này) + `programs-tab.tsx` (filter Môn/Khối qua nuqs, `DataTable`/`FilterBar`/`TablePagination` chuẩn) + `rooms-tab.tsx`; `program-form-dialog.tsx` + `lesson-form-dialog.tsx` + `room-form-dialog.tsx` (1 dialog dùng chung create/edit qua prop `mode`, nơi gọi truyền `key` theo id để reset đúng `defaultValues` — không dùng `useEffect` để né lint `react-hooks/set-state-in-effect`); `program-detail-view.tsx` (12B, header dựng tay bằng `PageHeader` + `SubjectTag`/`Badge`/`MoneyText` theo đúng tiền lệ `class-detail-view.tsx`, **không dùng `DetailHeader`** vì component đó gắn avatar cho entity kiểu người, không hợp với chương trình đào tạo); `lesson-list.tsx` (kéo-thả).
  - **Sắp xếp lại bài học dùng HTML5 drag-and-drop gốc** (`draggable`, `onDragStart/onDragOver/onDrop`) — repo chưa cài `@dnd-kit/*` hay thư viện DnD nào, theo đúng rule "không tự thêm thư viện UI mới khi chưa hỏi". State cục bộ `localLessons` đồng bộ với dữ liệu server bằng pattern "điều chỉnh state lúc render" (so `lessons !== prevLessons` rồi `setState` ngay trong thân hàm) thay vì `useEffect`, tránh đúng lỗi `react-hooks/set-state-in-effect` mà `filter-bar.tsx` đã mắc từ trước (xem gotchas). Mutation `useReorderLessons` chạy ngay khi thả, revert lại state cũ nếu lỗi.
  - **Phát hiện lúc làm PROMPT 12B, đã sửa ngay sau đó (xem bullet kế tiếp)**: `shared/feedback/async-boundary.tsx` coi `data === undefined` là rỗng và render `EmptyState` — nếu gọi `<AsyncBoundary>` không truyền `data`/`isEmpty` (như `class-detail-view.tsx`, `teacher-detail-view.tsx` đang làm) thì nhánh `children` không bao giờ hiện được. `program-detail-view.tsx` né lỗi này bằng cách truyền thẳng `isEmpty={false}` và tự xử lý rỗng/not-found trong `children`.
  - Không thêm gì vào `components/shared/` — toàn bộ UI của domain này đặc thù riêng, chưa có feature thứ hai cần dùng lại.
- **2026-09-23 (Fix `async-boundary.tsx` — bug ảnh hưởng 6 màn đã ship)**:
  - Root-cause fix cho bug phát hiện ở PROMPT 12B: `checkEmpty` trong `shared/feedback/async-boundary.tsx` giờ chỉ tính rỗng khi `data` HOẶC `isEmpty` thực sự được truyền (`data !== undefined && (data === null || (Array.isArray(data) && data.length === 0))`) — không còn suy luận "thiếu prop `data`" thành rỗng.
  - **Trước khi sửa, 6 màn sau luôn render `EmptyState` thay vì nội dung thật ngay khi tải xong** (vì đều gọi `<AsyncBoundary>` không truyền `data`/`isEmpty`, tự xử lý not-found/rỗng trong `children`): `dashboard-view.tsx`, `student-detail-view.tsx`, `parent-detail-view.tsx`, `class-detail-view.tsx`, `teacher-detail-view.tsx`, `substitutes-view.tsx`. Không bị `npm run build`/`lint` bắt vì là lỗi logic runtime (prop optional, type vẫn đúng), chỉ lộ ra khi chạy thật trong trình duyệt.
  - Đã kiểm tra toàn bộ 10 nơi dùng `AsyncBoundary` trong repo trước khi sửa: `data-table.tsx` (luôn truyền `data={data}`, một mảng) và `schedule-view.tsx` (truyền thẳng `isEmpty=...`) không bị ảnh hưởng bởi thay đổi. Đã build + lint lại sau khi sửa — sạch, không phát sinh lỗi mới.
  - `program-detail-view.tsx` (PROMPT 12B) vẫn còn giữ workaround `isEmpty={false}` — vô hại, không cần gỡ.
- **2026-09-29 (PROMPT 14, 14B, 15 — Quản lý viên, Lịch sử thay đổi, Tài khoản cá nhân)**:
  - Trang: `manager/system/managers` (14), `manager/system/audit-logs` (14B), `manager/profile` (15, route mới `ROUTES.MANAGER.PROFILE`, không có trong menu — mở từ dropdown avatar, đã wire `user-menu.tsx`'s "Tài khoản"/"Đổi mật khẩu" — trước đó 2 item này không có `onClick`).
  - Entity mới `types/system.ts`: `ManagerAccount` (status khớp `STATUS_MAP.manager` đã có sẵn từ trước) và `SystemAuditLogEntry`/`AuditActionType` (11 loại thao tác, map nhãn+màu ở `constants/audit.ts` theo đúng tinh thần `STATUS_MAP`). Mock `mocks/data/system.ts`: `CURRENT_MANAGER_ID = "mgr-001"` (khớp `MOCK_ACCOUNTS[0]` ở `mocks/data/auth.ts` — chưa có session/auth-context thật nên đây là "quản lý đang đăng nhập" cho toàn bộ giai đoạn mock), 5 `MOCK_MANAGER_ACCOUNTS`, 20 dòng `MOCK_AUDIT_LOG` tất định (tái dùng đúng student/class id đã có trong `students.ts`/`catalog.ts`, không bịa id mới).
  - PROMPT 14B: bảng có dòng mở rộng inline (Lý do/Ngày áp dụng/IP qua `DescriptionList`) — `DataTable` chung không hỗ trợ expand nên `audit-log-table.tsx` dựng trực tiếp từ `ui/table.tsx` (một tầng dưới `DataTable`, vẫn không hand-roll markup thô).
  - Không đụng `Manager`/`MOCK_MANAGERS` (kiểu `{id,name}` tối giản) sẵn có trong `mocks/data/payments.ts` — vẫn dùng riêng cho attribution "người xác nhận/người xếp" ở payments & teachers, không gộp với `ManagerAccount`.
- **2026-09-29 (PROMPT 16, 16B, 16C — Trạng thái chung, Trang lỗi, Hết phiên đăng nhập)**:
  - PROMPT 16 mở rộng thẳng trang showcase có sẵn `dev/components` (không tạo trang riêng) — thêm Toast 4 loại, Alert 4 màu, Empty State 2 biến thể, Error State, thêm biến thể `ConfirmDialog` default, dải Button, dải Input, và sweep đủ `StatusBadge` theo danh sách docs. Tiện tay dọn ~15 import chết còn sót từ trước (Phase 3 Display components import nhưng chưa từng render) và sửa 1 bug có sẵn: badge dùng `status="makeup"` trong khi `STATUS_MAP.attendance` chỉ có key `made_up`.
  - PROMPT 16B: `proxy.ts` đã rewrite sang `/403` từ trước nhưng **route đó chưa từng tồn tại** (role sai sẽ ra 404) — đã thêm `src/app/403/page.tsx`. `ErrorPage` (`shared/feedback/error-page.tsx`) đổi nút 403/404 từ "Về trang chủ"→`/` cứng sang "Về Dashboard" đọc cookie `STORAGE_KEYS.ROLE_COOKIE` qua `useSyncExternalStore` (không dùng `useEffect`+`setState` vì trúng lint `react-hooks/set-state-in-effect`) để về đúng dashboard theo role, fallback `ROUTES.PUBLIC.HOME` — tránh vòng lặp 403 khi role sai điều hướng nhầm sang dashboard của role kia.
  - PROMPT 16C: `SessionExpiredModal` từng dựng xong nhưng **chưa từng được mount ở đâu**, và không có nơi nào gọi `emitSessionExpired()`. Đã sửa nội dung khớp docs (tiêu đề/mô tả, email đọc từ `STORAGE_KEYS.USER_PROFILE`, thêm field mật khẩu) và **tách kiến trúc**: `session-expired-modal.tsx` (ở `shared/feedback/`) giờ là component thuần nhận `onReauth`/`isSubmitting`/`errorMessage` qua props — không tự gọi `useLogin` nữa vì `shared/` không được import `features/` (`.claude/rules/implement-ui.md` — bản đầu do subagent viết có vi phạm này, đã phát hiện và sửa lại). Logic mutation thật nằm ở `features/auth/components/session-expired-modal-container.tsx`, mount từ `app/(manager)/layout.tsx` (không phải từ `AppShell`, cũng là `shared/`). Trang `dev/components` tự mount container riêng (không nằm trong `(manager)/layout.tsx`) kèm nút demo gọi `emitSessionExpired()`.
  - Cả 2 việc (403 page, session-expired mount) là hạ tầng có sẵn nhưng chưa từng hoạt động thật — không phải màn hình mới bịa ra.
- **2026-09-29 (Teacher portal T0–T8 — Dashboard/Lịch dạy/Lớp/Điểm danh/Bài tập/Chấm bài AI/Báo cáo/Tài khoản)**:
  - Toàn bộ cổng thông tin Giáo viên hoàn tất qua 3 batch tuần tự (kế hoạch
    `zesty-watching-possum`): batch 1+2 dựng `(teacher)/layout.tsx`, Dashboard, Lịch dạy,
    Lớp của tôi + Chi tiết lớp, Điểm danh, và domain hoàn toàn mới Bài tập/Đề kiểm tra +
    Chấm bài AI (T5/T5B/T5C/T6/T6B/T6C) — `src/types/assignment.ts`, `src/mocks/data/assignments.ts`,
    `src/features/assignments/`, `src/features/grading/`. Batch 3 (bullet này) làm nốt
    T7 (Báo cáo) + T8 (Tài khoản giáo viên) và dọn placeholder.
  - **PROMPT T7 — Báo cáo** (`(teacher)/teacher/reports`): entity mới `src/types/report.ts`
    (`TeacherReport`) + mock `src/mocks/data/reports.ts` (5 báo cáo tất định trên các lớp
    thật của `tch-001`, `mockCreateTeacherReport` tự đặt tên theo lớp+khoảng ngày qua
    `buildReportName()`, `fileSizeLabel` derive tất định từ số lớp/số học sinh — không
    `Math.random`). Validator `lib/validators/report.ts` (`createReportSchema`, tái dùng
    `VALIDATION_MSG.END_DATE_AFTER_START` cho rule `toDate >= fromDate`). Selector
    `features/reports/selectors.ts` (`getReportRows`, join tên lớp) tái dùng
    `getMyClassOptions()` của `features/assignments/selectors.ts` cho danh sách lớp thay vì
    dựng lại. Màn `features/reports/components/teacher-reports-view.tsx`: form Lớp là
    checkbox-group qua `Controller` (không có multi-select `EntityPicker` sẵn — `EntityPicker`
    chỉ hỗ trợ chọn 1), 2 field ngày Từ/Đến dựng cục bộ bằng `ui/popover` + `ui/calendar`
    (không dùng `shared/pickers/date-range-picker.tsx` vì component đó bind cứng qua nuqs,
    không hợp với state của 1 form), nút "Tạo báo cáo" hiện "Đang tổng hợp..." + `Progress`
    tĩnh khi `isPending`. Bảng lịch sử dùng `DataTable`/`TablePagination` chuẩn +
    `ExportButton` ×2 ("Tải Excel"/"Tải PDF", `onExport` no-op có toast theo đúng
    `.claude/rules/mock-data.md`). **Bỏ qua picker Học sinh (tùy chọn)** — docs ghi rõ "để
    trống = cả lớp" nên không bắt buộc, và `EntityPicker` sẵn có không hỗ trợ multi-select
    nên không ép dùng; field `studentProfileIds` vẫn có trong type/schema cho tương lai.
    Message `constants/messages/events/report.ts` (`REPORT_MSG`), thêm
    `VALIDATION_MSG.CLASSES_REQUIRED`.
  - **PROMPT T8 — Tài khoản giáo viên** (`(teacher)/teacher/profile`, route mới
    `ROUTES.TEACHER.PROFILE`): clone gần như 1:1 `features/system/components/profile-view.tsx`
    của Quản lý → `features/system/components/teacher-profile-view.tsx` (cùng thư mục
    `features/system/` vì cùng là màn "tài khoản đang đăng nhập", không tách feature mới),
    nguồn dữ liệu đổi sang `Teacher`/`CURRENT_TEACHER_ID`/`findTeacher`
    (`mocks/data/catalog.ts`). Thêm field readonly "Môn dạy" (dòng mới, dưới Email) render
    `SubjectTag` cho từng `subjectIds` qua `findSubject()`, kèm hint tương tự
    `EMAIL_DISABLED_HINT`. Mutation `mockUpdateTeacherProfile` thêm vào `catalog.ts` (cạnh
    `MOCK_TEACHERS`/`findTeacher`), mirror hệt `mockUpdateManagerProfile`. **Đổi mật khẩu
    dùng lại nguyên `mockChangeManagerPassword`** (`mocks/data/system.ts`) — hàm này vốn đã
    tra theo email trong `MOCK_ACCOUNTS` bất kể role nên role-agnostic sẵn, `tch-001`
    (`minh.tran@edugrade.vn`) đã có sẵn trong `MOCK_ACCOUNTS` từ PROMPT 1 nên không cần
    thêm tài khoản mới. Selector `getCurrentTeacher()` thêm vào `features/system/selectors.ts`
    (cạnh `getCurrentManager()`). Hook mới `features/system/hooks/use-teacher-profile.ts`.
    Message `TEACHER_PROFILE_MSG` thêm vào `constants/messages/events/teacher-portal.ts`
    (cùng file với `TEACHER_CLASS_MSG`/`TEACHER_ATTENDANCE_MSG`).
  - `header.tsx`: `UserMenu` của giáo viên đổi `accountHref` từ fallback
    `ROUTES.TEACHER.DASHBOARD` sang `ROUTES.TEACHER.PROFILE` — "Tài khoản"/"Đổi mật khẩu"
    trên dropdown avatar giờ mở đúng trang.
  - **Dọn placeholder bắt buộc** (`features/dashboard/teacher-selectors.ts` từng ghi rõ
    "xóa khi domain Bài tập/Chấm bài được xây"): xóa `TEACHER_STATIC_PLACEHOLDERS`,
    `SubmissionPlaceholderStatus`, `SubmissionPlaceholderRow`, `getRecentSubmissionsPlaceholder`.
    Thay bằng số liệu thật: `ungradedSubmissions` đếm `Submission.status === "pending"`,
    `pendingAiReview` lấy thẳng `getGradingQueueCounts().pending_review` của
    `features/grading/selectors.ts` (khớp đúng tab "Chờ duyệt" T6, gồm cả `ai_graded` lẫn
    `ai_grading` — không tính lại khác đi), `assignmentsDueSoon` đếm bài `status: "assigned"`
    có `dueDate` trong `BUSINESS_RULES.ASSIGNMENT_DUE_SOON_HOURS` giờ tới (thêm hằng số này,
    72 giờ — chọn mốc cho ra đúng 2 bài trong bộ mock, khớp tinh thần số liệu cũ). Bảng
    "Bài nộp gần đây" đổi sang `getRecentSubmissions()` (dữ liệu thật, sort theo
    `submittedAt`), `teacher-dashboard-view.tsx` đổi từ Badge dựng tay sang
    `<StatusBadge category="submission" .../>` chuẩn (xóa 3 key
    `SUBMISSION_STATUS_PENDING/AI_GRADED/PUBLISHED` không còn dùng ở
    `TEACHER_DASHBOARD_MSG`). `(teacher)/layout.tsx` đổi `badgeCounts` sang gọi
    `getTeacherPendingCounts()` thật thay vì hằng số tĩnh.
  - Verify cuối batch (đủ cả 3 batch cộng lại): `npx eslint --fix .`, `npm run lint`,
    `npx tsc --noEmit`, `npm run build` đều sạch — chỉ còn đúng 4 warning có sẵn từ trước
    (không liên quan): `session-drawer.tsx`, `section-card.tsx`,
    `entity-picker-presets.tsx`, `entity-picker.tsx`.
- **Current System Status**:
  - **Mock-Only**: The application is currently mock-only (using local state & mock data fixtures). No active backend API client connected yet.
- **Next** — PROMPT 13/13B (Lịch sử email, Gửi thông báo) chưa implement dù route đã có sẵn trong `constants/routes.ts`/`menu.ts`; Domain Features Implementation cho role Giáo viên (T0–T8) đã xong đủ 7 màn theo `docs/ui-screens-teacher.md`.

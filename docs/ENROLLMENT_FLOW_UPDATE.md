# Rà soát và cập nhật nghiệp vụ đăng ký học

Ngày: 03/10/2026. Chỉ sửa FE web. Các thay đổi được liệt kê bên dưới so với trạng thái workspace ngay trước yêu cầu này, không gộp các thay đổi có sẵn từ lượt trước.

## Danh sách đã liệt kê trước khi sửa

| File trong src/ | Dấu vết cũ | Xử lý |
| --- | --- | --- |
| types/auth.ts | Invitation, expiresAt, usedAt cho token kích hoạt | Xóa type Invitation |
| lib/validators/auth.ts | activateAccountSchema, ActivateAccountInput, token, fullName, confirmPassword, hasAcceptedTerms | Xóa schema/form cũ; thêm schema đăng ký phụ huynh email/password |
| mocks/data/auth.ts | MOCK_INVITATIONS, bảng token, mockGetInvitation, mockActivateAccount, addDays | Xóa toàn bộ dữ liệu/hàm kích hoạt |
| features/auth/hooks/use-invitation.ts | Lookup lời mời bằng token | Xóa file |
| features/auth/hooks/use-activate-account.ts | Mutation kích hoạt bằng mock | Xóa file |
| features/auth/components/activate-account-form.tsx | Đọc token, email khóa, mật khẩu và lời mời | Xóa file |
| features/auth/components/index.ts | Export form kích hoạt | Thay bằng form đăng ký thông thường |
| app/(auth)/activate/page.tsx | /activate?token=... | Xóa route; /register không đọc token/query credential |
| constants/routes.ts | AUTH.ACTIVATE | Xóa, thêm AUTH.REGISTER |
| constants/business-rules.ts | ACTIVATION_LINK_EXPIRY_DAYS | Xóa |
| constants/messages/events/auth.ts | Các thông báo ACTIVATE_* | Xóa, thêm nội dung đăng ký phụ huynh |
| features/students/components/students-view.tsx | Hướng dẫn Chờ liên kết, mã QR/link kích hoạt | Thay bằng hướng dẫn phụ huynh tự tạo tài khoản/con |

Không có entity tên ActivationLink hay API Axios thật tạo link trong src/ tại thời điểm rà soát. Module enrollments mock đã dùng hồ sơ con có sẵn. Module registration-flow thật đã tạo Enrollment ngay khi xác nhận thanh toán, nên giữ cơ chế draft/confirm/receipt và khóa idempotency.

Các kết quả tìm kiếm từ khóa được phân biệt để tránh xóa nghiệp vụ khác:

- `types/student.ts`, `mocks/data/parents.ts`, `features/enrollments/selectors.ts`, `features/parents/components/{parents-view,parent-detail-view,parent-account-dialogs}.tsx`, `constants/status.ts`, `constants/messages/events/parent.ts`, `app/dev/components/page.tsx`: trạng thái `activated`/`activatedAt` của tài khoản phụ huynh trong mô hình mock, không phải một link hoặc lời mời đăng ký con; không đổi entity này.
- `types/teacher.ts`, `features/teachers/**`, `mocks/data/teachers.ts`, `lib/validators/teacher.ts`, route teacher invitations: lời mời giáo viên, giữ nguyên.
- `features/system/**`, `mocks/data/system.ts`, `lib/validators/system.ts`, `constants/messages/events/system.ts`, `constants/status.ts`: mời/vô hiệu hóa tài khoản nhân sự, giữ nguyên.
- `types/student.ts`, `mocks/data/payments.ts`: mã QR của phương thức thu tiền cũ, không phải mã kích hoạt con; không sửa.
- Link đặt lại mật khẩu, JWT access/refresh token, mã học sinh/môn và Zod issue `code` không thuộc ActivationLink.

## Hành vi sau sửa

- Phụ huynh dùng `/register` để tự tạo tài khoản bằng email/password; FE gọi `POST /auth/register` thật, không nhận mã mời, không trả token cho browser và không tạo hồ sơ con thay phụ huynh. Phụ huynh tiếp tục trên app.
- Đăng nhập STAFF đi vào `/staff/enrollments/new`. Ô email debounce 400 ms, tìm từ 2 ký tự, chỉ dùng kết quả khớp chuỗi hiện tại. Bắt buộc chọn đúng tài khoản rồi lookup hồ sơ con; không tự chọn tài khoản dựa trên chuỗi đang gõ.
- Chọn con có sẵn → môn/lớp phù hợp khối trong hồ sơ → ngày/gói 1–12 tháng → nhận đủ tiền → xác nhận → Enrollment/biên lai. Không thêm bước xác nhận từ phụ huynh.
- STAFF và manager không dùng chung route đăng ký: manager bị 403 tại `/staff/*` và BFF `/registrations*`; STAFF bị 403 tại `/manager/*`. Menu và các đường dẫn đăng ký liên quan đã cập nhật.
- Các route phụ trợ STAFF cho tra cứu con/phụ huynh, biên lai và tài khoản chỉ dùng lại component có sẵn. Không triển khai thêm nghiệp vụ nghỉ học, giáo viên, giáo trình hoặc dashboard.
- Khối học dùng giá trị trong hồ sơ con của BE; nhân viên không sửa hồ sơ con hoặc cho đăng ký lớp sai khối.

## Phụ thuộc BE còn thiếu

`GET /parents/search?email=<chuỗi>&limit=10` chưa có trong BE hiện tại. FE đã chuẩn bị request và UI gợi ý; contract cần BE bổ sung ở mục 0 của [BE_FIX_REQUESTS.md](BE_FIX_REQUESTS.md). Khi endpoint trả 404/405/501, FE báo rõ chưa hỗ trợ gợi ý. Nhập email đầy đủ sẽ fallback sang lookup hiện có, hiển thị tài khoản thật để chọn. Không sinh gợi ý từ mock.

BE còn cấp MANAGER quyền create/cancel/confirm/read registrations: cần chặn tại BE để client gọi trực tiếp cũng tuân thủ SRS. Web BFF đã chặn quyền này.

BE yêu cầu emailVerifiedAt trước khi phụ huynh tạo con và trước khi đăng ký. FE giữ điều kiện đã có để khớp service; xác minh email tài khoản không phải link kích hoạt Enrollment hoặc bước xác nhận sau thanh toán.

## Đối chiếu toàn bộ validators

| File | Kết quả |
| --- | --- |
| auth.ts | Xóa schema/token kích hoạt; đăng ký mới chỉ email/password, kiểm tra giới hạn bcrypt 72 byte UTF-8 |
| enrollment.ts | Đã có parentAccountId, studentProfileId, subjectId, classId, months; không có field ActivationLink; chỉ sửa comment tra cứu email |
| parent.ts | phone, đúng ParentAccount; không sửa |
| absence.ts | studentProfileId/enrollmentId/ClassSession và thông tin nghỉ/học bù; không có ActivationLink, không sửa |
| assignment.ts | Bài tập/câu hỏi; không liên quan, không sửa |
| catalog.ts | Program/Lesson/Room và các field form; không liên quan ActivationLink, không sửa |
| class.ts | Lớp/lịch/giáo viên và các field form; không có ActivationLink, không sửa |
| grading.ts | Điểm/nhận xét; không liên quan, không sửa |
| report.ts | Class IDs/studentProfileIds/khoảng ngày báo cáo; không liên quan, không sửa |
| system.ts | Mời nhân sự, hồ sơ và đổi mật khẩu nhân sự; không thuộc đăng ký phụ huynh/con, không sửa |
| teacher.ts | Mời/sửa hồ sơ giáo viên, dạy thay; không thuộc đăng ký phụ huynh/con, không sửa |
| work-credit.ts | Công dạy/báo nghỉ giáo viên; không liên quan, không sửa |

Không đổi tên field của DTO registration-flow thực tế (`targetStudentId`, `packageMonths`, `fullName`, `grade`) sang tên mô hình khái niệm vì BE đang dùng đúng những tên đó. Những khác biệt khác của module mock không được mở rộng trong yêu cầu bỏ link.

## File không sửa vì ngoài phạm vi

- `docs/BUSINESS_WORKFLOW.md`, `docs/DATA_CONTRACTS.md` đã mô tả đúng nghiệp vụ mới; giữ nguyên. Chỉ sửa một dòng SRS còn ghi “gắn link” để bảng quyền khớp nội dung chính.
- Các validator không liên quan liệt kê trong bảng trên; `src/components/ui/**`, `src/features/teachers/**`, `src/features/system/**`, `src/features/catalog/**`, các chức năng điểm danh/chấm bài/báo cáo không sửa.
- Màn nghỉ/học bù/lịch cũ chưa chuyển route hoặc nối thêm API; chỉ `reenroll-tab.tsx` được sửa đường dẫn mở đăng ký mới. Chuyển các màn vận hành còn ở `/manager/*` sang staff là công việc riêng ngoài phạm vi này.
- Không sửa source BE hoặc mobile.

## Xác minh

- npm run lint: 0 lỗi; 4 cảnh báo unused import có sẵn ở session-drawer, section-card, entity-picker-presets, entity-picker.
- npm run build: đạt, gồm TypeScript và các route /register, /staff/*; không còn /activate.
- npm run test:registration: 21 test đạt.
- npm run test:registration:http: 1 test HTTP production đạt, gồm self-register, gợi ý email, quyền STAFF/MANAGER, thanh toán lặp, biên lai, refresh và logout.
- Rà soát lại src/: không còn schema/type/hook/route/token của luồng kích hoạt hoặc nội dung gửi link kích hoạt cho con.
- Các test dùng BE fixture, không phải database BE thật; endpoint search trên BE thật còn thiếu. Không thực hiện nghiệm thu giao diện bằng trình duyệt trong yêu cầu này.

## Danh sách file thay đổi trong yêu cầu này

<!-- changed-files -->

Tổng 55 file, tính cả file thêm/xóa và báo cáo này.

| Trạng thái | File |
| --- | --- |
| Sửa | `.claude/rules/architecture.md` |
| Sửa | `.claude/rules/data-contracts.md` |
| Sửa | `.claude/rules/security.md` |
| Sửa | `.claude/skills/enrollment-flow/SKILL.md` |
| Sửa | `docs/api-integration.md` |
| Sửa | `docs/BE_FIX_REQUESTS.md` |
| Thêm | `docs/ENROLLMENT_FLOW_UPDATE.md` |
| Xóa | `src/app/(auth)/activate/page.tsx` |
| Thêm | `src/app/(auth)/register/page.tsx` |
| Xóa | `src/app/(manager)/manager/enrollments/new/page.tsx` |
| Xóa | `src/app/(manager)/manager/payments/page.tsx` |
| Thêm | `src/app/(staff)/layout.tsx` |
| Thêm | `src/app/(staff)/staff/enrollments/new/page.tsx` |
| Thêm | `src/app/(staff)/staff/parents/page.tsx` |
| Thêm | `src/app/(staff)/staff/payments/page.tsx` |
| Thêm | `src/app/(staff)/staff/profile/page.tsx` |
| Thêm | `src/app/(staff)/staff/students/page.tsx` |
| Sửa | `src/app/api/auth/restore/route.ts` |
| Sửa | `src/app/api/backend/[...path]/route.ts` |
| Sửa | `src/components/shared/layout/header/header.tsx` |
| Sửa | `src/constants/business-rules.ts` |
| Sửa | `src/constants/menu.ts` |
| Sửa | `src/constants/messages/events/auth.ts` |
| Sửa | `src/constants/role-access.ts` |
| Sửa | `src/constants/routes.ts` |
| Sửa | `src/features/absences/components/reenroll-tab.tsx` |
| Xóa | `src/features/auth/components/activate-account-form.tsx` |
| Sửa | `src/features/auth/components/index.ts` |
| Sửa | `src/features/auth/components/login-form.tsx` |
| Thêm | `src/features/auth/components/register-parent-form.tsx` |
| Xóa | `src/features/auth/hooks/use-activate-account.ts` |
| Xóa | `src/features/auth/hooks/use-invitation.ts` |
| Thêm | `src/features/auth/hooks/use-register-parent.ts` |
| Sửa | `src/features/dashboard/components/dashboard-view.tsx` |
| Sửa | `src/features/parents/components/parent-detail-view.tsx` |
| Sửa | `src/features/parents/components/parents-view.tsx` |
| Sửa | `src/features/registration-flow/api.ts` |
| Sửa | `src/features/registration-flow/components/dashboard-view.tsx` |
| Thêm | `src/features/registration-flow/components/parent-email-search.tsx` |
| Sửa | `src/features/registration-flow/components/parent-lookup-view.tsx` |
| Sửa | `src/features/registration-flow/components/payments-view.tsx` |
| Sửa | `src/features/registration-flow/components/registration-wizard.tsx` |
| Sửa | `src/features/registration-flow/schemas.ts` |
| Sửa | `src/features/students/components/student-detail-view.tsx` |
| Sửa | `src/features/students/components/students-view.tsx` |
| Sửa | `src/lib/api/client.ts` |
| Sửa | `src/lib/validators/auth.ts` |
| Sửa | `src/lib/validators/enrollment.ts` |
| Sửa | `src/mocks/data/auth.ts` |
| Sửa | `src/proxy.ts` |
| Sửa | `src/types/auth.ts` |
| Sửa | `src/types/backend.ts` |
| Sửa | `SRS.md` |
| Sửa | `tests/registration-flow.test.cjs` |
| Sửa | `tests/registration-http.test.cjs` |

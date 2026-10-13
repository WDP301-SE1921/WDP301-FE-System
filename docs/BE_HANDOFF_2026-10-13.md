# Gửi BE: lỗi và phần còn thiếu sau khi Web nối API của BE `5ec1729`

Ngày cập nhật: **13/10/2026**. Mốc đối chiếu: **BE `5ec1729`** (PR #7), **Web nhánh `dev` sau `99d8645`**.

Tài liệu này tiếp nối [BE_HANDOFF_REMAINING_GAPS.md](BE_HANDOFF_REMAINING_GAPS.md). Các mục dưới đây được xác nhận bằng đọc source BE và chạy thử Web với BE thật (MySQL biệt lập). Web **không sửa BE**; BE tự sửa và trả lại contract. Đã chốt với người dùng ngày 13/10: **không dùng phân quyền con cho Quản lý** (mọi Quản lý có đủ tính năng của role) và **chuyển lớp vẫn bắt buộc cùng học phí**.

**Quy ước:** URL tương đối với `/api/v1`. P0 là sai dữ liệu/quyền hoặc làm hỏng luồng; P1 là hoàn thiện chức năng. Mỗi mục ghi phần Web đang làm tạm (nếu có) để BE biết điều gì sẽ thay đổi khi sửa xong.

## 1. Kết quả kiểm tra BE `5ec1729`

- Typecheck sạch; unit 14/14; e2e academic + curriculum + registration 46/46 (MySQL biệt lập, SMTP tắt).
- Harness UI Web 114 bước cũ vẫn đạt với BE mới: BE mới không làm hỏng luồng Web đang chạy.
- Web đã nối các API mới: phòng, mời/duyệt Giáo viên và Quản lý, danh sách Quản lý, dạy thay, đổi giáo viên từ ngày hiệu lực, xác nhận/mở khóa lịch, chuyên cần lớp, học bù theo `eligible/availableSeats/reasonCodes`, đặt lại/đổi buổi học bù, kết thúc nghỉ sớm, cho học lại, lịch sử email/gửi lại, nhật ký hệ thống, sửa hồ sơ/đổi mật khẩu, quên/đặt lại mật khẩu, nhận lời mời. Chi tiết ở [WEB_EXISTING_API_INTEGRATION.md](WEB_EXISTING_API_INTEGRATION.md).

## 2. Lỗi BE cần sửa

### BE-19 — P0: đổi giáo viên “từ ngày hiệu lực” nhưng lớp đổi giáo viên ngay

**Hiện tại:** `RegistrationFlowService.assignTeacher` cập nhật `ClassSession.teacherId` cho các buổi từ `effectiveAt`, nhưng cũng cập nhật **`Class.teacherId` ngay khi gọi API**.

**Hậu quả:** hẹn đổi từ tháng sau thì ngay hôm nay giáo viên cũ mất quyền xem lớp, bài tập, báo cáo và chuyên cần (các quyền này đi theo `Class.teacherId`), còn giáo viên mới có quyền luôn. Buổi được sinh thêm trước mốc hiệu lực cũng gán nhầm giáo viên mới. Ngoài ra, kiểm tra trùng lịch không loại các buổi của chính lớp, nên chọn lại giáo viên đang dạy một buổi của lớp sẽ báo `TEACHER_SCHEDULE_CONFLICT`.

**Cần BE:** lưu phân công chờ hiệu lực (ví dụ `pendingTeacherId` + `pendingTeacherFrom`, hoặc bảng phân công theo khoảng) và chỉ đổi `Class.teacherId` khi tới mốc (worker hoặc tính theo ngày). Sinh lịch/preview phải gán giáo viên theo thời điểm từng buổi và kiểm tra trùng lịch cho đúng giáo viên đó. Kiểm tra trùng lịch phải loại các buổi đang được chuyển. `GET /classes/:id` trả thêm thông tin phân công đang chờ để Web hiển thị.

**Nghiệm thu:** hẹn đổi T1 → T2 từ ngày X: trước X, T1 vẫn mở được lớp và T2 bị 403; buổi trước X giữ T1, buổi từ X là T2; sau X lớp thuộc T2. Gọi lại với giáo viên hiện tại thì hủy được lịch đổi.

**Web đang làm:** màn đổi giáo viên ghi rõ “Giáo viên phụ trách lớp được cập nhật ngay khi lưu”. Harness UI bước F26 cảnh báo đúng hành vi này.

### BE-20 — P0: kết thúc nghỉ dài hạn sớm có thể xóa trạng thái nghỉ của kỳ nghỉ khác

**Hiện tại:** `EnrollmentWorkflowsService.endLeaveEarly` đặt lại `UNMARKED` cho mọi participant `EXCUSED` có `startsAt >= effectiveDate` mà **không giới hạn ngày cuối** của kỳ nghỉ đang kết thúc. Mốc tính bằng `effectiveDate + T00:00:00Z` (UTC, không phải UTC+7). Gửi chuỗi ngày kèm giờ thì ghép chuỗi thành ngày không hợp lệ. API không chặn ngày trong quá khứ.

**Hậu quả:** một kỳ nghỉ đã duyệt khác nằm sau bị mất trạng thái nghỉ có phép. Buổi trước 07:00 sáng của ngày đi học lại không được mở lại.

**Cần BE:** chỉ nhận `YYYY-MM-DD`; chặn ngày nhỏ hơn hôm nay (UTC+7); chỉ mở lại các buổi `SCHEDULED` có ngày học trong khoảng `[effectiveDate, toDate cũ]` theo giờ địa phương, cùng cách tính với `cancelLeave` (`fromDate − 7h`, `toDate + 17h`).

**Nghiệm thu:** hai kỳ nghỉ của cùng ghi danh; kết thúc sớm kỳ thứ nhất không đổi trạng thái của kỳ thứ hai; ngày quá khứ trả `INVALID_EFFECTIVE_DATE`.

**Web đang làm:** chỉ gửi `YYYY-MM-DD`, chặn ngày quá khứ và chặn ngày ngoài kỳ nghỉ ngay trên form.

### BE-21 — P0: đổi mật khẩu sai mật khẩu hiện tại trả 401

**Hiện tại:** `AuthService.changePassword` ném `AUTH_INVALID_CREDENTIALS` với HTTP **401**.

**Hậu quả:** client hiểu 401 là hết phiên. BFF Web thử refresh rồi xóa cookie, nên người dùng bị đăng xuất chỉ vì gõ sai mật khẩu hiện tại. Mobile sẽ gặp cùng vấn đề.

**Cần BE:** trả **400** với mã riêng, ví dụ `AUTH_CURRENT_PASSWORD_INVALID`.

**Web đang làm:** BFF kiểm tra phiên qua `auth/me` trước, rồi đổi 401 của lệnh này thành 400 `AUTH_CURRENT_PASSWORD_INVALID` mà không xóa phiên. Khi BE sửa, có thể bỏ xử lý này.

### BE-22 — P0: kiểm tra chỗ khi đăng ký vẫn đếm theo lớp gốc, chưa theo chuyển lớp

**Hiện tại:** `assertRegistrationAllowed` và `listClasses` (khi có `startDate`) đếm sĩ số bằng `Enrollment.classId`. `studentTermEnrollments` cũng dùng lớp gốc để kiểm tra trùng lớp và trùng lịch của con.

**Hậu quả:** sau khi chuyển A → B, lớp B có thể nhận vượt sĩ số vì học viên chuyển vào không được đếm, còn lớp A vẫn bị giữ chỗ. Con đã chuyển sang B vẫn bị coi là đang học A khi đăng ký thêm (`DUPLICATE_CLASS_REGISTRATION`, `STUDENT_SCHEDULE_CONFLICT` sai lớp).

**Cần BE:** dùng cùng nguyên tắc placement như `GET /classes/:id` (`effectiveFrom <= t < effectiveTo`, không có placement thì dùng `classId`) cho sĩ số cao nhất trong kỳ, kiểm tra trùng lớp và trùng lịch.

**Nghiệm thu:** lớp sức chứa 1 có một học viên chuyển vào thì `availableSeats = 0` và đăng ký mới trả `CLASS_FULL`; lớp cũ được trả lại chỗ từ ngày chuyển.

### BE-23 — P1: chuyên cần cắt mất ngày cuối, chưa có tổng theo học sinh, khác báo cáo

**Hiện tại:** `attendanceSummary` dùng `new Date(fromDate)` và `new Date(toDate)` với `lte`. Vì vậy `toDate=2026-10-31` chỉ tính đến 07:00 sáng 31/10 giờ Việt Nam, mất buổi tối ngày cuối. Response chỉ có tổng cả lớp và lịch sử. Báo cáo (`ReportsService`) tính riêng: bỏ qua dòng `UNMARKED`, trong khi summary coi `UNMARKED` là vắng. DTO Teacher chưa nhận `studentId`.

**Cần BE:** `YYYY-MM-DD` được hiểu là cả ngày theo UTC+7; thêm `students[]` (counts và `attendancePercent` từng con); summary và report dùng chung một hàm tính; nhận `studentId` cho Teacher.

**Web đang làm:** gửi `fromDate=YYYY-MM-DDT00:00:00.000+07:00` và `toDate=YYYY-MM-DDT23:59:59.999+07:00`, rồi tự cộng theo học sinh từ `effectiveStatus` của BE (không tự đặt công thức). Khi BE có `students[]`, Web chuyển sang dùng trực tiếp.

### BE-24 — P1: phòng học và dữ liệu lớp

- `PATCH /classes/:id` tăng `capacity` mà không gửi `roomId` thì không kiểm tra sức chứa của phòng đang gán (`assertRoom(undefined, …)`), nên lớp có thể lớn hơn phòng.
- `GET /classes/:id` và `GET /classes` không trả quan hệ `room`. Web phải tra tên phòng từ `GET /rooms`.
- `GET /classes` vẫn trả `_count.enrollments` theo lớp gốc. Đề xuất thêm `rosterCount` theo placement tại thời điểm hiện tại, giữ `_count` để tương thích.
- `POST /academic/sessions` (đường cũ) chưa gán và kiểm tra phòng.

### BE-25 — P1: lời mời Giáo viên / Quản lý

- Response của `POST /teacher-invitations`, `/manager-invitations`, `POST /account-invitations/:id/review` và `/revoke` chứa **`tokenHash`**. Chỉ được trả trường công khai; riêng `acceptanceToken` trả một lần khi tạo.
- `acceptInvitation`, `reviewInvitation`, `revokeInvitation` đọc trạng thái **ngoài transaction**: hai lệnh accept đồng thời, hoặc accept và revoke cùng lúc, có thể cùng chạy. Cần cập nhật có điều kiện trạng thái (`updateMany where status = …`) trong transaction.
- Chưa gửi email lời mời và chưa có lệnh gửi lại. Khi gửi email, nên dùng link `${WEB_ORIGIN}/accept-invitation?token=…`; trang này Web đã có.
- `GET …-invitations` chưa kèm `acceptedUser` (tên người đã hoàn tất), nên Web chỉ hiện email.
- Lời mời bị từ chối để lại một User `DISABLED` cùng email, nên không mời lại được (`AUTH_EMAIL_EXISTS`). Cần chốt quy tắc mời lại.

**Web đang làm:** sau khi tạo, hiện link `/accept-invitation?token=…` một lần để Quản lý tự gửi. Web không hiển thị `tokenHash`.

### BE-26 — P1: bỏ phân quyền con của Quản lý (đã chốt 13/10/2026)

**Hiện tại:** `requireManagerPermission` kiểm `MANAGE_MANAGERS` / `MANAGE_ACCOUNTS` ở `/managers` và các API lời mời. Quản lý nhận lời mời được tạo với `permissions: []`, nên sau khi duyệt sẽ bị 403 ở chính các màn đó, trong khi các API quản lý khác chỉ kiểm role.

**Cần BE:** mọi API Quản lý chỉ kiểm role `MANAGER`; bỏ `PATCH /managers/:id/permissions` và DTO tương ứng; khi accept không gán `permissions: []`; `GET /managers` không trả `permissions`. Cột `User.permissions` có thể giữ lại để không cần migration xóa.

**Web đang làm:** không làm màn phân quyền. Màn “Quản lý trung tâm” chỉ có danh sách, mời và thu hồi.

### BE-27 — P1: worker và gửi lại email

- `POST /academic/email-deliveries/:id/retry` khi SMTP lỗi ném lỗi của nodemailer ra ngoài, nên client nhận **500 INTERNAL_ERROR**. Cần mã riêng, ví dụ 502 `EMAIL_DELIVERY_FAILED`, và giữ lần thử đã ghi.
- `processDue` không bắt lỗi truy vấn. Lời gọi `void this.processDue()` trong `setInterval` có thể gây unhandled rejection và làm dừng process Node khi DB chập chờn.
- Job kẹt ở `PROCESSING` (process chết giữa lúc gửi) không bao giờ được thu hồi. Cần cơ chế lease hoặc timeout.
- Worker lọc cứng `attemptCount < 5`, không theo `maxAttempts` của từng bản ghi.

**Web đang làm:** khi gửi lại trả 5xx, Web hiện “Gửi lại không thành công. Xem lỗi gần nhất…” và tải lại danh sách.

### BE-28 — P1: quên / đặt lại mật khẩu

- `resetPassword` kiểm `usedAt` ngoài transaction, rồi cập nhật không có điều kiện, nên hai request đồng thời đều dùng được một token. Cần tiêu token có điều kiện (`usedAt = null`, còn hạn) trong transaction.
- Đặt lại thành công chưa vô hiệu các token reset khác của user và chưa ghi audit `PASSWORD_RESET`. `changePassword` cũng chưa vô hiệu token reset còn hạn.
- Email chỉ chứa mã. Đề xuất gửi link `${WEB_ORIGIN}/reset-password?token=…` (trang này Web đã có; trang cũng cho dán mã thủ công).
- Gửi email xác minh và reset vẫn gửi trực tiếp, không qua outbox, nên không có retry.

## 3. Nghiệp vụ SRS còn thiếu ở BE

| Mã | SRS | Còn thiếu |
| --- | --- | --- |
| S1 | §3.6, §3.7, §3.8, §3.11, §4.7, §5.9 #32, §6.3–6.8 | Mới chỉ email **xác nhận thanh toán** đi qua outbox. Chưa có email điểm danh, nghỉ một buổi/nghỉ dài hạn, học bù, đổi lớp, nghỉ môn/nghỉ hẳn, lời mời. Email thanh toán thiếu **môn và lịch học** và đang viết tiếng Anh. Thông báo/nhắc học phí gửi trực tiếp, không lưu lịch sử gửi. |
| S2 | §3.1 | Mời/duyệt Giáo viên chưa gửi email (BE-25). `POST /teachers` tạo trực tiếp vẫn bỏ qua bước duyệt; cần chốt có giữ đường này không. |
| S3 | §3.4, §9 | Tính công Giáo viên từ điểm danh: chưa có đặc tả, giữ nguyên chưa làm. |

Đã đúng theo SRS (không cần đổi): tài khoản Phụ huynh/hồ sơ con (§5.2–5.3), công thức chuyên cần (§5.5), quy tắc học bù (§5.6), nghỉ dài hạn tự `EXCUSED` (§5.8), cho học lại dùng hồ sơ cũ (§5.9 #33), thanh toán chặn trùng (§5.10), AI chỉ đề xuất (§5.12), báo cáo (§5.13), lịch sử thay đổi (§5.14), ma trận quyền theo role (§8).

## 4. Thứ tự đề xuất

1. BE-19 → BE-22 (sai quyền và dữ liệu).
2. BE-23 → BE-28.
3. S1 (email nghiệp vụ qua outbox), sau đó S2.

Mỗi mục bàn giao kèm method/path, response và mã lỗi mới, migration nếu có, test e2e cho đúng tình huống nghiệm thu, và cập nhật `ACADEMIC_API_FLOW.md` / Swagger. Web sẽ bỏ các xử lý tạm ghi ở từng mục khi BE trả contract mới.

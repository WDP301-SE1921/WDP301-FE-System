# Yêu cầu API cho BE từ FE web và FEM mobile

**Ngày đối chiếu: 07/10/2026.** Tài liệu gửi nhóm BE để thống nhất contract và chia việc triển khai.

Đọc cùng [đề xuất UI và luồng đào tạo](UI_ACADEMIC_FLOW_PROPOSAL.md) và [danh sách route BE hiện có](BACKEND_API_EXISTING_ROUTES.md).

## 1. Phạm vi và cách đọc

Đã rà soát route màn hình, API client, hook/selectors, types/validators và các luồng thao tác ở hai repo client; đối chiếu controller, DTO, service nghiệp vụ, tích hợp storage/AI và Prisma ở repo BE. Đây là **đối chiếu tĩnh từ source**, chưa gọi thử API trên môi trường chạy thật và chưa xác nhận migration/config đã được deploy.

| Repo              | HEAD tại lúc đọc | Lưu ý                                                                                                                         |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WDP301-FE-System  | 80233b1          | Có thay đổi chưa commit, gồm directory-list-view, BFF, registration và calendar; đã tính các thay đổi đang có trong workspace |
| WDP301-FEM-System | 106d397          | wired-routes là cơ sở xác định request ra BE thật; README còn mô tả một số phần theo trạng thái cũ                            |
| WDP301-BE-System  | 85caeeb          | directory controller/service có thay đổi chưa commit; route tìm thấy trong workspace có thể chưa có ở môi trường BE đang dùng |

Không dùng các ghi chú “BE chưa có” trong tài liệu cũ làm kết luận nếu controller/service hiện đã triển khai. Bản này là mốc đối chiếu mới, không xóa lịch sử trong BE_FIX_REQUESTS.md của hai repo.

### Ký hiệu

- **Đã nối:** client đang gọi route thật trong source, chưa đồng nghĩa đã nghiệm thu môi trường deploy.
- **Có / chưa nối:** đã có route và nghiệp vụ BE; phần tích hợp còn nằm ở FE/FEM.
- **Bổ sung:** mở rộng DTO/response/hành vi của route có sẵn.
- **Mới:** chưa thấy route tương ứng trong các controller BE đã đọc; tên URL là đề xuất.
- **Chốt:** có khác biệt SRS/UI/BE hoặc chức năng tùy chọn cần thống nhất phạm vi.

**P0:** chặn tính đúng của luồng liên nền tảng hoặc quyết định mô hình trước khi sửa UI. **P1:** hoàn thiện các tính năng trong phạm vi hiện tại/đề xuất UI. **P2:** tiện ích, trường phụ hoặc mở rộng cần chốt; không mặc định buộc BE xây tất cả.

Trong các bảng, URL được viết tương đối với **/api/v1**. M=MANAGER, D=CURRICULUM_DESIGNER, S=STAFF, T=TEACHER, P=PARENT. “Quyền đích” là yêu cầu đề xuất; phần hiện trạng nêu quyền hiện đang có khi khác biệt đáng chú ý.

## 2. Kết luận chính để BE lên backlog

1. **Đã có và nên tái sử dụng:** auth, hồ sơ con, parent search/lookup, programs/classes/lịch tuần, đăng ký/bill/thu tiền/biên lai, directory, dashboard, curriculum-units/sinh lịch, roster/điểm danh, nghỉ/học bù/chuyển lớp, bài tập/chấm/AI, báo cáo và file bài nộp.
2. **Luồng đào tạo mới cần thêm:** danh mục môn thật, CSV preview/commit, AI gợi ý giáo trình, xóa/sắp lại bài nháp, tra cứu học phần áp dụng cho lớp và quy tắc áp dụng giáo trình giữa các khóa.
3. **Mobile cần dữ liệu học tập đầy đủ:** điểm danh và tỷ lệ đi học, lịch theo từng con gồm học bù/lịch sử, chi tiết buổi, bài tập theo con, lịch sử điểm và lộ trình bài chưa xếp lịch.
4. **Web giáo viên cần tích hợp nhiều API đã có**; các phần thực sự thiếu gồm hàng đợi chấm/chi tiết bài nộp, điểm danh nháp/sửa sau chốt nếu giữ UI đó, báo nghỉ/dạy thay, tính công và thông tin hồ sơ giáo viên.
5. **Có việc phía FE:** mở BFF theo từng method/role, bỏ mock/CURRENT_TEACHER_ID, đưa nghỉ/học bù về route STAFF, nối dashboard/directory/payments list đã có và nối upload ảnh trên mobile.

## 3. Hiện trạng theo vai trò

| Vai trò          | FE/FEM đang nối thật                                                                                                             | Còn mock hoặc chưa đủ                                                                                                                                 | Phần đã có bên BE để nối tiếp                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quản lý web      | Login/profile đọc, danh sách phụ huynh/con, tạo/chọn Program, Class/lịch tuần, duyệt học phần, preview/generate và đọc buổi học  | Danh sách/chi tiết giáo viên, nhân viên, dạy thay, tính công; dashboard hiện chủ yếu đếm lớp; các bộ lọc/chi tiết nâng cao                            | Directory staff/teachers/parents, dashboard, list payments/registrations, sửa/xóa Program và chi tiết Class                                        |
| Designer web     | Tạo/sửa học phần, bài thường, kiểm tra tháng, revision, đọc học phần                                                             | CSV, AI gợi ý, xóa/sắp bài, trạng thái sẵn sàng áp dụng                                                                                               | Feedback giáo trình đã có API nhưng chưa có luồng tích hợp tương ứng trong UI hiện tại                                                             |
| Nhân viên web    | Email search/lookup, chọn con/lớp theo kỳ, draft/bill/cancel/confirm/receipt, directory parents/students, đọc lớp và buổi        | Nghỉ/học bù/chuyển lớp còn mock; bảng payments dùng lịch sử ID trên thiết bị, chưa đọc toàn bộ backend                                                | Leaves, makeup-sources/candidates/bookings, transfer/end, students enrollment/schedule, list registrations/payments                                |
| Giáo viên web    | Login                                                                                                                            | Dashboard, lớp, calendar, attendance, assignment, grading, report, profile và work-credit chủ yếu mock                                                | Classes/enrollments/scheduled-sessions, roster/finalize, assignments, submissions, grade/AI/job/approve/publish, reports/download, lesson feedback |
| Phụ huynh mobile | 20 method/path trong wired-routes: auth, con, ghi danh/bill/receipt, buổi học, leaves, assignments/detail/submissions và nộp bài | Dashboard/attendance/unread-count dùng mock; notification screen là placeholder; ảnh bài nộp chưa tích hợp; dữ liệu giáo viên/phòng/tiến độ còn thiếu | Files upload/download, makeups, announcements có route nhưng chưa wire; phần thông báo trong app cần chốt riêng                                    |

Nguồn FE: src/app, src/features/*/hooks, src/features/registration-flow, src/features/curriculum. Nguồn FEM: src/api/wired-routes.ts, endpoints.ts, src/features/parent-dashboard/api và types.ts.

## 4. Contract chung

### 4.1 Response, phân trang và dữ liệu

Giữ envelope hiện có:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "requestId": "request-id",
    "details": { "field": "programId" }
  }
}
```

- Danh sách có phân trang dùng items/page/limit/total; page từ 1, limit tối đa 100 như DTO hiện có. Sắp xếp ổn định, có tiêu chí phụ theo id khi giá trị chính bằng nhau.
- Academic hiện trả mảng; programs/classes cũng trả mảng; curriculum-units chưa phân trang. Directory/registrations/payments/me-bills có items/page/limit/total. **Không đổi các response này âm thầm:** báo client, cập nhật type/loader và nghiệm thu cùng đợt.
- Tiền đề xuất thống nhất Decimal string + currency=VND. Hiện bill có chuỗi thập phân, receipt có number; FE/FEM cần được thông báo nếu chuẩn hóa.
- Ngày chỉ lịch: YYYY-MM-DD; giờ tuần: HH:mm; weekday ISO 1=Thứ Hai, 7=Chủ nhật. Instant: ISO UTC. Ngày học dùng múi giờ trung tâm Asia/Ho_Chi_Minh (+07:00).
- Kỳ ghi danh [startDate,endDate); filter từ/đến ngày của calendar và khoảng học phần là ngày inclusive. Placement [effectiveFrom,effectiveTo). Ghi rõ từng loại thay vì áp một quy tắc cho tất cả.
- Trả DTO ổn định, không trả mọi cột Prisma. Field không có dữ liệu trả null; summary/tổng số lấy trên toàn bộ filter, không chỉ trang đang xem.
- Các field/path nêu là “mới/bổ sung/đề xuất” trong tài liệu này **chưa được client bảo đảm hỗ trợ**. API hiện có giữ tên thật như fullName, displayName, dueAt, maxScore.

### 4.2 Retry và cập nhật đồng thời

- Tiếp tục Idempotency-Key hiện có cho draft, confirm-payment và session-generations; bind actor/scope/body, replay cùng kết quả, đổi body báo conflict.
- CSV commit, reschedule học bù, bulk duyệt nếu triển khai cần bảo vệ request lặp và ghi transaction; timeout không được tạo trùng hoặc để trạng thái nửa chừng.
- Edit/reorder/import curriculum đề xuất có expectedRevision hoặc If-Match. Đây là revision chỉnh sửa nháp, phân biệt với version của bản giáo trình đã duyệt; BE chốt cách biểu diễn.
- Preview phải kiểm tra lại ở bước ghi. Đổi lớp/lịch/giáo viên/nội dung sau preview thì preview cũ hết hiệu lực; không chỉ dựa vào việc FE đã bấm xem trước.

### 4.3 Identity và quyền

- Actor lấy từ JWT, không nhận designerId/teacherId/confirmedBy cho mục đích giả làm actor khác. teacherId để phân công là field nghiệp vụ, tách với người thực hiện.
- P chỉ đọc/ghi dữ liệu hồ sơ con thuộc tài khoản; T giới hạn lớp/buổi/bài được phân công, gồm buổi dạy thay khi chức năng đó được triển khai.
- M không thực hiện đăng ký/thu tiền; S không soạn giáo trình, không tạo lớp hoặc phân công giáo viên.
- FE có role admin, BE UserRole không có ADMIN. Chưa yêu cầu thêm role mới; chốt phạm vi quản trị thay vì gửi admin vào API hiện có.

## 5. API chung: đăng nhập và tài khoản

| ID      | Ưu tiên | API                                                      | Quyền đích                                  | Hiện trạng / yêu cầu                                                                                                                      |
| ------- | ------- | -------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | P0      | POST /auth/login, /refresh, /logout; GET /auth/me        | Theo phiên hợp lệ                           | Có; FE/FEM đã nối. Giữ access/refresh rotation và user an toàn, status, role, emailVerifiedAt                                             |
| AUTH-02 | P0      | POST /auth/register, /verify-email, /resend-verification | P đăng ký; verify/resend theo contract auth | Có, FEM đã nối. SMTP phải cấu hình để tài khoản tự đăng ký tạo được con. Không thêm link claim ghi danh                                   |
| AUTH-03 | P1      | POST /auth/forgot-password; POST /auth/reset-password    | Public, theo token reset                    | Mới. forgot nhận email, response không tiết lộ tài khoản; reset nhận token + newPassword, token có hạn/dùng một lần                       |
| AUTH-04 | P1      | POST /auth/change-password                               | M/D/S/T/P chính chủ                         | Mới. currentPassword + newPassword; chốt thu hồi phiên còn lại. Web teacher/designer có UI mock; M/S profile hiện chỉ đọc                 |
| AUTH-05 | P1      | PATCH /auth/me                                           | M/D/S/T/P chính chủ                         | Mới. displayName, phone theo profile được phép; không tự đổi role/status. Mobile hiện chưa có form sửa parent profile, là nhu cầu mở rộng |

Email đăng nhập/đổi email cần quy trình xác minh riêng nếu bổ sung sau này; không nhét vào PATCH profile hiện đề xuất.

## 6. API danh mục, giáo trình và luồng tạo lớp

### 6.1 Danh mục và khóa học

| ID     | Ưu tiên | API                                                          | Quyền đích                        | Hiện trạng / dữ liệu cần có                                                                                                                                              |
| ------ | ------- | ------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CAT-01 | P1      | GET/POST /subjects; PATCH /subjects/:id                      | M ghi; M/D/S/T đọc theo nhu cầu   | Mới. id/code/name/isActive; list search/isActive + count khóa/lớp nếu UI dùng. BE chưa có model Subject; migrate subject string và giữ response subject cho client cũ    |
| CAT-02 | P1      | GET/POST /programs; PATCH/DELETE /programs/:id               | M ghi; M/D/S/T đọc                | Đã có tất cả method nêu. FE mới nối GET/POST; PATCH/DELETE chưa được BFF allow. Không yêu cầu BE tạo lại. Bổ sung filter search/subjectId/grade/isActive nếu UI mới dùng |
| CAT-03 | P1      | GET /programs/:id                                            | M/D/S/T theo phạm vi              | Mới. name/subject/grade, mô tả/bộ sách nếu chốt, số học phần/bài/lớp; link/tab giáo trình và lớp dùng programId                                                          |
| CAT-04 | P2      | PATCH /programs/:id với description/textbook/isActive        | M                                 | Bổ sung, DTO hiện chỉ name/subject/grade. Ưu tiên archive khóa đã có dữ liệu; tổng bài tính từ nội dung, học phí tiếp tục ở Class                                        |
| CAT-05 | P1      | GET/POST /rooms; PATCH /rooms/:id; roomId trên Class/Session | M ghi; role có lịch đọc tên phòng | Mới. FE có màn phòng mock, SRS có chọn phòng nhưng schema chưa có Room. Khi triển khai kiểm tra sức chứa, trùng phòng, room cho buổi dạy thay/học bù                     |

Không cần CRUD Grade nếu chỉ dùng 6–9. Chưa có POST /parents cho quản lý: phụ huynh tự tạo tài khoản, manager chỉ quản lý contact/status.

### 6.2 Thiết kế giáo trình

| ID     | Ưu tiên | API                                                                                                  | Quyền đích                                                 | Hiện trạng / dữ liệu cần có                                                                                                                                                                                                                                                                    |
| ------ | ------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CUR-01 | P0      | GET/POST /academic/curriculum-units; GET/PATCH /academic/curriculum-units/:id                        | D soạn nháp của mình; M đọc; T đọc APPROVED được phân công | Có, FE đã nối. Bổ sung search/status/pagination, program name và số bài thường/kiểm tra; date tối đa 366 ngày giữ theo contract                                                                                                                                                                |
| CUR-02 | P0      | Filter programId; kiểm tra tương thích unit và Class                                                 | M/D/T theo use case                                        | Bổ sung/chốt. Hiện list và generate dùng track môn+khối; đề xuất đúng programId mặc định, hoặc quan hệ khóa–giáo trình được khai báo. Unique hiện theo track/date/version cũng cần đối chiếu để hai khóa cùng track có học phần độc lập                                                        |
| CUR-03 | P0      | POST /academic/curriculum-units/:id/approve; đề xuất POST /academic/curriculum-units/:id/validation  | M duyệt; D/M xem validation                                | Approve đã có nhưng bắt buộc tồn tại lớp cùng track có lịch tuần, lỗi NO_SCHEDULED_CLASS. Đề xuất validation trả lỗi theo nội dung/coverage; duyệt nội dung độc lập lớp, preview/generate kiểm tra đủ bài cho lớp cụ thể. Nếu giữ ràng buộc cũ, UI phải hướng dẫn tạo lớp/lịch trước khi duyệt |
| CUR-04 | P1      | POST .../:id/lessons; PATCH .../:id/lessons/:lessonId; POST .../:id/monthly-tests                    | D, nháp thuộc mình                                         | Có, FE đã nối. Giữ title/content/sequence và monthKey; monthly-tests hiện là upsert theo tháng                                                                                                                                                                                                 |
| CUR-05 | P1      | DELETE /academic/curriculum-units/:id/lessons/:lessonId; PUT .../:id/lesson-order                    | D, nháp thuộc mình                                         | Mới. Delete/reorder transaction; list orderedLessonIds phải đầy đủ, không trùng; cập nhật sequence liên tục. Dùng delete cho bài kiểm tra nếu cùng model Lesson, có validation monthKey tương ứng                                                                                              |
| CUR-06 | P1      | POST /academic/curriculum-units/:id/revisions                                                        | D, chủ sở hữu                                              | Có, FE đã nối. Bản APPROVED giữ nguyên; version mới sao chép nội dung. Bổ sung lịch sử version/nguồn revision khi UI cần                                                                                                                                                                       |
| CUR-07 | P1      | POST /academic/curriculum-units/:id/import-preview; POST .../:id/import-commit                       | D, nháp thuộc mình                                         | Mới. CSV mapping/errors/preview, append hoặc replace có lựa chọn rõ; giới hạn đề xuất 5 MiB/1.000 dòng; commit atomic + idempotency + kiểm tra revision. Xem contract C2                                                                                                                       |
| CUR-08 | P1      | POST /academic/curriculum-units/:id/suggestion-jobs; GET /academic/curriculum-suggestion-jobs/:jobId | D, chủ sở hữu                                              | Mới. Async AI gợi ý bài từ nguồn/mục tiêu/bộ sách, status/result/error. Kết quả chưa lưu bài/chưa duyệt; áp dụng qua batch save/import-commit sau khi xem lại. Xem C3                                                                                                                          |
| CUR-09 | P1      | POST /academic/lessons/:id/feedback; GET /academic/feedback; POST /academic/feedback/:id/resolve     | T góp ý; D xử lý của mình; M đọc/xử lý theo quyền          | Đã có, FE chưa nối. Bổ sung filter unit/program/status/teacher và tên bài/lớp để UI không nhập ID. Chốt resolve với unit revision mới vì route hiện kiểm tra lesson.basedOnId                                                                                                                  |

Nếu danh sách chỉ 20 bản và trường lọc thay đổi, không bắt FE tải hết nội dung mọi học phần để đếm/lọc. AI cho giáo trình là nghiệp vụ mới, dù BE đã có AcademicAiService cho chấm bài/báo cáo.

### 6.3 Lớp, lịch tuần và buổi học

| ID     | Ưu tiên | API                                                                                                        | Quyền đích                                             | Hiện trạng / dữ liệu cần có                                                                                                                                                                                                        |
| ------ | ------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLS-01 | P0      | GET/POST /classes; GET/PATCH /classes/:id; POST /classes/:id/schedules                                     | M cấu hình; S đọc; T đọc lớp được phân công            | Có, FE M/S đã nối. Bổ sung list filter programId/grade/search/isOpen theo UI; currentProgram, teacher {id,displayName}, lịch tuần, roster theo thời điểm. PATCH hiện không đổi programId                                           |
| CLS-02 | P1      | Chi tiết Class.enrollments                                                                                 | M/S/T theo quyền lớp                                   | Bổ sung. getClass hiện tìm enrollment.classId, chưa dùng placement có hiệu lực; sau chuyển lớp dễ còn con ở lớp cũ/thiếu con lớp mới. Nhận atDate/status/search, trả currentClassId và total theo filter                           |
| CLS-03 | P1      | GET /teachers?search&status&page&limit                                                                     | M chọn phân công; S đọc                                | Đã có trong directory, UI giáo viên còn mock, BFF chưa allow. Response tối thiểu id/displayName/email/status. Chuyên môn và khả dụng theo thời gian là bổ sung, xem MGR-02/04                                                      |
| CLS-04 | P1      | GET /academic/classes/:id/curriculum-bindings; POST/PATCH binding nếu cần lưu lựa chọn trước khi sinh lịch | M ghi; M/T đọc; S đọc tóm tắt                          | Mới nếu cần persist lựa chọn. Có thể dựng lịch sử đã áp dụng từ ScheduleGeneration để giảm API; cần unitId/version/fromDate/toDate/generationId. Không yêu cầu binding mới nếu lựa chọn chỉ tồn tại trong một lần preview/generate |
| CLS-05 | P0      | POST /academic/classes/:id/session-preview; POST .../:id/session-generations                               | M                                                      | Có, FE đã nối. Giữ unitId/range, conflicts, key; bổ sung summary số buổi thường/kiểm tra, thiếu bài/tháng cụ thể và kiểm tra lớp–khóa–unit. Chia khoảng sinh lịch không quay lại bài 1                                             |
| CLS-06 | P0      | GET /academic/scheduled-sessions                                                                           | M/S/T; P trong phạm vi con                             | Có, FE M/S và FEM đã nối; T web còn mock. Bổ sung studentId, programId/status nếu cần, teacher displayName, lesson.sequence, tên khóa, participant/enrollment context, lịch bù và lịch sử; xem MOB-03/C4                           |
| CLS-07 | P1      | GET /academic/scheduled-sessions/:id?studentId=...                                                         | M/S/T theo quyền; P có con tham gia                    | Mới. Trả chi tiết buổi, lesson/summary, giáo viên/phòng, attendance context; P chỉ thấy thông tin con đang chọn. Không cần gửi startsAt để dò lại cả ngày như FEM hiện tại                                                         |
| CLS-08 | P1      | POST /academic/sessions/:id/cancel                                                                         | M                                                      | Mới. reason, kết quả buổi bị hủy + các con cần học bù; giữ lịch sử và thông báo. Schema có CANCELLED nhưng chưa có route hủy buổi. Chốt tạo lại giờ trùng buổi CANCELLED vì unique(classId,startsAt) vẫn tồn tại                   |
| CLS-09 | P2      | PUT /classes/:id/schedule-confirmation                                                                     | T xác nhận lớp được phân công, nếu giữ “set cứng lịch” | Chốt, chưa có. SRS diễn giải chức năng này chưa thống nhất; không cấp teacher quyền tự sửa lịch tuần toàn lớp bằng API manager                                                                                                     |

Đường chính đề xuất: /programs, /classes cho metadata và lịch tuần; /academic/curriculum-units và scheduled-sessions cho nội dung/buổi. BE còn /academic/programs, /academic/classes, /academic/lessons, /academic/sessions: ghi rõ route tương thích; không xây dữ liệu song song.

## 7. API quản lý trung tâm

| ID     | Ưu tiên | API                                                                                                          | Hiện trạng / yêu cầu                                                                                                                                                                                                                                         |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MGR-01 | P1      | GET/POST /staff, GET/PATCH /staff/:id; GET/POST /teachers, GET/PATCH /teachers/:id                           | Có trong directory. MANAGER quản lý, STAFF được đọc teacher. FE còn mock/BFF chưa mở. API hiện tạo email/displayName/password, sửa displayName/status; disable thay hard delete                                                                              |
| MGR-02 | P1      | Bổ sung teacher profile và detail                                                                            | Chưa có teacher phone/subjectIds/grades/specialty/experience trong schema/API directory. UI đang hiển thị nhiều field mock, có rating/head-teacher. Các trường chuyên môn cần cho phân công là P1; rating/đánh giá/head-teacher là P2 cần chốt nguồn dữ liệu |
| MGR-03 | P2      | Lời mời nhân sự/giáo viên                                                                                    | Chốt. UI mock có invite/review/resend, BE đang tạo tài khoản trực tiếp với password, chưa có invitation API. Có thể đổi UI để khớp direct-create; chỉ thêm invitations/accept/resend/review khi nhóm giữ quy trình mời                                       |
| MGR-04 | P1      | GET /academic/teacher-absences; GET /academic/sessions/:id/substitute-candidates; POST .../:id/substitutions | M xử lý; T chỉ báo nghỉ của mình                                                                                                                                                                                                                             | Mới. Danh sách nghỉ, ứng viên ACTIVE đúng chuyên môn/không trùng lịch, phân công teacherId/reason; lưu giáo viên gốc, người dạy thực tế và lịch sử. Xem C7                                                               |
| MGR-05 | P1      | Command đổi giáo viên lớp theo effectiveAt                                                                   | PATCH /classes/:id có teacherId nhưng chưa có lịch sử/chính sách cập nhật các buổi đã sinh. Đề xuất POST /classes/:id/teacher-assignments với teacherId/effectiveAt/reason; không thay giáo viên trên buổi quá khứ                                           |
| MGR-06 | P1      | GET /teachers/:id/work-credits?month=YYYY-MM; POST /academic/sessions/:id/work-credit-adjustments            | M xem/điều chỉnh; T đọc công mình                                                                                                                                                                                                                            | Mới. Tính từ người thực dạy/chốt attendance/điều chỉnh, tránh tính cả giáo viên chính và dạy thay. Schema chưa có attendanceMarkedBy/adjustment/substitution như mock FE. Không mở rộng sang lương/đơn giá khi chưa chốt |
| MGR-07 | P1      | GET /dashboard?fromDate&toDate                                                                               | Có, MANAGER-only; FE dashboard chưa gọi. Trả revenue và counts/registration status hiện có. Chuỗi doanh thu theo ngày/tháng, chuyên cần, pending tasks là bổ sung nếu giữ dashboard cũ                                                                       |
| MGR-08 | P1      | GET /parents, GET/PATCH /parents/:id; GET /students, GET /students/:id/enrollments, /schedule                | Có. M/S đọc danh sách/con, M sửa parent contact/status; FE danh sách đã nối, chi tiết/patch còn chưa đủ. GET /students/:id tổng quan hồ sơ là mới nếu không dùng list/enrollment composition                                                                 |
| MGR-09 | P1      | GET /audit-logs?actorId&action&entityType&entityId&fromDate&toDate&page&limit                                | Mới route đọc; AuditLog đã có schema và một số hành động đã ghi. Bổ sung audit đổi GV/dạy thay/học bù/transfer/leave/AI review/attendance correction. FE audit screen chỉ admin được vào hiện tại: chốt cho manager xem nếu là yêu cầu quản lý               |

Tạo tài khoản designer: seed.ts hiện đã hỗ trợ đủ 5 role. API directory chỉ tạo STAFF/TEACHER, chưa có create CURRICULUM_DESIGNER/MANAGER. Không cần API public tự đăng ký role nhân sự; nếu cần UI quản trị các role này thì bổ sung quy trình và quyền riêng, không mặc định manager được tạo mọi role.

## 8. API nhân viên

| ID     | Ưu tiên | API                                                                                                              | Hiện trạng / dữ liệu cần có                                                                                                                                                                                                                                                    |
| ------ | ------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| STF-01 | P0      | GET /parents/search?email&limit; GET /parents/lookup?email                                                       | Có, FE đã nối. Search chỉ STAFF, tối thiểu 2 ký tự; lookup STAFF/MANAGER, trả con ACTIVE và emailVerifiedAt. Không yêu cầu viết lại search                                                                                                                                     |
| STF-02 | P0      | GET /classes?studentId&startDate&packageMonths                                                                   | Có, FE đã nối. grade từ hồ sơ con, availableSeats/isEligible/ineligibleReason đã triển khai theo kỳ và peakOccupancy. Không suy ra chỗ từ _count.enrollments; cần nghiệm thu cả placement sau transfer                                                                         |
| STF-03 | P0      | POST /registrations; GET /registrations/:id; POST .../:id/cancel                                                 | Có, FE đã nối, STAFF ghi. draft nhận targetStudentId/classId/startDate/packageMonths và idempotency. Không tạo parent/con tại quầy bằng tài khoản STAFF                                                                                                                        |
| STF-04 | P0      | GET .../:id/bill; POST .../:id/confirm-payment; GET .../:id/receipt                                              | Có, FE/FEM đã nối theo quyền. STAFF thu đủ tiền offline; P chỉ đọc của mình. Giữ pricing snapshot/BILL_CLASS_CHANGED, retry không tạo hai Payment/Enrollment                                                                                                                   |
| STF-05 | P1      | GET /registrations; GET /payments                                                                                | Có, FE chưa nối list/BFF chưa allow. Dùng search/status/date/page/limit và tổng tiền từ backend; bỏ phụ thuộc danh sách ID trên thiết bị. Chốt mapping ngày filter giữa ngày lập đơn và ngày thu tiền                                                                          |
| STF-06 | P1      | GET /academic/enrollments; GET /students/:id/enrollments, /schedule                                              | Có và STAFF đã có quyền đọc. Bổ sung classId/status/search/asOf, effective placement, parent summary tối thiểu, đủ để chọn enrollment cho nghỉ/chuyển lớp                                                                                                                      |
| STF-07 | P0      | POST /academic/leaves; GET /academic/leaves; POST .../:id/decide, /cancel                                        | Có; STAFF tạo hộ và auto approve trong service hiện tại. Đơn một buổi đang yêu cầu participant đã có, cần tạo hợp lệ khi lớp đã sinh lịch nhưng chưa prepare roster. Chốt SINGLE_ABSENCE đánh dấu vắng và PERIOD_PAUSE excused; không cấp STAFF ghi finalize toàn bộ điểm danh |
| STF-08 | P1      | GET /academic/makeup-sources?studentId; GET /academic/participants/:id/makeup-candidates; POST /academic/makeups | Có, STAFF đã được cấp quyền. Bổ sung tên lớp/môn/bài, teacher, availableSeats, student/enrollment/source context; kiểm tra cùng khóa/cùng bài/chưa diễn ra và chỗ thật khi ghi                                                                                                 |
| STF-09 | P1      | GET /academic/makeups; POST .../:id/cancel; đề xuất POST .../:id/reschedule                                      | List/cancel đã có; đổi booking mới chưa có command atomic. UI mock phân biệt makeup/swap, BE MakeupBooking chưa có kind/note/markOriginalAbsent tương ứng: chốt mapping hoặc thêm field, không tự dùng cancel+create không có rollback                                         |
| STF-10 | P1      | POST /academic/enrollments/:id/transfer; đề xuất GET .../:id/transfer-candidates                                 | Transfer có, STAFF được quyền; requires khác lớp, cùng programId và **cùng monthlyFee**. Candidates mới hoặc mở rộng /classes để trả eligibility theo effectiveAt, placement và phần kỳ còn lại; giữ lịch sử lớp cũ                                                            |
| STF-11 | P1      | Kết thúc bảo lưu sớm: đề xuất POST /academic/leaves/:id/end-early                                                | Mới. UI useEndLongLeaveEarly có mock; cancel hiện không tương đương kết thúc phần còn lại có bảo toàn lịch sử. effectiveDate/reason, cập nhật buổi tương lai, giữ excused quá khứ                                                                                              |
| STF-12 | P1      | POST /academic/enrollments/:id/end; POST /academic/students/:id/end-study                                        | Có, hiện M/S được ghi; quyền đích STAFF theo SRS. Bổ sung reason/effectiveAt nếu giữ UI nhập ngày; API hiện kết thúc ngay, controller không dùng body ReasonDto. Trả impact enrollment/buổi/makeup/leave và giữ lịch sử                                                        |
| STF-13 | P1      | Cho học lại hồ sơ INACTIVE                                                                                       | Khoảng thiếu nghiệp vụ. end-study đặt con INACTIVE, đăng ký mới yêu cầu ACTIVE, PATCH /me/students/:id không nhận status. Đề xuất POST /students/:id/reactivate cho STAFF với reason rồi ghi danh mới qua luồng thu tiền; giữ cùng StudentProfile                              |

**Việc FE phải làm:** các màn absences hiện nằm ở /manager/absences và dùng mock. STAFF bị chặn vào /manager/*, còn MANAGER không có AREA.ABSENCES. Cần chuyển/mở route /staff/absences tương ứng; bổ sung BFF cho đúng API/quyền. Đây là lỗi tích hợp client, không phải tất cả API nghỉ/học bù đều thiếu ở BE.

**Bảo lưu nhiều môn:** UI LongLeave.subjectIds có thể rỗng nghĩa là tất cả môn; BE LeaveDto nhận một enrollmentId. Có thể FE tạo theo từng enrollment nhưng cần kết quả từng môn và xử lý khi có lỗi; API batch atomic là P2 nếu nhóm cần thao tác một lần cho tất cả.

## 9. API giáo viên web

| ID     | Ưu tiên | API                                                                                                                                                                                  | Hiện trạng / dữ liệu cần có                                                                                                                                                                                                                                                                                      |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TCH-01 | P1      | GET /classes; GET /classes/:id; GET /academic/enrollments                                                                                                                            | Có, teacher được scope theo user.id; FE lớp còn mock. Danh sách cần tên môn/khối/lịch tuần/sĩ số đúng thời điểm; detail/enrollments phải tính placement, không chỉ enrollment.classId                                                                                                                            |
| TCH-02 | P1      | GET /academic/scheduled-sessions; GET chi tiết buổi theo CLS-07                                                                                                                      | List có và lọc teacherId=user.id; FE calendar còn mock/CURRENT_TEACHER_ID. Detail cần lesson content được phép, roster count, summary, trạng thái chốt và quyền thao tác                                                                                                                                         |
| TCH-03 | P0      | POST /academic/sessions/:id/roster; GET .../:id/roster; POST .../:id/finalize-attendance                                                                                             | Có, FE chưa nối. POST roster tạo participant; GET đọc; finalize nhận items[{participantId,status}], summary và chỉ chốt buổi đã kết thúc. Hiện MANAGER cũng có quyền, cần chốt teacher-only theo SRS. BE có UNMARKED/PRESENT/ABSENT/EXCUSED, made_up là kết quả booking liên quan                                |
| TCH-04 | P1      | PUT /academic/sessions/:id/attendance-draft; POST .../:id/attendance-corrections                                                                                                     | Mới nếu giữ UI lưu/sửa điểm danh. API hiện chỉ finalize một lần khi buổi kết thúc, không tương đương nút lưu draft hoặc sửa sau chốt. Correction cần reason/revision/audit và cập nhật makeup/tỷ lệ đi học/email/công                                                                                            |
| TCH-05 | P1      | GET/POST /academic/assignments; GET/PATCH .../:id; POST .../:id/publish, /close, /reopen, /publish-answers                                                                           | Có, FE assignment còn mock. Body AssignmentDto: classId/title/instructions/dueAt/maxAttempts/questions; publish: enrollmentIds. Bổ sung filter classId/status/search và counts học sinh được giao/đã nộp/chưa nộp/đã công bố. Không gọi “assigned” vào API status PUBLISHED                                      |
| TCH-06 | P0      | GET .../assignments/:id/submissions; POST /academic/submissions/:id/grades, /grade-objective, /grade-ai; GET /academic/grading-jobs/:id; POST /academic/grades/:id/approve, /publish | Có. T chấm lớp/bài mình được phân công; FE chưa nối. AI job hiện chỉ trả result.scores, **không tự tạo GradeReview**. UI phải nhận kết quả, POST grades để lưu bản review rồi approve/publish. Kết quả chưa PUBLISHED không được trả cho P                                                                       |
| TCH-07 | P1      | GET /academic/grading-queue; GET /academic/submissions/:id                                                                                                                           | Mới. Queue filter classId/assignmentId/status/search/page/limit, latestAttempt/job/latestGrade + counts. Detail cần đề/câu hỏi/đáp án của GV, tên con, answers/file metadata, AI scores, grade revision. List submissions hiện thiếu student summary và job context để dựng queue trực tiếp                      |
| TCH-08 | P2      | POST /academic/grades/bulk-approve                                                                                                                                                   | Mới/tùy chọn. UI có bulk approve theo confidence nhưng BE AI result chưa có confidence. Thống nhất thêm confidence nullable hoặc bỏ chỉ số/nút này. Duyệt hàng loạt phải do teacher chọn, không tự công bố                                                                                                       |
| TCH-09 | P1      | POST /academic/reports; GET /academic/reports; GET .../:id/download?format=xlsx hoặc pdf                                                                                             | Có, teacher-only; FE reports còn mock. ReportDto hiện một classId + studentId? + from/to/includeAi. FE form nhiều classIds/studentProfileIds và includeScores/Attendance/Progress chưa khớp: thu gọn UI hoặc mở rộng DTO, không mặc định phải tạo API mới                                                        |
| TCH-10 | P1      | Metadata/detail và filter cho reports                                                                                                                                                | Bổ sung; list hiện id/classId/createdAt, cần tên lớp/khoảng ngày/snapshot progress để dựng bảng. GET /academic/reports/:id mới nếu cần preview. Kiểm tra latest grade và cách tính chuyên cần chung; download báo cáo cũ sau đổi teacher là quyền cần chốt, vì access.classroom hiện phụ thuộc GV đang phụ trách |
| TCH-11 | P1      | POST /academic/sessions/:id/teacher-absence; GET /me/teacher-absences                                                                                                                | Mới. Báo nghỉ buổi mình sắp dạy, reason, status và reportedAt từ BE; không nhận teacherId actor từ FE. M xử lý bằng MGR-04/CLS-08; xem C7                                                                                                                                                                        |
| TCH-12 | P1      | GET /me/work-credits?month=...; GET /me/teacher-profile hoặc mở rộng GET /auth/me                                                                                                    | Mới/bổ sung theo MGR-02/06. Teacher đọc công bản thân và hồ sơ tên/phone/chuyên môn. API profile sửa chính chủ theo AUTH-05                                                                                                                                                                                      |
| TCH-13 | P2      | GET /me/teacher-dashboard?fromDate&toDate                                                                                                                                            | Mới aggregate tùy chọn. Có thể ghép các API lớp/lịch/assignment/queue; cần todaySessions, pendingAttendance, pendingReview và recentSubmissions nếu giữ dashboard hiện tại                                                                                                                                       |
| TCH-14 | P1      | GET /academic/curriculum-units/:id; POST lesson feedback theo CUR-09                                                                                                                 | Có, chỉ approved trong phạm vi teacher. Cần đảm bảo quyền đọc của người dạy thay, và mapping feedback–revision; FE mới chưa có màn xử lý feedback                                                                                                                                                                |

### 9.1 Những field của UI mock chưa có trong AssignmentDto

| UI hiện có                              | BE hiện có                                          | Cách xử lý đề xuất                                                                 |
| --------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| type=practice/test                      | Không có phân loại đó                               | P2 thêm assignment type nếu cần lọc; hoặc bỏ field UI                              |
| description                             | instructions                                        | FE đổi form/mapping theo contract thật                                             |
| openAt, durationMinutes                 | Chưa có openAt/duration, publish là hành động riêng | P2 chốt hẹn giờ/mở bài và giới hạn thời gian; không xem như đã được server enforce |
| submissionMethod=online/photo_upload    | SubmissionDto cho answers và fileIds                | Dùng khả năng upload thật; chỉ bổ sung hạn chế kiểu nộp khi nghiệp vụ cần          |
| allowLateSubmission, latePenaltyPerHour | Service chặn nộp quá dueAt                          | P2 chốt nộp muộn/chính sách trừ điểm, hoặc ẩn các field UI chưa có tác dụng        |
| multiple_choice options có id/isCorrect | choices:string[], correctAnswer:string              | FE thích nghi contract; correctAnswer chỉ teacher hoặc sau publish-answers         |
| aiConfidence/aiTotalScore               | Job result.scores, không có confidence              | Có thể tính tổng score; confidence chỉ hiển thị khi BE thực sự cung cấp            |

### 9.2 Báo cáo và cách tính kết quả

ReportsService đã xuất xlsx/pdf thật, không yêu cầu BE viết lại export. Cần dùng chung service tính chuyên cần với mobile: REGULAR PRESENT + buổi gốc ABSENT có booking COMPLETED; không cộng thêm buổi bù lần thứ hai vào mẫu số.

Report hiện đọc các GradeReview PUBLISHED trong khoảng submittedAt; cần chốt lấy revision công bố mới nhất cho mỗi submission và lần nộp dùng tính điểm môn. Nếu có nhiều bản công bố/lần nộp thì không đếm tất cả như các bài khác nhau. Điểm trung bình nên có maxScore/scale và quy tắc trọng số rõ ràng; mobile đang trình bày thang 10, report hiện chuẩn hóa phần trăm.

## 10. API phụ huynh trên mobile

| ID     | Ưu tiên | API                                                                                | Hiện trạng / dữ liệu cần có                                                                                                                                                                                                                                                |
| ------ | ------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MOB-01 | P0      | GET/POST /me/students; PATCH /me/students/:id                                      | Có, FEM đã nối. fullName/grade/dateOfBirth, sở hữu của P, emailVerifiedAt; không thêm account học sinh. Hồ sơ INACTIVE muốn học lại theo STF-13                                                                                                                            |
| MOB-02 | P0      | GET /me/students/:id/enrollments                                                   | Có, FEM đã nối. Bổ sung computed termStatus (UPCOMING/ACTIVE/PAUSED/ENDED), currentClass/currentPlacement, teacher displayName và term dates; giữ placements để đọc lịch sử. ACTIVE đã hết kỳ hiện FEM phải tự tính ENDED                                                  |
| MOB-03 | P0      | GET /academic/scheduled-sessions?studentId&fromDate&toDate&page&limit              | Có nhưng chưa nhận studentId, không trả buổi MAKEUP của con ở lớp khác, chỉ dùng enrollment ACTIVE và ẩn CANCELLED. Bổ sung chính xác con/enrollment/participant, makeup source/booking, bảo lưu, lịch sử ENDED tới endedAt, teacher name và sequence. Xem C4              |
| MOB-04 | P0      | GET /me/students/:id/attendance?fromDate&toDate&programId&page&limit               | Mới. Trả items điểm danh của con và summary present/madeUp/absent/excused/unmarked/required/attendancePercent tính ở BE; web dùng cùng service. Route /parent/students/:id/attendance trong FEM là mock tạm, không phải route BE đã tồn tại. Xem C5                        |
| MOB-05 | P1      | GET chi tiết buổi theo CLS-07                                                      | Mới. FEM hiện tìm buổi bằng sessionId+startsAt trong danh sách ngày. Cần bài, summary của lớp, attendance con, giáo viên và makeup context; checkedInAt/nhận xét riêng/tài liệu từng buổi là P2 vì schema hiện chưa có các field riêng đó                                  |
| MOB-06 | P1      | GET /me/students/:id/assignments?status&classId&page&limit                         | Mới aggregate, hoặc bổ sung studentId/summary vào GET /academic/assignments. FEM đang dùng list → detail + submissions cho từng bài (1+2N). Trả recipientId/questionCounts/maxScore/latestSubmission/publishedGrade/names để tránh tải toàn bộ đề chỉ để dựng danh sách    |
| MOB-07 | P0      | GET /academic/assignments/:id, .../:id/submissions; POST /academic/submissions     | Có, FEM đã nối. Giữ recipientId + answers; P chỉ nộp bài cho enrollment con mình. Bổ sung studentId cho đọc để tránh trộn các con được giao cùng bài; idempotency khi nộp là đề xuất P1 để retry không mất một attempt                                                     |
| MOB-08 | P1      | POST /academic/files; GET /academic/files/:id/download; fileIds trên SubmissionDto | Có, P upload, P/T download theo ownership/assignment. 10 MiB/file, PDF/PNG/JPEG, tối đa 5 file/submission. FEM chưa wire/chưa có chọn ảnh. BE grade-ai hiện từ chối attachment (AI_ATTACHMENTS_UNSUPPORTED); ảnh chấm tay được, AI ảnh/OCR là yêu cầu bổ sung nếu nhóm cần |
| MOB-09 | P1      | GET /me/students/:id/grades?programId&fromDate&toDate&page&limit                   | Mới aggregate hoặc trả trong MOB-06. Chỉ latest PUBLISHED, score/maxScore/scale/feedback/date; summary theo môn với quy tắc như 9.2. Không trả DRAFT/APPROVED grade hoặc AI proposal                                                                                       |
| MOB-10 | P1      | GET /me/students/:id/enrollments/:enrollmentId/roadmap                             | Mới. Trả học phần/phiên bản đã áp dụng, ordered lessons/monthly tests, session nullable, published assignment result và summary tiến độ. FEM hiện dựng lộ trình từ buổi đã sinh nên không có bài chưa xếp lịch                                                             |
| MOB-11 | P1      | GET /me/bills?studentId&status&page&limit; GET /registrations/:id/bill, /receipt   | Có, FEM đã nối; list me-bills hiện chỉ page/limit, cần filter để không tải bill mọi con rồi lọc client. Giữ UNPAID/PAID/CANCELLED và quan hệ quyền cùng hồ sơ con cho bill/receipt                                                                                         |
| MOB-12 | P1      | GET /academic/leaves; GET /academic/makeups                                        | Có. Leaves FEM đã nối để hiển thị PAUSED; makeups chưa wire và response thiếu tên lớp/bài/teacher. MOB-03 có lịch bù đầy đủ thì không bắt FEM gọi thêm bookings để dựng calendar                                                                                           |
| MOB-13 | P2      | GET /me/students/:id/dashboard                                                     | Mới aggregate tùy chọn. FEM mock đang ở /parent/students/:id/dashboard. Có thể ghép attendance/grades/assignments thật; nếu giữ endpoint tổng quan thì attendancePercent/averageScore/upcomingSession/pendingTasks/recentEvents, thống kê BE tính chung                    |
| MOB-14 | P2      | Thông báo trong app / unread count / mark-read                                     | Chốt. FEM có unread-count mock và notification placeholder; SRS yêu cầu email, không yêu cầu notification inbox. Không xem đây là P0. GET /academic/announcements đã có nhưng chưa có per-user read/unread và không thay email log                                         |

MOBILE **không cần** API tự đăng ký/hủy lớp, tự thanh toán online, claim link/mã ghi danh hoặc tải báo cáo giáo viên. P xem bill để biết trạng thái thu tiền ở trung tâm; hành động confirm-payment vẫn thuộc STAFF.

## 11. Email, lịch sử và các điểm lệch cần xử lý chung

| ID   | Ưu tiên | Phát hiện trong source hiện tại                                                                                                                                 | Đề nghị                                                                                                                                                                   |
| ---- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X-01 | P0      | ApproveUnit phụ thuộc lớp có lịch và track môn+khối                                                                                                             | Chốt CUR-02/03 trước khi UI dùng luồng giáo trình chuẩn bị trước lớp                                                                                                      |
| X-02 | P0      | scheduled-sessions PARENT thiếu MAKEUP khác lớp và lịch sử ENDED; không có identity con trong row                                                               | Sửa MOB-03 theo participant/enrollment/placement, tránh FE đoán dữ liệu giữa nhiều con                                                                                    |
| X-03 | P0      | SINGLE_ABSENCE yêu cầu roster tồn tại; auto approve STAFF chưa giải quyết nhu cầu participant tương lai                                                         | Đảm bảo create/record absence có participant hợp lệ và ghi nhận đúng nghiệp vụ; không buộc teacher chuẩn bị tất cả roster trước                                           |
| X-04 | P1      | Nhiều command academic vẫn cho M/S; finalize cho M/T; SRS yêu cầu STAFF vận hành nghỉ và TEACHER điểm danh                                                      | Chốt quyền đích và kiểm tra gọi trực tiếp, cập nhật BE và BFF cùng đợt                                                                                                    |
| X-05 | P1      | Có OutboxEvent schema nhưng chưa thấy worker tiêu thụ hoặc enqueue outbox trong src của confirm-payment; finalize/leave/makeup/transfer chưa thấy email tự động | Bổ sung queue/outbox hoặc xác nhận dịch vụ bên ngoài đang làm; email cho thu tiền, điểm danh, thay đổi lịch/nghỉ, công bố điểm theo phạm vi SRS                           |
| X-06 | P1      | Announcements send-email trả kết quả đồng bộ + automaticRetry:false, chưa có route đọc delivery history/retry theo recipient                                    | Đề xuất GET /email-deliveries và POST /email-deliveries/:id/retry cho M/S theo loại email; trạng thái PENDING/SENT/FAILED/attempts/nextAttemptAt/lastError, chống gửi lặp |
| X-07 | P1      | Một số actor field legacy tên managerId/confirmedByManagerId nhưng hành động do STAFF; frontend mock dùng assignedBy/markedBy                                   | Giữ actor theo JWT; DTO trả tên/role thật, migration tên field nếu cần có kế hoạch, không để FE gửi actor                                                                 |
| X-08 | P1      | EndStudy làm con INACTIVE nhưng chưa có cách reactivate; end endpoints là ngay lập tức trong khi UI có ngày hiệu lực/lý do                                      | STF-12/13 để hoàn tất cả nghỉ và học lại, không tạo hồ sơ con mới để né INACTIVE                                                                                          |
| X-09 | P1      | Lịch tuần/Class.teacherId sửa không đồng nghĩa các ClassSession đã sinh đổi theo                                                                                | Teacher assignment/cancel/substitute có effectiveAt và impact; preserve lịch sử; lớp/lịch thay đổi phải kiểm tra preview lại                                              |
| X-10 | P1      | Academic trả mảng và FEM readAllPages giới hạn 20 trang; curriculum-units không phân trang                                                                      | Lộ trình đổi contract 4.1; server filter/pagination, không âm thầm cắt 2.000 record trên mobile                                                                           |
| X-11 | P1      | getClass.enrollments dựa classId gốc; các chỗ seats/term/announcements dùng quy tắc khác nhau                                                                   | Dùng placement và [startDate,endDate) thống nhất. Announcements hiện endDate>=day cần đối chiếu exclusive; nghiệm thu end-date và chuyển lớp                              |
| X-12 | P1      | Bill quyền theo quan hệ con, registration/receipt kiểm tra parentEmail; amount không cùng kiểu                                                                  | Chuẩn hóa theo identity/ownership ổn định và chốt kiểu tiền; không thay response đang dùng mà không báo client                                                            |

Email log/delivery API là năng lực vận hành, khác notification inbox trên mobile. Hỏng SMTP không được rollback Payment đã xác nhận; lưu tác vụ gửi và retry độc lập.

## 12. Contract đề xuất cho các phần thiếu trọng tâm

Các JSON dưới đây là **dạng data bên trong envelope**, trừ request body. ID, tên và ngày là dữ liệu minh họa; BE có thể điều chỉnh tên route khi thống nhất nhưng cần giữ rõ semantics.

Các mảng rows/items được rút gọn để minh họa cấu trúc. summary/total biểu diễn toàn bộ dữ liệu theo bộ lọc; response thực tế phải có đầy đủ phần tử của trang tương ứng.

### C1. Lớp và học phần áp dụng

GET /classes/:id bổ sung projection cho UI:

```json
{
  "id": "class-6a",
  "name": "Toán 6A",
  "programId": "program-basic-6",
  "program": {
    "id": "program-basic-6",
    "name": "Toán 6 cơ bản",
    "subject": "Toán",
    "grade": 6
  },
  "teacher": { "id": "teacher-1", "displayName": "Giáo viên A" },
  "capacity": 20,
  "monthlyFee": "800000.00",
  "isOpen": false,
  "weeklySchedules": [
    { "weekday": 1, "startTime": "18:00", "endTime": "20:00" }
  ],
  "appliedCurricula": [
    {
      "unitId": "unit-1",
      "title": "Học kỳ I",
      "version": 1,
      "fromDate": "2026-11-01",
      "toDate": "2026-11-30",
      "generationId": "generation-1"
    }
  ],
  "configuration": {
    "hasTeacher": true,
    "hasWeeklySchedule": true,
    "hasGeneratedSessions": true
  }
}
```

appliedCurricula có thể lấy từ ScheduleGeneration. Nếu phải nhớ lựa chọn khi chưa generate thì dùng binding riêng theo CLS-04. configuration là projection tính được, chưa yêu cầu thêm status enum Class.

### C2. Nhập CSV

POST .../:unitId/import-preview: multipart file và columnMapping (field JSON) hoặc JSON rows do FE parse; nhóm chọn **một** contract. Nếu upload file thì endpoint designer riêng, không dùng AcademicStorageService.upload hiện chỉ cho PARENT/ảnh/PDF.

```json
{
  "previewId": "import-preview-1",
  "unitId": "unit-1",
  "expectedRevision": 4,
  "expiresAt": "2026-10-07T11:00:00Z",
  "summary": { "rows": 3, "validRows": 2, "invalidRows": 1 },
  "rows": [
    {
      "rowNumber": 2,
      "kind": "LESSON",
      "sequence": 1,
      "title": "Tập hợp",
      "content": "Nội dung bài",
      "monthKey": null,
      "errors": []
    },
    {
      "rowNumber": 3,
      "kind": "LESSON",
      "sequence": 1,
      "title": "Số tự nhiên",
      "content": "Nội dung bài",
      "monthKey": null,
      "errors": [
        {
          "field": "sequence",
          "code": "DUPLICATE_SEQUENCE",
          "message": "Duplicate sequence"
        }
      ]
    }
  ]
}
```

POST .../:unitId/import-commit nhận previewId, expectedRevision, mode=APPEND hoặc REPLACE và tập rows đã sửa/chọn (hoặc preview mới đã hợp lệ), cùng Idempotency-Key. Khi sửa rows, BE validate lại và hash đúng tập commit; không coi previewId cũ đã bảo đảm dữ liệu mới đúng.

Response: unitId/revision, createdCount, updatedCount nếu có, lessonCount/testCount. Không có lỗi từng dòng mới commit; lỗi 409 UNIT_LOCKED/REVISION_CONFLICT, preview hết hạn và lỗi dữ liệu có details.rowNumber/field. Append/reorder phải kiểm tra toàn bộ bài trong học phần, không chỉ file.

### C3. AI gợi ý giáo trình

Request POST .../:unitId/suggestion-jobs:

```json
{
  "sourceText": "Nội dung hoặc mục lục do người thiết kế cung cấp",
  "textbook": "Bộ sách tham chiếu",
  "goals": "Mục tiêu học phần",
  "targetLessonCount": 12,
  "includeMonthlyTests": true
}
```

program/subject/grade lấy từ unit. GET job trả id/unitId/status=QUEUED|PROCESSING|SUCCEEDED|FAILED, result.rows cùng cấu trúc CSV, errorCode/errorMessage và thời điểm. targetLessonCount là gợi ý soạn bài, không thay phép tính số buổi từ lịch tuần. Kết quả chưa lưu hoặc approve; lỗi AI vẫn cho phép nhập/soạn thủ công.

### C4. Calendar theo con

```json
{
  "items": [
    {
      "id": "session-2",
      "classId": "class-6b",
      "startsAt": "2026-11-04T11:00:00Z",
      "endsAt": "2026-11-04T13:00:00Z",
      "status": "SCHEDULED",
      "class": {
        "id": "class-6b",
        "name": "Toán 6B",
        "program": {
          "id": "program-basic-6",
          "name": "Toán 6 cơ bản",
          "subject": "Toán",
          "grade": 6
        }
      },
      "teacher": { "id": "teacher-2", "displayName": "Giáo viên B" },
      "lesson": {
        "id": "lesson-1",
        "unitId": "unit-1",
        "sequence": 1,
        "title": "Tập hợp",
        "kind": "LESSON",
        "monthKey": null
      },
      "participation": {
        "studentId": "student-1",
        "enrollmentId": "enrollment-1",
        "participantId": "participant-2",
        "kind": "MAKEUP",
        "attendance": "UNMARKED",
        "effectiveAttendance": "UNMARKED",
        "pause": null
      },
      "makeup": {
        "bookingId": "booking-1",
        "originalSessionId": "session-1",
        "status": "BOOKED"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

P nên gửi studentId để một row có một context con; nếu endpoint hỗ trợ nhiều con cùng một session thì trả participations[] thay vì gắn nhầm một con. session vẫn là cùng ID chung trên web/mobile. P không được xem roster các con khác.

Đối với buổi tương lai chưa prepare roster, participantId có thể null; BE vẫn phải xác định con được tham gia từ term/placement. Lịch bù dùng booking/participant, không lọc theo lớp ghi danh gốc. Lịch sử ENDED giữ các buổi hợp lệ trước endedAt; CANCELLED trả status/reason để giải thích lịch thay đổi.

### C5. Chuyên cần

```json
{
  "items": [
    {
      "sessionId": "session-1",
      "participantId": "participant-1",
      "enrollmentId": "enrollment-1",
      "startsAt": "2026-11-02T11:00:00Z",
      "kind": "REGULAR",
      "attendance": "ABSENT",
      "effectiveAttendance": "MADE_UP",
      "makeup": {
        "bookingId": "booking-1",
        "status": "COMPLETED",
        "sessionId": "session-2"
      }
    }
  ],
  "summary": {
    "present": 8,
    "madeUp": 1,
    "absent": 1,
    "excused": 2,
    "unmarked": 0,
    "required": 10,
    "attendancePercent": 90
  },
  "page": 1,
  "limit": 20,
  "total": 12
}
```

attendance giữ enum BE đang lưu; effectiveAttendance là projection có MADE_UP. Không cần thêm enum database nếu có thể tính từ booking COMPLETED. summary tính toàn bộ filter: (present+madeUp)/required; buổi bảo lưu EXCUSED và session CANCELLED không vào required, không đếm buổi bù thêm lần nữa. Nếu required=0 thì percent=null. UNMARKED trả riêng; thống nhất mẫu số cho buổi chưa chốt để không có số phần trăm khác nhau trên từng client.

### C6. Assignment/grade summary theo con

```json
{
  "items": [
    {
      "assignmentId": "assignment-1",
      "recipientId": "recipient-1",
      "studentId": "student-1",
      "enrollmentId": "enrollment-1",
      "title": "Bài tập tập hợp",
      "class": { "id": "class-6a", "name": "Toán 6A" },
      "subject": "Toán",
      "dueAt": "2026-11-05T13:00:00Z",
      "status": "PUBLISHED",
      "maxAttempts": 2,
      "questionCounts": { "multipleChoice": 4, "essay": 1 },
      "maxScore": 10,
      "latestSubmission": {
        "id": "submission-1",
        "attemptNo": 1,
        "submittedAt": "2026-11-04T10:00:00Z"
      },
      "publishedGrade": {
        "id": "grade-1",
        "revision": 1,
        "totalScore": 8,
        "maxScore": 10,
        "feedback": "Hoàn thành tốt",
        "publishedAt": "2026-11-05T12:00:00Z"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

publishedGrade=null trước công bố. Danh sách không chứa correctAnswer/rubric/AI result. Chi tiết đề vẫn qua endpoint đang có và correctAnswer chỉ sau publish-answers; công bố điểm và công bố đáp án là hai hành động riêng hiện tại.

### C7. Nghỉ giáo viên, dạy thay và công

- Báo nghỉ: sessionId/reason trong request; response id/teacherId/reportedAt/status=PENDING|COVERED|CANCELLED. Status là đề xuất, chưa có schema hiện tại.
- Candidates: teacher{id,displayName,subjectIds}, availability/conflicts, không dựa vào rating mock.
- Assignment: sessionId/originalTeacherId/substituteTeacherId/effectiveAt/reason/assignedBy; teacher của buổi thực tế đổi đúng phạm vi. Teacher classId cố định không được overwrite để xử lý một buổi.
- Khi chốt attendance, lưu finalizedBy/finalizedAt hoặc dấu vết tương đương. credit 1 cho người thực dạy, 0 cho người nghỉ; manager adjustment có reason/audit; một buổi chỉ tính công một lần.
- Hủy buổi: giữ status/reason, không tính công và tạo danh sách con cần được STAFF xử lý học bù.

## 13. Ma trận quyền cần nghiệm thu chung

| Nhóm thao tác                               | M                         | D            | S                    | T                           | P                              |
| ------------------------------------------- | ------------------------- | ------------ | -------------------- | --------------------------- | ------------------------------ |
| Danh mục/khóa học và tạo lớp/lịch tuần      | Ghi                       | Đọc          | Đọc                  | Đọc giới hạn                | Đọc qua enrollment của con     |
| Soạn/import/AI giáo trình nháp              | Đọc                       | Ghi của mình | —                    | Đọc APPROVED được phân công | Lộ trình cho con               |
| Duyệt giáo trình/sinh lịch                  | Ghi                       | Đọc          | Đọc                  | Đọc                         | Đọc cho con                    |
| Đăng ký và confirm-payment                  | Đọc tổng hợp              | —            | Ghi                  | —                           | Bill/receipt cho con           |
| Nghỉ/học bù/transfer/end/reactivate         | Đọc vận hành              | —            | Ghi                  | Đọc liên quan               | Đọc cho con                    |
| Phân công/dạy thay/hủy buổi/điều chỉnh công | Ghi                       | —            | Đọc                  | Báo nghỉ/đọc công mình      | Đọc kết quả lịch               |
| Roster/finalize/correct attendance          | Đọc vận hành              | —            | Đọc phục vụ vận hành | Ghi buổi được phân công     | Đọc con mình                   |
| Giao bài/review/approve/publish grade       | —                         | —            | —                    | Ghi lớp/bài được phân công  | Nộp cho con, chỉ đọc PUBLISHED |
| Báo cáo Excel/PDF                           | —                         | —            | —                    | Tạo/đọc/tải theo quyền      | —                              |
| Parent/student account và hồ sơ con         | Sửa contact/status parent | —            | Đọc để vận hành      | Đọc tối thiểu lớp mình      | Tạo/sửa con mình               |

Bảng này là quyền đích theo SRS và đề xuất. Không tự mở tất cả API cho role chỉ vì role đó xem được một màn. Các ngoại lệ legacy MANAGER vận hành nghỉ/điểm danh cần BE chốt ở X-04.

## 14. Việc FE/FEM phải làm, tách khỏi backlog BE

1. **BFF web:** src/app/api/backend/[...path]/route.ts mới allow auth/parents/students/programs/classes/registrations detail và một số curriculum route. Chưa allow staff/teachers/dashboard/payments/list registrations, program PATCH/DELETE, hoặc assessment/reports/files. Phải thêm method/path và role cụ thể khi wire.
2. **BFF academicRoles:** mọi GET ngoài scheduled-sessions hiện dùng M/D/T; approve hoặc academic/classes/* dùng M; các POST khác mặc định designer. Logic này chỉ phục vụ curriculum hiện đã wire, không dùng nguyên trạng cho teacher assignment/grading/attendance hay STAFF leave/makeup.
3. **Teacher web:** thay CURRENT_TEACHER_ID và mock data bằng identity/API, không chỉ thay request nhưng vẫn lấy lớp/học sinh từ selector mock.
4. **Manager web:** nối directory staff/teacher, dashboard, program update/delete và parent detail/patch đã tồn tại; UI direct account creation cần khớp MGR-03.
5. **Staff web:** route vận hành nghỉ/học bù phải truy cập được bằng STAFF; payments list dùng backend thay local registration IDs; lớp/giáo viên chọn bằng tên.
6. **FEM:** thêm wired-routes cho endpoint mới sau thống nhất contract và xóa mock tương ứng; hiện chỉ attendance/dashboard/unread-count còn mock, các academic assignment/calendar đã nối.
7. **FEM ảnh:** làm picker/camera hoặc file picker, upload /academic/files và fileIds; đây là phần FE còn thiếu với API BE đã có. Không hứa AI chấm ảnh khi BE hiện chỉ hỗ trợ text.
8. **Hai client:** sửa loader/type khi đổi pagination; giữ errorCode/requestId, không dùng number hoặc tên enum mock khác để suy ra API thật; invalidate dữ liệu sau mutation.

## 15. Thứ tự triển khai đề xuất

| Đợt                        | Phần BE                                                                   | Phần FE/FEM chạy cùng                                                                | Kết quả nghiệm thu                                                           |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1 – Chốt mô hình           | CUR-02/03, CLS-02, STF-07/13, MOB-03/04, X-04 và contract pagination      | Điều chỉnh luồng đào tạo, context con, bỏ mock attendance khi API có                 | Nội dung/lớp đúng khóa; đăng ký–lịch–điểm danh–học bù–học lại nhất quán      |
| 2 – Giáo trình và vận hành | CAT-01, CUR-05/07/08, CLS-04/07/08, MGR-04/05/06, STF-09/10/11            | CSV/AI, teacher picker, class tabs, staff absence routes                             | Tạo giáo trình/lớp/lịch đầy đủ; đổi/dạy thay/hủy có lịch sử                  |
| 3 – Dạy và học thật        | TCH-04/07, MOB-06/09/10, email X-05/06                                    | Wire teacher roster/assignment/grading/report hiện đã có; mobile upload và summaries | Giáo viên dạy/chấm/công bố; phụ huynh thấy đúng con, đúng kết quả và tiến độ |
| 4 – Tiện ích               | AUTH-03/04/05, metadata/report filters, dashboard series; P2 sau khi chốt | Profile/password, báo cáo/aggregate dashboard                                        | Hoàn thiện quản trị; không kéo các field UI tùy chọn thành P0                |

BE không phải đợi toàn bộ API mới để FE bắt đầu: directory, dashboard, danh sách thanh toán và nghiệp vụ giáo viên đã có có thể wire ngay với contract/quyền đã xác nhận.

## 16. Checklist nghiệm thu liên nền tảng

- Hai khóa cùng môn/khối nhưng khác nội dung; tạo/duyệt/import revision và áp dụng đúng khóa, gồm duyệt khi chưa có lớp nếu chọn CUR-03 mới.
- Hai lớp cùng khóa, lịch tuần khác nhau; generate từng đợt không lặp bài, kiểm tra cuối tháng đúng, retry không trùng; xung đột GV/phòng/lớp trả lỗi cụ thể.
- Parent đã xác minh với hai con: STAFF chỉ ghi danh con đúng khối; thu tiền tạo đúng một Payment/Enrollment/bill PAID; mobile hiện ngay, không claim link.
- Enrollment vào đúng ngày hết hạn không có buổi mới; transfer theo effectiveAt giữ lịch cũ và đưa con vào roster lớp mới, availableSeats đúng sau transfer.
- Nghỉ một buổi trước khi teacher prepare roster; bảo lưu; học bù ở lớp khác; đi bù/missed/cancel/reschedule; web/mobile có cùng tỷ lệ đi học và không đếm bù hai lần.
- Kết thúc một môn, kết thúc toàn bộ, cho INACTIVE học lại: giữ cùng hồ sơ và lịch sử, không ảnh hưởng các con khác.
- Teacher báo nghỉ → M xếp dạy thay hoặc hủy → người dạy đúng có quyền roster/finalize → công chỉ tính một lần; P thấy thay đổi lịch.
- Hai con cùng nhận một assignment: recipientId/context riêng; nộp text/ảnh hợp lệ; sai owner bị chặn; retry không tiêu thêm attempt nếu chọn idempotency.
- AI fail/text-only/manual review; grade DRAFT/APPROVED không lộ; chỉ PUBLISHED hiện mobile; correctAnswer chỉ sau publish-answers; sửa revision không đếm hai điểm.
- Export xlsx/pdf đúng giáo viên, thống kê cùng mobile; thiếu AI/storage/SMTP có lỗi cụ thể và luồng thay thế phù hợp, không báo thành công giả.
- Email gửi lỗi có log/retry, không ghi thêm Payment khi gửi lại; hành động chính lưu audit và actor đúng role.
- BFF và gọi BE trực tiếp có cùng quyền; query studentId/classId không vượt ownership; đổi pagination không làm hai client lỗi.

## 17. Bằng chứng và nguồn đối chiếu

| Nhóm                               | File nguồn chính                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI/route web và quyền              | FE/src/app, FE/src/constants/role-access.ts, FE/src/lib/api/backend-permissions.ts, FE/src/app/api/backend/[...path]/route.ts                             |
| Web thật và mock                   | FE/src/features/registration-flow/api.ts và components; FE/src/features/curriculum/api.ts và components; FE/src/features/*/hooks, selectors; FE/src/types |
| Mobile request thật                | FEM/src/api/endpoints.ts, FEM/src/api/wired-routes.ts, FEM/src/features/parent-dashboard/api/parent-dashboard-api.ts                                      |
| Mobile projection/field thiếu      | FEM/src/features/parent-dashboard/api/parent-data-mappers.ts, FEM/src/features/parent-dashboard/types.ts, FEM/src/app/(tabs), FEM/src/features/children   |
| Đặc tả và yêu cầu cũ               | FEM/docs/SRS.md, FEM/docs/BE_FIX_REQUESTS.md; FE/docs/BUSINESS_WORKFLOW.md, BE_FIX_REQUESTS.md, CURRICULUM_API_INTEGRATION.md                             |
| Controller/DTO hiện có             | BE/src/modules/auth, registration-flow, directory, curriculum-scheduling, academic                                                                        |
| Quyền, điểm danh và chuyển lớp     | BE/src/modules/academic/academic-access.service.ts, catalog.service.ts, enrollment-workflows.service.ts                                                   |
| Giáo trình, ghép lịch              | BE/src/modules/curriculum-scheduling/curriculum-scheduling.service.ts và dto.ts                                                                           |
| Bài tập/AI/báo cáo/email           | BE/src/modules/academic/assessment.service.ts, grading-worker.service.ts, reports.service.ts, announcements.service.ts                                    |
| Storage, mô hình và tài khoản test | BE/src/integrations/academic-storage.service.ts, prisma/schema.prisma, src/database/seed.ts                                                               |

FE/FEM/BE trong bảng tương ứng ba repo WDP301-FE-System, WDP301-FEM-System và WDP301-BE-System. Danh sách method/path kèm vị trí controller ở [BACKEND_API_EXISTING_ROUTES.md](BACKEND_API_EXISTING_ROUTES.md).

**Cần nhóm BE phản hồi:** lựa chọn programId so với track dùng chung; duyệt nội dung trước khi có lớp; endpoint chính/response pagination; quyền legacy của MANAGER; cách nhập CSV/AI; phạm vi rooms/invitations/in-app notifications và các field P2. Các mục này không chặn việc triển khai những API P0/P1 đã xác định rõ ở trên.

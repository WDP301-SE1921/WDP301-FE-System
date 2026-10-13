# Gửi BE: các phần còn thiếu sau khi Web đã tích hợp API hiện có

Ngày cập nhật: **10/10/2026**. Mốc đối chiếu: **Web `4dc5929`**, **BE `c29d57c`**.

Tài liệu này là danh sách việc cần BE xử lý tiếp, dựa trên SRS 03/10, controller/service/Prisma hiện tại và kết quả tích hợp Web. Không yêu cầu làm lại các API đã có. Phạm vi thay đổi client vẫn là Web; các yêu cầu đọc theo Parent bên dưới thuộc contract BE dùng chung, không phải yêu cầu sửa Mobile trong lượt này.

**Quy ước:** mọi URL tương đối với `/api/v1`. Các URL/body/field ghi **đề xuất** chưa tồn tại hoặc chưa phải contract được BE xác nhận. BE có thể chọn URL khác và gửi lại contract cuối cùng. P0 là đứt luồng hoặc sai quyền/dữ liệu; P1 là hoàn thiện chức năng SRS; P2 là tiện ích hoặc cần chốt nghiệp vụ.

## 1. Phần đã xong, không đưa lại vào backlog BE

Web đã nối Manager dashboard, Teacher/Staff CRUD, Parent detail/update; Staff danh sách đăng ký/thanh toán, Student detail, nghỉ/học bù/chuyển lớp/kết thúc học; Teacher attendance, assignments, manual/objective/AI grading, approve/publish, reports PDF/XLSX; Teacher–Designer feedback và Manager announcements/email commands.

Subject/Program/Class/lịch tuần, giáo trình Unit/CSV/review/revision, sinh/đổi/hủy buổi đã nối từ trước. Profile đọc `GET /auth/me` thật. Web dùng các API Unit/scheduled-session hiện hành, không cần thêm màn trùng cho alias legacy.

62/62 logic/BFF tests, HTTP production và Chromium với BE/MySQL biệt lập đã đạt các luồng đã nối. Điều này không có nghĩa các khoảng thiếu dưới đây đã được nghiệm thu. SMTP/AI provider trong test dùng dữ liệu kiểm thử; chưa xác nhận cấu hình SMTP/S3/AI production.

## 2. Tổng quan việc cần BE theo role

| Role bị ảnh hưởng                | Việc còn lại                                                                                                                                  | Mã bên dưới                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Manager                          | Mời/duyệt Teacher; mời/thêm Manager và phân quyền; phòng; đổi giáo viên từ ngày hiệu lực; dạy thay; đọc lớp đúng sau transfer; email bền vững | BE-02, BE-08–BE-12         |
| Staff                            | Báo nghỉ trước khi roster tồn tại; đặt lại học bù sau hủy; candidates đúng eligibility/chỗ; cho học lại hồ sơ cũ; email nghiệp vụ             | BE-03–BE-06, BE-08         |
| Teacher                          | Roster lớp đúng placement; chuyên cần dùng chung; quyền theo giáo viên phụ trách/dạy thay; xác nhận lịch còn cần chốt nghĩa                   | BE-02, BE-07, BE-12, BE-17 |
| Designer                         | Chưa phát hiện nhóm API nội dung cốt lõi còn thiếu; cần đóng đường legacy cho Manager viết nội dung                                           | BE-01                      |
| Dữ liệu Parent của BE dùng chung | Lịch đúng từng con, gồm học bù/lịch sử; chuyên cần và email cập nhật từ thao tác Web                                                          | BE-07, BE-08, BE-13        |
| Mọi role Web                     | Siết quyền trực tiếp ở BE; các tiện ích profile/password còn thiếu contract                                                                   | BE-01, BE-14               |

Các dòng là nhóm nghiệp vụ, không phải số lượng endpoint cần tạo mới.

## 3. Các lỗi và phần thiếu cần ưu tiên

### BE-01 — P0: quyền ghi BE chưa khớp SRS

**Hiện tại:** `EnrollmentWorkflowsService` cho MANAGER và STAFF cùng decide/cancel leave, book/cancel makeup, transfer/end/end-study. `finalizeAttendance()` dùng `AcademicAccessService.session()`, hiện cho cả MANAGER. Legacy `CatalogService.createLesson()` cho MANAGER viết nội dung. Web BFF đã chặn các quyền ghi này theo SRS, nhưng gọi trực tiếp Nest API vẫn dựa vào quyền BE.

**Cần BE:** theo SRS §4.1, §5.6–5.8, §8: Staff vận hành nghỉ/học bù/chuyển/end; Teacher được phân công chốt attendance và chấm bài; Designer soạn nội dung; Manager tạo lớp/xếp giáo viên/review. Parent chỉ tạo yêu cầu nghỉ cho enrollment thuộc con mình và không tự duyệt. Tách quyền đọc giám sát với quyền ghi. Nếu giữ legacy lesson API, quyền soạn và actor phải đúng Designer; hoặc deprecate đường ghi đó và dùng Unit workflow.

**Nghiệm thu:** gọi trực tiếp bằng JWT sai role phải 403, kể cả có ID hợp lệ. Teacher lớp/buổi khác không ghi được; actor lấy từ JWT. Không sửa bằng cách cấp Staff quyền chốt attendance toàn lớp.

**Nguồn:** `academic-access.service.ts`, `enrollment-workflows.service.ts`, `catalog.service.ts`.

### BE-02 — P0: danh sách học sinh của lớp chưa theo placement sau chuyển lớp

**Hiện tại:** `RegistrationFlowService.getClass()` đọc enrollment bằng `{ classId: id }`. `Enrollment.classId` giữ lớp gốc, còn transfer ghi `EnrollmentPlacement`. Vì vậy danh sách `/classes/:id` có thể giữ con ở lớp cũ và không có con ở lớp mới sau ngày hiệu lực. Đây là lỗi projection đọc; transfer và placement API đã tồn tại.

`GET /academic/enrollments` cho Teacher và prepare-roster đã xét placement; dùng lại nguyên tắc này, không coi toàn bộ các API roster đều sai.

**Cần BE:** trả roster hiện tại theo khoảng `effectiveFrom <= at < effectiveTo`, kỳ học và status; enrollment không có placement mới fallback classId. Cho đọc theo thời điểm để xem lịch sử. Giữ enrollment/payment/history gốc, phân biệt roster tại thời điểm với lịch sử enrollment. Rà các projection count và Teacher ownership liên quan cùng nguyên tắc; không đổi toàn bộ Enrollment.classId thành lớp mới để né lỗi.

**Contract đề xuất:** mở rộng `GET /classes/:id` với `at` hoặc trả roster riêng. BE cần ghi rõ ý nghĩa của `enrollments`, roster hiện tại, total/count và pagination để Web cập nhật tương thích.

**Nghiệm thu:** trước ngày transfer con ở roster lớp A; từ ngày hiệu lực ở B; buổi/điểm lịch sử A vẫn còn. Transfer tương lai không làm chuyển roster ngay hôm nay. Counts nhất quán với roster và không ảnh hưởng con khác.

**Nguồn:** `registration-flow.service.ts#getClass`, `enrollment-workflows.service.ts#transfer`, Prisma `EnrollmentPlacement`.

### BE-03 — P0: Staff báo nghỉ một buổi bị phụ thuộc Teacher đã prepare-roster

**Hiện tại:** `POST /academic/leaves` kind `SINGLE_ABSENCE` tìm `SessionParticipant` đã tồn tại; thiếu participant trả `INVALID_SESSION`. Generate/confirm-payment chưa bảo đảm có participant cho mọi buổi. Web phải hướng dẫn Teacher chuẩn bị roster trước nên luồng Staff chưa độc lập theo SRS §6.4–6.5.

**Cần BE:** trong service báo nghỉ, xác minh enrollment/placement/kỳ học/session hợp lệ và bảo đảm participant của đúng con, đúng buổi trong transaction, không cần Staff gọi POST roster của Teacher. Staff tạo leave vẫn được auto-approve theo hành vi hiện tại. Công bố rõ trạng thái nghỉ dự kiến trước khi Teacher finalize; nghỉ một buổi không tự biến thành EXCUSED của period pause.

**Nghiệm thu:** session vừa sinh, chưa prepare-roster → Staff ghi nghỉ thành công → đọc makeup source/candidates và đặt được buổi hợp lệ. Teacher prepare lại không nhân đôi participant/không mất đơn. Buổi ngoài placement/kỳ học, canceled hoặc con INACTIVE bị từ chối. Chốt attendance vẫn do Teacher.

**Nguồn:** `enrollment-workflows.service.ts#requestLeave/#decideLeave`, `catalog.service.ts#prepareRoster`.

### BE-04 — P0: hủy học bù xong không đặt lại được cùng buổi

**Đã tái hiện khi test BE/MySQL thật:** book enrollment E vào target T → cancel → book lại E vào T trả **409 `RESOURCE_CONFLICT`**. Web đang loại các target từng đặt khỏi candidates để tránh lỗi này, kể cả booking đã CANCELLED.

**Nguyên nhân từ source:** cancel chỉ đặt `SessionParticipant.cancelled=true`; book luôn create participant mới, đụng unique `(sessionId, enrollmentId)`. `MakeupBooking.replacementParticipantId` cũng unique và vẫn gắn booking lịch sử, nên chỉ thay create bằng upsert chưa đủ để bảo toàn booking history.

**Cần BE:** điều chỉnh mô hình/relation hoặc command để cho phép tái đặt chỗ đã hủy mà vẫn giữ lịch sử từng booking. Không xóa history và không mở hai booking hoạt động cho cùng source/chỗ. Cập nhật cả roster/transfer nếu chúng gặp participant MAKEUP đã hủy.

**Nghiệm thu:** book → cancel → rebook cùng target hợp lệ thành công; còn booking CANCELLED cũ và booking mới; chỉ một chỗ hoạt động. Hai request cạnh tranh không tạo hai booking. Booking đã COMPLETED không được hồi sinh như một booking mới.

**Nguồn:** `enrollment-workflows.service.ts#bookMakeup/#cancelMakeup`, Prisma `SessionParticipant`, `MakeupBooking`.

### BE-05 — P0: thiếu command cho học lại hồ sơ INACTIVE

**Hiện tại:** end-study đặt StudentProfile INACTIVE; đăng ký tiếp chặn `STUDENT_INACTIVE`. Không tìm thấy reactivate command; Parent PATCH con không có field status. SRS §3.3, §5.9 yêu cầu quay lại dùng hồ sơ cũ và tạo Enrollment mới.

**Contract đề xuất:** Staff `POST /students/:id/reactivate`, body `{ reason }`; trả hồ sơ cùng ID, status ACTIVE và lưu actor/time/reason/history. Có thể chọn thiết kế khác nếu giữ đúng luồng nghiệp vụ.

**Luồng cần đạt:** Staff chọn con cũ → cho học lại → registration/bill → nhận đủ tiền → confirm → Enrollment mới. Reactivate không tự tạo Enrollment chưa thanh toán và không hồi sinh Enrollment ENDED.

**Nghiệm thu:** giữ nguyên StudentProfile/Parent; history/grades/payments cũ vẫn đọc được; con khác không đổi. Replay không tạo hồ sơ mới; Teacher/Manager/Parent không dùng quyền Staff để reactivate.

**Nguồn:** `enrollment-workflows.service.ts#endStudent`, `registration-flow.service.ts#registrationProblem`.

### BE-06 — P1: makeup candidates chưa phản ánh điều kiện đặt và chỗ còn lại

**Hiện tại:** `GET /academic/participants/:id/makeup-candidates` lọc cùng lesson, buổi tương lai và SCHEDULED, trả `_count.participants`. Lệnh book còn kiểm tra kỳ học, approved leave, trùng lịch, regular reservations theo placement và makeup seats. Participants chưa prepare không đại diện cho số chỗ đã giữ.

**Cần BE:** dùng cùng hàm eligibility/capacity giữa candidates và book. Có thể chỉ trả buổi hợp lệ, hoặc bổ sung field **đề xuất** `eligible`, `availableSeats`, `reasonCodes`. Ràng buộc nào đã chọn phải có mô tả rõ, gồm cách tính giữ chỗ khi period pause. Web không tự tính capacity bằng participant count.

**Nghiệm thu:** lớp đầy dù chưa prepare-roster không được gợi ý là còn chỗ; target ngoài kỳ/trùng lịch/trong kỳ nghỉ bị loại hoặc có lý do. Booking vẫn kiểm tra lại trong transaction vì candidates là snapshot, không giữ chỗ. Sau BE-04, buổi đã hủy có thể xuất hiện lại nếu hợp lệ.

**Nguồn:** `enrollment-workflows.service.ts#makeupCandidates/#bookMakeup/#reservations`.

### BE-07 — P1: thiếu API chuyên cần dùng chung cho Teacher và Parent

**Hiện tại:** report đã tính `required`, `attended`, `attendancePercent`; chưa có API đọc summary/history chuyên cần cho màn lớp/học sinh. Chi tiết một buổi đã có participation nhưng không thay thế chuyên cần cả kỳ.

**Contract đề xuất:** Teacher `GET /classes/:id/attendance-summary?fromDate=&toDate=&studentId=`; Parent `GET /me/students/:id/attendance?fromDate=&toDate=`. Dùng một service tính cho cả hai và report, không tạo công thức riêng theo client.

**Dữ liệu cần chốt:** các counts PRESENT/ABSENT/MADE_UP/EXCUSED, required/attended/percent, range, lịch sử participant/session/enrollment và source↔makeup. MADE_UP hiện là kết quả suy ra từ source booking COMPLETED; không bắt buộc đổi raw attendance enum chỉ để trả trạng thái hiệu lực này. Quy định rõ mẫu số theo buổi đã chốt hay toàn kỳ; giữ nhất quán với report hiện tại, `required=0` trả null thay vì tỷ lệ giả.

**Nghiệm thu theo SRS §5.5–5.6:** `(present + made_up) / required`; PERIOD_PAUSE EXCUSED không tăng required; lượt makeup không thêm một buổi bắt buộc; đi bù PRESENT tính cho source một lần, MISSED giữ absent. Web/Parent/report ra cùng kết quả; Parent chỉ đọc con mình, Teacher chỉ đọc phạm vi được phân công.

**Nguồn:** `reports.service.ts#create`, `enrollment-workflows.service.ts#finalizeAttendance`.

### BE-08 — P1: thiếu email tự động, lưu kết quả và retry bền vững

**Hiện tại:** announcement/reminder send API đã có và Web đã nối. Gửi đồng bộ, trả per-recipient `sent` và `automaticRetry:false`; chưa lưu delivery history/retry. Confirm-payment/attendance/leave/makeup/transfer/end chưa thấy enqueue email nghiệp vụ. Schema có `OutboxEvent`, nhưng hiện liên kết bắt buộc `RegistrationOrder`; không đủ chỉ bật worker rồi dùng nguyên model cho mọi loại event.

**Cần BE theo SRS §3.6–3.11, §4.7, §5.11:** lưu event cùng transaction nghiệp vụ; worker gửi và retry có giới hạn/backoff; lưu recipient/event/status/attempts/nextAttemptAt/lastError/sentAt; chống gửi lặp khi replay command. Điều chỉnh outbox/relation để hỗ trợ các aggregate cần thông báo. SMTP lỗi không rollback Payment/Enrollment/Attendance.

Email cần tên con, môn/lớp/lịch hoặc source/target phù hợp sự kiện; receipt/payment phải đúng dữ liệu đã confirm. DRAFT không được thông báo như đã thu tiền/ghi danh thành công. Khóa chống lặp phân biệt retry kỹ thuật với lần resend chủ động. Lưu announcement và gửi announcement là hai trạng thái riêng.

**API vận hành đề xuất:** `GET /email-deliveries`, `POST /email-deliveries/:id/retry`; BE chốt role được đọc/retry và response. Endpoint này là cách vận hành đề xuất; SRS bắt buộc độ tin cậy gửi/lưu/retry, không bắt buộc đúng tên URL. Lịch tự động nhắc học phí cần chốt tần suất và tránh gửi lại cùng kỳ.

**Nghiệm thu:** SMTP hỏng → nghiệp vụ thành công, delivery FAILED/PENDING có attempts → khôi phục SMTP, retry thành SENT; replay confirm/finalize không phát sinh email nghiệp vụ trùng. Hai con cùng Parent vẫn có nội dung đúng con. Manual send không báo thành công toàn bộ nếu có recipient fail.

**Nguồn:** `registration-flow.service.ts#confirmPayment`, `enrollment-workflows.service.ts`, `announcements.service.ts`, Prisma `OutboxEvent`.

### BE-09 — P1: thiếu mời và duyệt Teacher

**Hiện tại:** POST `/teachers` tạo tài khoản trực tiếp bằng mật khẩu ban đầu, ACTIVE. API CRUD này đã nối Web; chưa có invitation/accept/review. `LinkInvitation` của registration cũ không phải Teacher invitation.

**Cần BE theo SRS §3.1:** luồng Manager mời → người nhận hoàn tất thông tin → Manager duyệt → Teacher đủ điều kiện được phân công. BE/nhóm sản phẩm chốt thứ tự accept/approve và trạng thái invitation, không tự coi direct-create là đã đáp ứng cả luồng mời/duyệt.

**Nhóm URL đề xuất:** `POST/GET /teacher-invitations`; accept, approve/reject, revoke/resend theo ID/token. Token có hạn, một lần sử dụng; không tự đăng ký role Teacher qua Parent register. Chỉ account đã ACTIVE/được duyệt mới assign vào lớp.

**Nghiệm thu:** kiểm tra mời trùng email, token hết hạn/đã dùng, reject/revoke/resend, đúng role Manager và lịch sử actor. Giữ API tạo Teacher trực tiếp hiện tại nếu contract vẫn cho phép.

**Nguồn:** `directory.controller.ts`, `directory.service.ts`, `auth.controller.ts`.

### BE-10 — P1: thiếu thêm Manager và phân quyền trong trung tâm

**Hiện tại:** directory target STAFF/TEACHER; không có Manager list/invitation/permission API. SRS §3.1, §5.1 yêu cầu nhiều Manager, mời thêm và phân quyền.

**Nhóm URL đề xuất:** `GET/PATCH /managers`, `POST/GET /manager-invitations`, accept/revoke/resend và permission command nếu nhóm chốt quyền con. Chốt tập permission và cách trả về phiên trước khi Web xây UI; vẫn giữ 5 role, không tự tạo ADMIN thứ sáu.

**Nghiệm thu:** Manager đủ quyền mời/quản lý Manager khác; người không đủ quyền bị 403; permission thay đổi được áp dụng server-side và ghi history. Không cho Parent register hoặc Staff CRUD tạo account MANAGER bằng field role tùy ý.

**Nguồn:** `directory.controller.ts`, `directory.service.ts`, `auth.controller.ts`, Prisma `UserRole`.

### BE-11 — P1: thiếu phòng học trong lớp/lịch

**Hiện tại:** không có Room/roomId trong Class/ClassSession và không có rooms controller. SRS §3.1, §6.2, model §7 có chọn phòng khi tạo lớp.

**Contract đề xuất:** Manager `GET/POST /rooms`, `PATCH /rooms/:id`; dữ liệu tối thiểu ID, tên, sức chứa, status. Gắn roomId vào class và phòng thực tế của session/lịch. BE chốt đọc danh mục cho các role cần xem lịch và quy tắc room capacity so với class capacity.

**Nghiệm thu:** create/update/generate/reschedule kiểm tra phòng tồn tại/hoạt động, đủ sức chứa và không trùng giờ; trả thông tin phòng trong lịch/detail. Migration có kế hoạch cho lớp đã tồn tại không có phòng, không làm mất sessions/participants.

**Nguồn:** Prisma `Class`, `ClassSession`, registration/curriculum scheduling DTO và service.

### BE-12 — P1: thiếu đổi giáo viên lớp đang chạy và dạy thay buổi hiện hữu

**Hiện tại:** POST/PATCH classes đã có teacherId và Web đã nối. PATCH đổi giáo viên bị `CLASS_TEACHER_LOCKED` khi còn session SCHEDULED tương lai. Không có command gán Teacher khác cho buổi hiện hữu. API đổi giờ/cancel session hiện tại không phải API dạy thay.

**Hai luồng cần BE theo SRS §3.1, §5.4, §5.14:**

1. **Đổi giáo viên lâu dài:** Manager chọn Teacher và ngày hiệu lực → kiểm tra ảnh hưởng/conflict → cập nhật phân công và các buổi tương lai phù hợp → giữ Teacher buổi quá khứ và history.
2. **Dạy thay một buổi:** Manager chọn Teacher thay thế → kiểm tra hoạt động/trùng lịch → cập nhật phân công đúng buổi, giữ sessionId/lesson/participants → ghi actor/reason/time/history. Teacher không tự nhận lớp.

**Nhóm URL/body đề xuất:** `POST /classes/:id/teacher-assignments` với `{ teacherId, effectiveAt, reason }`; `GET /academic/sessions/:id/substitute-candidates`, `POST /academic/sessions/:id/substitutions` với `{ teacherId, reason }`. Có preview/expectedRevision hoặc cơ chế tương đương chống ghi đè.

**Nghiệm thu:** không tạo buổi trùng để mô phỏng dạy thay; không đổi giáo viên của buổi đã chốt. Lịch/quyền attendance đúng Teacher của từng buổi. BE phải chốt quyền đọc assignments/grades/report lịch sử khi đổi Teacher, vì hiện assessment/report dựa cả creator và Teacher hiện tại của Class; tránh vô tình mất lịch sử hoặc trao quyền toàn lớp quá rộng.

**Nguồn:** `registration-flow.service.ts#updateClass`, `academic-access.service.ts`, `assessment.service.ts`, `reports.service.ts`.

### BE-13 — P0 dữ liệu liên thông: Parent calendar chưa đủ học bù và lịch sử của từng con

**Hiện tại:** Parent `GET /academic/scheduled-sessions` lấy enrollments ACTIVE và classes theo placement; DTO list chưa nhận studentId. Target makeup ở lớp ngoài placement có thể không có trong list, enrollment ENDED bị loại, response thiếu participation/identity con/kind. `GET /academic/scheduled-sessions/:id?studentId=` đã có; không đề nghị tạo lại detail API.

**Cần BE theo SRS §3.5, §4.2, §5.9:** mở rộng list hiện có hoặc thêm `GET /me/students/:id/calendar` **đề xuất**. Trả REGULAR + MAKEUP + lịch sử hợp lệ của đúng con trong range; có student/enrollment/participant/kind/effective attendance/source-target context. Enrollment ENDED vẫn xem được buổi lịch sử thuộc kỳ đã học, không cấp quyền xem buổi mới sau kết thúc.

**Nghiệm thu:** hai con cùng Parent; chỉ một con có makeup lớp khác; transfer giữa kỳ; period pause; end một môn/end-study → list/detail còn đúng nguồn dữ liệu và lịch sử theo con, không lộ học sinh khác. Đây là yêu cầu BE đồng bộ kết quả vận hành trên Web; không sửa client Mobile trong lượt tài liệu này.

**Nguồn:** `curriculum-scheduling.service.ts#sessions/#sessionDetail`, `curriculum-scheduling.dto.ts#SessionQueryDto`, `enrollment-workflows.service.ts#makeups`.

## 4. Các mục P2 hoặc cần chốt trước khi làm thêm

| Mã    | Khoảng còn lại                                          | Hướng đề xuất và giới hạn phạm vi                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-14 | Tự sửa profile; đổi/quên/reset mật khẩu                 | Chưa có PATCH self-profile/change/forgot/reset. Có thể dùng `PATCH /auth/me`, POST `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`; đây là backlog UX, không phải nhóm chức năng riêng bắt buộc được SRS liệt kê. Không đổi email/role qua generic profile PATCH.                                                                                                                                                                  |
| BE-15 | Query tổng hợp và contract đọc                          | Teacher queue/detail hiện Web ghép assignments/submissions; đề xuất aggregate queue và submission detail, filter class/student/status/date, pagination có total. Grade/progress summary theo con và metadata range/score scale cần chốt; điểm PUBLISHED đã có, không phải thiếu grading API. Report averageScore hiện là phần trăm 0–100; ghi rõ khi dùng cùng summary khác. Không đổi array hiện tại thành envelope khác mà không có kế hoạch tương thích. |
| BE-16 | Kết thúc period pause sớm, đổi booking atomic           | Cancel leave chỉ hủy toàn đơn; đã có buổi hoàn thành có thể bị LEAVE_HAS_ACTIVITY. Nếu cần học lại sớm, đề xuất POST `/academic/leaves/:id/end-early` giữ EXCUSED quá khứ và mở phần tương lai. Nếu cần nút đổi booking, đề xuất POST `/academic/makeups/:id/reschedule`: target mới thất bại phải giữ booking cũ. Tự hết hạn period pause đã có; không bắt buộc thêm resume API cho trường hợp hết hạn bình thường.                                        |
| BE-17 | Teacher xác nhận “set cứng” lịch                        | SRS §3.4/§8 có chức năng, nhưng §9 để mở cách hiểu. Khóa lịch tự động do enrollment/session đã có, chưa phải Teacher xác nhận. Nếu giữ nghĩa confirm/lock, đề xuất `PUT /classes/:id/schedule-confirmation` cho Teacher được phân công; phải chốt unlock/history trước, không cấp Teacher quyền sửa lịch tuần của Manager.                                                                                                                                  |
| BE-18 | Audit log UI, payroll, AI soạn giáo trình, inbox/unread | Chưa có generic GET audit log cho màn Manager, nhưng nhiều command đã lưu history; không kết luận chưa có lịch sử toàn hệ thống. Payroll, Teacher báo nghỉ riêng, AI soạn bài, inbox/push chưa có yêu cầu chi tiết tương ứng; chỉ làm khi nhóm chốt. SRS hiện yêu cầu email, không bắt buộc inbox/SMS/push hoặc bộ tính lương đầy đủ.                                                                                                                       |

**Chốt thêm cho transfer:** BE hiện yêu cầu cùng Program **và cùng monthlyFee**. SRS §5.7 chỉ nói cùng Program/lịch khác/còn chỗ. Web đang theo ràng buộc BE; nhóm cần xác nhận giữ cùng phí hay có điều chỉnh phí. Không tự sửa bill/payment lịch sử và không bỏ check fee khi chưa có quy tắc mới.

## 5. Thứ tự triển khai và checklist BE bàn giao

1. Sửa BE-01–BE-05 và BE-13 để khép các lỗi quyền/dữ liệu/đứt luồng.
2. BE-06–BE-08: thống nhất candidates, chuyên cần và email bền vững.
3. BE-09–BE-12: hoàn thiện nghiệp vụ Manager theo SRS.
4. Chốt BE-14–BE-18 và quy tắc học phí khi transfer trước khi mở rộng.

Mỗi nhóm bàn giao cần có:

- Method/path, role/ownership, DTO/query/response, ví dụ success/error và error codes; đánh dấu field mới/đổi ý nghĩa.
- State transitions, actor từ JWT, ảnh hưởng tới session/participant/placement/payment và lịch sử.
- Migration/config nếu cần, ghi rõ triển khai với dữ liệu hiện có; không coi chưa deploy migration là thiếu endpoint.
- Test BE gọi trực tiếp sai role, hai con cùng Parent, transfer tương lai, makeup/leave/ENDED và replay/concurrency phù hợp lệnh.
- Riêng email: lưu/retry/dedup và SMTP lỗi không rollback; riêng chuyên cần: Teacher/Parent/report cùng công thức.
- Cập nhật Swagger cùng `ACADEMIC_API_FLOW.md`/tài liệu contract liên quan; gửi Web contract cuối cùng để nối các phần mới.

## 6. Căn cứ để BE tra source

- [SRS 03/10](../SRS.md): §3, §4.1–4.7, §5.5–5.14, §6, §8–9.
- [Web đã tích hợp và kết quả test](WEB_EXISTING_API_INTEGRATION.md).
- [Audit trước tích hợp](API_GAP_BY_ROLE_SRS.md): chỉ dùng làm căn cứ, các mục “Có BE, chưa nối” của Web đã được xử lý ở commit nêu đầu file.
- BE: `src/modules/academic/{academic-access, catalog, enrollment-workflows, assessment, reports, announcements}.service.ts`; `src/modules/directory/`; `src/modules/registration-flow/registration-flow.service.ts`; `src/modules/curriculum-scheduling/`; `src/modules/auth/`; `prisma/schema.prisma`.

File này chỉ ghi yêu cầu bàn giao; chưa triển khai các sửa đổi BE hoặc sửa Mobile.

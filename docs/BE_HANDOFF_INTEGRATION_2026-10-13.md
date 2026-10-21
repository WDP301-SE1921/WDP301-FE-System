# Web tích hợp BE sau handoff 13/10/2026

Đối chiếu BE `d1ce7dc` (PR #8, fix `02cf6a9`), Web `39420d4` cộng thay đổi local. Đã fetch FE/BE; hai nhánh `dev` trùng `origin/dev`. Theo yêu cầu cuối của người dùng, phạm vi chỉ BE và FE; các thay đổi FEM của phiên này đã hoàn tác. Không commit/push.

## Hành vi Web sau sửa

| Vai trò            | Luồng                  | Thay đổi                                                                                                                                                            |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quản lý            | Phân công giáo viên    | Đọc `pendingTeacher`/`pendingTeacherFrom`, giữ giáo viên hiện tại tới mốc hiệu lực. Hủy phân công chờ bằng cách gửi lại `teacherId` hiện tại, có lý do và xác nhận. |
| Quản lý            | Mời giáo viên/Quản lý  | Nối `POST /account-invitations/:id/resend`; link cũ hết hiệu lực và bị xóa khỏi UI sau gửi lại. Lời mời hết hạn được gửi lại; danh sách hiển thị `acceptedUser`.    |
| Quản lý            | Tạo giáo viên          | Dẫn sang luồng mời → nhận → duyệt. BFF bỏ `POST /teachers` vì BE trả 410 `TEACHER_INVITATION_REQUIRED`; tạo Staff vẫn hoạt động.                                    |
| Quản lý, Nhân viên | Danh sách lớp          | Hiển thị phòng và `rosterCount` do BE tính theo placement, thay vì số ghi danh gốc `_count`.                                                                        |
| Giáo viên          | Chuyên cần             | Đọc `students[]` của BE và gửi ngày `YYYY-MM-DD`, không tự cộng lại lịch sử ở Web. Loại `EXCUSED`, học bù hoàn thành tính một lần.                                  |
| Quản lý, Nhân viên | Thông báo/nhắc học phí | Dùng kết quả `{ email, queued: true }` và thông báo “xếp hàng gửi”. Không báo email đã giao chỉ từ kết quả enqueue.                                                 |
| Quản lý, Nhân viên | Lịch sử email          | Đọc mọi loại sự kiện outbox và tự tải lại khi đang chờ/đang gửi. Theo dõi `SENT`, số lần thử và lỗi, retry theo API hiện có.                                        |
| Người dùng Web     | Đổi mật khẩu           | Bỏ xử lý tạm đổi 401 thành 400. Sai mật khẩu hiện tại là 400 `AUTH_CURRENT_PASSWORD_INVALID`; 401 hết phiên thật vẫn đi qua refresh/logout bình thường.             |

Các luồng Staff kết thúc nghỉ sớm, cho học lại, chuyển lớp/học bù và Teacher/Designer đã nối ở `WEB_EXISTING_API_INTEGRATION.md`; không thêm quyền ngoài role SRS. Quản lý có đủ quyền role, không có quyền con. Chuyển lớp vẫn bắt buộc cùng học phí.

## Xác minh với BE thật

- BE typecheck, build, lint đạt; 21 unit và 53 e2e đạt với MySQL Docker biệt lập.
- Web production build đạt; lint 0 lỗi, 4 warning unused có sẵn ở file ngoài thay đổi.
- 24 ca hồi quy BE/FE cross-role đạt, không import FEM: quyền Manager điểm danh, roster sau chuyển, API lịch học bù Parent, lịch sử ghi danh kết thúc, nghỉ trước roster, hủy/đặt lại học bù, BFF/cookie/Origin. Sáu lỗi BE audit 12/10 không còn tái hiện với BE mới.
- 10 ca HTTP handoff đạt: giữ phiên khi gõ sai mật khẩu, ngày cuối tính buổi tối, chuyên cần theo con, capacity/phòng, phân công chờ/hủy, invitation và token, role-only Manager, kết thúc nghỉ sớm giờ Việt Nam và không ảnh hưởng kỳ nghỉ khác, email ẩn payload.
- Docker build từ Dockerfile BE đạt; 7 ca API ghi/đọc thật đạt (JWT/đọc con, tài khoản, sức chứa/roster, phân công chờ, resend token, quyền, SMTP worker). Kết quả ở `../../audit-20261013/docker-results.json`.
- Giao diện FE local: đăng nhập Manager; tạo/gửi lại lời mời; link cũ được xóa; hẹn và hủy giáo viên; gửi thông báo lớp; email chuyển sang `SENT`, thư tới SMTP local. FE nối BE Docker cũng tạo thông báo, enqueue và theo dõi giao email thật.

Thư gửi qua giao thức SMTP tới máy chủ bắt thư local, không tới hộp thư bên ngoài. Khi resend trước lúc worker giao thư, outbox cũ có thể thành `FAILED` với “Invitation token was replaced or expired”; thư mang token mới được gửi. Đây là vô hiệu hóa token cũ đúng hợp đồng, không phải lỗi SMTP.

Bằng chứng và script nằm ở `D:/kỳ 8/audit-20261013`: `be-fe-regression-results.json`, `handoff-results.json`, `docker-results.json`, `results.json`, `invitation-resent.jpg`, `pending-teacher.jpg`, `announcement-queued.jpg`, `email-sent.jpg`, `docker-announcement-queued.jpg`, `docker-email-sent.jpg`. Log BE/FE ở workspace cùng ngày. Hồi quy có đọc Parent API của BE; không import source FEM.

## Giới hạn kiểm thử

Chỉ migrate cơ sở dữ liệu kiểm thử được tạo riêng. Không migrate DB ứng dụng, không sửa cấu hình người dùng, không gọi AI/S3 hay gửi email ngoài local. `npm run test:registration*` trỏ vào `tests/` vốn bị gitignore và không có trong checkout này; các ca HTTP/hồi quy chạy bằng script audit riêng. Không tuyên bố kiểm thử toàn bộ chức năng bằng giao diện: các ca nghiệp vụ rộng hơn được xác minh bằng API/e2e.

# Yêu cầu bổ sung/sửa BE cho web STAFF và MANAGER

Ngày: 03/10/2026. Phạm vi đối chiếu: ba tài liệu gốc, `src/modules/auth`, `src/modules/registration-flow`, `src/modules/academic` và Prisma schema của `WDP301-BE-System`. File này ở FE để gửi nhóm BE; không thay đổi nguồn BE.

Luồng hiện đã nối trên FE: đăng nhập STAFF → chọn phụ huynh đã xác minh → chọn con → chọn môn/lớp/ngày/gói tháng → DRAFT → thu đủ tiền offline → COMPLETED và biên lai. Phụ huynh tự đăng ký bằng email/mật khẩu và tự tạo con trên mobile. Quản lý không được tạo đăng ký hoặc xác nhận học phí theo SRS mới.

## 0. P0 — Tìm kiếm email và quyền STAFF theo SRS mới

BE hiện chỉ có `GET /parents/lookup?email=<email đầy đủ>` với `@IsEmail()` và so sánh chính xác. API đó không thể trả gợi ý sau 1–2 ký tự. FE không sửa nguồn BE và không giả lập tài khoản phụ huynh.

Đề nghị triển khai contract sau để bật đầy đủ giao diện đã chuẩn bị:

- `GET /api/v1/parents/search?email=ng&limit=10`, JWT, **chỉ STAFF**.
- `email`: trim/lowercase, từ 2 đến 255 ký tự, là chuỗi tìm kiếm từng phần, không dùng `@IsEmail()` cho query này; `limit`: số nguyên 1–10, mặc định 10.
- Chỉ tìm user `role=PARENT`, email chứa chuỗi tìm kiếm không phân biệt hoa thường; thứ tự email tăng dần, tối đa limit bản ghi. Không trả tài khoản nhân sự hoặc mật khẩu/token.
- Response dưới đây dùng envelope chuẩn; thiếu kết quả trả `data: []`, không phải lỗi 404. Chỉ trả thông tin tóm tắt, không cần trả danh sách con ở bước gợi ý.

```json
{
  "success": true,
  "data": [{
    "id": "parent-user-id",
    "email": "nguyen@example.com",
    "displayName": "Nguyễn Văn A",
    "status": "ACTIVE"
  }]
}
```

Sau khi chọn tài khoản, FE gọi `GET /parents/lookup?email=<email đã chọn>` để tải các hồ sơ con. Khi endpoint search chưa có (404/405/501), FE báo chưa hỗ trợ gợi ý; nếu đã nhập email đầy đủ thì dùng lookup hiện có để hiển thị đúng tài khoản cho người dùng chọn.

`createRegistration`, `getRegistration`, `cancelRegistration`, `confirmPayment`, `receipt` trong service hiện cho cả STAFF/MANAGER. Cần sửa thành STAFF cho nghiệp vụ quầy theo SRS §§3.3, 3.6, 8. FE đã chặn manager tại `/staff/*` và BFF `/registrations*`; BE cũng phải chặn khi client gọi trực tiếp. Giữ `confirmedBy`/actor theo STAFF đã xác thực, không nhận actor từ client.

`POST /auth/register` đã hỗ trợ email/password, không có token/mã mời: không yêu cầu BE tạo lại endpoint này. Xác minh email hiện là điều kiện BE bắt buộc trước khi phụ huynh tạo hồ sơ con; đây không phải bước claim đăng ký sau thanh toán. Không thêm bước xác nhận Enrollment từ phụ huynh sau thu tiền.

## 1. Điều kiện để chạy nghiệm thu thực tế

- Cần tài khoản `MANAGER` và `STAFF` ACTIVE có mật khẩu thực. Không có endpoint public tự đăng ký hai role này; không thấy seed nhân sự trong repo BE. Cung cấp seed/script quản trị hoặc tài khoản test qua kênh riêng, không đưa mật khẩu vào tài liệu.
- Apply migration đăng ký mới; chạy BE ở origin cấu hình cho FE. Cung cấp tài khoản PARENT đã xác minh có ít nhất hai hồ sơ con ACTIVE.
- Cấu hình `SMTP_URL`, `MAIL_FROM`. Hiện thiếu SMTP thì không gửi token; token không trả qua register response nên phụ huynh không thể hoàn tất xác minh chỉ bằng UI.
- `FEATURE_PROGRESS.md` còn ghi email verification là Pending trong khi module auth mới đã triển khai. Cập nhật tài liệu tiến độ để tránh FE/mobile dùng flow cũ.

## 2. API còn thiếu cho các mục trong ảnh yêu cầu

Tên endpoint dưới đây là **đề xuất**, chưa được FE gọi khi BE chưa có contract.

| Ưu tiên | Nhu cầu                                                 | Hiện trạng BE                                                                                         | Đề xuất                                                                                                                                   |
| ------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P0      | CRUD nhân viên/giáo viên cho quản lý                    | Chưa có controller nhân sự/teacher management                                                         | `GET/POST /staff`, `PATCH /staff/:id`, `GET/POST /teachers`, `PATCH /teachers/:id`; disable thay vì hard delete tài khoản đã có dữ liệu   |
| P0      | Chọn giáo viên để gán lớp                               | `PATCH /classes/:id` đã nhận `teacherId` và kiểm tra TEACHER ACTIVE; thiếu danh sách để chọn          | `GET /teachers?status=ACTIVE&search=...` trả id, displayName, email, status. FE tạm gán bằng mã tài khoản được cung cấp                   |
| P1      | Lịch sử thu học phí toàn trung tâm                      | Chỉ đọc đăng ký/biên lai theo ID; không có GET danh sách registrations/payments                       | `GET /registrations` và `GET /payments` có search, trạng thái, khoảng ngày, pagination; kèm tổng tiền thật                                |
| P1      | Dashboard tiền học phí, số học sinh/giáo viên/nhân viên | Không có dashboard aggregation endpoint                                                               | `GET /dashboard?fromDate=...&toDate=...`; chốt cách đếm ACTIVE và tiền CONFIRMED, không đếm draft                                         |
| P1      | CRUD phụ huynh cho quản lý                              | Chỉ tra email chính xác; PARENT tự đăng ký; chưa có quản trị tài khoản phụ huynh                      | `GET /parents`, `GET /parents/:id`, `PATCH /parents/:id` cho tên/phone/status; không tạo hoặc đặt lại mật khẩu của phụ huynh từ nhân viên |
| P1      | Danh sách/chi tiết con và enrollment cho nhân viên      | Lookup trả con ACTIVE; `/me/students/:id/*` chỉ PARENT. Academic enrollments có nhưng không cho STAFF | `GET /students`, `GET /students/:id/enrollments`, `GET /students/:id/schedule` hoặc mở đọc academic phù hợp cho STAFF                     |
| P1      | Sửa/xóa chương trình                                    | `/programs` chỉ GET/POST; chưa PATCH/DELETE                                                           | `PATCH /programs/:id`, quy định archive/xóa nếu chưa có lớp; ràng buộc khi đổi khối/môn                                                   |
| P1      | Chi tiết lớp theo ID                                    | Có GET danh sách nhưng chưa GET `/classes/:id`                                                        | Bổ sung detail kèm program, teacher displayName, weeklySchedules, enrollment có pagination                                                |
| P1      | Khôi phục nháp mất response                             | POST tạo draft chưa có idempotency; không có danh sách nháp theo người tạo                            | Nhận `Idempotency-Key` cho create draft và `GET /registrations?status=DRAFT&createdBy=me`                                                 |
| P2      | Quên/đổi mật khẩu, sửa hồ sơ nhân sự                    | Chưa có endpoint                                                                                      | Chốt forgot/reset/change password, cập nhật profile; FE hiện không báo gửi email giả                                                      |

## 3. Academic đã có nhưng STAFF chưa được cấp quyền

Không cần tạo lại các endpoint dưới đây. Cần BE chốt và sửa quyền theo vai trò nhân viên trong ảnh trước khi tích hợp:

- `GET /academic/enrollments`, `GET /academic/sessions`, `GET /academic/classes`, `GET /academic/leaves`, `GET /academic/makeups` và các API xem roster/candidates đang thiết kế cho MANAGER/TEACHER/PARENT, chưa đầy đủ quyền STAFF.
- Đổi lịch cố định cho một con: `POST /academic/enrollments/:id/transfer` đã có. Đây là chuyển placement lớp, không phải sửa lịch tuần toàn lớp. Cần quyền STAFF và API chọn lớp/lịch/enrollment phù hợp. Lịch `/me/students/:id/schedule` hiện lấy class trên enrollment, cần đối chiếu placement sau transfer để không trả lịch cũ.
- Xếp học bù: `GET /academic/participants/:id/makeup-candidates`, `POST /academic/makeups`, hủy booking đã có. Quyền đọc/ghi STAFF cần được chốt; bổ sung thông tin học sinh/lớp để UI không phải nhập participant ID.
- Nghỉ dài hạn: `POST /academic/leaves` đã có với kind `PERIOD_PAUSE`, cùng decide/cancel. Chốt STAFF tạo hộ và tự duyệt hay phải MANAGER duyệt. Danh sách phải trả học sinh/enrollment/lớp và cho lọc ngày/trạng thái.
- Nghỉ luôn học sinh: `POST /academic/students/:id/end-study` và `POST /academic/enrollments/:id/end` đã có. Cấp quyền STAFF nếu đúng nghiệp vụ; trả tác động lên các enrollment/buổi học/học bù, có audit. Không coi đây là yêu cầu hoàn phí.
- CRUD giáo trình chi tiết và tạo buổi học ở `/academic/lessons`, `/academic/sessions` đã có một phần. Chốt contract sửa/archive, designer/manager quyền và đồng bộ với lịch tuần mới. Luồng registration mới chỉ tạo lịch tuần, không tự tạo Session.

Các màn academic ngoài luồng đăng ký vẫn chưa được nối trong thay đổi FE này. Việc thiếu quyền STAFF khác với việc không tồn tại API; không cần BE triển khai trùng module.

## 4. Hành vi contract cần sửa/chốt

1. **Danh sách lớp theo kỳ học**: `ClassFilterDto` nhận `startDate`, `packageMonths` nhưng `listClasses` chưa sử dụng. `_count.enrollments` đếm mọi enrollment nên không phải số chỗ trong kỳ. Đề xuất trả `availableSeats`, `isEligible`, `ineligibleReason` theo `[startDate,endDate)` và trùng giờ. FE hiện không dùng count để khẳng định còn chỗ.
2. **Pagination**: programs/classes hiện trả mảng thuần không có total/hasNextPage. FE đọc các trang limit=100 đến khi trang cuối ít hơn 100. Đề xuất envelope data có `items`, `page`, `limit`, `total` hoặc metadata đã thống nhất. Thay contract cần báo trước cho FE/mobile.
3. **Hủy nháp**: service dùng Prisma update `{ id, status: 'DRAFT' }`; order không tồn tại/không còn DRAFT có thể thành INTERNAL_ERROR. Trả `REGISTRATION_NOT_FOUND` (404), `REGISTRATION_NOT_DRAFT` (409); request hủy lặp nên trả CANCELLED hiện tại.
4. **Ngày xác nhận thanh toán**: create draft kiểm tra startDate >= hôm nay; confirm gọi `assertRegistrationAllowed` nhưng không kiểm tra lại ngày đã qua. Chốt nháp qua ngày có được thanh toán không; nếu không, trả `INVALID_START_DATE` để tạo nháp mới.
5. **Biên lai**: label hiện chỉ kiểm tra ngày bắt đầu, nên order hết kỳ vẫn có thể nói “Đang học”. Trả term status theo cả endDate và trạng thái enrollment. FE đang tự tính nhãn đúng, không dùng label này.
6. **Idempotency confirm**: tài liệu nói completed với key mới bị từ chối, nhưng service hiện trả biên lai cho mọi key mới nếu order COMPLETED. Chốt contract; bind scope/key với actor/body/order, báo conflict khi key/body không khớp. FE giữ nguyên key/body cho retry.
7. **Sĩ số theo thời gian**: hiện seatCount đếm tất cả ACTIVE giao nhau với cả kỳ, có thể từ chối một kỳ khi nhiều ghi danh liên tiếp không đồng thời chạm sức chứa. Chốt cách đếm peak occupancy theo các mốc start/end; nghiệm thu trường hợp hai gói không giao nhau.
8. **Khoảng thời gian academic**: `inTerm` đang dùng `endDate >= day`, khác registration `[startDate,endDate)`. Chốt không cho buổi học vào đúng ngày hết hạn. Schedule của con cần chỉ trả ACTIVE trong kỳ và lớp theo placement có hiệu lực.

## 5. Nghiệm thu đề nghị BE

- STAFF tra cứu, tạo nháp, thu tiền và đọc biên lai; MANAGER/TEACHER/PARENT không được thu tiền. Kiểm tra thêm search từng phần, không trả tài khoản ngoài role PARENT.
- Email chưa xác minh, parent DISABLED, con INACTIVE bị chặn; không có tạo học sinh bằng tài khoản nhân viên trong flow mới.
- Lớp đóng, thiếu lịch, sai khối, đầy chỗ, trùng lớp/trùng giờ trả code cụ thể với requestId.
- Hai xác nhận cạnh tranh chỗ cuối chỉ một thành công; cùng idempotency key không có hai Payment/Enrollment.
- Cancel nháp không tồn tại/đã thanh toán không thành lỗi 500; nháp mất response có cách khôi phục.
- Khối 6–9, ISO weekday 1–7, Decimal string, cuối tháng/năm, ngày hết hạn exclusive đồng nhất registration và academic.
- Mobile thấy lớp/kỳ học/biên lai thật sau thanh toán và lịch đúng sau transfer/nghỉ dài hạn.

Luồng FE không cần endpoint tạo/gửi/claim link enrollment theo cơ chế cũ. Nếu vẫn giữ endpoint cũ để tương thích dữ liệu, không dùng làm mặc định cho đăng ký mới.

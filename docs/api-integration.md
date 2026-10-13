# Tích hợp đăng nhập và đăng ký học trên web

Cập nhật API bill 06/10/2026: wizard và `/staff/payments` đã đọc `GET /registrations/:id/bill` thật, dùng giá snapshot và popup xác nhận `POST /registrations/:id/confirm-payment` với receiptNumber/Idempotency-Key. Chưa có API lưu phương thức/thời gian thu/mã ngân hàng; các yêu cầu BE và kết quả kiểm thử ở [BILL_PAYMENT_API_INTEGRATION.md](BILL_PAYMENT_API_INTEGRATION.md).

Cập nhật 06/10/2026: đã nối giáo trình/sinh lịch và màn nhân viên thêm học sinh từ lớp, xem [CURRICULUM_API_INTEGRATION.md](CURRICULUM_API_INTEGRATION.md). BE hiện đã có `GET /parents/search` và kiểm tra lớp theo kỳ; các ghi chú “API chưa có” bên dưới là trạng thái tại ngày đối chiếu cũ.

Cập nhật kiểm thử 06/10/2026: BE đã khởi chạy với Docker MySQL sau chuẩn bị dependency/migration đã có; 33 e2e registration đạt. Timeline các bước đã bỏ khung viền. Proxy/restore giữ cookie khi BE trả 429; sidebar tắt prefetch để giảm các lần kiểm tra phiên không cần thiết. Bill/popup thu tiền theo phương thức và bảng thu chi mới là phần chuẩn bị FE, chưa nối metadata vào API cũ; contract và ảnh tại [BILL_PAYMENT_API_CONTRACT.md](BILL_PAYMENT_API_CONTRACT.md).

Ngày đối chiếu: 03/10/2026. Chỉ thay đổi `WDP301-FE-System`; đọc controller, DTO và service trong BE cùng `FEATURE_PROGRESS.md`, `EDUGRADE_BACKEND_FLOW.md`, `PARENT_REGISTRATION_API_GUIDE.md`.

## Khởi chạy

1. BE cần chạy, apply migration `20261002000000_parent_registration_flow` và có tài khoản `STAFF`, `MANAGER` đang hoạt động. Web không tự tạo nhân sự hoặc sửa database BE.
2. Sao chép `.env.example` thành `.env.local`. Đặt `BACKEND_API_URL=http://localhost:3000/api/v1`, hoặc địa chỉ API thực tế.
3. Chạy `npm run dev -- --port 3001`. Không dùng cùng port với BE.
4. Phụ huynh hoàn tất đăng ký, xác minh email và tạo hồ sơ con trên mobile. SMTP của BE phải có cấu hình để nhận token xác minh.

`BACKEND_API_URL` chỉ dùng phía server. Browser gọi `/api/backend/*`; route web gửi Bearer token đến BE, tránh phụ thuộc CORS giữa hai origin. `rememberMe` là tùy chọn của web, không gửi vào DTO đăng nhập BE.

## Các màn đã nối API thật

| Màn                                 | Role                         | API/hành vi                                                                                                                        |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| /login, hết phiên, đăng xuất        | Các role web mà BE hỗ trợ    | POST /auth/login, POST /auth/refresh, GET /auth/me, POST /auth/logout                                                              |
| /register                           | Public, phụ huynh tự đăng ký | POST /auth/register với email/password; tiếp tục quản lý con trên app, không tạo phiên web phụ huynh                               |
| /staff/enrollments/new              | STAFF                        | Tìm email debounce 400 ms từ 2 ký tự → chọn tài khoản → lookup con → chọn lớp → tạo draft → xác nhận học phí → Enrollment/biên lai |
| /staff/payments                     | STAFF                        | GET /registrations/:id, GET /registrations/:id/receipt; tiếp tục draft                                                             |
| /staff/parents, /staff/students     | STAFF                        | Lookup email đầy đủ, xem phụ huynh/con và mở wizard đã điền email/hồ sơ                                                            |
| /staff/profile                      | STAFF                        | GET /auth/me                                                                                                                       |
| /manager/dashboard                  | MANAGER                      | Danh sách lớp thật và lối tắt quản lý                                                                                              |
| /manager/parents, /manager/students | MANAGER                      | GET /parents/lookup, tra cứu hồ sơ; không có nút thu tiền                                                                          |
| /manager/catalog                    | MANAGER                      | GET/POST /programs                                                                                                                 |
| /manager/classes, /new, /:id        | MANAGER                      | GET/POST /classes, PATCH /classes/:id, POST /classes/:id/schedules                                                                 |
| /manager/profile                    | MANAGER                      | GET /auth/me                                                                                                                       |

**API gợi ý chưa có trong BE hiện tại.** FE đã chuẩn bị GET /parents/search?email=<chuỗi>&limit=10, dùng AbortSignal hủy tìm kiếm cũ, chỉ hiển thị kết quả cho chuỗi hiện tại và yêu cầu chọn tài khoản. Xem mục 0 trong BE_FIX_REQUESTS.md để triển khai contract. Khi chưa có endpoint, FE báo rõ giới hạn; nhập email đầy đủ vẫn tìm được tài khoản qua lookup. Không giả lập gợi ý từ dữ liệu mock.

Các màn ngoài bảng, bao gồm nghỉ/học bù, nhân sự và giáo trình chi tiết, vẫn là triển khai cũ và không được mở rộng trong thay đổi nghiệp vụ đăng ký này. STAFF không còn được vào /manager/*; các màn vận hành cũ ở nhóm manager cần một lần chuyển route riêng ngoài phạm vi yêu cầu hiện tại. Các đường dẫn cũ /manager/enrollments/new và /manager/payments đã bị loại bỏ.

## Phiên và quyền

- BE `MANAGER` → FE `center_manager`; `STAFF` → `staff`; `TEACHER` → `teacher`; `CURRICULUM_DESIGNER` → `curriculum_designer`.
- STAFF chỉ dùng các route /staff/* cho luồng đăng ký; manager không vào khu này và BFF chỉ chấp nhận STAFF cho /registrations* và /parents/search.
- PARENT dùng mobile; đăng nhập web trả hướng dẫn và thu hồi phiên vừa tạo. BE hiện không có ADMIN nên web không giả lập đăng nhập admin.
- Access/refresh token chỉ ở cookie HttpOnly, SameSite=Lax; Secure trong production. Browser chỉ lưu hồ sơ hiển thị. Không trả token trong JSON cho JavaScript.
- Proxy gọi `/auth/me`, xác định role từ BE và ghi đè header role trước khi render layout. Cookie role giả hoặc header do client gửi không cấp quyền. Role sai trả trang 403; thiếu phiên về `/login`.
- Khi request protected nhận 401, web refresh một lần rồi gửi lại request. Proxy không rotate token trong ngữ cảnh riêng: nếu mở trang với access token hết hạn, Proxy chuyển qua `/api/auth/restore` để refresh và quay lại URL đang mở. Các lần rotate đều ở Route Handler; request đồng thời có cùng refresh token dùng chung promise. Kết quả giữ 60 giây để request còn mang cookie cũ không dùng lại token đã rotate. Lỗi mạng/5xx cho thử lại; 401 do refresh xóa cookie và yêu cầu đăng nhập lại.
- Mutation qua proxy web kiểm tra Origin. Danh sách đường dẫn được cho phép cố định; không có proxy URL tùy ý.
- Điều phối refresh hiện áp dụng cho **một tiến trình Node**. Nếu triển khai nhiều worker/replica/serverless, cần điều phối phân tán hoặc BFF session store tập trung để tránh hai instance rotate cùng token. Không tuyên bố an toàn nhiều instance với bộ nhớ hiện tại.

## Bản nháp và thu tiền

- Một đăng ký = một con + một lớp + một kỳ học. Không có gửi link/claim, thanh toán ngân hàng hoặc tạo con trên web.
- Chỉ tiếp tục khi phụ huynh ACTIVE, đã xác minh email và có con ACTIVE. Khối lấy từ hồ sơ con; không cho sửa khối trong wizard.
- Ngày bắt đầu từ hôm nay tại Việt Nam, đúng ISO weekday của lớp. Gói 1–12 tháng; cuối tháng được cắt đúng theo BE. Ngày kết thúc không bao gồm trong kỳ học.
- Chỉ chọn lớp mở có lịch. UI hiển thị sức chứa, không suy diễn số chỗ còn lại từ `_count.enrollments`. BE kiểm tra sĩ số, trùng lớp/trùng giờ khi lập nháp và thu tiền.
- Bước lập nháp chỉ gửi `targetStudentId`, `classId`, `startDate`, `packageMonths`. Học phí ở bước xác nhận lấy `quotedAmount` của BE, kể cả Decimal dạng chuỗi; không gửi số tiền xác nhận.
- `registrationId` giữ trong URL. Bản nháp có thể mở lại bằng mã trên màn thanh toán. Lịch sử phiên chỉ lưu các ID theo tài khoản thao tác trong sessionStorage, không phải lịch sử toàn trung tâm.
- Khóa UUID và body biên lai lưu trước khi gọi confirm, theo user + registration. Retry giữ nguyên key/body; nhập số biên lai bị khóa sau lần gửi đầu. Nút gửi bị khóa trong lúc xử lý. Nếu sessionStorage không ghi được, không gửi xác nhận làm mất khóa retry.
- Timeout/5xx: đọc lại order; COMPLETED thì lấy biên lai, DRAFT thì cho thử lại với cùng key. Không tự lặp request thanh toán khi lỗi nghiệp vụ.
- `POST /registrations` chưa có idempotency nên FE không tự retry. Nếu server đã tạo nháp nhưng response thất lạc trước khi nhận ID, BE cần endpoint danh sách/idempotency để phục hồi đầy đủ.
- Muốn chọn lại sau khi lập nháp: hủy nháp thành công trên BE rồi mới trở lại lựa chọn. Bản nháp đã thanh toán không hủy bằng API cancel.
- Biên lai dùng dữ liệu trả về, không tự đặt tên người thu tiền/địa chỉ trung tâm khi BE chưa trả các trường đó. Nút in dùng print stylesheet dành riêng cho biên lai.

## Kiểm tra

```bash
npm run test:registration
npx tsc --noEmit
npm run lint
npm run build
npm run test:registration:http
```

Test hợp đồng dùng response mô phỏng BE và chạy chính code proxy, Route Handler, calendar, validation, API recovery và payment storage. Đây không phải kiểm thử DB BE. Cần nghiệm thu thêm bằng tài khoản thực: quản lý tạo chương trình/lớp/lịch và mở lớp; nhân viên tra phụ huynh đã có hai con, tạo nháp và xác nhận thu tiền; phụ huynh kiểm tra lớp/biên lai trên mobile.

Kết quả xác minh thay đổi mới được ghi trong ENROLLMENT_FLOW_UPDATE.md. Test HTTP dùng BE fixture, không chứng minh endpoint search đã tồn tại trên BE thật.

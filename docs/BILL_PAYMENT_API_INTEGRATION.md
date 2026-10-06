# Nối API bill và xác nhận thanh toán

Ngày đối chiếu 06/10/2026. Đọc `BILL_PAYMENT_API_CONTRACT.md` của FE và `PAYMENT_BILL_API.md`, controller/DTO/service/Prisma hiện tại của BE.

## Phạm vi đã có ở BE

- `GET /registrations/:id/bill`: STAFF hoặc PARENT sở hữu con, snapshot bill, trạng thái UNPAID/PAID/CANCELLED, tiền dạng chuỗi Decimal, payment có receiptNumber/paidAmount/confirmedAt khi đã thu.
- `POST /registrations/:id/confirm-payment`: STAFF, Idempotency-Key, body chỉ `receiptNumber?`, kiểm tra lại điều kiện ghi danh và tạo payment/enrollment/receipt.
- `GET /registrations/:id/receipt`: đọc lại biên lai. `GET /me/bills?page=1&limit=20` dành PARENT mobile, trả `{items, page, limit, total}`, không mở parent web.
- Mã bill là registrationId; FE không tự tạo mã khác. Không có QR trong bill.

## Chuẩn bị BE cần thực hiện trước khi test, đã báo trước

Readiness hiện trả 200 nhưng OpenAPI của tiến trình đang chạy chưa có đường dẫn bill. `prisma migrate status` báo migration **đã có trong repo** `20261006010000_payment_bill_snapshot` chưa áp dụng.

Đã deploy migration có sẵn, generate Prisma, build BE và khởi động lại tiến trình BE cục bộ đang phục vụ cổng 3000. Generate ban đầu bị khóa DLL Prisma của tiến trình cũ; dừng đúng tiến trình BE rồi generate/build lại đạt. Readiness 200 và OpenAPI hiện đã có hai endpoint bill. Không viết migration mới, không sửa controller/service/DTO nghiệp vụ; không reset DB ứng dụng.

## FE đã nối

1. Allowlist BFF GET bill, kiểm tra STAFF trên web trước khi gửi Bearer từ cookie HttpOnly.
2. Type/schema giữ đúng billNumber/registrationId/parent.displayName/student.fullName/class.schedules/pricing.total/payment.paidAmount. Parse response trước khi hiển thị; không tự tính lại tổng học phí đã chốt.
3. Bước thu học phí và màn tra cứu đọc bill thật. Bill UNPAID có nút mở popup xác nhận, mã biên lai tùy chọn, checkbox đã nhận đủ tiền, nút Đã thanh toán. Confirm chỉ gửi DTO được BE hỗ trợ; giữ khóa/body qua timeout, reload và thử lại; thành công đọc lại trạng thái/biên lai.
4. PAID chỉ hiển thị đã thanh toán/biên lai từ dữ liệu BE; CANCELLED không có nút thu tiền. Khi tên/môn/khối/lịch lớp đổi, hiện lỗi BILL_CLASS_CHANGED để hủy bill cũ và lập lại.

## BE còn thiếu so với đề xuất thanh toán mới

API hiện chưa nhận/lưu paymentMethod, receivedAt, bankTransactionReference hoặc trả confirmedBy; Payment model không có các trường phương thức/thời gian thu/mã ngân hàng. Bill payment.confirmedAt là giờ xác nhận, không tự diễn giải thành giờ nhận tiền. Không gửi các trường này qua DTO receiptNumber rồi bỏ mất dữ liệu.

API thống kê theo phương thức thu và khoản chi riêng cũng chưa có. Các ý cần bổ sung đã liệt kê trong `BILL_PAYMENT_API_CONTRACT.md`; không sửa nghiệp vụ BE ở lượt nối API hiện có này. Bộ popup CASH/BANK_TRANSFER và bảng thu chi minh họa (trang `/dev/billing`) đã gỡ khỏi FE web; dựng lại khi có contract thực tế.

## Kết quả kiểm thử

- Build production FE (`npx next build --webpack`) và build BE đạt.
- Lint toàn repo FE: 0 lỗi, còn 4 warning unused import cũ ở session-drawer, section-card và hai entity-picker.
- 42 kiểm thử logic/adapter/BFF FE đạt, gồm 7 ca mới cho bill thật: Decimal/snapshot/legacy null, response không hợp lệ, sai registrationId, quyền STAFF, xác nhận đủ tiền, storage hỏng và BILL_CLASS_CHANGED không tự retry.
- Một kiểm thử HTTP qua Next production đạt: đọc bill UNPAID/PAID, confirm/replay và biên lai.
- 33 kiểm thử registration BE MySQL đạt. Bộ test tự tạo và dọn DB kiểm thử riêng, không reset `edugrade_db`.
- Desktop Chrome 1440 × 1000 với BFF/BE/MySQL Docker thật đạt toàn luồng, lưu **12 ảnh**, không có pageerror hoặc request API lỗi trong lượt đạt.
- Lượt đạt `muwp5543`: 3 buổi học, một registration COMPLETED, một Payment 2.400.000 đ, một Enrollment ACTIVE. Tải lại đọc được biên lai; gửi lại sinh lịch/confirm với cùng khóa/body không tăng số bản ghi.
- Bill giữ `monthlyFee: "800000"` và `total: "2400000.00"` dù đổi học phí lớp lên 900.000 đ/tháng sau lúc lập bill. Bill chuyển UNPAID → PAID, payment từ null thành biên lai/thời gian xác nhận do BE trả. Trang tra cứu không còn nút xác nhận khi PAID.
- API PARENT đọc được bill PAID của con, `me/bills` phân trang đúng `{items,page,limit,total}`, 3 buổi học và ghi danh ACTIVE. Phụ huynh vẫn dùng mobile.
- Kiểm tra in riêng bill và biên lai khi cùng hiển thị trên trang; timeline border 0px, shadow none, background transparent.

Dữ liệu desktop là tài khoản/hồ sơ kiểm thử đánh dấu riêng và xác nhận thu offline, không có giao dịch ngân hàng hoặc gửi email thật. Hai lượt trước gặp lỗi trong harness (locator bị ẩn lúc in; đọc nhầm danh sách bill phân trang thành array); đã sửa test rồi chạy lại toàn luồng đạt. Giữ dữ liệu đánh dấu và file `diagnostic-*` để đối chiếu. Đọc IDs và kết quả tại [evidence.json](screenshots/desktop-live-bill-2026-10-06/evidence.json).

Mở lại bill bằng tài khoản STAFF tại `http://localhost:3001/staff/payments?registrationId=cmuwp5too003fm17kgu6xhuv4`. BE đang chạy cổng 3000, FE dev cổng 3001.

## Ảnh desktop toàn luồng

![1. Lịch tuần lớp](screenshots/desktop-live-bill-2026-10-06/01-lich-tuan-cua-lop.png)

![2. Giáo trình đã soạn](screenshots/desktop-live-bill-2026-10-06/02-giao-trinh-da-soan.png)

![3. Học phần đã duyệt](screenshots/desktop-live-bill-2026-10-06/03-hoc-phan-da-duyet.png)

![4. Xem trước lịch học](screenshots/desktop-live-bill-2026-10-06/04-xem-truoc-lich-hoc.png)

![5. Tạo lịch học thành công](screenshots/desktop-live-bill-2026-10-06/05-tao-lich-hoc-thanh-cong.png)

![6. Nhập Gmail phụ huynh](screenshots/desktop-live-bill-2026-10-06/06-nhap-gmail-phu-huynh.png)

![7. Chọn con và khối có sẵn](screenshots/desktop-live-bill-2026-10-06/07-danh-sach-con-va-khoi.png)

![8. Chọn lớp đúng khối và kỳ học](screenshots/desktop-live-bill-2026-10-06/08-chon-lop-dung-khoi.png)

![9a. Bill thật chưa thanh toán](screenshots/desktop-live-bill-2026-10-06/09a-bill-chua-thanh-toan.png)

![9. Popup xác nhận thanh toán](screenshots/desktop-live-bill-2026-10-06/09-xac-nhan-thu-hoc-phi.png)

![10. Đăng ký và thanh toán thành công sau reload](screenshots/desktop-live-bill-2026-10-06/10-dang-ky-va-thanh-toan-thanh-cong.png)

![11. Tra cứu bill đã thanh toán](screenshots/desktop-live-bill-2026-10-06/11-tra-cuu-bill-da-thanh-toan.png)

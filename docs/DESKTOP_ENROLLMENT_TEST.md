# Kiểm thử desktop: tạo lịch đến đăng ký và thu học phí

Cập nhật bill thật 06/10/2026: đã kiểm thử lại toàn luồng bằng GET bill và popup confirm-payment; 12 ảnh mới, trạng thái UNPAID/PAID, giá snapshot không đổi và danh sách bill phụ huynh tại [BILL_PAYMENT_API_INTEGRATION.md](BILL_PAYMENT_API_INTEGRATION.md). Nội dung/ảnh dưới đây giữ lại lượt thu offline trước khi nối GET bill.

Ngày: 06/10/2026. **Đạt toàn bộ luồng desktop với BE NestJS thật và MySQL Docker.** Đã lưu 10 ảnh desktop, không có lỗi JavaScript hoặc request API lỗi trong lượt đạt. Kết quả: 3 buổi học, đăng ký `COMPLETED`, một ghi danh `ACTIVE`, một khoản thu 2.400.000 đ; tải lại vẫn đọc được biên lai. Gửi lại sinh lịch và confirm-payment với cùng khóa/body không tạo thêm dữ liệu.

## Phạm vi

Chrome desktop, viewport **1440 × 1000**, device scale 1, `isMobile: false`, múi giờ Việt Nam. Chạy Next.js production, BFF thật, BE `localhost:3000/api/v1`, MySQL `edugrade_db` ở `localhost:3307`. Theo yêu cầu chạy BE test, đã chuẩn bị dependency/migration có sẵn và tạo dữ liệu kiểm thử đánh dấu riêng, không reset DB ứng dụng. Prerequisite ở `tests/fixtures/real-desktop-backend.cjs`; chương trình/lớp đích/giáo trình/lịch/registration/payment được tạo qua UI và đối chiếu lại bằng Prisma.

Tài khoản kiểm thử được tạo trước, email phụ huynh được đặt đã xác minh vì chưa có SMTP; hồ sơ hai con được tạo qua API PARENT thật. Không gửi Gmail/email thật. Các lượt chạy trước cũng có dữ liệu đánh dấu `.desktop.<runId>`; giữ lại để đối chiếu, không trộn vào phép đếm của lượt đạt.

Browser trong app báo thiếu `sandboxPolicy` ngay khi khởi tạo. Ảnh được chụp bằng Chrome riêng chạy qua Playwright, không điều khiển Browser trong app.

## Luồng và dữ liệu kiểm thử

1. Quản lý tạo chương trình Toán khối 8, lớp **Toán 8A - Tối 2, 4, 6**, học phí 800.000 đ/tháng, sức chứa 20. Lưu lịch tuần thứ 2, 4, 6 lúc 18:00–20:00 và mở đăng ký.
2. Thiết kế giáo trình tạo học phần 04–08/01/2027, soạn hai bài và kiểm tra tháng 1. Quản lý duyệt, xem trước và sinh ba buổi tương ứng.
3. Nhân viên xem lịch đã sinh; không có nút sinh lịch.
4. Nhân viên nhập Gmail `phuhuynh.desktop.muwoatoa@gmail.com` và chọn tài khoản. Danh sách hiện **Nguyễn Minh An — khối 8** và **Nguyễn Minh Bình — khối 6**.
5. Chọn An; khối lấy từ hồ sơ, chỉ chọn lớp phụ huynh muốn. Danh sách không hiện lớp Toán 6A và không yêu cầu chọn môn hoặc nhập khối.
6. Chọn ngày 04/01/2027, gói 3 tháng, kiểm tra còn 20 chỗ trong kỳ và học phí 2.400.000 đ. Lập bản nháp; chưa có khoản thu hay ghi danh thành công ở bước này.
7. Nhập biên lai `DESKTOP-REAL-muwoatoa`, đánh dấu đã nhận đủ tiền và xác nhận. Kiểm tra đăng ký `COMPLETED`, ghi danh `ACTIVE`, đúng con/lớp, đúng một khoản thu 2.400.000 đ.
8. Tải lại trang; biên lai và trạng thái thành công vẫn hiển thị, không phát sinh thêm khoản thu. Kiểm tra không có lỗi JavaScript trên trang.

9. Gửi lại sinh lịch và confirm-payment từ browser với khóa/body đã dùng. DB vẫn 3 buổi, 1 registration, 1 payment, 1 enrollment. API PARENT đọc được 3 buổi trong kỳ đã đóng tiền và một ghi danh ACTIVE, không cần attendance roster.

Tài khoản/hồ sơ là dữ liệu kiểm thử lưu ở DB thật. Thu học phí là **xác nhận offline theo API hiện có**, không chứng minh giao dịch tiền thật. Popup bill mới với CASH/BANK_TRANSFER, thời gian thu và mã ngân hàng được chuẩn bị riêng, chưa gắn API mới; xem [BILL_PAYMENT_API_CONTRACT.md](BILL_PAYMENT_API_CONTRACT.md).

Timeline đã bỏ viền, nền, bóng: computed style border=0px, shadow=none, background=transparent. FE giữ phiên khi BE trả 429 và tắt prefetch sidebar để giảm auth/me không cần thiết. Harness giới hạn locator sĩ số theo lớp đích, replay bằng browser để cookie Secure trên loopback đi như thao tác UI; chờ trước khi thử lại login bị giới hạn.

## Ảnh desktop theo thứ tự

### 1. Lịch tuần của lớp đã mở đăng ký

![Lịch tuần](screenshots/desktop-real-enrollment-2026-10-06/01-lich-tuan-cua-lop.png)

### 2. Giáo trình đã soạn

![Giáo trình](screenshots/desktop-real-enrollment-2026-10-06/02-giao-trinh-da-soan.png)

### 3. Học phần đã duyệt

![Đã duyệt](screenshots/desktop-real-enrollment-2026-10-06/03-hoc-phan-da-duyet.png)

### 4. Xem trước lịch học

![Xem trước lịch](screenshots/desktop-real-enrollment-2026-10-06/04-xem-truoc-lich-hoc.png)

### 5. Sinh lịch thành công

![Sinh lịch thành công](screenshots/desktop-real-enrollment-2026-10-06/05-tao-lich-hoc-thanh-cong.png)

### 6. Nhập Gmail phụ huynh

![Gmail phụ huynh](screenshots/desktop-real-enrollment-2026-10-06/06-nhap-gmail-phu-huynh.png)

### 7. Các con và khối từ hồ sơ

![Các con và khối](screenshots/desktop-real-enrollment-2026-10-06/07-danh-sach-con-va-khoi.png)

### 8. Chọn lớp đúng khối

![Chọn lớp](screenshots/desktop-real-enrollment-2026-10-06/08-chon-lop-dung-khoi.png)

### 9. Xác nhận đã nhận đủ học phí

![Xác nhận học phí](screenshots/desktop-real-enrollment-2026-10-06/09-xac-nhan-thu-hoc-phi.png)

### 10. Đăng ký và thanh toán thành công sau khi tải lại trang

![Đăng ký thành công](screenshots/desktop-real-enrollment-2026-10-06/10-dang-ky-va-thanh-toan-thanh-cong.png)

## Chạy lại

Trong thư mục FE, build production trước. Playwright có thể cài riêng trong thư mục tạm để giữ nguyên dependency của dự án:

```powershell
npx next build --webpack
$desktopToolDirectory = Join-Path $env:TEMP 'wdp-desktop-test-tools'
npm install --prefix $desktopToolDirectory --no-save --package-lock=false playwright-core
$env:DESKTOP_PLAYWRIGHT_MODULE = Join-Path $desktopToolDirectory 'node_modules\playwright-core'
$env:DESKTOP_REAL_API_URL = 'http://localhost:3000/api/v1'
$env:DESKTOP_ALLOW_DATABASE_WRITES = 'true'
node tests/desktop-flow.test.cjs
```

Bài test tự mở/đóng server FE tại cổng loopback trống; BE cần chạy sẵn. Mặc định dùng Chrome tại `C:\Program Files\Google\Chrome\Application\chrome.exe`; có thể chỉ định `DESKTOP_BROWSER_PATH`. Kết quả có cấu trúc lưu tại [evidence.json](screenshots/desktop-real-enrollment-2026-10-06/evidence.json). Bỏ DESKTOP_REAL_API_URL để chạy fixture không ghi DB; bộ ảnh fixture cũ vẫn ở screenshots/desktop-enrollment-2026-10-06.

## BE/DB thật

BE build đạt, readiness HTTP 200/DB up. 33 e2e registration MySQL thật đạt trong database kiểm thử tự tạo/xóa riêng. Chuẩn bị dependency/workspace và migration có sẵn theo yêu cầu, chi tiết [CURRICULUM_API_BE_NOTES.md](CURRICULUM_API_BE_NOTES.md); chưa sửa controller/service nghiệp vụ.

Lượt desktop đạt `muwoatoa`: class `cmuwoaxyq005sm17wq2pyj88j`, unit `cmuwob2wq0060m17wwz0e5bvc`, registration `cmuwob8yx006jm17w1luewhju`, payment `cmuwob97n006lm17wvtfv8s1k`, enrollment `cmuwob97t006nm17wujxw0hwf`.

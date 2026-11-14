# Playwright — production WDP

Target được giới hạn vào hai host production được chủ dự án cung cấp. Suite không tự lấy database, không seed/reset production, và không đổi mật khẩu/cấu hình của tài khoản đang dùng.

Đặt cấu hình riêng tại `e2e/.production-runtime/settings.json` (đã được Git và Docker bỏ qua): `web`, `api`, `password`, `accounts` theo các vai trò `admin/manager/staff/teacher/designer/parent`; thêm `aiUrl`, `aiKey`, `aiModel`, `visionModel`, `smtpUrl`, `mailFrom` nếu kiểm tra dịch vụ thật. Không commit file này hoặc session đăng nhập.

```powershell
# Route tĩnh, chuyển hướng, phân quyền API và các API đọc. Không tạo dữ liệu nghiệp vụ.
npm run test:e2e:production -- --headed

# Thêm provider thật và luồng nghiệp vụ với dữ liệu test riêng.
# Lệnh này có thể gửi email biên lai thật đến phụ huynh cấu hình trong accounts.parent.
npm run test:e2e:production -- --headed --write --providers

# Sau khi triển khai bản sửa AI/PDF, tạo tác vụ chấm mới thay vì đọc kết quả cũ.
npm run test:e2e:production -- --headed --write --providers --recheck-ai

npm run test:e2e:production:report
```

`--write` tạo/tiếp tục bộ hồ sơ riêng được ghi trong `.production-runtime/fixture.json`, tên bắt đầu bằng `E2E-PROD` và mã ngẫu nhiên. Lớp thử có học phí 0 đồng; thanh toán và biên lai kiểm tra transaction thật. Thay đổi đăng ký, giáo trình, buổi học, bài nộp, điểm và báo cáo chỉ chạm các ID của bộ dữ liệu thử. Không chạy các luồng hủy/chuyển/đổi lịch trên lớp hoặc học sinh đang sử dụng.

Kiểm tra mọi thao tác API bảo vệ bằng yêu cầu không có token với ID giả không tồn tại. Public invitation acceptance được loại khỏi nhóm này vì xác thực bằng token lời mời dùng một lần, dù Swagger kế thừa nhãn bearer từ controller. API tìm phụ huynh dùng vai trò STAFF; giao bài/báo cáo dùng TEACHER; các API quản trị dùng ADMIN.

Bộ đầy đủ còn đăng nhập Admin tổng tại `https://admin.edugrade.45.77.168.110.sslip.io`, kiểm tra 19 route lấy từ source ở kích thước 1440 và 390, và xác nhận không hiển thị nhãn dữ liệu mẫu. Trang chi tiết dùng đúng ID của fixture riêng; bài này chỉ đọc dữ liệu.

Provider test gửi bài toán và ảnh tổng hợp qua đúng lớp tích hợp AI của backend; không gửi dữ liệu học sinh thật. Bài nộp production dùng ảnh/PDF tổng hợp tải lên MinIO thật. AI chỉ đề xuất, không tự công bố điểm. Test riêng kiểm tra giáo viên sửa bản chép bài trước khi duyệt/công bố. `SUCCEEDED` của tác vụ AI vẫn có thể chứa câu cần giáo viên đọc lại; suite kiểm tra cả kết quả chi tiết đó.

SMTP `verify()` chứng minh kết nối/xác thực. Outbox `SENT` của email biên lai chứng minh ứng dụng đã chuyển thư cho SMTP. Không tuyên bố thư đã vào inbox nếu chưa mở hộp thư nhận.

Sau khi hoàn tất và không cần chạy tiếp trên fixture hiện tại, chạy script cleanup. Script chỉ chấp nhận bộ dữ liệu E2E-PROD đã lưu, đối chiếu tên/ID trước khi kết thúc ghi danh, lưu trữ giáo trình và xóa mềm hồ sơ/lớp/khóa thử. Biên lai 0 đồng, điểm và audit được giữ làm lịch sử.

```powershell
node e2e/production/cleanup.mjs
```

Khi chạy lại `--write` sau cleanup, runner tự lưu manifest cũ vào lịch sử riêng và tạo bộ dữ liệu mới. Report/traces có thể chứa dữ liệu nội bộ và token phiên; giữ riêng trên máy, không commit hoặc xuất bản.

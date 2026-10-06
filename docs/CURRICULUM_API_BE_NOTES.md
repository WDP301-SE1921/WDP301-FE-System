# Đối chiếu BE cho giáo trình và ghi danh

Ngày kiểm tra: 06/10/2026. Tích hợp FE; chuẩn bị cấu hình BE theo yêu cầu chạy kiểm thử. Chưa sửa controller/service nghiệp vụ BE.

## Chuẩn bị BE đã được cho phép (06/10/2026)

Bạn đã yêu cầu “rồi chạy be test đi”, cho phép chuẩn bị dependency, áp dụng migration có sẵn và chạy kiểm thử với Docker DB.

Các sửa cấu hình cần thực hiện, đã báo trước trong chat:

- `WDP301-BE-System/pnpm-workspace.yaml`: thêm `packages: ['.']`. pnpm 9 theo `packageManager` hiện tại dừng với `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION` vì thiếu trường này.
- `WDP301-BE-System/package.json` và `pnpm-lock.yaml`: khai báo trực tiếp `express` 5.2.1 (phiên bản đã có trong lockfile qua NestJS). `src/main.ts` đang import `json`/`urlencoded` từ `express`, nhưng pnpm không cho root resolve dependency gián tiếp; BE dừng với `Cannot find module 'express'`.
- Sau đó cài dependency theo lockfile, generate Prisma, deploy migration giáo trình đã có và build/start BE. Không cần sửa controller/service cho hai lỗi khởi động này.

Kiểm thử sẽ dùng dữ liệu đánh dấu riêng để đối chiếu buổi học, đăng ký, payment và enrollment thật. Không reset hoặc xóa DB ứng dụng.

## Việc chuẩn bị đã hoàn thành

1. **Áp dụng migration đã có `20261006000000_curriculum_scheduling`.**
   - Docker `edugrade_mysql` đang chạy, ánh xạ cổng 3307; Prisma kết nối `edugrade_db` tại `localhost:3307`.
   - Đã chạy `corepack pnpm prisma:migrate:deploy` và `corepack pnpm prisma:generate`, áp dụng migration đã có, không viết migration mới.

2. **Khôi phục dependency để BE khởi chạy.**
   - Chạy bản build hiện tại bằng `node dist/main.js` dừng với `Cannot find module 'express'`.
   - Đã sửa cấu hình như danh sách phía trên, cài theo frozen lockfile, build và chạy `node dist/main.js` ở cổng 3000.
   - `GET /api/v1/health/ready` trả HTTP 200, DB up.

## Contract đã có, không cần đề nghị viết lại

- `GET /parents/search`, `GET /programs`, `GET /classes` có kiểm tra theo `startDate` + `packageMonths`.
- `POST /registrations`, `POST /registrations/:id/confirm-payment` và API biên lai đã phục vụ nhân viên thêm con có hồ sơ vào lớp sau khi nhận đủ học phí.
- Các API học phần, bài học, kiểm tra tháng, duyệt, tạo phiên bản mới, xem trước/sinh lịch và đọc buổi học đã có trong controller/service BE.
- Các mục trong `BE_FIX_REQUESTS.md` là báo cáo cũ; không xem tất cả là lỗi còn tồn tại. Đối chiếu source BE hiện tại trước khi sửa.

## Xác minh

- 33 kiểm thử e2e registration với MySQL thật đã pass; test tự tạo/xóa database kiểm thử riêng, không reset DB ứng dụng.
- FE đã qua build/TypeScript, 29 kiểm thử logic/route và 1 kiểm thử HTTP production với BE fixture. Chi tiết ở [CURRICULUM_API_INTEGRATION.md](CURRICULUM_API_INTEGRATION.md).
- Luồng UI desktop production với API fixture đã đạt đến đăng ký và thu tiền, lưu 10 ảnh; xem [DESKTOP_ENROLLMENT_TEST.md](DESKTOP_ENROLLMENT_TEST.md). Kết quả UI với BE thật được cập nhật riêng trong báo cáo đó.
- Lượt desktop với BE/MySQL thật đã đạt toàn bộ, 10 ảnh: 3 buổi, 1 payment 2.400.000 đ, 1 ACTIVE enrollment, registration COMPLETED. Reload và replay giữ nguyên kết quả; PARENT đọc được 3 buổi và ghi danh. Không có request API lỗi hoặc lỗi JavaScript trong lượt đạt.

## API mới cho bill và thu chi

FE đã chuẩn bị bill/popup tiền mặt hoặc chuyển khoản, thời gian thu, mã ngân hàng và bảng đối soát thu chi riêng. BE hiện chưa có các trường và API mới; các ý cần bổ sung đã ghi ở [BILL_PAYMENT_API_CONTRACT.md](BILL_PAYMENT_API_CONTRACT.md). Chưa sửa nghiệp vụ BE cho phần này và chưa gửi metadata mới qua API confirm-payment cũ.

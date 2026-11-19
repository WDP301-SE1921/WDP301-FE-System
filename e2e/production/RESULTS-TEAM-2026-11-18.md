# Production Playwright cho team — 18/11/2026

Đã tách project `production` với cấu hình `.env`, Chromium, giao diện UI và báo cáo riêng. Chỉ cần repo FE cùng các development dependencies; không import bản build BE, source Admin hoặc môi trường Docker/database local.

| Kiểm chứng                                                     | Kết quả                                                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Production đầy đủ, Chromium có cửa sổ                          | **96/96 đạt**, 0 skip, 0 retry, 0 flaky; bắt đầu **14:01:55 giờ Việt Nam**, chạy **370 giây**.                                         |
| Lệnh services chạy lại sau sửa cuối                            | **7/7 đạt** trên fixture mới; biên lai chờ worker khoảng **29,7 giây** rồi SENT. Cleanup tự đăng nhập và hoàn tất.                     |
| Public khi `.env` không tồn tại                                | **3/3 đạt**: web, Admin login, API/database readiness.                                                                                 |
| Khám phá test ở checkout chưa có auth/OpenAPI/env              | `--full --list` liệt kê **96 bài**, không gọi mạng hoặc chuẩn bị dữ liệu.                                                              |
| Cấu hình, profile, provider, session, cleanup, summary/masking | **42 contract tests đạt**, không gọi production.                                                                                       |
| Hồi quy readiness/chuyển hướng                                 | **9/9 đạt**.                                                                                                                           |
| Chất lượng source                                              | E2E TypeScript, ESLint và Prettier đạt.                                                                                                |
| Playwright UI                                                  | `localhost:9326` tải được project `production`, nhóm `00-production.spec.ts` và danh sách route; đã lưu ảnh kiểm chứng riêng trên máy. |

Lượt full sử dụng fixture riêng `E2E-PROD 2026-11-18 92559211`, học phí **0 VND**. Đã kết thúc ghi danh, xử lý giáo trình và xóa mềm đúng học sinh/lớp/khóa thử lúc **14:08:05**. AI ảnh/PDF, báo cáo, SMTP/outbox đều gọi dịch vụ thật. `SENT` vẫn không đồng nghĩa đã mở hộp thư nhận.

File thật `e2e/production/.env`, phiên đăng nhập, JSON chi tiết, screenshot và traces không được commit. File mẫu không có key/mật khẩu. Biến môi trường được ưu tiên hơn `.env`; setup không ghi đè file đã có. Session cache được kiểm tra với API, tự refresh/login khi không còn hợp lệ. Cleanup hỗ trợ manifest dở dang và tự chuẩn bị đăng nhập từ `.env`.

Repo GitHub hiện public. Workflow mới chỉ chia sẻ số liệu/production links và, nếu cần, các trường nhận diện dữ liệu E2E để khôi phục cleanup. Bằng chứng có ảnh, nội dung lỗi, token hoặc dữ liệu nghiệp vụ không được upload vào artifact public. Các giá trị cấu hình bí mật và token được đăng ký che trong Actions trước khi dùng. Workflow chỉ cho upload report đầy đủ nếu repo private.

Workflow GitHub đã được kiểm tra source/YAML nhưng **chưa chạy trên GitHub**: cần merge file workflow vào nhánh mặc định; profile có đăng nhập cần repository secret `PRODUCTION_E2E_ENV`. Không triển khai mã ứng dụng hoặc chỉnh cấu hình máy chủ trong lượt này.

Runtime dependency audit: **0 advisory**. Có 20 advisory ở công cụ development đã có sẵn (eslint-config-next/shadcn và phụ thuộc liên quan); Nodemailer mới thêm không có advisory được báo. Đây không phải kết luận kiểm toán bảo mật toàn hệ thống.

Lệnh setup/chạy/link production: [README dành cho team](./README.md). Bằng chứng số liệu được giữ ở `e2e/.production-runtime/team-full-results-20261118.json`, `team-services-results-20261118.json`, `team-public-results-20261118.json`; report đầy đủ gần nhất ở `e2e/.production-report/`.

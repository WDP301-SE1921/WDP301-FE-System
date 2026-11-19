# Playwright — kiểm tra toàn hệ thống WDP

Chạy từ repo FE, với BE, ADMIN và FEM ở các thư mục cùng cấp. Dùng Node 22+, Docker Desktop và Microsoft Edge; cài dependency theo lockfile của cả bốn repo. Backend/FE/Admin dựa trên `dev`; mobile dựa trên `develop`, có Expo 58, tải ảnh/PDF theo câu, xin nghỉ một buổi và popup realtime. Mốc code và kết quả hiện tại nằm trong [kiểm chứng 18/11](RESULTS-2026-11-18.md); `../demo/branch-audit.json` là lịch sử đối chiếu trước đó.

```powershell
# Dựng MySQL/MinIO riêng, migrate/seed, build, mở trình duyệt và chạy toàn bộ suite.
npm run test:e2e:all -- --headed

# Chỉ 17 ca cập nhật nghiệp vụ, popup, báo cáo và chấm bài mở rộng.
npm run test:e2e:updates -- --headed

# Dùng các dịch vụ test đã mở từ lượt hiện tại.
npm run test:e2e:all -- --reuse --headed

# Mở báo cáo Playwright có bước chạy, ảnh, video và trace.
npm run test:e2e:system:report

# Kiểm tra kiểu của test, tách khỏi build ứng dụng production.
npm run test:e2e:typecheck
npm run test:regressions
```

Suite giữ các luồng nghiệp vụ demo và thêm học phí Tết, đối soát ca, hoàn tiền có duyệt, gia hạn, đơn nghỉ từ app, sửa điểm danh trong ngày, chi tiết báo cáo và tệp theo câu. Bộ kiểm tra route tự lấy toàn bộ `page.tsx`, gồm cả `/manager/payments` mới, để danh sách không bị lỗi thời; thử kích thước 1440 và 390; kiểm tra năm trang xác thực; chuyển hướng đăng nhập sau reverse proxy; 19 màn hình Admin gồm trang chi tiết; 15 màn hình phụ huynh; và xem ảnh bài làm qua API có xác thực. Route `/dev/components` phải trả 404 trong bản production.

**Đã kiểm chứng ngày 18/11/2026: 113/113 E2E đạt, không failed/skipped/flaky.** Xem [kết quả và mốc nguồn](RESULTS-2026-11-18.md). [Bàn giao chuẩn bị 17/11](UPDATES-2026-11-17.md) và các báo cáo 14/11 được giữ làm lịch sử.

API NestJS, MySQL và MinIO đều chạy thật. Admin đặt `VITE_DATA_SOURCE=api`; không dùng dữ liệu mock. AI/SMTP của suite local là provider xác định được và máy chủ SMTP cục bộ. Kiểm chứng provider thật và production là suite riêng, xem `../production/README.md`.

Môi trường chỉ sử dụng database `edugrade_e2e` tại `127.0.0.1:3308`, kho tệp tại `127.0.0.1:9002`; không reset database production. Các fixture độc lập có tiền tố E2E. Lần chạy lặp lại giữ dữ liệu test; có thể dừng các dịch vụ của suite khi cần giải phóng cổng.

Giữ môi trường để xem UI hoặc chạy riêng một lỗi:

```powershell
node e2e/demo/run.mjs --system --serve
# Terminal khác:
npm run test:e2e:all -- --reuse --headed system/05-file-preview.spec.ts
```

Các kết quả, video và session nằm trong các thư mục `e2e/.*` bị Git và Docker bỏ qua. Mỗi lượt đầy đủ tạo lại `e2e/.system-report` và `e2e/.system-results/results.json`.

Phụ huynh được chạy bằng Expo Web kết nối API thật. Luồng xin nghỉ một buổi mới thao tác qua biểu mẫu app thật, kèm một lỗi GET được chủ động tạo để kiểm tra nút thử lại; lần đọc lại, gửi đơn và duyệt đơn dùng API thật. Nghỉ dài hạn vẫn do nhân viên thực hiện. Popup đã được nhóm gộp vào `develop` ngày 18/11 và có ca E2E riêng. Suite này không xác nhận camera thiết bị, app native iOS/Android, OS Push/Web Push hoặc mọi trình duyệt/thiết bị.

Lỗi PDF trắng trên Linux có phép kiểm tra độc lập `pdf-render.cjs`: chạy nó trong image backend, truyền một PDF có chữ. Phép đo đòi hỏi hơn 1.000 điểm ảnh tối. `live-pdf-reader.cjs` xác minh cùng PDF qua AI thật với cấu hình riêng bị Git bỏ qua. Tài nguyên font của runtime phải được giữ trong Dockerfile backend.

# Playwright — kiểm tra toàn hệ thống WDP

Chạy từ repo FE, với BE, ADMIN và FEM ở các thư mục cùng cấp. Dùng Node 22+, Docker Desktop và Microsoft Edge; cài dependency theo lockfile của cả bốn repo. Backend/FE/Admin dùng nhánh `dev`; mobile dùng `develop` hiện có Expo 58 và tải ảnh/PDF theo câu. Chi tiết đối chiếu nhánh nằm trong `../demo/branch-audit.json`.

```powershell
# Dựng MySQL/MinIO riêng, migrate/seed, build, mở trình duyệt và chạy toàn bộ suite.
npm run test:e2e:all -- --headed

# Dùng các dịch vụ test đã mở từ lượt hiện tại.
npm run test:e2e:all -- --reuse --headed

# Mở báo cáo Playwright có bước chạy, ảnh, video và trace.
npm run test:e2e:system:report

# Kiểm tra kiểu của test, tách khỏi build ứng dụng production.
npm run test:e2e:typecheck
npm run test:regressions
```

Suite gồm 13 luồng nghiệp vụ của demo; tự lấy toàn bộ `page.tsx` để kiểm tra 75 route web tĩnh/chi tiết; thử kích thước 1440 và 390; kiểm tra tiêu đề của năm trang xác thực; chuyển hướng đăng nhập sau reverse proxy; toàn bộ 19 màn hình Admin gồm trang chi tiết; 15 màn hình phụ huynh; và xem ảnh bài làm qua API có xác thực. Route `/dev/components` phải trả 404 trong bản production.

API NestJS, MySQL và MinIO đều chạy thật. Admin đặt `VITE_DATA_SOURCE=api`; không dùng dữ liệu mock. AI/SMTP của suite local là provider xác định được và máy chủ SMTP cục bộ. Kiểm chứng provider thật và production là suite riêng, xem `../production/README.md`.

Môi trường chỉ sử dụng database `edugrade_e2e` tại `127.0.0.1:3308`, kho tệp tại `127.0.0.1:9002`; không reset database production. Các fixture độc lập có tiền tố E2E. Lần chạy lặp lại giữ dữ liệu test; có thể dừng các dịch vụ của suite khi cần giải phóng cổng.

Giữ môi trường để xem UI hoặc chạy riêng một lỗi:

```powershell
node e2e/demo/run.mjs --system --serve
# Terminal khác:
npm run test:e2e:all -- --reuse --headed system/05-file-preview.spec.ts
```

Các kết quả, video và session nằm trong các thư mục `e2e/.*` bị Git và Docker bỏ qua. Mỗi lượt đầy đủ tạo lại `e2e/.system-report` và `e2e/.system-results/results.json`.

Phụ huynh được chạy bằng Expo Web kết nối API thật. Suite này không xác nhận camera thiết bị, app native iOS/Android, hệ thống Web Push hoặc mọi trình duyệt/thiết bị. Các luồng nghỉ học không có biểu mẫu trên app được gửi qua API phụ huynh thật. Xem kết quả và giới hạn cụ thể trong `RESULTS.md` sau lượt kiểm chứng cuối.

Lỗi PDF trắng trên Linux có phép kiểm tra độc lập `pdf-render.cjs`: chạy nó trong image backend, truyền một PDF có chữ. Phép đo đòi hỏi hơn 1.000 điểm ảnh tối. `live-pdf-reader.cjs` xác minh cùng PDF qua AI thật với cấu hình riêng bị Git bỏ qua. Tài nguyên font của runtime phải được giữ trong Dockerfile backend.

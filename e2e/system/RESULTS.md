# Kết quả kiểm tra toàn hệ thống WDP

Lượt chạy ngày **14/11/2026 (giờ Việt Nam)**: **97/97 passed**, 0 failed, 0 skipped, 0 flaky; khoảng 12,0 phút trên Next.js 16.4.6. Microsoft Edge mở trên màn hình; 1 worker, không retry.

| Phạm vi                                                            | Kết quả            |
| ------------------------------------------------------------------ | ------------------ |
| Sáu luồng trình diễn và các luồng vận hành                         | 13/13              |
| Toàn bộ route web lấy từ source, có ID thật cho trang chi tiết     | 75/75              |
| Chuyển hướng đăng nhập giữ đúng địa chỉ công khai                  | 1/1                |
| Tiêu đề, bố cục năm biểu mẫu xác thực                              | 5/5                |
| Admin tổng: 19 route, API thật, màn hình 1440 và 390               | 1/1, 19 bước route |
| Phụ huynh Expo Web: 15 màn hình tĩnh/chi tiết                      | 1/1, 15 bước route |
| Ảnh bài làm qua API có xác thực, đúng byte và từ chối vai trò khác | 1/1                |

Báo cáo tương tác có ảnh, video và trace tại `e2e/.system-report/index.html`; mở bằng `npm run test:e2e:system:report`. JSON của lượt chạy nằm tại `e2e/.system-results/results.json`. Các bằng chứng này được giữ trên máy và không đưa vào Git/image ứng dụng. Hướng dẫn chạy lại: [README.md](./README.md).

Các bản sửa đã có phép kiểm chứng: dùng chung tiêu đề và bộ chọn trong biểu mẫu; bảng quyền Admin không tràn màn hình nhỏ; đường dẫn About trỏ tới mục hiện có; chuyển hướng đăng nhập sau reverse proxy; xem ảnh riêng tư qua HTTPS cùng origin. Backend đã được kiểm tra lại 551 unit test; mobile nhánh develop/Expo 58 đạt 668 test; Admin đạt 61 test; kiểm tra FE hiện có đạt 63 test và thêm 4 phép hồi quy chuyển hướng.

Frontend dùng Next.js 16.4.6, Zod 4.6.6 và khóa các bản vá gián tiếp tương thích; công cụ shadcn được giữ ở nhóm dependency phát triển. `npm audit --omit=dev` trả 0 cảnh báo cho runtime frontend. Xem [thông báo bảo mật Next.js](https://github.com/advisories/GHSA-2464-fhr4-w9xw). Đây không phải kết luận toàn bộ bốn kho đã qua kiểm toán bảo mật: thư viện công cụ phát triển và backend vẫn có advisory, gồm Prisma cần nâng major; không áp dụng tự động các bản nâng phá vỡ tương thích.

PDF dùng font chuẩn không nhúng bị trắng trong Linux slim đã được tái hiện trong image cũ (0 điểm ảnh tối). Image có font fallback tạo 12.528 điểm ảnh tối và AI thật đọc được đúng lời giải. Kiểm tra pipeline production sau triển khai dùng suite riêng: [production/README.md](../production/README.md).

Giới hạn: local dùng MySQL/MinIO thật và provider AI/SMTP cục bộ xác định được. Mobile là Expo Web; chưa kiểm tra native Android/iOS, camera hoặc OS Push. SMTP xác thực thật và outbox SENT không chứng minh thư đã vào inbox. Phạm vi trên không bảo đảm hệ thống không còn lỗi ngoài các trường hợp đã chạy.

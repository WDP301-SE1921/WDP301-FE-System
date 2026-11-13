# Kết quả Playwright E2E WDP

Lượt chạy bắt đầu lúc **19:00:11 13/11/26 (giờ Việt Nam)**.

**13/13 passed**, 0 failed, 0 skipped, 0 flaky. Tổng thời gian 130.97 giây. Chạy với cửa sổ trình duyệt hiển thị, không bật retry.

| Test                                 | Kết quả | Thời gian |
| ------------------------------------ | ------- | --------- |
| 01 - Giáo trình và lịch học          | passed  | 11.0s     |
| 02 - Ghi danh và học phí             | passed  | 9.7s      |
| 03 - Giao bài và chấm điểm           | passed  | 19.6s     |
| 04 - Nghỉ học và xếp học bù          | passed  | 8.7s      |
| 05 - Điểm danh và tỷ lệ chuyên cần   | passed  | 13.6s     |
| 06 - Báo cáo học tập và xuất file    | passed  | 4.7s      |
| 07 - Tạm nghỉ dài hạn                | passed  | 3.4s      |
| 08 - Chuyển lớp có ngày hiệu lực     | passed  | 3.9s      |
| 09 - Kết thúc môn và đăng ký lại     | passed  | 4.1s      |
| 10 - Dạy thay và đổi giáo viên       | passed  | 2.1s      |
| 11 - Dời buổi và ngày nghỉ trung tâm | passed  | 3.8s      |
| 12 - Thông báo và nhắc học phí       | passed  | 26.8s     |
| 13 - Chat nội bộ nhiều vai trò       | passed  | 6.2s      |

Báo cáo có ảnh, video, trace: `e2e/.demo-report/index.html`. Mở bằng `npm run test:e2e:demo:report`. Danh sách bằng chứng và commit từng repo nằm trong [last-run.json](./last-run.json).

Chạy lại khi môi trường còn mở: `npm run test:e2e:demo:headed -- --reuse`. Môi trường đã dừng: `npm run test:e2e:demo:headed` để dựng/migrate/seed/build và chạy.

Phạm vi: 6 luồng demo và các luồng vận hành, theo [README.md](./README.md). Mobile qua Expo web; parent báo nghỉ qua API thật; AI là provider kiểm thử cục bộ; email vào SMTP cục bộ; chưa xác minh Android/iOS native, độ chính xác AI, mail ngoài hoặc OS Web Push.

Nhánh: BE dev; FE nền main trên feature/demo-e2e; Admin dev; FEM dev. FEM develop đã được tải/cập nhật riêng nhưng không tự gộp với dev; chi tiết trong [branch-audit.json](./branch-audit.json).

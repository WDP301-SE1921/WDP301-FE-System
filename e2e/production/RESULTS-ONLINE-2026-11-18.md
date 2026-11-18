# Báo cáo production online — 18/11/2026

[Trang báo cáo dùng chung](https://wdp301-se1921.github.io/WDP301-FE-System/) mở thẳng báo cáo full đã chạy; không cần bấm Run. Giao diện Playwright gốc hiển thị từng case, trạng thái, thời gian và liên kết production.

| Kiểm chứng                                                             | Kết quả                                                                                                                                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Full](https://wdp301-se1921.github.io/WDP301-FE-System/full/)         | **96/96 đạt**, 0 fail/skip/flaky; lượt chạy thật lúc **14:01:55 giờ Việt Nam**, khoảng 370 giây. Dựng lại từ JSON đã lưu, không chạy lại nghiệp vụ để tạo trang.  |
| [AI/email](https://wdp301-se1921.github.io/WDP301-FE-System/services/) | **7/7 đạt**, lượt chạy thật lúc **14:15:52**; giữ riêng kết quả provider/pipeline thật đã ghi nhận.                                                               |
| [Public](https://wdp301-se1921.github.io/WDP301-FE-System/public/)     | **3/3 đạt** trong lượt kiểm chứng CLI online lúc **20:26:22**, 8 giây. Lệnh xuất bản, chờ Pages cập nhật, in link và **thoát 0**, không mở máy chủ báo cáo local. |
| Trình duyệt đọc báo cáo đã deploy                                      | Cả ba link HTTP 200, đúng số ca; không có JavaScript page error. Trang gốc chuyển tới full, không bị lượt public ghi đè.                                          |
| Kiểm tra runner, bảo vệ dữ liệu và xuất bản                            | **58/58 đạt**; có kiểm tra bảo toàn mã thoát khi xuất bản lỗi và vô hiệu hóa cấu hình tự mở HTML cũ.                                                              |
| Hồi quy readiness/chuyển hướng                                         | **9/9 đạt**.                                                                                                                                                      |
| Kiểm tra source                                                        | ESLint, TypeScript E2E, Prettier và build frontend đạt.                                                                                                           |

Các lệnh chạy production chỉ cập nhật web, in link rồi kết thúc. `npm run test:e2e:production:report` in link online đã có; không chạy test và không mở máy chủ local. Bản JSON/bằng chứng đầy đủ vẫn được lưu riêng trên máy chạy để chẩn đoán.

Xuất bản dùng quyền Git của thành viên, chỉ cập nhật nhánh báo cáo `gh-pages`, không đổi nhánh nguồn hoặc stage code đang sửa. Public/read-only/services/full/filtered có thư mục riêng; lượt lọc không ghi đè full và lượt chưa chạy ca nào không thay thế kết quả chung. Push thông thường được thử lại khi thành viên khác vừa cập nhật; không force push.

Trang public chỉ chứa thông tin case, trạng thái, thời gian và các link production được duyệt. Không xuất bản ảnh, traces, log, annotation riêng tư, nội dung lỗi/AI, cấu hình hoặc phiên đăng nhập. Bộ dựng báo cáo chặn ghi ngoài thư mục E2E và bỏ các biến môi trường có thể đổi thư mục đầu ra của HTML reporter.

File `.env` thật giữ trên từng máy, không commit và chưa chuyển lên GitHub Actions. CI có profile public không cần secret và bước xuất bản riêng; các profile có đăng nhập chỉ sử dụng khi quản trị viên chủ động cấu hình secret riêng. Phạm vi xác nhận email vẫn là SMTP xác thực và outbox `SENT`; chưa xác nhận thư nằm trong Inbox/Spam của người nhận.

Hướng dẫn setup/chạy: [README dành cho team](./README.md). Kết quả nghiệp vụ/provider gốc: [bộ production đầy đủ](./RESULTS-TEAM-2026-11-18.md) và [AI/email thật](./RESULTS-2026-11-18.md).

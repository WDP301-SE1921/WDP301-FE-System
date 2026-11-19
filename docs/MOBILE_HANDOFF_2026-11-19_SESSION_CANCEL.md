# Bàn giao cho team Mobile — bỏ hủy buổi, bỏ Ngày nghỉ, nghỉ Tết tự động (19/11/2026)

Nguồn: BE `dev` tại `d5aaa7c` (đã push, Render tự deploy), Web nhánh `feature/remove-session-cancel`. **Repo Mobile không bị sửa.** Đối chiếu với `WDP301-FEM-System` nhánh `develop` tại `d0c540e`.

**Kết luận: Mobile không bắt buộc phải sửa gì.** Không có field nào bị đổi tên hay bỏ khỏi response.

## Thay đổi nghiệp vụ

- Trung tâm **không hủy buổi** nữa. Buổi không dạy được thì đổi sang ngày khác (đổi giờ) hoặc đổi giáo viên (dạy thay).
- **Không còn Ngày nghỉ của trung tâm.** Chỉ có kỳ nghỉ Tết cố định, **từ 23 tháng Chạp đến hết mùng 7**. Ví dụ Tết 2027 nghỉ từ 30/01 đến 12/02/2027. Khi tạo lịch, hệ thống không sinh buổi trong kỳ này, và bài kế tiếp rơi vào buổi đầu sau Tết.
- **Giảm 50% tháng có Tết vẫn giữ nguyên.** Bảng mùng 1 Tết của BE sửa năm 2030 thành **02/02** (theo âm lịch Việt Nam; bảng cũ ghi 03/02).
- Đơn xin nghỉ của học sinh (một buổi, dài hạn, bảo lưu) và học bù không đổi.

## M-1. Buổi "Đã hủy" chỉ còn ở dữ liệu cũ (không bắt buộc)

- **Hiện tại:** app hiện `status: "CANCELLED"` kèm `cancelReason` (`session-info-card.tsx`, `today-sessions.tsx`, `parent-data-mappers.ts`), nhãn thông báo `SESSION_CANCELLED` và gia hạn nguồn `SESSION_CANCELLED`.
- **Hậu quả:** không có buổi `CANCELLED` mới, không có thông báo `SESSION_CANCELLED` mới. Buổi và thông báo cũ vẫn được trả về như trước.
- **Cần làm:** **giữ** các map hiển thị đó để dữ liệu cũ vẫn đọc được. Không thêm gì.
- **API:** `GET /academic/scheduled-sessions` vẫn trả `status`, `cancelReason`; bộ lọc `status=CANCELLED` vẫn được nhận.

## M-2. Route hủy buổi và Ngày nghỉ trả 404 (thông tin)

- Đã xóa ở BE: `POST academic/sessions/:id/cancel`, `.../cancel-preview`, `academic/sessions/bulk-cancel`, `.../bulk-cancel-preview`, và `GET/POST academic/center-closures`, `PATCH/DELETE academic/center-closures/:id`.
- Mobile không gọi các route này: `src/__tests__/wired-routes.test.ts:85` khẳng định app không nối `/cancel` của buổi, và `src` không có chỗ nào dùng `closure`. Không ảnh hưởng.

## M-3. Lịch có khoảng trống dịp Tết (thông tin)

- Lịch tuần/tháng của con sẽ trống từ 23 tháng Chạp đến mùng 7. Đây là dữ liệu đúng, không phải lỗi tải.
- **Đề xuất (nếu sản phẩm muốn):** hiện chú thích "Trung tâm nghỉ Tết" cho các ngày trống trong khoảng đó. Ngày nghỉ lấy theo bảng `TET_BREAKS` của BE (`src/common/lunar-new-year.ts`). BE chưa có API trả bảng này; nếu cần thì báo BE thêm, đừng tự chép bảng vào app.

## M-4. Hóa đơn giảm Tết không đổi

- `pricing.tetDiscount`, `pricing.listTotal`, `months[].tet` giữ nguyên. App vẫn hiện dòng "Giảm 50% tháng có Tết" khi `tetDiscount` khác null.

## Nghiệm thu

- Lịch của con hiện đúng: buổi cũ đã hủy vẫn có nhãn "Đã hủy" và lý do; các tuần sau không có buổi hủy mới; kỳ Tết không có buổi.
- Hóa đơn cũ và mới qua Tết vẫn hiện dòng giảm 50%; hóa đơn không qua Tết không có dòng giảm.
- Xin nghỉ một buổi và nghỉ dài hạn vẫn gửi và hiện trạng thái như trước.

Implement màn hình sau thành trang thật trong repo, tuân thủ đúng quy tắc đã lưu ở
.claude/rules/implement-ui.md — bắt buộc:
1. Dùng lại component trong src/components/shared/ và src/components/ui/, không tự
   viết lại từ đầu.
2. Dùng lại constants trong src/constants/ (messages, status, routes, business-rules,
   format, pagination, ui, subjects) — không hardcode text/số/route/màu.

Mã tham chiếu: [vd: PROMPT 3C] (bên [docs/ui-screens-manager.md / docs/ui-screens-teacher.md])

Trước khi viết bất kỳ dòng code nào:
1. Mở đúng file docs, tra bảng "Mục lục nhanh" đầu file để lấy Tên màn hình và
   Route dự kiến ứng với mã tham chiếu trên.
2. Đọc phần mô tả chi tiết của đúng mã đó trong file docs — đây là nguồn nội dung
   chuẩn (label, số liệu mẫu, trạng thái, bố cục), không đoán từ ảnh.
3. Liệt kê ngắn gọn component shared/ sẽ dùng cho từng khối trong ảnh.
4. Liệt kê ngắn gọn constants (messages/status/routes/business-rules...) sẽ dùng.
5. Nếu có khối nào không có component hoặc constant phù hợp, dừng lại và hỏi tôi
   trước khi tạo mới.

Ảnh đính kèm là kết quả dựng UI bằng Stitch, chỉ dùng để tham khảo bố cục và spacing,
KHÔNG copy code/style từ đó. Nếu ảnh và file docs khác nhau về nội dung, docs thắng.
Nếu route trong docs không khớp cấu trúc `src/app/` thực tế của repo, dùng route
đúng theo repo và báo lại cho tôi biết đã đổi.

Sau khi code xong:
- Chạy npm run build và npm run lint, đảm bảo sạch.
- Báo cáo: mã tham chiếu, tên màn hình và route đã dùng (tự tra từ docs), đã dùng
  shared component nào, đã dùng/thêm constants nào, đã thêm mock/type nào, có tạo
  file mới nào ngoài page.tsx không (và tại sao nếu có).
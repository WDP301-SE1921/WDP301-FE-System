Khi tôi đưa 1 ảnh chụp UI (từ Google Stitch) và yêu cầu implement thành trang/component
thật trong repo, LUÔN tuân thủ các quy tắc sau. Đây là quy tắc bắt buộc, không phải gợi ý.

## 1. BẮT BUỘC TÁI SỬ DỤNG COMPONENT ĐÃ CÓ

Trước khi viết BẤT KỲ JSX nào, phải:
1. Chạy `view` hoặc liệt kê toàn bộ `src/components/ui/` và `src/components/shared/`
   (bao gồm các thư mục con: layout, feedback, data-table, display, actions, pickers,
   workflows, calendar).
2. Đọc file `progress.md` (hoặc `.claude/memory/progress.md`) để biết chính xác
   component nào đã tồn tại, tên props ra sao.
3. Với MỌI phần tử trong ảnh, tự hỏi: "component này đã có trong shared/ chưa?"
   trước khi viết mới. Bảng tra nhanh:

   | Thấy trong ảnh                          | Dùng component có sẵn              |
   |------------------------------------------|-------------------------------------|
   | Sidebar + header layout                  | shared/layout/app-shell.tsx        |
   | Tiêu đề trang + breadcrumb + nút hành động | shared/layout/page-header.tsx      |
   | Badge trạng thái (Đang học, Vắng...)     | shared/feedback/status-badge.tsx   |
   | Bảng dữ liệu có filter/sort/phân trang   | shared/data-table/data-table.tsx + filter-bar + status-tabs + table-pagination |
   | Nút ⋮ có dropdown trên 1 dòng            | shared/data-table/row-actions.tsx  |
   | Card có tiêu đề + action                 | shared/display/section-card.tsx    |
   | Header trang chi tiết (avatar, badge, chỉ số) | shared/display/detail-header.tsx |
   | Cặp nhãn – giá trị                       | shared/display/description-list.tsx|
   | 4 KPI ở Dashboard                        | shared/display/kpi-card.tsx        |
   | Timeline lịch sử                         | shared/display/timeline.tsx        |
   | "cũ → mới" trong audit log               | shared/display/change-diff.tsx     |
   | Avatar + tên + dòng phụ trong bảng       | shared/display/user-cell.tsx       |
   | Tag màu theo môn (Toán/Lý/Hóa/Sinh)      | shared/display/subject-tag.tsx     |
   | "T2-T4-T6 · 15:00–16:30"                 | shared/display/schedule-text.tsx   |
   | Số tiền dạng "1.500.000 ₫"               | shared/display/money-text.tsx      |
   | Ngày/giờ/"5 phút trước"                  | shared/display/date-text.tsx       |
   | Thanh progress (tỷ lệ đi học, sĩ số x/max, tiến độ bài) | shared/display/progress-stat.tsx |
   | "Còn 2 ngày" / "Hết hạn"                 | shared/display/countdown-badge.tsx |
   | Mã monospace + nút copy                  | shared/display/code-display.tsx    |
   | Nút copy đơn lẻ                          | shared/actions/copy-button.tsx     |
   | Nút xuất Excel/PDF                       | shared/actions/export-button.tsx   |
   | Vùng in (biên lai)                       | shared/actions/print-layout.tsx    |
   | Empty state ("Chưa có...", "Không tìm thấy...") | shared/feedback/empty-state.tsx |
   | Vùng lỗi + nút Thử lại                   | shared/feedback/error-state.tsx    |
   | Dialog xác nhận (kể cả nút đỏ nguy hiểm) | shared/feedback/confirm-dialog.tsx |
   | Card chọn radio lớn (Loại đăng ký, chọn lớp) | shared/pickers/selectable-card.tsx |
   | Combobox tìm học sinh/phụ huynh/GV/lớp   | shared/pickers/entity-picker-presets.tsx |
   | Card lớp có lịch + sĩ số để chọn         | shared/pickers/class-option-card.tsx |
   | Danh sách buổi học bù để chọn            | shared/pickers/session-option-list.tsx |
   | Chip điều kiện "Cùng chương trình · ..." | shared/pickers/condition-chips.tsx |
   | Stepper ngang nhiều bước                 | shared/workflows/stepper.tsx       |
   | Layout wizard (stepper + nội dung + tóm tắt sticky) | shared/workflows/wizard-layout.tsx |
   | Thanh nút cố định cuối form               | shared/workflows/sticky-form-footer.tsx |
   | Lịch tuần/ngày dạng calendar             | shared/calendar/schedule-calendar.tsx |
   | 1 block buổi học trong calendar          | shared/calendar/session-block.tsx  |
   | Drawer chi tiết buổi học                 | shared/calendar/session-drawer.tsx |
   | Avatar nhóm chồng lên nhau ("+2")        | shared/display/avatar-group-display.tsx |
   | 4 ô đếm điểm danh (Có mặt/Vắng/...)      | shared/display/attendance-summary.tsx |

4. Với button, input, select, dialog, tabs, tooltip, dropdown, skeleton, spinner, toast,
   sheet, popover... LUÔN dùng từ `src/components/ui/`, không tạo lại bằng HTML/div thô.

## 2. CHỈ ĐƯỢC TẠO COMPONENT MỚI KHI THỰC SỰ KHÔNG CÓ

Nếu sau khi tra bảng trên và đọc thư mục shared/ mà thấy KHÔNG có component phù hợp:
- Dừng lại, liệt kê rõ tên component còn thiếu và mô tả ngắn.
- Hỏi tôi xác nhận trước khi tạo mới trong `shared/`.
- KHÔNG tự ý viết lại 1 bản UI riêng trong page.tsx thay vì dùng shared/.
- Nếu chỉ là phần rất đặc thù cho riêng 1 feature (không dùng lại chỗ khác),
  được phép tạo trong `src/features/<domain>/components/`, không đặt vào shared/.

## 3. QUY ƯỚC BẮT BUỘC KHÁC (đã chốt từ trước, không được bỏ qua)

- Không viết cứng text tiếng Việt trong component. Mọi label, message, placeholder
  phải lấy từ `src/constants/messages/*`, `src/constants/status.ts`,
  `src/constants/business-rules.ts`. Thiếu message nào thì thêm vào đúng file
  theo quy ước trong SKILL edugrade-constants (constants/messages/events/<domain>.ts
  cho message theo nghiệp vụ, common/error/validation/confirm/empty cho phần chung).
- Không viết cứng route, dùng `constants/routes.ts` (ROUTES.MANAGER.*).
- Không viết cứng số giới hạn nghiệp vụ (1–12 tháng, 7 ngày hết hạn...), lấy từ
  `constants/business-rules.ts`.
- Badge trạng thái luôn qua `<StatusBadge domain="..." status="..." />`, không tự
  viết className màu tay.
- Icon dùng thống nhất Hugeicons (`@hugeicons/react`), không dùng lucide-react.
- Đang ở giai đoạn MOCK-ONLY: không gọi API thật, không thêm Axios/service.
  Dữ liệu lấy từ `src/mocks/data/*`, gọi qua TanStack Query với queryFn là hàm mock
  trong `src/mocks/utils/mock-query.ts`. Nếu màn hình cần type/mock chưa có,
  tạo trong `src/types/` và `src/mocks/data/` theo đúng pattern các file mock hiện có.
- DataTable dùng chế độ server-side giả lập: state (page, pageSize, sort, search,
  status, filter) đồng bộ qua `nuqs`, không tự quản state cục bộ tách rời URL.
- Phân quyền chỉ theo role (manager | teacher), KHÔNG tạo permission chi tiết,
  không tạo UI ẩn/hiện theo quyền con trong 1 role.
- Route web KHÔNG có phần dành cho phụ huynh (parent chỉ dùng app mobile).
- Mọi trang mới phải nằm trong route group đúng: `(manager)` cho quản lý,
  `(teacher)` cho giáo viên.

## 4. QUY TRÌNH KHI TÔI ĐƯA 1 ẢNH STITCH

1. Đọc kỹ ảnh, liệt kê từng khối UI xuất hiện (header, filter, bảng, card, footer...).
2. Với từng khối, tra bảng ở mục 1 để chọn đúng component có sẵn.
3. Kiểm tra props thực tế của component đó bằng cách `view` file component
   (không đoán props từ tên).
4. Viết `page.tsx` (hoặc component con nếu là modal/drawer) ghép các component đã có.
5. Nếu cần mock data mới, tạo/mở rộng file trong `src/mocks/data/` và
   `src/types/` trước, rồi mới dùng trong page.
6. Nếu thiếu message/constant, thêm vào đúng file theo mục 1, không hardcode tạm.
7. Chạy `npm run build` và `npm run lint`, sửa tới khi sạch.
8. Báo cáo ngắn gọn: đã dùng những shared component nào, đã thêm mock/constant nào,
   có tạo component mới không (và tại sao nếu có).

## 5. KHÔNG ĐƯỢC LÀM

- Không copy y nguyên style/HTML mà Stitch xuất ra (Stitch không biết Tailwind
  token, component ui/, shared/ của repo này). Ảnh Stitch chỉ dùng để xác định
  BỐ CỤC và NỘI DUNG, không dùng làm nguồn code.
- Không tạo lại Badge/Button/Input/Table riêng cho 1 trang.
- Không tự thêm thư viện UI mới (icon set khác, component lib khác) khi chưa hỏi.
- Không tự ý đổi cấu trúc `src/constants/` hoặc `src/components/shared/` đã có.
Khi tôi đưa 1 ảnh chụp UI (từ Google Stitch) và yêu cầu implement thành trang/component
thật trong repo, LUÔN tuân thủ các quy tắc sau. Đây là quy tắc bắt buộc, không phải gợi ý.

## 0. BỐI CẢNH DỰ ÁN (đọc trước khi làm bất cứ gì)

- Dự án: EduGrade — hệ thống quản lý trung tâm dạy thêm (Toán/Lý/Hóa/Sinh, khối 6–9).
- 5 role dùng web: Quản trị viên (`admin`), Quản lý trung tâm (`center_manager`), Thiết kế
  giáo trình (`curriculum_designer`), Nhân viên (`staff`) — 4 role này dùng chung cây
  `/manager/*` (route group `(manager)` = "back-office trung tâm") — và Giáo viên
  (`teacher`, cây `/teacher/*`). Phụ huynh CHỈ dùng app mobile — không tạo bất kỳ
  trang/route nào cho phụ huynh trên web.
- Phân quyền theo role ở mức MÀN HÌNH: mỗi role có một tập màn hình cố định, nguồn duy
  nhất là `src/constants/role-access.ts` (`ROLE_AREAS`, `canAccessPath`). Không có
  permission chi tiết ngoài bảng đó — không tạo UI ẩn/hiện theo quyền con trong 1 role.
  Nút/link dẫn tới màn mà role hiện tại không vào được phải ẩn (dùng `useRoleAccess()`),
  không để người dùng bấm rồi nhận 403. Ngoại lệ duy nhất: `ACCOUNT_MANAGE_TARGETS`
  (role nào được tạo/mời tài khoản của role nào).
- Đang ở giai đoạn MOCK-ONLY: chưa có backend thật. Không gọi API thật, không thêm
  Axios/service gọi network. Dữ liệu lấy từ `src/mocks/data/*` qua TanStack Query với
  queryFn là hàm mock trong `src/mocks/utils/mock-query.ts`.
- Toàn bộ text hiển thị là tiếng Việt.
- Trước khi code bất kỳ màn nào, đọc `.claude/memory/progress.md` (hoặc file progress
  tương đương trong repo) để biết chính xác phase nào đã xong, component nào đã có —
  không giả định, không đoán.

## 1. BẮT BUỘC TÁI SỬ DỤNG COMPONENT ĐÃ CÓ

Trước khi viết BẤT KỲ JSX nào, phải:
1. Chạy `view`/liệt kê toàn bộ `src/components/ui/` và `src/components/shared/`
   (các thư mục con: layout, feedback, data-table, display, actions, pickers,
   workflows, calendar) để biết chính xác file nào đã tồn tại.
2. Với MỌI khối UI trong ảnh, tự hỏi "component này đã có trong shared/ chưa?"
   trước khi viết mới. Bảng tra nhanh:

   | Thấy trong ảnh                          | Dùng component có sẵn              |
   |------------------------------------------|-------------------------------------|
   | Sidebar + header layout                  | shared/layout/app-shell.tsx        |
   | Tiêu đề trang + breadcrumb + nút hành động | shared/layout/page-header.tsx      |
   | Badge trạng thái (Đang học, Vắng...)     | shared/feedback/status-badge.tsx   |
   | Bảng dữ liệu có filter/sort/phân trang   | shared/data-table/data-table.tsx + filter-bar + status-tabs + table-pagination |
   | Nút ⋮ có dropdown trên 1 dòng            | shared/data-table/row-actions.tsx  |
   | Nhiều dòng đang chọn cần thao tác hàng loạt | shared/data-table/bulk-action-bar.tsx |
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
   | Avatar nhóm chồng lên nhau ("+2")        | shared/display/avatar-group-display.tsx |
   | 4 ô đếm điểm danh (Có mặt/Vắng/...)      | shared/display/attendance-summary.tsx |
   | Nút copy đơn lẻ                          | shared/actions/copy-button.tsx     |
   | Nút xuất Excel/PDF                       | shared/actions/export-button.tsx   |
   | Vùng in (biên lai)                       | shared/actions/print-layout.tsx    |
   | Empty state ("Chưa có...", "Không tìm thấy...") | shared/feedback/empty-state.tsx |
   | Vùng lỗi + nút Thử lại                   | shared/feedback/error-state.tsx    |
   | Dialog xác nhận (kể cả nút đỏ nguy hiểm) | shared/feedback/confirm-dialog.tsx |
   | Loading lần đầu cho bảng/card/dashboard  | shared/feedback/skeleton-presets.tsx |
   | Phủ mờ khi refetch/đổi trang             | shared/feedback/loading-overlay.tsx |
   | Card chọn radio lớn (Loại đăng ký, chọn lớp) | shared/pickers/selectable-card.tsx |
   | Combobox tìm học sinh/phụ huynh/GV/lớp   | shared/pickers/entity-picker-presets.tsx |
   | Card lớp có lịch + sĩ số để chọn         | shared/pickers/class-option-card.tsx |
   | Danh sách buổi học bù để chọn            | shared/pickers/session-option-list.tsx |
   | Chip điều kiện "Cùng chương trình · ..." (read-only) | shared/pickers/condition-chips.tsx |
   | Stepper ngang nhiều bước                 | shared/workflows/stepper.tsx       |
   | Layout wizard (stepper + nội dung + tóm tắt sticky) | shared/workflows/wizard-layout.tsx |
   | Thanh nút cố định cuối form               | shared/workflows/sticky-form-footer.tsx |
   | Lịch tuần/ngày dạng calendar             | shared/calendar/schedule-calendar.tsx |
   | 1 block buổi học trong calendar          | shared/calendar/session-block.tsx  |
   | Drawer chi tiết buổi học                 | shared/calendar/session-drawer.tsx |

3. Với button, input, select, dialog, tabs, tooltip, dropdown, skeleton, spinner, toast,
   sheet, popover, calendar (date picker)... LUÔN dùng từ `src/components/ui/`, không
   tạo lại bằng HTML/div thô.
4. KHÔNG đoán props của component — luôn `view` file component thật để lấy đúng tên
   props, không suy diễn từ tên biến.

## 2. BẮT BUỘC TÁI SỬ DỤNG CONSTANTS — KHÔNG HARDCODE

Trước khi viết bất kỳ chuỗi text, số, route, hay className màu nào, kiểm tra
`src/constants/` đã có chưa:

   | Cần dùng trong UI                         | Lấy từ                                    |
   |--------------------------------------------|--------------------------------------------|
   | Text nút, label chung (Lưu, Hủy, Xóa bộ lọc...) | constants/messages/common.ts → ACTION_LABEL, COMMON_MSG |
   | Toast thành công/thất bại theo nghiệp vụ  | constants/messages/events/<domain>.ts (tạo nếu chưa có, theo đúng pattern) |
   | Thông báo lỗi chung / lỗi theo mã backend  | constants/messages/error.ts → ERROR_MSG, API_ERROR_CODE_MSG |
   | Lỗi validate form                          | constants/messages/validation.ts → VALIDATION_MSG |
   | Nội dung Confirm dialog                    | constants/messages/confirm.ts → CONFIRM_MSG |
   | Empty state (tiêu đề/mô tả)                | constants/messages/empty.ts → EMPTY_MSG |
   | Label + màu badge trạng thái               | constants/status.ts (dùng qua `<StatusBadge domain="..." status="..." />`, KHÔNG tự viết className màu tay) |
   | Route trang                                | constants/routes.ts → ROUTES.MANAGER.* (back-office) / ROUTES.TEACHER.* |
   | Giới hạn nghiệp vụ (1–12 tháng, 7 ngày hết hạn, ngưỡng cảnh báo...) | constants/business-rules.ts → BUSINESS_RULES |
   | Danh sách thứ trong tuần                   | constants/business-rules.ts → WEEKDAYS |
   | Regex, giới hạn ký tự field                | constants/validation.ts → REGEX, FIELD_LIMITS |
   | Format ngày/giờ                            | constants/format.ts → DATE_FORMAT (qua lib/format.ts, không tự viết format tay) |
   | Page size, số dòng/trang mặc định          | constants/pagination.ts → PAGINATION |
   | Duration toast, debounce search            | constants/ui.ts → TOAST_DURATION, DEBOUNCE |
   | Màu/label theo môn học                     | constants/subjects.ts |
   | Vai trò người dùng                         | constants/roles.ts → ROLES, ROLE_LABEL (admin / center_manager / curriculum_designer / staff / teacher / parent) |
   | Role nào vào được màn nào, trang chủ theo role | constants/role-access.ts → ROLE_AREAS, canAccessPath, ROLE_HOME_ROUTE |
   | Key lưu localStorage (trạng thái sidebar...) | constants/storage-keys.ts → STORAGE_KEYS |

Nếu màn hình cần message/constant chưa có:
- KHÔNG hardcode tạm "cho xong". Thêm vào đúng file theo bảng trên, đúng quy ước đặt
  tên đã có trong SKILL `edugrade-constants` (UPPER_SNAKE_CASE, hậu tố `_MSG`/`_STATUS`,
  `as const`, message có tham số dùng function).
- Message theo nghiệp vụ mới (chưa có domain trong `messages/events/`) → tạo file mới
  theo đúng pattern các file domain khác, rồi export ở `messages/index.ts`.

## 3. CHỈ ĐƯỢC TẠO COMPONENT/CONSTANT MỚI KHI THỰC SỰ KHÔNG CÓ

Nếu sau khi tra 2 bảng ở mục 1 và 2 mà thấy KHÔNG có gì phù hợp:
- Dừng lại, liệt kê rõ tên component/constant còn thiếu và mô tả ngắn.
- Hỏi tôi xác nhận trước khi tạo mới trong `shared/` hoặc thêm field mới vào
  `constants/`.
- KHÔNG tự ý viết lại 1 bản UI riêng trong page.tsx thay vì dùng shared/.
- Nếu chỉ là phần rất đặc thù cho riêng 1 feature (không dùng lại chỗ khác), được
  phép tạo trong `src/features/<domain>/components/`, không đặt vào shared/.

## 4. QUY ƯỚC BẮT BUỘC KHÁC (đã chốt từ trước, không được bỏ qua)

- Icon dùng thống nhất Hugeicons (`@hugeicons/react`), không dùng lucide-react hay
  thư viện icon khác.
- DataTable dùng chế độ server-side giả lập: state (page, pageSize, sort, search,
  status, filter) đồng bộ qua `nuqs`, không tự quản state cục bộ tách rời URL. Đổi
  search/tab/filter phải reset page về 1.
- Field nhập liệu dùng `react-hook-form` + `zod`, schema đặt trong `src/lib/validators/`
  theo đúng field name của data contract (không tự đổi tên field "cho đẹp").
- Route web KHÔNG có phần dành cho phụ huynh.
- Mọi trang mới phải nằm trong route group đúng: `(manager)` (URL `/manager/*`) cho
  admin / quản lý trung tâm / thiết kế giáo trình / nhân viên, `(teacher)` cho giáo viên.
  Trang mới của `(manager)` phải được khai báo trong `ROUTE_AREAS` của
  `constants/role-access.ts` (nếu không, proxy sẽ trả 403 cho mọi role).
- `shared/` KHÔNG được import từ `mocks/`, `features/`, hay service gọi API — component
  shared chỉ nhận dữ liệu qua props/fetcher truyền từ ngoài vào.

## 5. QUY TRÌNH KHI TÔI ĐƯA 1 ẢNH STITCH

1. Đọc kỹ ảnh, liệt kê từng khối UI xuất hiện (header, filter, bảng, card, footer...).
2. Với từng khối: tra bảng component ở mục 1, tra bảng constants ở mục 2.
3. Kiểm tra props/API thực tế bằng cách `view` file component và file constants liên
   quan — không đoán.
4. Viết `page.tsx` (hoặc component con nếu là modal/drawer) ghép các component đã có,
   dùng constants đã có.
5. Nếu cần mock data mới, tạo/mở rộng file trong `src/mocks/data/` và `src/types/`
   trước, theo đúng pattern các file mock hiện có, rồi mới dùng trong page.
6. Nếu thiếu message/constant, thêm vào đúng file theo mục 2, không hardcode tạm.
7. Chạy `npm run build` và `npm run lint`, sửa tới khi sạch.
8. Báo cáo ngắn gọn:
   - Đã dùng những shared component nào.
   - Đã dùng/thêm constants nào (đặc biệt message mới nếu có).
   - Đã thêm mock/type nào.
   - Có tạo component/constant mới không, và tại sao (nếu có).

## 6. KHÔNG ĐƯỢC LÀM

- Không copy y nguyên style/HTML mà Stitch xuất ra (Stitch không biết Tailwind
  token, component ui/, shared/, constants/ của repo này). Ảnh Stitch chỉ dùng để
  xác định BỐ CỤC và NỘI DUNG, không dùng làm nguồn code.
- Không tạo lại Badge/Button/Input/Table riêng cho 1 trang.
- Không viết cứng chuỗi tiếng Việt, số giới hạn nghiệp vụ, route, hay màu badge
  trong component — dù chỉ là "tạm thời".
- Không tự thêm thư viện UI mới (icon set khác, component lib khác) khi chưa hỏi.
- Không tự ý đổi cấu trúc `src/constants/` hoặc `src/components/shared/` đã có.
- Không thêm API client/Axios/service gọi mạng thật khi đang ở giai đoạn mock-only.
- Không tạo route hay UI cho phụ huynh trên web.
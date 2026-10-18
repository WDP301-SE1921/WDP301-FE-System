# Bàn giao thiết kế lại UI/UX Web EduGrade

Ngày: 18/10/2026. Phạm vi: **chỉ Web** (`WDP301-FE-System`), 4 vai trò Quản lý trung tâm, Nhân viên, Giáo viên, Thiết kế giáo trình. App Mobile phụ huynh chỉ bị nhắc ở phần cần làm thêm.

Trạng thái: **mới có bản thiết kế, chưa sửa code**. Tài liệu này dùng để người khác lập trình lại giao diện theo thiết kế.

Nguyên tắc chung: **chỉ đổi giao diện và điều hướng**. Giữ nguyên API, phân quyền theo vai trò, validate (Zod), luồng duyệt giáo trình hai cấp, các bước nghỉ/học bù/thanh toán. Mọi chỗ khác nguyên tắc này được liệt kê riêng ở [mục 6](#6-những-chỗ-có-đổi-logic).

---

## 1. Mở và kết nối bản thiết kế Claude Design

### 1.1 Link

**https://claude.ai/artifact/5wQzCn4axE3SZBScGHtFPv**

- Canvas đang chia sẻ dạng _ai có link đều xem được_. Nếu không mở được, nhờ chủ canvas mở lại quyền trong menu **Share**.
- Muốn bình luận ngay trên thiết kế thì đăng nhập claude.ai và dùng chức năng comment của canvas.

### 1.2 Cách xem

1. Mở link. Thanh trên cùng có danh sách **7 trang** (xem mục 1.4). Bấm tên trang để chuyển.
2. Mỗi khung trên canvas là một **artboard** = một màn hình. Tên artboard ghi ở dải phía trên khung (ví dụ `Nhân viên · Học sinh + panel Xử lý`).
3. Bấm đúp vào artboard (hoặc nút mở rộng) để xem toàn màn hình. Các màn trang ứng dụng giãn theo bề rộng cửa sổ, chuẩn thiết kế là 1440px.
4. Artboard có **nút Play** (đánh dấu xanh) là màn **bấm thử được**: đổi tab, mở panel, mở hộp thoại, vẽ trên ảnh. Bấm Play rồi thao tác như ứng dụng thật.
5. Link giữa các màn (ví dụ bấm "Chấm bài" ở danh sách bài nộp) chỉ hoạt động trong chế độ Play.

### 1.3 Lấy mã nguồn artboard

Có 2 cách:

- **Bản sao trong repo** (không cần mạng): `docs/ui-redesign-2026-10/design-source/`
  - `<TênArtboard>.dc.html`: mã nguồn từng màn. Mở bằng editor để đọc cấu trúc, chữ hiển thị, màu và khoảng cách. File **không chạy độc lập** trên trình duyệt vì cần runtime của Claude Design, nhưng HTML/CSS đọc được bình thường.
  - `canvas.json`: danh sách artboard, tên, trang, kích thước.
  - `eg.css`: các lớp CSS `eg-*` dùng trong artboard. Bảng đổi sang Tailwind/shadcn ở [mục 3.2](#32-đổi-lớp-eg--sang-tailwind--shadcn).
- **Qua Claude Code**: dán link canvas và yêu cầu kiểu _"đọc artboard `QL-LichHoc.dc.html` trong canvas này rồi dựng lại bằng component trong `src/components/ui`"_. Claude Code đọc được mã nguồn trực tiếp từ link.

Lưu ý khi đọc thiết kế:

- **Dữ liệu trong thiết kế là dữ liệu mẫu** (tên lớp, học sinh, số tiền, biểu đồ). Khi code, mọi số liệu lấy từ API.
- Nhãn xám **`chờ BE-x`** / **`M-1`** trên thiết kế = phần cần BE hoặc Mobile làm thêm, xem [mục 9](#9-việc-cần-be--mobile). Khi chưa có thì ẩn hoặc disable đúng như ghi chú.
- Icon trên sidebar thiết kế là ảnh minh họa. Khi code dùng lại icon hiện có trong `src/constants/menu.ts` (bộ icon đang dùng trong project).

### 1.4 Danh sách artboard theo trang

| Trang canvas               | Artboard (file)                                                                                                                 | Màn hình                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1 · Tổng quan & menu       | `Main`                                                                                                                          | Nguyên tắc, menu mới theo vai trò                                                                                 |
| 2 · Dashboard theo vai trò | `QL-Dashboard`, `NV-Dashboard`, `GV-Dashboard`, `TK-Dashboard`                                                                  | Dashboard 4 vai trò                                                                                               |
| 3 · Giáo trình & xếp lịch  | `NghiepVu-QuanHe`, `NghiepVu-QuyTrinh`                                                                                          | Đề xuất nghiệp vụ, quan hệ dữ liệu, việc cần BE                                                                   |
|                            | `GT-DanhSach`, `GT-TaoMoi`, `GT-ChiTiet`, `GT-ImportCSV`, `GT-ThamDinh`, `GT-PhanHoi`, `GT-SinhLich`                            | Giáo trình và sinh lịch                                                                                           |
| 4 · Nhân viên              | `NV-HocSinh`, `LopHoc`, `NV-ThanhToan`                                                                                          | Học sinh & phụ huynh, Lớp học + Phòng, Đăng ký & biên lai                                                         |
| 5 · Quản lý                | `QL-HocSinhPhuHuynh`, `QL-HocSinhChiTiet`, `QL-LichHoc`, `QL-ChiTietLop`, `QL-DanhMuc`, `QL-ThongBao`, `QL-NhanSu`, `QL-LichSu` | Phụ huynh, chi tiết học sinh, Lịch học, Chi tiết lớp, Khóa học & giáo trình, Thông báo, Nhân sự, Lịch sử thay đổi |
| 6 · Giáo viên              | `GV-BaiTap`, `GV-BaiNop`, `GV-ChamBai`, `GV-ChamBaiAnh`, `GV-TaoBaiTap`, `GV-DiemDanh`, `GV-BaoCao`                             | Bài tập & chấm bài, Lịch dạy & điểm danh, Báo cáo                                                                 |
| 7 · Thành phần & tài khoản | `Sidebar`, `Topbar`, `TaiKhoan`                                                                                                 | Menu theo vai trò, thanh trên, tài khoản cá nhân                                                                  |

Artboard bấm thử được: `QL-Dashboard`, `NV-Dashboard`, `GV-Dashboard` (rê chuột lên biểu đồ), `NV-HocSinh`, `LopHoc`, `QL-LichHoc`, `QL-DanhMuc`, `QL-NhanSu`, `QL-HocSinhPhuHuynh`, `QL-HocSinhChiTiet`, `GV-ChamBaiAnh`.

---

## 2. Quy tắc dựng giao diện

- Dùng primitive có sẵn trong `src/components/ui/` (Button, Card, Table, Tabs, Badge, Input, Select, Dialog, **Sheet**, DropdownMenu, Tooltip, Progress) và `src/components/shared/` (`data-table`, `layout/page-header`, `layout/page-container`, `feedback/*`). Không thêm thư viện UI mới.
- Tab, bộ lọc, panel đang mở, tuần đang xem đều giữ trên URL bằng `nuqs` để reload và chia sẻ link không mất trạng thái.
- Form vẫn dùng `react-hook-form` + schema Zod hiện có trong `src/lib/validators/`. Chỉ đổi nơi đặt form (panel, hộp thoại, cột trái), **không đổi schema**.
- Mỗi màn gộp vẫn kiểm tra quyền theo `src/constants/role-access.ts`. Tab nào thuộc vùng quyền (area) vai trò không có thì ẩn tab đó.
- **Route cũ không xóa**: chuyển thành redirect sang màn mới, giữ query (ví dụ `?studentId=&sessionId=`), để link cũ, bookmark và link trong email vẫn chạy.
- Giữ thông báo lỗi tiếng Việt hiện có (bộ diễn giải lỗi chung). Không in JSON thô.

---

## 3. Hệ thiết kế

### 3.1 Màu và kiểu chữ: một tông xanh cho mọi màn

| Thay đổi       | Chi tiết                                                                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bỏ**         | Theme `edugrade-warm` (kem/cam đất) trong `src/app/globals.css` (khối `.edugrade-warm, body:has(.edugrade-warm)` và các lớp `dashboard-*`), font tiêu đề Noto Serif của dashboard                                    |
| **Dùng chung** | Token mặc định `:root` hiện có: primary `#155dfc` (oklch 0.546 0.245 262.881), viền `#e5e5e5`, chữ phụ `#737373`, nền sidebar `#fafafa`, font Be Vietnam Pro                                                         |
| **Biểu đồ**    | Một chuỗi: xanh `#2a78d6`. Nhiều chuỗi: theo thứ tự xanh `#2a78d6`, cam `#eb6834`, ngọc `#1baf7a`, vàng `#eda100`. Thanh ≤ 24px, đầu bo 4px, lưới mảnh 1px, có tooltip khi rê chuột, **không dùng biểu đồ 2 trục y** |
| **Trạng thái** | Có mặt `#0ca30c`, Vắng `#d03b3b`, Có phép `#fab219`. Luôn kèm chữ hoặc icon, không chỉ dùng màu                                                                                                                      |
| **Bo góc**     | Giữ quy định `.claude/rules/ui.md`: card 18px (`rounded-2xl`), input/nút 14px (`rounded-xl`), badge `rounded-full`                                                                                                   |

Khi code xong phải sửa `.claude/rules/ui.md`: bỏ dòng _"User-approved dashboard variant (2026-10-14) … edugrade-warm"_ và ghi quyết định ngày 18/10/2026 "một tông xanh cho mọi màn".

### 3.2 Đổi lớp `eg-*` sang Tailwind / shadcn

| Lớp trong thiết kế                                         | Dùng khi code                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `eg-card`                                                  | `<Card>` (đã có `rounded-2xl border p-6 shadow-xs`)                                               |
| `eg-tw` + `eg-t`                                           | `<Table>` hoặc `shared/data-table` (header `h-11 px-4 bg-muted/50`)                               |
| `eg-tabs` / `eg-tab on`                                    | `<Tabs>` / `<TabsTrigger>`                                                                        |
| `eg-btn eg-btn-p / -o / -g / -d`                           | `<Button variant="default / outline / ghost / destructive">`                                      |
| `eg-badge eg-b-green / amber / red / blue / gray / violet` | `<Badge>` hoặc `StatusBadge` (`shared/feedback/status-badge.tsx`) với màu tương ứng               |
| Nút thao tác cuối dòng, menu ⋯                             | `shared/data-table/row-actions.tsx` + `<DropdownMenu>`                                            |
| Tab lọc trạng thái trên bảng (Tất cả / Cần chấm / …)       | `shared/data-table/status-tabs.tsx`                                                               |
| Thanh tìm kiếm + bộ lọc                                    | `shared/data-table/filter-bar.tsx`, `active-filter-chips.tsx`                                     |
| `eg-drawer` + `eg-overlay`                                 | `<Sheet side="right">` (rộng 520–680px)                                                           |
| `eg-dialog`                                                | `<Dialog>`; hộp xác nhận dùng `shared/feedback/confirm-dialog.tsx`                                |
| `eg-kv` (nhãn – giá trị)                                   | `shared/display/description-list.tsx`                                                             |
| So sánh bản mới / bản cũ (thẩm định)                       | `shared/display/change-diff.tsx`                                                                  |
| `eg-split` / `eg-left` / `eg-right`                        | `grid lg:grid-cols-[minmax(320px,400px)_1fr] gap-6` (form trái, nội dung phải); dưới `lg` xếp dọc |
| `eg-grid4`                                                 | `grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]` → 4 cột ở 1440px         |
| `eg-kanban` / `eg-kcol` / `eg-kcard`                       | Mở rộng `src/features/curriculum/components/schedule-board.tsx` đang có                           |
| `eg-steps`                                                 | `shared/workflows/stepper.tsx` (có sẵn)                                                           |
| `eg-stat`, thẻ số liệu dashboard                           | `shared/display/kpi-card.tsx` / `progress-stat.tsx` (có sẵn)                                      |
| Thanh tiến độ (sĩ số, giáo trình)                          | `<Progress>` (`ui/progress.tsx`)                                                                  |
| Nút lưu cố định cuối form                                  | `shared/workflows/sticky-form-footer.tsx`                                                         |
| `eg-seg` (Có mặt / Vắng / Có phép)                         | `ToggleGroup` tự dựng từ `Button` (không thêm thư viện)                                           |

### 3.3 Mẫu bố cục dùng lặp lại

| Mẫu                                                | Dùng cho                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Bảng + nút thao tác trên dòng → Sheet bên phải** | Học sinh (Xử lý nghỉ/học bù), Phụ huynh, Nhân sự, Đăng ký & biên lai, Lịch học (bấm một buổi)                                   |
| **Lưới thẻ 4 cột**                                 | Lớp học (Quản lý, Nhân viên), Lớp của tôi (Giáo viên)                                                                           |
| **Chia 2 phần: nhập trái, hiển thị phải**          | Môn học/Khóa học/Phòng, Thông báo, Sinh lịch, Tạo giáo trình, Nhập CSV, Tạo bài tập, Chấm bài, Báo cáo, Tài khoản, Chi tiết lớp |
| **Kanban theo ngày trong tuần**                    | Chỉ Lịch học / Lịch dạy. Không kéo-thả; đổi giờ/hủy/dạy thay qua Sheet                                                          |
| **Danh sách → bấm → làm → Gửi**                    | Chấm bài, Thẩm định giáo trình, Điểm danh (không dùng Kanban)                                                                   |

---

## 4. Menu mới và route

Sửa ở `src/constants/menu.ts` (nhãn, nhóm), `src/constants/routes.ts` (route mới), `src/constants/role-access.ts` (thêm tiền tố route mới vào `ROUTE_AREAS`, nếu không proxy sẽ trả 403). Không đổi `ROLE_AREAS`.

### 4.1 Quản lý trung tâm: 18 → 8 mục

| Mục mới               | Route                                                                        | Gộp từ (route cũ → redirect)                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard             | `/manager/dashboard`                                                         | giữ                                                                                                                                                                                                    |
| Học sinh & phụ huynh  | `/manager/students` (`?tab=students\|parents`)                               | `/manager/parents` → `?tab=parents`; `/manager/parents/[id]` → `?tab=parents&parent=<id>` (Sheet)                                                                                                      |
| Lớp học               | `/manager/classes` (`?tab=classes\|rooms`)                                   | `/manager/rooms` → `?tab=rooms`                                                                                                                                                                        |
| Lịch học              | `/manager/schedule` (mặc định `?view=board`)                                 | `/manager/teachers/substitutes` → `/manager/schedule` (dạy thay nằm trong Sheet buổi học)                                                                                                              |
| Khóa học & giáo trình | `/manager/curriculum` (`?tab=programs\|subjects\|feedback`)                  | `/manager/catalog` → `?tab=subjects`; `/manager/catalog/programs/[id]` → `?program=<id>`; `/manager/curriculum/feedback` → `?tab=feedback`                                                             |
| Thông báo             | `/manager/notifications` (**route mới**)                                     | `/manager/notifications/send` và `/manager/notifications/emails` → route mới                                                                                                                           |
| Nhân sự               | `/manager/people` (**route mới**, `?tab=teachers\|staff\|managers\|invites`) | `/manager/teachers`, `/manager/teachers/invitations`, `/manager/system/staff`, `/manager/system/managers` → route mới; `/manager/teachers/[id]`, `/manager/system/staff/[id]` → `?person=<id>` (Sheet) |
| Lịch sử thay đổi      | `/manager/system/audit-logs`                                                 | giữ                                                                                                                                                                                                    |

Sinh lịch: giữ route `/manager/sessions` nhưng hiển thị màn **Sinh lịch theo khóa**; `/manager/classes/[id]/sessions` → `/manager/sessions?classId=<id>`.

Không đụng: `/manager/absences/*`. Các route này chỉ vai trò `admin` vào được, mà BE không có admin.

### 4.2 Nhân viên: 11 → 6 mục

| Mục mới                 | Route                                                                                      | Gộp từ                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard (**màn mới**) | `/staff/dashboard` (**route mới**)                                                         | —                                                                                                                                                                                                                                                                                                                                         |
| Học sinh & phụ huynh    | `/staff/students` (`?tab=students\|parents`, `&student=<id>&action=<mode>` mở Sheet Xử lý) | `/staff/parents` → `?tab=parents`; `/staff/absences/makeup` → `?action=makeup`; `/staff/absences/swap` → `?action=swap`; `/staff/absences/change-class` → `?action=change`; `/staff/absences/long-leave` → `?action=leave`; `/staff/absences/withdraw` → `?action=withdraw` (giữ `studentId`, `enrollmentId`, `sessionId` sang query mới) |
| Đăng ký học             | `/staff/enrollments/new`                                                                   | giữ                                                                                                                                                                                                                                                                                                                                       |
| Đăng ký & biên lai      | `/staff/payments`                                                                          | giữ                                                                                                                                                                                                                                                                                                                                       |
| Lớp học                 | `/staff/classes`                                                                           | giữ (không có tab Phòng vì nhân viên không có quyền `rooms`)                                                                                                                                                                                                                                                                              |
| Lịch học                | `/staff/schedule`                                                                          | giữ                                                                                                                                                                                                                                                                                                                                       |

Đề xuất (cần bạn duyệt): đổi trang chủ sau đăng nhập của nhân viên (`ROLE_HOME_ROUTE.staff`) từ `/staff/enrollments/new` sang `/staff/dashboard`.

### 4.3 Giáo viên: 10 → 6 mục

| Mục mới              | Route                                                  | Gộp từ                                                                                              |
| -------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Dashboard            | `/teacher/dashboard`                                   | giữ                                                                                                 |
| Lịch dạy & điểm danh | `/teacher/schedule` (`?view=list\|board&session=<id>`) | `/teacher/attendance` → `?view=list`; `/teacher/attendance/[sessionId]` → `?view=list&session=<id>` |
| Lớp của tôi          | `/teacher/classes`                                     | giữ                                                                                                 |
| Giáo trình           | `/teacher/curriculum` (`?tab=review\|feedback`)        | `/teacher/feedback` → `?tab=feedback`                                                               |
| Bài tập & chấm bài   | `/teacher/assignments`                                 | `/teacher/submissions` và `/teacher/grading` → `/teacher/assignments?filter=need-grading`           |
| Báo cáo              | `/teacher/reports`                                     | giữ                                                                                                 |

### 4.4 Thiết kế giáo trình: 2 mục

| Mục mới                 | Route                                                                                 | Ghi chú                                     |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| Dashboard (**màn mới**) | `/manager/curriculum/overview` (**route mới**, nằm trong vùng quyền `catalog` sẵn có) | —                                           |
| Giáo trình              | `/manager/curriculum` (tab Giáo trình + Phản hồi)                                     | Vai trò này không thấy tab Môn học/Khóa học |

---

## 5. Chi tiết từng màn

Mỗi màn ghi: artboard mẫu · route · **giữ nguyên** · **bỏ khỏi UI cũ** · **thêm ở UI mới** · **đổi logic?** · chờ BE.

### 5.1 Dashboard

**`QL-Dashboard`, Dashboard Quản lý**: `/manager/dashboard`, component `src/features/dashboard/components/live-manager-dashboard.tsx`

- Giữ: API dashboard và export Excel, bộ chọn khoảng ngày, nguồn số liệu.
- Bỏ: theme cam đất, 6 thẻ KPI xếp 3 cột, **biểu đồ "Doanh thu & Buổi học" 2 trục y**, khối "Thống kê theo loại hoạt động", font serif.
- Thêm: 4 thẻ số liệu / hàng (học phí đã nhận kèm % so với tháng trước, học sinh đang học / hồ sơ, lớp đang mở, buổi học tuần này); biểu đồ cột _Học phí theo tháng_ (có tooltip, có nút chuyển sang dạng bảng); thanh ngang _Học sinh theo khối_; _Lấp chỗ theo lớp_ (sĩ số/sức chứa); _Cần chú ý_ (email lỗi, lớp chưa có giáo viên, khóa chưa có giáo trình kỳ sau, giáo trình chờ duyệt, mỗi dòng dẫn tới màn liên quan); _Hoạt động gần đây_ (5 dòng mới nhất từ audit log, link "Xem tất cả").
- Đổi logic: không. Chỉ tính thêm ở FE từ API sẵn có (% so với tháng trước, lấp chỗ = học sinh đang học / `capacity`).

**`NV-Dashboard`, Dashboard Nhân viên (màn mới)**: `/staff/dashboard`

- Thêm: đơn chờ thu phí (đăng ký `DRAFT` + tổng tiền dự kiến), đã thu hôm nay, chờ xếp học bù, buổi học hôm nay, bảng 5 đơn chờ thu có nút _Thu phí_, biểu đồ học phí thu 14 ngày, _Chỗ trống theo lớp_ (để tư vấn phụ huynh), danh sách học bù chờ xếp có nút _Xếp học bù_.
- Nguồn: `directoryApi.registrations`, `directoryApi.payments`, `academicApi.sessions`, `academicApi.makeupSources`, `registrationApi.classes` (`availableSeats`).
- Đổi logic: không. Màn mới chỉ đọc dữ liệu.

**`GV-Dashboard`, Dashboard Giáo viên**: `/teacher/dashboard`, `live-teacher-dashboard.tsx`

- Giữ: số liệu lớp phụ trách, buổi hôm nay, bài nộp, thông báo lớp.
- Đổi: thẻ "Bản chấm chờ duyệt" → **"Buổi chưa điểm danh"** (vì đã có nút Gửi điểm, xem 5.6).
- Thêm: biểu đồ _Chuyên cần_ theo buổi đã chốt; _Tiến độ giáo trình_ từng lớp (bài đang dạy / tổng bài, cảnh báo lớp chậm hơn khóa); danh sách _Cần chấm_, _Chờ bạn thẩm định_.
- Đổi logic: không. Chuyên cần % tính ở FE từ danh sách người học của buổi (`participants.attendance`).

**`TK-Dashboard`, Dashboard Thiết kế giáo trình (màn mới)**: `/manager/curriculum/overview`

- Thêm: số giáo trình đang soạn / bị trả lại / chờ duyệt / phản hồi chưa xử lý; _Sẵn sàng cho kỳ sau theo khóa_ (bài đã có / bài cần); 3 phản hồi mới nhất.
- Nguồn: `curriculumApi` (danh sách học phần), `LiveCurriculumFeedback` API. "Bài cần" xem 5.4 (cần BE-1, tạm tính ở FE).

### 5.2 Học sinh & phụ huynh

**`NV-HocSinh`, bảng Học sinh + Sheet "Xử lý"**: `/staff/students` (Quản lý dùng cùng màn, không có nút Xử lý nếu vai trò không có quyền `absences`)

- Giữ: toàn bộ logic trong `src/features/absences/components/live-staff-workflows.tsx` (`SingleAbsence`, `MakeupPanel`, `TransferPanel`, form nghỉ dài hạn, kết thúc môn, nghỉ hẳn, `ReactivatePanel`, `LeaveHistory`), cùng API `academicApi.createLeave`, `makeupSources`, `makeupCandidates`, `endEnrollment`, `endStudent`… và quy tắc chuyển lớp phải cùng học phí.
- Bỏ: **5 trang riêng** (Nghỉ học và học bù, Đổi một buổi, Đổi lớp và lịch cố định, Nghỉ dài hạn, Nghỉ môn/Nghỉ hẳn), mỗi trang chỉ có một ô chọn học sinh chiếm cả chiều ngang.
- Thêm: bảng học sinh (Học sinh · Phụ huynh · Lớp đang học · **Chuyên cần %** · Nghỉ/học bù · Trạng thái · **Xem** · **Xử lý**). Bấm _Xử lý_ mở Sheet gồm: ô chọn ghi danh, 6 tab (Nghỉ 1 buổi · Học bù · Đổi 1 buổi · Đổi lớp/lịch cố định · Nghỉ dài hạn · Nghỉ môn/nghỉ hẳn), dưới cùng là lịch sử nghỉ & học bù. Lọc nhanh: Chờ xếp học bù / Đang nghỉ dài hạn / Chưa có lớp.
- Cách làm: tách `LiveStaffWorkflows` thành `StudentActionSheet` nhận `mode` từ tab (`?action=`) thay vì từ route. Các panel con giữ nguyên.
- Đổi logic: không.

**`QL-HocSinhChiTiet`, chi tiết học sinh**: `/staff/students/[id]` và `/manager/students/[id]`, component `src/features/directory/components/student-detail-view.tsx`

- Giữ: API `directoryApi.student`, `studentEnrollments`, `studentSchedule`.
- Bỏ: bố cục 3 card xếp dọc (thông tin + lịch tuần + ghi danh).
- Thêm: 4 thẻ số liệu (Chuyên cần % kèm có mặt/tổng buổi, Số buổi vắng kèm số chờ học bù / có phép, Điểm trung bình các bài đã công bố, Học phí đã đóng kèm ngày hết hạn); tab Tổng quan / Lịch học / Điểm & bài tập / Học phí / Nghỉ & học bù; dải ô điểm danh theo từng lớp (Có mặt / Vắng / Có phép / Học bù / Sắp tới, rê chuột xem ngày); bảng buổi gần đây; lớp đang học (còn bao nhiêu tuần); phụ huynh; điểm gần đây. Nút: _Đăng ký thêm lớp_, _Xử lý nghỉ / học bù_, menu ⋯ (_Sửa hồ sơ_, _Xem tài khoản phụ huynh_, _Ngừng học_).
- Thêm/sửa/xóa học sinh:
  - **Thêm**: Web không tạo hồ sơ con. Phụ huynh tạo trên app (quy định domain, giữ nguyên).
  - **Sửa hồ sơ**: chưa có API, **chờ BE-8**. Hiện nút disable kèm nhãn.
  - **Xóa**: dùng _Ngừng học_ đã có (`academicApi.endStudent`). Không xóa cứng.
- Đổi logic: không. Chuyên cần % và số buổi vắng tính ở FE từ điểm danh các buổi của học sinh. Nếu BE chưa trả đủ dữ liệu điểm danh theo học sinh thì xem ghi chú ở BE-8.

**`QL-HocSinhPhuHuynh`, tab Phụ huynh**: `/manager/students?tab=parents` (Nhân viên: `/staff/students?tab=parents`)

- Giữ: `directoryApi.parent`, `updateParent` (PATCH: họ tên, SĐT, trạng thái ACTIVE/DISABLED), `parentUpdateSchema`.
- Bỏ: trang `/manager/parents/[id]` riêng (`parent-detail-view.tsx`), nội dung chuyển vào Sheet.
- Thêm: bảng (Phụ huynh · Điện thoại · Hồ sơ con · Đã đóng · Trạng thái · **Xem / Sửa / Xóa**). _Xem_ mở Sheet: các con (chuyên cần, link xem học sinh), lịch sử thanh toán. _Sửa_ mở Dialog (họ tên, SĐT, trạng thái; email chỉ đọc). Nhân viên có thêm nút _Đăng ký cho con_.
- **Xóa**: chưa có API. Hộp thoại giải thích không xóa hẳn được khi đã có hồ sơ con hoặc thanh toán, rồi đề xuất **Khóa tài khoản** (= PATCH `status: DISABLED`, đã có). Xóa hẳn tài khoản trống **chờ BE-9**.
- Đổi logic: không.

### 5.3 Lớp học và lịch

**`LopHoc`, Lớp học (lưới 4 cột) + tab Phòng học**: `/manager/classes`, `/staff/classes`, `/teacher/classes`

- Giữ: `RegistrationClassesView` (`registration-flow/components/classes-view.tsx`), `LiveRoomsView` (`catalog/components/live-rooms-view.tsx`), API lớp và phòng.
- Bỏ: thẻ 3 cột cao ~380px, dòng lặp "Toán · Khối 8 / Toán 8", hai nút to full chiều ngang mỗi thẻ; trang Phòng học riêng có **form sửa cho từng phòng**.
- Thêm: thẻ gọn 4 cột (tên + trạng thái, môn · khối · phòng, lịch tuần, giáo viên hoặc cảnh báo _Chưa phân công_, sĩ số dạng thanh, học phí, nút _Chi tiết_ + menu ⋯ gồm _Xem buổi học / Thêm học sinh / Đóng đăng ký / Ngừng hoạt động_); nút chuyển Thẻ/Bảng; tab **Phòng học** (chỉ Quản lý): form thêm phòng bên trái, bảng phòng bên phải (Sửa / Ngừng sử dụng bằng Dialog).
- Đổi logic: không.

**`QL-ChiTietLop`, chi tiết lớp**: `/manager/classes/[id]`, `RegistrationClassEditor` (`registration-flow/components/class-editor.tsx`)

- Giữ: mọi form và API (lưu thông tin lớp, lịch tuần, xác nhận/mở khóa lịch, đổi giáo viên theo ngày hiệu lực, mở/đóng đăng ký, ngừng, xóa lớp chưa dùng).
- Bỏ: 4 card form xếp dọc (~2.200px); form _Đổi giáo viên từ ngày hiệu lực_ luôn mở.
- Thêm: tab Tổng quan / Học sinh / Buổi học / Chuyên cần. Tổng quan chia 2 cột: trái là _Thông tin lớp_ + _Lịch cố định_ (bảng gọn, nhãn Đã khóa, nút _Mở khóa để sửa…_ mở Dialog nhập lý do); phải là _Học sinh đang học_, _Buổi sắp tới_, _Giáo trình đang dùng_ (tiến độ). _Đổi giáo viên…_ mở Dialog. _Ngừng hoạt động / Xóa lớp_ chuyển vào menu ⋯.
- Đổi logic: không.

**`QL-LichHoc`, Lịch học Kanban + Sheet buổi học**: `/manager/schedule`, `/staff/schedule`

- Giữ: `AcademicCalendarView`, `ScheduleBoard`, `SessionDetailSheet` (`features/curriculum/components/`), API đổi giờ (xem trước rồi xác nhận), hủy buổi, xếp dạy thay (`LiveSubstitutesView`, `teachers/components/live-substitutes-view.tsx`).
- Bỏ: trang _Dạy thay_ riêng (danh sách buổi trong khoảng ngày).
- Thêm: Kanban mặc định (cột Thứ 2 → CN), thẻ buổi gồm giờ · lớp · bài · giáo viên · phòng · nhãn _Dạy thay_ / _Đã hủy_; chip tổng hợp tuần; Sheet buổi học có 4 tab **Nội dung / Đổi giờ / Hủy buổi / Dạy thay** (chỉ Quản lý thấy 3 tab thao tác; Nhân viên chỉ thấy Nội dung); nút _Sinh lịch theo khóa_.
- Đổi logic: không. Vẫn **không kéo-thả** để đổi lịch.

**`GT-SinhLich`, Sinh lịch theo khóa**: `/manager/sessions`, thay `ScheduledSessionsView` + `SessionGenerator`

- Giữ: API `curriculumApi.preview` / `generate` và cơ chế khóa chống trùng (idempotency key lưu sessionStorage), bắt buộc xem trước lại khi đổi đầu vào.
- Bỏ: trang chỉ có một ô chọn lớp, danh sách buổi dạng card xếp dọc, phải chọn tay học phần cho từng lớp.
- Thêm: trái là Khóa học, Từ/Đến ngày, _Giáo trình áp dụng_ **tự chọn** (bản đã duyệt có hiệu lực trong khoảng ngày), danh sách lớp của khóa có checkbox; phải là xem trước **từng lớp** (số buổi, bài đầu → cuối, xung đột, bảng vài buổi đầu/cuối), cảnh báo lớp khác số buổi/tuần; nút _Sinh lịch cho N lớp_.
- Đổi logic: **có, nhỏ, chỉ ở FE**, xem [6.3](#6-những-chỗ-có-đổi-logic).

### 5.4 Khóa học & giáo trình

**`QL-DanhMuc`, Khóa học & giáo trình (gộp Danh mục)**: `/manager/curriculum`

- Giữ: `RegistrationProgramsView` (`registration-flow/components/programs-view.tsx`: tạo/sửa môn học, khóa học), `CurriculumUnitsView` (`curriculum/components/units-view.tsx`).
- Bỏ: menu **Danh mục** riêng (`/manager/catalog`), menu **Phản hồi giáo trình** riêng, tab Phòng (chuyển sang Lớp học).
- Thêm: tab _Khóa học & giáo trình_ (trái: form _Tạo khóa học_; phải: bảng nhóm theo khóa, dòng khóa có _Sửa khóa_, dưới là các phiên bản giáo trình theo kỳ với hiệu lực, số bài, trạng thái, nút _Xem_ / _Duyệt_), tab _Môn học_, tab _Phản hồi giáo trình_.
- **Quản lý không tạo giáo trình**: giữ đúng quy định hiện tại. Nút tạo giáo trình chỉ hiện cho Thiết kế giáo trình (`units-view.tsx` đang kiểm `role === "curriculum_designer"`), BFF `src/lib/api/backend-permissions.ts` chỉ cho `designer` gọi POST/PATCH `academic/curriculum-units…`. Quản lý chỉ **tạo khóa học**, **duyệt áp dụng / trả lại**, **lưu trữ** và **sinh lịch**. Không được thêm nút tạo giáo trình vào màn của Quản lý.
- Đổi logic: không.

**`GT-DanhSach`, danh sách giáo trình (góc nhìn Thiết kế giáo trình)**: `/manager/curriculum` khi vai trò là `curriculum_designer`

- Thêm: tên hiển thị **"Giáo trình [khóa] · [kỳ]"** thay cho "Học phần"; nhóm theo khóa; cột Hiệu lực (còn bao nhiêu tuần), Bài (đã có/cần), Lớp dùng, Trạng thái, **Bước tiếp theo**; bộ lọc _Cần tôi xử lý_; cảnh báo khóa chưa có giáo trình kỳ sau; nút _Chuẩn bị kỳ tiếp theo_ ngay trên dòng.
- Đổi logic: không (chỉ đổi nhãn và tính hiển thị ở FE).

**`GT-TaoMoi`, tạo giáo trình cho kỳ mới (Thiết kế giáo trình)**

- Giữ: `curriculumApi.create` (khóa, tiêu đề, từ/đến ngày), `revise` (_Chuẩn bị kỳ tiếp theo_ = sao chép bài), luồng nhập CSV.
- Thêm: chọn nguồn bài (_Sao chép từ kỳ đang dùng_ / _Nhập CSV_ / _Soạn từ đầu_); khung kiểm tra trước khi tạo: số tuần học, số buổi/tuần, **số bài cần**, số bài bản nguồn đang có, không chồng ngày với bản đang dùng, các lớp sẽ dùng.
- Đổi logic: không. Số bài cần tính ở FE (cần BE-1 để có "số buổi/tuần" chuẩn).

**`GT-ChiTiet`, chi tiết giáo trình (bảng bài học)**: `/manager/curriculum/[id]`, `CurriculumUnitDetailView` (`curriculum/components/unit-detail-view.tsx`)

- Giữ: thêm/sửa/xóa/sắp xếp bài, kiểm tra cấu trúc, gửi thẩm định, lưu trữ, _Chuẩn bị kỳ tiếp theo_.
- Bỏ: **mỗi bài một card xếp dọc**.
- Thêm: thanh tiến trình duyệt (Soạn → Giáo viên thẩm định → Quản lý duyệt → Áp dụng); thẻ số liệu (hiệu lực, số bài cần, đã có / thiếu, so với kỳ trước, lớp sẽ dùng); **bảng bài học** (STT · Tên bài · Nội dung tóm tắt · **So với kỳ trước: Mới / Đã sửa / Giữ nguyên**), lọc theo thay đổi, phân trang; sửa bài trong **panel bên phải**; cột _Chương_ (disable, chờ BE-4).
- Đổi logic: không. Cột "So với kỳ trước" tính ở FE bằng cách so bài cùng thứ tự với bản gốc.

**`GT-ImportCSV`, nhập CSV**: `curriculum/components/curriculum-import.tsx`

- Giữ: chế độ _Thêm vào_ / _Thay toàn bộ_ (có xác nhận), xem trước lỗi từng dòng, chỉ nhập khi mọi dòng hợp lệ.
- Thêm: bố cục chia 2 phần (trái: tải file mẫu, chọn file, chế độ; phải: bảng xem trước Dòng · STT · Tên · Nội dung · Kết quả, nhãn tổng hợp, câu báo sau khi nhập sẽ đủ/thiếu bao nhiêu bài).
- Đổi logic: không. File mẫu CSV là file tĩnh mới trong `public/`.

**`GT-ThamDinh`, giáo viên thẩm định / quản lý duyệt**: `/teacher/curriculum/[id]` và `/manager/curriculum/[id]`, `curriculum-review-forms.tsx`

- Giữ: _Đạt chuyên môn_ / _Trả lại kèm nhận xét_ (giáo viên), _Duyệt áp dụng_ / _Trả lại kèm lý do_ (quản lý).
- Thêm: mặc định chỉ hiện **các bài thay đổi** so với kỳ trước; panel phải so **bản mới với bản đang áp dụng**; khung kết luận cố định ở cuối trang.
- Đổi logic: không.

**`GT-PhanHoi`, phản hồi giáo trình**: tab trong `/manager/curriculum` và `/teacher/curriculum`, `LiveCurriculumFeedback` (`curriculum/components/live-feedback-view.tsx`)

- Bỏ: menu riêng _Phản hồi giáo trình_ (cả 2 vai trò).
- Thêm: bảng (Bài · Nội dung · Giáo viên · Trạng thái), panel phải để xử lý (trạng thái, bài đã sửa ở bản kỳ sau, trả lời).
- Đổi logic: không.

### 5.5 Đăng ký & thanh toán

**`NV-ThanhToan`, Đăng ký & biên lai**: `/staff/payments`, `RegistrationPaymentsView` (`registration-flow/components/payments-view.tsx`)

- Giữ: xác nhận thu tiền (số biên lai + đã nhận đủ tiền), khóa chống trùng khi thử lại, in bill, mở biên lai, hủy đăng ký nháp.
- Bỏ: card _Tra cứu mã đăng ký_ và card _Đăng ký gần đây trong phiên này_.
- Thêm: ô tìm kiếm chung (tên con, email phụ huynh **hoặc mã đăng ký**); bộ lọc thời gian có lựa chọn _Tạo trong phiên này_; chip tổng hợp _N chờ thu · tổng tiền_; bấm dòng nháp mở **Sheet thu học phí** (thông tin bill, cần thu, số biên lai, xác nhận đã nhận đủ, In bill, Hủy đăng ký); dòng hoàn tất có nút _Biên lai_.
- Đổi logic: không.

**Đăng ký học** (`registration-wizard.tsx`): **giữ nguyên**, chỉ đổi theo token màu chung.

### 5.6 Bài tập, chấm bài, điểm danh, báo cáo (Giáo viên)

**`GV-BaiTap`, Bài tập & chấm bài**: `/teacher/assignments`, `LiveAssignmentsView`

- Bỏ: 2 menu trùng **Bài nộp của học sinh** và **Chấm bài**. Cả 2 đang render cùng `LiveGradingQueue` với nhóm nút trạng thái.
- Thêm: bảng bài (Bài · Lớp · Hạn nộp · Đã nộp x/y · **Chưa chấm** · Trạng thái), lọc _Cần chấm / Còn hạn / Nháp / Đã đóng_, bấm dòng mở danh sách bài nộp. Số chưa chấm hiện làm badge trên menu.

**`GV-BaiNop`, bài nộp của một bài**: `/teacher/assignments/[id]/submissions`, `LiveAssignmentSubmissions`

- Thêm: thẻ tổng hợp (đã giao / đã nộp / chưa chấm / đã gửi điểm / chưa nộp); tab lọc; bảng có cột **Bài tự luận: Nhập chữ / N ảnh**; nút _Chấm bài_ mở đúng màn chấm (nhập chữ hoặc ảnh). Nút _Công bố đáp án_, _Đóng bài_ giữ nguyên chức năng.

**`GV-ChamBai`, chấm bài nhập chữ**: `/teacher/grading/[submissionId]`, `LiveGradingDetail`

- Giữ: chấm trắc nghiệm tự động, gợi ý AI (chỉ đề xuất, giáo viên quyết định), lịch sử phiên bản điểm.
- Bỏ: 3 card riêng **Lưu bản chấm → Duyệt điểm (checkbox) → Công bố điểm (checkbox)**; ô nhận xét cho câu trắc nghiệm.
- Thêm: chia 2 phần (trái bài làm, phải chấm điểm cố định khi cuộn); câu trắc nghiệm chỉ hiện kết quả tự chấm; câu tự luận có **điểm + nhận xét**; nhận xét chung; 2 nút **Lưu nháp** và **Gửi điểm**; _Bài chưa chấm tiếp theo_.
- Đổi logic: **có**, xem [6.1](#6-những-chỗ-có-đổi-logic).

**`GV-ChamBaiAnh`, chấm bài nộp bằng ảnh**: cùng route, hiển thị khi câu tự luận có file ảnh

- Thêm: xem ảnh **ngay trong trang** (thay nút _Tải file bài làm_ mở tab mới); **công cụ vẽ lên ảnh**: bút / bút dạ quang, 3 màu, 3 độ dày, Hoàn tác, Xóa hết nét; chuyển giữa các ảnh; nét chấm là **lớp riêng**, ảnh gốc không bị sửa; bên phải là điểm + nhận xét như bài nhập chữ.
- Cách làm: lớp SVG phủ lên ảnh, ghi lại nét bằng pointer events, không cần thư viện. Khi lưu xuất ra PNG hoặc JSON nét vẽ.
- Chờ: **BE-7** (lưu nét chấm theo câu, trả cho phụ huynh), **M-1** (app phụ huynh chụp/chọn ảnh khi nộp). Khi chưa có BE-7: vẫn xem được ảnh và chấm điểm, ẩn công cụ vẽ.

**`GV-TaoBaiTap`, tạo/sửa bài tập**: `/teacher/assignments/new`, `[id]/edit`, `LiveAssignmentEditor`

- Giữ: schema `assignmentSchema` (bài tập/kiểm tra, buổi, loại kiểm tra, câu hỏi, tiêu chí chấm), nhập câu hỏi từ file (`assignment-import-dialog.tsx`), luồng Lưu nháp → chọn học sinh → Giao bài.
- Bỏ: form một cột dài.
- Thêm: trái là _Thông tin chung_ (cố định khi cuộn, có tổng điểm); phải là danh sách câu hỏi; lựa chọn trắc nghiệm dạng radio chọn đáp án đúng; ghi chú câu tự luận cho phép học sinh nhập chữ hoặc gửi ảnh.

**`GV-DiemDanh`, Lịch dạy & điểm danh**: `/teacher/schedule`, `LiveAttendanceList`, `LiveAttendanceSession` (`attendance/components/live-attendance-view.tsx`)

- Giữ: chuẩn bị danh sách, đánh dấu Có mặt/Vắng/Có phép, chỉ chốt khi buổi đã kết thúc, chốt rồi không sửa.
- Bỏ: menu _Điểm danh_ riêng; danh sách buổi dạng card to 2 cột.
- Thêm: chuyển _Danh sách / Kanban tuần_; trái là các buổi trong tuần kèm trạng thái (Đã chốt / Chưa điểm danh / Hôm nay / Sắp tới); phải là bảng học viên với nút chọn 3 trạng thái, đếm tổng, ghi chú buổi, _Chốt điểm danh_.

**`GV-BaoCao`, Báo cáo**: `/teacher/reports`, `LiveReportsView`

- Giữ: form tạo (lớp, toàn lớp/từng học sinh, khoảng ngày, nhận xét AI), tải Excel/PDF.
- Bỏ: báo cáo đã tạo dạng card 2 cột.
- Thêm: chia 2 phần, bên phải là **bảng báo cáo đã tạo** (Lớp · Phạm vi · Khoảng ngày · Tạo lúc · Excel/PDF).

### 5.7 Quản trị

**`QL-ThongBao`, Thông báo**: `/manager/notifications` (route mới), `LiveAnnouncementsView` + `EmailDeliveriesView` (`features/system/components/`)

- Giữ: thông báo lớp, nhắc học phí, gửi lại email lỗi, thông báo lỗi đã diễn giải.
- Bỏ: 2 trang riêng; lịch sử email dạng 11 card 2 cột (~2.000px).
- Thêm: trái là form soạn (tab _Thông báo lớp / Nhắc học phí_); phải là **bảng lịch sử email** (Tiêu đề · Người nhận · Trạng thái · Lần gửi · Tạo lúc · Gửi lại) có lọc trạng thái, dòng lỗi tô đỏ.

**`QL-NhanSu`, Nhân sự**: `/manager/people` (route mới), `AccountsView`, `AccountDetailView`, `ManagersView`, `TeacherInvitationsView`, `InvitationsPanel` (`features/directory/components/`)

- Giữ: tạo tài khoản nhân viên (họ tên, email, mật khẩu ban đầu), mời giáo viên / quản lý qua email, duyệt / từ chối / gửi lại / thu hồi lời mời, sửa họ tên + khóa/mở (`accountUpdateSchema`).
- Bỏ: 4 trang riêng (_Danh sách giáo viên_, _Lời mời & duyệt_, _Nhân sự trung tâm_, _Quản lý trung tâm_) và các trang chi tiết riêng.
- Thêm:
  - Tab **Giáo viên**: cột _Lớp phụ trách_, **Buổi đã dạy (tháng)**, **Chờ điểm danh**, **Dạy thay**, nút Xem/Sửa. _Xem_ mở Sheet gồm bộ chọn tháng, 3 thẻ (đã tính / chờ điểm danh / người khác dạy thay) và bảng buổi dạy (Ngày · Lớp · bài · Điểm danh · Tính buổi).
  - Tab **Nhân viên & thiết kế giáo trình**: một bảng 2 vai trò, cột _Vai trò_, Sửa/Khóa; Dialog tạo tài khoản có chọn vai trò.
  - Tab **Quản lý**, tab **Lời mời**.
  - Nút chính đổi theo tab.
- Quy tắc tính buổi dạy: buổi được tính khi **giáo viên dạy buổi đó chốt điểm danh**; buổi có dạy thay tính cho **người dạy thay**; buổi hủy không tính.
- Bỏ dữ liệu giả: `src/features/work-credits/` (`WorkCreditPanel`, `useTeacherWorkCredits` dùng `@/mocks/data/teachers`) chỉ được dùng trong `teachers/components/teacher-detail-view.tsx` và `attendance/components/attendance-list-view.tsx`, hai file này **không còn được mount** ở route nào. Khi làm số buổi dạy thật thì xóa nhóm mock này.
- Chờ: **BE-10** (tài khoản Thiết kế giáo trình trong cùng bảng; hiện API `staff` chỉ trả vai trò Nhân viên và Quản lý chỉ được tạo Nhân viên), **BE-11** (thống kê buổi dạy). Khi chưa có BE-10: bảng chỉ hiện Nhân viên, ẩn lựa chọn vai trò.

**`QL-LichSu`, Lịch sử thay đổi**: `/manager/system/audit-logs`, `LiveAuditLogView` (`features/system/components/live-audit-log-view.tsx`)

- Giữ: bộ lọc đối tượng / hành động / khoảng ngày, giải mã snapshot thay đổi, escape nội dung.
- Bỏ: mỗi bản ghi một card full chiều ngang (19 bản ghi ≈ 5.000px).
- Thêm: **bảng** (Thời gian · Hành động · Đối tượng · Người thực hiện), bấm dòng mở chi tiết thay đổi ngay dưới dòng; lọc thêm theo người thực hiện; 5 bản ghi mới nhất hiện ở Dashboard Quản lý.

**`TaiKhoan`, tài khoản cá nhân**: `/manager/profile`, `/staff/profile`, `/teacher/profile`, `AccountProfile` (`features/auth/components/account-profile.tsx`)

- Giữ: đổi họ tên hiển thị, đổi mật khẩu.
- Thêm: chia 2 phần (thông tin trái, đổi mật khẩu phải).

### 5.8 Khung ứng dụng

**`Sidebar`, `Topbar`**: `src/components/shared/layout/sidebar.tsx`, `src/components/shared/layout/header/*`

- Giữ: logo, nhóm menu, đánh dấu mục đang mở theo đường dẫn khớp dài nhất, badge số, ô tìm kiếm Ctrl/⌘ K, _Tạo nhanh_, chuông, menu người dùng.
- Đổi: nhãn và nhóm menu theo [mục 4](#4-menu-mới-và-route); bỏ nền gradient của theme ấm.
- Thêm badge: Học sinh & phụ huynh (số chờ học bù), Đăng ký & biên lai (số đơn chờ thu), Giáo trình (số việc chờ mình xử lý), Bài tập & chấm bài (số chưa chấm), Lịch dạy & điểm danh (số buổi chưa điểm danh).

---

## 6. Những chỗ có đổi logic

Ngoài các mục dưới đây, **không đổi logic**: không đổi API, không đổi schema Zod, không đổi phân quyền (`ROLE_AREAS`), không đổi luồng duyệt.

### 6.1 Chấm bài: nút "Gửi điểm" (đã chốt với chủ dự án)

- **Gửi điểm** = FE gọi lần lượt 3 API cũ: `academicApi.grade(submissionId, …)` (tạo bản DRAFT) → `academicApi.approveGrade(gradeId)` → `academicApi.publishGrade(gradeId)`. Có một Dialog xác nhận.
- Nếu bản chấm đang ở `DRAFT` thì bỏ bước 1. Nếu đang ở `APPROVED` thì chỉ gọi `publishGrade`.
- Lỗi giữa chừng: dừng ở trạng thái vừa đạt (DRAFT hoặc APPROVED), báo lỗi, bấm lại _Gửi điểm_ sẽ đi tiếp từ đó. Không tạo bản chấm mới.
- **Lưu nháp** = chỉ gọi `grade` như hiện nay.
- Kết quả dữ liệu giống luồng cũ, chỉ không dừng ở bước giữa nữa.

### 6.2 Tính toán mới ở FE (chỉ đọc, không ghi)

| Số liệu                                   | Cách tính                                                                                        | Nguồn                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Chuyên cần % học sinh, số buổi vắng       | có mặt / số buổi đã chốt (không tính có phép, buổi hủy)                                          | điểm danh các buổi của ghi danh                              |
| Buổi đã dạy của giáo viên / tháng         | đếm buổi `teacherId` = giáo viên **và** đã chốt điểm danh; buổi dạy thay tính cho người dạy thay | danh sách buổi + trạng thái điểm danh (tạm thời, chờ BE-11)  |
| Lấp chỗ lớp                               | học sinh đang học / `capacity`                                                                   | lớp                                                          |
| Số bài cần của giáo trình                 | số tuần trong khoảng hiệu lực × số buổi/tuần                                                     | tạm lấy số khung giờ lịch tuần của lớp trong khóa (chờ BE-1) |
| So với kỳ trước                           | so bài cùng thứ tự giữa bản hiện tại và bản gốc (`revise`)                                       | 2 lần đọc `curriculumApi.unit`                               |
| Dashboard Nhân viên / Thiết kế giáo trình | tổng hợp từ API danh sách sẵn có                                                                 | xem 5.1                                                      |

### 6.3 Sinh lịch theo khóa

- **Tự chọn giáo trình**: lấy bản `APPROVED` của khóa có khoảng hiệu lực phủ khoảng ngày đã chọn. Không có hoặc có nhiều hơn một bản thì bắt người dùng chọn tay như hiện nay.
- **Nhiều lớp**: FE gọi `preview` rồi `generate` **lần lượt cho từng lớp**. Mỗi lớp một idempotency key riêng, lưu sessionStorage như hiện tại. Lớp nào lỗi thì báo riêng lớp đó, lớp đã sinh không bị ảnh hưởng.

### 6.4 Điều hướng và giao diện

- Route mới: `/staff/dashboard`, `/manager/notifications`, `/manager/people`, `/manager/curriculum/overview`. Phải thêm vào `ROUTE_AREAS` trong `role-access.ts` đúng vùng quyền: dashboard nhân viên → `dashboard`; thông báo → `notifications`; nhân sự → `teachers` cho tab giáo viên, `staff_accounts` cho các tab còn lại; overview → `catalog`.
- Redirect route cũ như bảng mục 4.
- Bỏ theme `edugrade-warm`.
- (Đề xuất, chờ duyệt) trang chủ nhân viên → `/staff/dashboard`.

---

## 7. Tổng hợp: bỏ khỏi UI cũ

- 5 trang nghỉ/học bù của Nhân viên; trang Phụ huynh riêng của Nhân viên.
- Trang Bài nộp và trang Chấm bài trùng nhau của Giáo viên; 3 card Lưu/Duyệt/Công bố có checkbox.
- Trang Điểm danh riêng của Giáo viên; trang Phản hồi giáo trình riêng (Giáo viên, Quản lý, Thiết kế giáo trình).
- Trang Xếp lịch & buổi học (một ô chọn + card xếp dọc), trang Dạy thay.
- Trang Danh mục; trang Phòng học có form cho từng phòng.
- Trang Gửi thông báo và trang Lịch sử email tách rời; lịch sử email dạng card.
- 4 trang tài khoản (Giáo viên, Lời mời, Nhân sự trung tâm, Quản lý trung tâm) và các trang chi tiết tài khoản / phụ huynh riêng.
- Lịch sử thay đổi dạng card.
- Theme cam đất, 6 KPI 3 cột, biểu đồ 2 trục y.
- Card bài học trong giáo trình; nhãn "Học phần".
- Form _Đổi giáo viên_ luôn mở trong chi tiết lớp.
- Card _Tra cứu mã đăng ký_ và _Đăng ký gần đây trong phiên_.
- Nhóm mock `features/work-credits` (khi đã có số buổi dạy thật).

## 8. Tổng hợp: thêm ở UI mới

- Dashboard Nhân viên và Dashboard Thiết kế giáo trình (màn mới); biểu đồ ở cả 4 dashboard.
- Sheet _Xử lý_ 6 tab trên bảng học sinh; cột chuyên cần; trang chi tiết học sinh có dải điểm danh.
- Bảng phụ huynh có Xem/Sửa/Xóa (Xóa → Khóa).
- Nhân sự: tab gộp, số buổi dạy theo tháng, Sheet buổi dạy giáo viên.
- Kanban mặc định + Sheet buổi học (đổi giờ, hủy, dạy thay).
- Sinh lịch theo khóa nhiều lớp, tự chọn giáo trình.
- Khóa học & giáo trình một màn; tạo giáo trình kỳ mới có kiểm tra số bài; bảng bài học có "So với kỳ trước"; thẩm định chỉ xem bài thay đổi.
- Chấm bài 2 nút (Lưu nháp / Gửi điểm); chấm trên ảnh bằng bút vẽ (khi có BE-7).
- Lưới lớp học 4 cột + tab Phòng; chi tiết lớp chia tab và 2 cột.
- Thông báo chia 2 phần; lịch sử thay đổi dạng bảng; badge số trên menu.

---

## 9. Việc cần BE / Mobile

FE **không sửa** repo BE. Các mục dưới là yêu cầu gửi nhóm BE. Trong lúc chờ, FE làm đúng cột "FE tạm".

| Mã    | Cần làm                                                                                                                               | FE tạm                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| BE-1  | Khóa học có trường **số buổi/tuần**; lưu lịch tuần của lớp thì kiểm tra đúng số khung giờ                                             | Cảnh báo khi lớp khác số buổi so với các lớp cùng khóa; ô "Số buổi/tuần" disable |
| BE-2  | Mỗi khóa chỉ **1 giáo trình đã duyệt** có hiệu lực tại một ngày; bản mới bắt đầu thì bản cũ tự lưu trữ                                | Cảnh báo chồng ngày trước khi gửi duyệt                                          |
| BE-3  | API trả giáo trình hiệu lực của khóa tại một ngày, kèm các lớp đang dùng                                                              | Lọc từ danh sách giáo trình và lớp                                               |
| BE-4  | Bài học thêm **Chương**, **Tài liệu**; CSV nhận thêm 2 cột                                                                            | Ẩn/disable 2 cột                                                                 |
| BE-5  | (Tùy chọn) Nhập file **.xlsx**                                                                                                        | Chỉ nhận CSV, có file mẫu                                                        |
| BE-6  | (Tùy chọn) Xem trước/sinh lịch **nhiều lớp** trong một yêu cầu                                                                        | Gọi API cũ lần lượt từng lớp                                                     |
| BE-7  | Lưu **nét chấm trên ảnh** theo từng câu, trả cho phụ huynh; file bài nộp gắn theo **từng câu** (hiện gắn cả bài nộp)                  | Xem ảnh trong trang, ẩn công cụ vẽ                                               |
| BE-8  | API **sửa hồ sơ con** từ Web (họ tên, khối, ngày sinh); API điểm danh theo học sinh nếu cần cho chuyên cần                            | Nút _Sửa hồ sơ_ disable                                                          |
| BE-9  | **Xóa** tài khoản phụ huynh chưa có hồ sơ con/thanh toán                                                                              | Chỉ cho Khóa tài khoản                                                           |
| BE-10 | Danh sách + quyền tạo/khóa tài khoản **Thiết kế giáo trình** cho Quản lý, chung bảng với Nhân viên                                    | Bảng chỉ hiện Nhân viên                                                          |
| BE-11 | API **thống kê buổi dạy** theo giáo viên/tháng (đã chốt điểm danh, dạy thay)                                                          | Đếm từ danh sách buổi                                                            |
| M-1   | App phụ huynh (`WDP301-FEM-System`): **chụp/chọn ảnh** bài tự luận khi nộp (hiện chỉ nhập chữ, chưa có image picker) và gửi `fileIds` | Web chỉ hiện bài nhập chữ                                                        |

Chi tiết nghiệp vụ giáo trình (quan hệ dữ liệu, vòng đời theo kỳ) xem artboard `NghiepVu-QuanHe` và `NghiepVu-QuyTrinh` trên canvas.

---

## 10. Thứ tự làm đề xuất và nghiệm thu

1. **Nền**: token xanh, bỏ `edugrade-warm`, `menu.ts` / `routes.ts` / `role-access.ts`, redirect route cũ, mẫu "bảng + Sheet" dùng chung (tận dụng `shared/data-table`, `shared/display`, `shared/workflows` có sẵn, xem mục 3.2).
2. **Nhân viên**: Học sinh & phụ huynh + Sheet Xử lý, chi tiết học sinh, Đăng ký & biên lai, Dashboard nhân viên.
3. **Giáo viên**: Bài tập & chấm bài (Gửi điểm), Lịch dạy & điểm danh, Báo cáo, Dashboard.
4. **Quản lý**: Lịch học Kanban + Sheet, Lớp học + Phòng, Chi tiết lớp, Thông báo, Nhân sự, Lịch sử thay đổi, Dashboard.
5. **Giáo trình**: Khóa học & giáo trình, bảng bài học, tạo kỳ mới, nhập CSV, thẩm định, phản hồi, Sinh lịch theo khóa, Dashboard thiết kế giáo trình.
6. Phần chờ BE/Mobile: bật khi BE trả API.

Mỗi bước:

- `npx eslint --fix .`, `npm run lint`, `npx tsc --noEmit`, `npx next build --webpack`.
- Chạy harness UI desktop `tests/ui-flows/` (DB MySQL riêng, không đụng `edugrade_db`, đã chặn SMTP). Lưu ý: bộ flow cũ hỏng từ bước F1 vì danh mục đã chuyển sang bảng, cần cập nhật selector theo màn mới.
- Kiểm tra mọi route cũ trong mục 4 vẫn mở được và chuyển đúng màn.
- Kiểm tra quyền: Nhân viên không thấy tab Phòng; Thiết kế giáo trình không thấy tab Môn học/Khóa học; **Quản lý không có nút tạo giáo trình**; Giáo viên chỉ thấy lớp của mình.
- Màn 1440px không tràn ngang; bảng rộng cuộn trong khung riêng; ở màn nhỏ form 2 phần xếp dọc.

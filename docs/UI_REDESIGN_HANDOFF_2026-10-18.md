# Bàn giao thiết kế lại UI/UX Web EduGrade

Ngày: 18/10/2026. Phạm vi: **chỉ Web** (`WDP301-FE-System`), 4 vai trò Quản lý trung tâm, Nhân viên, Giáo viên, Thiết kế giáo trình. App Mobile phụ huynh chỉ bị nhắc ở phần cần làm thêm.

Trạng thái (cập nhật 19/10/2026 tối): **Phase 1–4 và đợt sửa sau Phase 4 đã code xong và test trình duyệt trên BE/DB riêng**. Phase 1–4 đã push `dev` (Phase 4 kèm BE-8 phần chuyên cần và BE-12, push 19/10 sau khi chủ dự án đồng ý). Đợt sửa ([mục 10.5](#105-đợt-sửa-sau-phase-4-code-xong-đã-test-19102026-tối)) kèm 10 commit BE, đã push `dev` ngày 19/10 sau khi chủ dự án đồng ý, trước FE. Kết quả từng phase ở [mục 10](#10-tiến-độ-theo-đợt-và-nghiệm-thu).

**Cách dùng:** nói với Claude Code _"Đọc `docs/UI_REDESIGN_HANDOFF_2026-10-18.md` rồi làm Phase 2"_ (hoặc 3, 4). Claude đọc [mục 0](#0-dành-cho-claude-code-đọc-mục-này-trước) để biết cách làm, rồi làm theo danh sách việc của phase đó ở [mục 10](#10-tiến-độ-theo-đợt-và-nghiệm-thu).

Nguyên tắc chung: **chỉ đổi giao diện và điều hướng**. Giữ nguyên API, phân quyền theo vai trò, validate (Zod), luồng duyệt giáo trình hai cấp, các bước nghỉ/học bù/thanh toán. Mọi chỗ khác nguyên tắc này được liệt kê riêng ở [mục 6](#6-những-chỗ-có-đổi-logic).

---

## 0. Dành cho Claude Code: đọc mục này trước

Người giao việc chỉ cần nói: **"Đọc `docs/UI_REDESIGN_HANDOFF_2026-10-18.md` rồi làm Phase 2"** (hoặc Phase 3, Phase 4). _Phase_ và _Đợt_ là một. Mục này nói Claude phải làm gì, theo thứ tự nào, và khi nào thì dừng.

### 0.1 Phạm vi và quyền đã được duyệt

- Danh sách việc của từng phase ở [mục 10](#10-tiến-độ-theo-đợt-và-nghiệm-thu) là **kế hoạch chủ dự án đã duyệt** (18/10/2026). Lệnh "làm Phase N" là lệnh bắt đầu code. Không cần trình kế hoạch rồi chờ duyệt lại: quy tắc "plan trước khi sửa code" trong `CLAUDE.md` đã được đáp ứng bằng tài liệu này. Trước khi code, vẫn ghi danh sách việc sẽ làm (todo) để người giao việc theo dõi.
- Chỉ làm **đúng phase được gọi**. Không làm việc của phase khác, kể cả khi tiện tay. Làm xong thì dừng, báo cáo theo [0.7](#07-kết-thúc-một-phase).
- Phụ thuộc giữa các phase:
  - Phase 2 và Phase 3 độc lập, làm phase nào trước cũng được.
  - Phase 4 dùng màn Nhân sự của Phase 2 (để thêm cột số buổi dạy) và màn Bài tập của Phase 3 (để thêm badge). Nếu phase đó chưa xong thì làm các việc còn lại của Phase 4, ghi phần bị chặn vào _Câu hỏi mở_.
- Chỗ tài liệu chưa quyết: chọn cách **giữ nguyên hành vi hiện tại**, ghi vào _Câu hỏi mở_ của phase trong mục 10, rồi làm tiếp. Không tự thêm tính năng ngoài tài liệu và thiết kế.

### 0.2 Thứ tự đọc

1. Mục 0 (mục này), [mục 2](#2-quy-tắc-dựng-giao-diện) (quy tắc), [mục 3](#3-hệ-thiết-kế) (màu, component tương ứng với thiết kế).
2. Mục 10.x của phase được gọi: danh sách việc, file cần sửa, cách nghiệm thu.
3. Với từng việc trong phase:
   - đọc đoạn tương ứng ở [mục 5](#5-chi-tiết-từng-màn) (giữ / bỏ / thêm / đổi logic);
   - mở artboard `docs/ui-redesign-2026-10/design-source/<Tên>.dc.html` để lấy bố cục, nhãn chữ, thứ tự cột, trạng thái rỗng. File này đọc như HTML thường; dữ liệu trong đó là dữ liệu mẫu.
4. [Mục 4](#4-menu-mới-và-route) (menu, route, redirect), [mục 6](#6-những-chỗ-có-đổi-logic) (chỗ đổi logic), [mục 9](#9-việc-cần-be--mobile) (phần chờ BE).
5. `CLAUDE.md` và `.claude/rules/*.md` của repo. Khi trùng ý, tài liệu này quyết định phần giao diện, còn `CLAUDE.md` quyết định quy ước code.

### 0.3 Ràng buộc cứng

- **Chỉ đổi giao diện và điều hướng.** Không đổi API, payload, schema Zod (`src/lib/validators/`), phân quyền (`ROLE_AREAS`, `backend-permissions.ts`), hay luồng duyệt. Ngoại lệ: [mục 6](#6-những-chỗ-có-đổi-logic), và những bước trong mục 10 ghi rõ (ví dụ P4-5 mở quyền BFF **sau khi** BE-8 xong). Thêm tiền tố route mới vào `ROUTE_AREAS` và thêm hàm đọc API mới trong `features/*/api.ts` không tính là đổi phân quyền hay API.
- Không thêm thư viện. Biểu đồ vẽ bằng SVG như `src/features/dashboard/components/dashboard-charts.tsx`. Không sửa tay `src/components/ui/*` (file shadcn sinh ra).
- Form dùng `react-hook-form` + Zod. Dễ nhất là dùng `ApiForm` (`src/components/shared/forms/api-form.tsx`). Trạng thái tab, bộ lọc, panel đang mở để trên URL bằng `nuqs`.
- **Không xóa route cũ.** Route cũ thành trang `redirect()` giữ query (xem [0.4](#04-cách-làm-một-việc)).
- **Quản lý không tạo giáo trình**: không thêm nút tạo/sửa bài cho vai trò `center_manager`.
- Không hiển thị dữ liệu giả như dữ liệu thật. Phần chờ BE thì ẩn hoặc disable kèm nhãn, theo cột "FE tạm" ở mục 9.
- Không sửa repo BE, trừ khi đúng điều kiện ở [0.8](#08-khi-cần-sửa-be).

### 0.4 Cách làm một việc

1. Tìm component đang chạy của màn đó ở [4.5](#45-route-hiện-tại--component). Dùng `grep` tìm mọi chỗ import nó, vì nhiều component dùng chung cho nhiều vai trò.
2. Cần ghép màn vào tab hoặc Sheet thì tách phần thân (không có `PageContainer`/`PageHeader`) thành component con. Component cũ giữ làm lớp bọc cho route còn dùng nó. Mẫu đã làm: `ParentsDirectory` / `StudentsDirectory` trong `registration-flow/components/directory-list-view.tsx`.
3. Sheet bên phải theo mẫu `StudentWorkflowSheet` (`absences/components/live-staff-workflows.tsx`) hoặc Sheet trong `registration-flow/components/payments-view.tsx`:
   - trạng thái mở nằm trên URL; đóng thì xóa query đó;
   - `SheetContent className="w-full overflow-y-auto sm:max-w-2xl"`, phần thân `space-y-4 pt-4`.
4. Hộp thoại sửa hoặc xác nhận theo mẫu `catalog/components/live-rooms-view.tsx`: đặt `ApiForm` trong `Dialog`, `successMessage={false}`, `onSuccess` thì đóng hộp thoại và gọi `toast.success`.
5. Chuyển hướng route cũ theo mẫu `app/(staff)/staff/absences/*/page.tsx` và `features/absences/legacy-routes.ts`: server component, `await searchParams`, gọi `redirect()` với query giữ lại.
6. Thêm route mới thì sửa đủ 3 chỗ: `ROUTES` (`constants/routes.ts`), `ROUTE_AREAS` (`constants/role-access.ts`), menu (`constants/menu.ts`). Thiếu `ROUTE_AREAS` thì proxy trả 403.

### 0.5 Bẫy đã gặp ở Phase 1

- Nhiều trang `(manager)` chọn component theo vai trò: `role === "center_manager"` thì dùng bản `Registration*View` hoặc bản live, nhánh còn lại là màn cũ cho `admin` (BE không có vai trò admin). Chỉ sửa nhánh `center_manager`, không xóa nhánh admin.
- `MENU_BACK_OFFICE` dùng chung cho admin, Quản lý và Thiết kế giáo trình. Mục menu hiện hay ẩn theo `canAccessArea(role, item.area)`. Không xóa các mục chỉ admin thấy (`ENROLLMENTS`, `PAYMENTS`, `ABSENCES`).
- `ROUTE_AREAS` khớp **tiền tố dài nhất**.
- BFF `src/lib/api/backend-permissions.ts` chặn API theo vai trò trước khi tới BE (xem [4.6](#46-quyền-gọi-api-cần-nhớ)). Không mở quyền ở BFF khi BE không cho.
- Trang có dùng `nuqs` phải bọc `Suspense`. Hai màn ghép trên một trang không được dùng chung tên query với kiểu giá trị khác nhau (`tab`, `status`, `page`…). Đổi tên query, hoặc reset khi đổi tab như `StaffStudentsHub`.
- `TableCell` mặc định `whitespace-nowrap`: ô có chữ dài phải thêm `whitespace-normal` và `max-w-*`.
- `ApiForm` gọi `useLiveCommand` (`features/academic/hooks/use-live-api.ts`). Lệnh này tự làm mới các query `web-api` (mọi `useLiveQuery`), `registration-classes`, `registration-class`, `registration-students`, `registration-parents`, `academic-calendar`, `academic-session`, `curriculum`. Query khác (ví dụ `registration-history`) phải tự `refetch`. `onSuccess` truyền vào chạy **sau** khi làm mới xong.
- Nội dung có nút In nằm trong Sheet thì cần CSS in riêng: xem `[data-registration-sheet]` trong `globals.css`.
- Test bằng Playwright:
  - checkbox của Base UI là input ẩn, phải bấm `label[for=…]`;
  - sidebar có nút "Thu gọn", nên selector phải lọc trong `main`;
  - chạy lại trên cùng DB thì dữ liệu của lượt trước làm selector bị trùng.

### 0.6 Kiểm tra trước khi coi là xong

- Bắt buộc, đều phải đạt: `npx eslint --fix <các file đã sửa>`, `npm run lint` (0 lỗi), `npx tsc --noEmit`, `npx next build --webpack`.
- Test giao diện:
  - Harness `tests/ui-flows/` **không có trong repo** (`/tests/` bị gitignore). Tự chạy BE `WDP301-BE-System` và FE trên máy, dùng **DB riêng**, tắt gửi mail (`SMTP_URL=''`, `MAIL_FROM=''`). Không dùng DB thật.
  - FE đọc địa chỉ BE từ `BACKEND_API_URL` trong `.env.local` (mẫu ở `.env.example`, mặc định `http://localhost:3000/api/v1`). FE chạy cổng 3001 (`npm run dev` hoặc `npm run build` rồi `npm run start`). Nếu cổng 3000 trên máy đã bị dự án khác chiếm thì chạy BE cổng khác và sửa biến này.
  - Đăng nhập từng vai trò liên quan, mở mọi màn của phase, làm thử thao tác chính (mở Sheet, lưu form, redirect route cũ), kiểm tra console không lỗi và màn 1440px không tràn ngang.
  - Không chạy được BE thì ghi rõ "chưa test giao diện" trong báo cáo. Không được báo là đã test.
- Kiểm tra quyền: đăng nhập vai trò không có quyền thì không thấy tab hoặc nút tương ứng; route cũ chuyển đúng.

### 0.7 Kết thúc một phase

1. Cập nhật mục 10.x của phase: đánh dấu từng việc xong hay chưa; ghi chỗ khác thiết kế kèm lý do; ghi _Câu hỏi mở_. Sửa luôn các đoạn ở mục 4, 5, 9 không còn đúng.
2. Commit trên nhánh `dev`:
   - chỉ `git add` file liên quan;
   - tách commit code (`feat: …`) và commit docs (`docs: …`);
   - không commit `tests/`, `docs/screenshots/`, `docs/BE_HANDOFF_*.md`.
3. `git push origin dev`.
4. Báo cáo cho người giao việc: đã làm gì, khác thiết kế ở đâu và vì sao, chưa làm gì và vì sao, kết quả từng lệnh kiểm tra, _Câu hỏi mở_.

### 0.8 Khi cần sửa BE

Từ 18/10/2026 chủ dự án cho phép sửa BE **khi màn hình thật sự cần**. Điều kiện:

- Mỗi thay đổi nhỏ, nằm trong một commit riêng ở repo BE, có test BE đi kèm.
- **Hỏi người giao việc trước khi push repo BE.**
- FE chỉ gửi tham số mới khi BE trên `dev` đã nhận tham số đó; nếu chưa, validation whitelist của BE trả 400 và màn hình hỏng.
- Không chắc thì không sửa BE: làm phần "FE tạm" ở mục 9 và ghi mã việc BE vào báo cáo.

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

Đã làm ở Phase 1: bỏ theme ấm khỏi code và sửa `.claude/rules/ui.md` (một tông xanh cho mọi màn, quyết định 18/10/2026).

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
| Học sinh & phụ huynh  | `/manager/students` (`?tab=students\|parents`)                               | `/manager/parents` → `?tab=parents`; `/manager/parents/[id]` → `?tab=parents&parentId=<id>` (Sheet)                                                                                                    |
| Lớp học               | `/manager/classes` (`?tab=classes\|rooms`)                                   | `/manager/rooms` → `?tab=rooms`                                                                                                                                                                        |
| Lịch học              | `/manager/schedule` (mặc định `?view=board`)                                 | `/manager/teachers/substitutes` → `/manager/schedule` (dạy thay nằm trong Sheet buổi học)                                                                                                              |
| Khóa học & giáo trình | `/manager/curriculum` (`?tab=programs\|subjects\|feedback`)                  | `/manager/catalog` → `?tab=subjects`; `/manager/catalog/programs/[id]` → `?program=<id>`; `/manager/curriculum/feedback` → `?tab=feedback`                                                             |
| Thông báo             | `/manager/notifications` (**route mới**)                                     | `/manager/notifications/send` và `/manager/notifications/emails` → route mới                                                                                                                           |
| Nhân sự               | `/manager/people` (**route mới**, `?tab=teachers\|staff\|managers\|invites`) | `/manager/teachers`, `/manager/teachers/invitations`, `/manager/system/staff`, `/manager/system/managers` → route mới; `/manager/teachers/[id]`, `/manager/system/staff/[id]` → `?person=<id>` (Sheet) |
| Lịch sử thay đổi      | `/manager/system/audit-logs`                                                 | giữ                                                                                                                                                                                                    |

Sinh lịch: giữ route `/manager/sessions` nhưng hiển thị màn **Sinh lịch theo khóa**; `/manager/classes/[id]/sessions` → `/manager/sessions?classId=<id>`.

Không đụng: `/manager/absences/*`. Các route này chỉ vai trò `admin` vào được, mà BE không có admin.

### 4.2 Nhân viên: 11 → 6 mục

| Mục mới                 | Route                                                                                        | Gộp từ                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard (**màn mới**) | `/staff/dashboard` (**route mới**)                                                           | —                                                                                                                                                                                                                                                                                                                                                                                          |
| Học sinh & phụ huynh    | `/staff/students` (`?tab=students\|parents`, `&studentId=<id>&action=<mode>` mở Sheet Xử lý) | `/staff/parents` → `?tab=parents` (giữ bộ lọc); `/staff/absences/makeup` và `/staff/absences/swap` → `?action=makeup`; `/staff/absences/change-class` → `?action=change`; `/staff/absences/long-leave` → `?action=leave`; `/staff/absences/withdraw` → `?action=withdraw` (giữ `studentId`, `enrollmentId`, `sessionId`; không có `studentId` thì chỉ mở danh sách). **Đã làm ở Phase 1.** |
| Đăng ký học             | `/staff/enrollments/new`                                                                     | giữ                                                                                                                                                                                                                                                                                                                                                                                        |
| Đăng ký & biên lai      | `/staff/payments`                                                                            | giữ                                                                                                                                                                                                                                                                                                                                                                                        |
| Lớp học                 | `/staff/classes`                                                                             | giữ (không có tab Phòng vì nhân viên không có quyền `rooms`)                                                                                                                                                                                                                                                                                                                               |
| Lịch học                | `/staff/schedule`                                                                            | giữ                                                                                                                                                                                                                                                                                                                                                                                        |

Đổi trang chủ sau đăng nhập của nhân viên (`ROLE_HOME_ROUTE.staff`) từ `/staff/enrollments/new` sang `/staff/dashboard`: **chưa quyết**, giữ như cũ (câu hỏi mở của Phase 4).

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

### 4.5 Route hiện tại → component

Trạng thái sau Phase 1. Đường dẫn component tính từ `src/features/`. Cột "Phase" là phase sẽ sửa màn đó.

| Route                                                           | Component đang render                                                                                                                                | Phase                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `/manager/dashboard`                                            | `dashboard/components/live-manager-dashboard.tsx` `LiveManagerDashboard`                                                                             | 4                         |
| `/manager/students`                                             | center_manager: `registration-flow/components/directory-list-view.tsx` `RegistrationStudentsView`; admin: `students/…/students-view.tsx`             | 2                         |
| `/manager/students/[id]`, `/staff/students/[id]`                | `directory/components/student-detail-view.tsx` `LiveStudentDetailView`                                                                               | 4                         |
| `/manager/parents`                                              | center_manager: `RegistrationParentsView` (cùng file trên); admin: `parents/…/parents-view.tsx`                                                      | 2                         |
| `/manager/parents/[id]`                                         | `directory/components/parent-detail-view.tsx` `LiveParentDetailView` (có form sửa `parentUpdateSchema`)                                              | 2                         |
| `/manager/classes`, `/staff/classes`                            | center_manager/staff: `registration-flow/components/classes-view.tsx` `RegistrationClassesView`; admin: `classes/…/classes-view.tsx`                 | 2                         |
| `/manager/classes/new`, `/manager/classes/[id]`                 | center_manager: `registration-flow/components/class-editor.tsx` `RegistrationClassEditor` (874 dòng); admin: `classes/…`                             | 2                         |
| `/manager/classes/[id]/sessions`, `/manager/sessions`           | `curriculum/components/sessions-view.tsx` `ScheduledSessionsView` (+ `session-generator.tsx`)                                                        | 3                         |
| `/manager/schedule`, `/staff/schedule`, `/teacher/schedule`     | `curriculum/components/calendar-view.tsx` `AcademicCalendarView` (`?view=day\|week\|board`, `?session=` mở `session-detail-sheet.tsx`)               | 2 (QL, NV), 3 (GV)        |
| `/manager/teachers/substitutes`                                 | `teachers/components/live-substitutes-view.tsx` `LiveSubstitutesView`                                                                                | 2                         |
| `/manager/teachers`, `/manager/system/staff`                    | `directory/components/accounts-view.tsx` `AccountsView kind="teachers"\|"staff"`                                                                     | 2                         |
| `/manager/teachers/[id]`, `/manager/system/staff/[id]`          | `AccountDetailView` (cùng file)                                                                                                                      | 2                         |
| `/manager/teachers/invitations`                                 | `directory/components/managers-view.tsx` `TeacherInvitationsView` (dùng `invitations-panel.tsx` `InvitationsPanel kind="teacher"`)                   | 2                         |
| `/manager/system/managers`                                      | `ManagersView` (cùng file, có `InvitationsPanel kind="manager"`)                                                                                     | 2                         |
| `/manager/catalog`                                              | center_manager: `registration-flow/components/programs-view.tsx` `RegistrationProgramsView` (`?tab=subjects\|programs`); khác: `CurriculumUnitsView` | 2                         |
| `/manager/catalog/programs/[id]`                                | `registration-flow/components/program-detail-view.tsx` `AcademicProgramDetailView` (`?tab=overview\|curriculum\|classes`)                            | 2                         |
| `/manager/curriculum`, `/teacher/curriculum`                    | `curriculum/components/units-view.tsx` `CurriculumUnitsView` (nút tạo chỉ cho `curriculum_designer`)                                                 | 2 (gộp tab), 3 (nội dung) |
| `/manager/curriculum/[id]`, `/teacher/curriculum/[id]`          | `curriculum/components/unit-detail-view.tsx` `CurriculumUnitDetailView` + `curriculum-review-forms.tsx`, `curriculum-import.tsx`, `lesson-form.tsx`  | 3                         |
| `/manager/curriculum/feedback`, `/teacher/feedback`             | `curriculum/components/live-feedback-view.tsx` `LiveCurriculumFeedback`                                                                              | 2 (QL), 3 (GV)            |
| `/manager/rooms`                                                | `catalog/components/live-rooms-view.tsx` `LiveRoomsView` (đã thành bảng ở Phase 1)                                                                   | 2 (thành tab)             |
| `/manager/notifications/send`                                   | `system/components/live-announcements-view.tsx` `LiveAnnouncementsView`                                                                              | 2                         |
| `/manager/notifications/emails`                                 | `system/components/email-deliveries-view.tsx` `EmailDeliveriesView` (đã thành bảng ở Phase 1)                                                        | 2                         |
| `/manager/system/audit-logs`                                    | `system/components/live-audit-log-view.tsx` `LiveAuditLogView` (đã thành bảng ở Phase 1)                                                             | —                         |
| `/manager/profile`, `/staff/profile`, `/teacher/profile`        | `auth/components/account-profile.tsx` `AccountProfile`                                                                                               | 2                         |
| `/manager/absences/*`                                           | màn cũ chỉ admin vào được                                                                                                                            | không sửa                 |
| `/staff/students`                                               | `StaffStudentsHub` + `StudentWorkflowSheet` (Phase 1)                                                                                                | 4 (thêm cột)              |
| `/staff/payments`                                               | `registration-flow/components/payments-view.tsx` `RegistrationPaymentsView` + `directory/components/payment-history.tsx` (Phase 1)                   | 4 (chip tổng tiền)        |
| `/staff/enrollments/new`                                        | `registration-flow/components/registration-wizard.tsx` `RegistrationWizard`                                                                          | không sửa                 |
| `/teacher/dashboard`                                            | `dashboard/components/live-teacher-dashboard.tsx` `LiveTeacherDashboard`                                                                             | 4                         |
| `/teacher/classes`, `/teacher/classes/[id]`                     | `classes/components/teacher-classes-view.tsx`, `teacher-class-detail-view.tsx`                                                                       | 3                         |
| `/teacher/assignments`, `/teacher/assignments/[id]/submissions` | `assignments/components/live-assignments-view.tsx` `LiveAssignmentsView`, `LiveAssignmentSubmissions`                                                | 3                         |
| `/teacher/assignments/new`, `/teacher/assignments/[id]/edit`    | `assignments/components/live-assignment-editor.tsx` `LiveAssignmentEditor`                                                                           | 3                         |
| `/teacher/submissions`, `/teacher/grading`                      | `grading/components/live-grading-view.tsx` `LiveGradingQueue` (hai route trùng nhau)                                                                 | 3                         |
| `/teacher/grading/[submissionId]`                               | `LiveGradingDetail` (cùng file; gọi `academicApi.grade`, `approveGrade`, `publishGrade`)                                                             | 3                         |
| `/teacher/attendance`, `/teacher/attendance/[sessionId]`        | `attendance/components/live-attendance-view.tsx` `LiveAttendanceList`, `LiveAttendanceSession`                                                       | 3                         |
| `/teacher/reports`                                              | `reports/components/live-reports-view.tsx` `LiveReportsView`                                                                                         | 3                         |

Code không còn route nào dùng: `features/work-credits/` (mock), `teachers/components/teacher-detail-view.tsx`, `attendance/components/attendance-list-view.tsx`. Phase 4 xóa nhóm này khi đã có số buổi dạy thật.

### 4.6 Quyền gọi API cần nhớ

Quyền kiểm ở `src/lib/api/backend-permissions.ts` (BFF), rồi BE kiểm lại. Những điểm ảnh hưởng tới thiết kế:

| API                                                                              | Ai gọi được                             | Hệ quả khi dựng màn                                                                                                                         |
| -------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET academic/analytics`                                                         | Quản lý, Thiết kế giáo trình, Giáo viên | **Nhân viên không gọi được.** Dashboard nhân viên phải tổng hợp từ các API dưới.                                                            |
| `GET dashboard`                                                                  | Quản lý                                 | Chỉ dùng cho dashboard Quản lý.                                                                                                             |
| `GET registrations`, `GET payments`                                              | Nhân viên                               | Quản lý **không** xem được danh sách đăng ký/thanh toán.                                                                                    |
| `GET parents/:id`, `PATCH parents/:id`, `PATCH staff\|teachers/:id`              | Quản lý                                 | Xem/Sửa/Khóa phụ huynh và tài khoản chỉ ở màn Quản lý. Tab Phụ huynh của Nhân viên giữ nút như hiện tại.                                    |
| `GET staff`, `POST staff`                                                        | Quản lý                                 | API chỉ trả và tạo vai trò Nhân viên (Thiết kế giáo trình chờ BE-10).                                                                       |
| `GET academic/scheduled-sessions` (`classId`, `studentId`, `fromDate`, `toDate`) | Quản lý, Nhân viên, Giáo viên           | Không có lọc theo giáo viên: lọc ở FE. Buổi `COMPLETED` = giáo viên đã chốt điểm danh; dạy thay thì BE đổi `teacherId` sang người dạy thay. |
| `GET academic/makeup-sources` (`studentId` **không bắt buộc**)                   | Nhân viên                               | Bỏ `studentId` để lấy mọi buổi chờ học bù của trung tâm (hàm `academicApi.makeupSources` hiện bắt buộc tham số, cần thêm biến thể).         |
| `GET academic/classes/:id/attendance-summary`                                    | Giáo viên (BE cho thêm Phụ huynh)       | Quản lý/Nhân viên **chưa** có số chuyên cần: cần BE-8.                                                                                      |
| `GET academic/email-deliveries`                                                  | Quản lý, Nhân viên                      | Chỉ nhận `page`, `limit` (lọc trạng thái chờ BE-12).                                                                                        |
| POST/PATCH `academic/curriculum-units…`                                          | Thiết kế giáo trình                     | Quản lý chỉ duyệt/trả lại/lưu trữ, không tạo/sửa giáo trình.                                                                                |

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
- Nguồn: `directoryApi.registrations`, `directoryApi.payments`, `academicApi.sessions`, `academic/makeup-sources` **không truyền `studentId`** (lấy cả trung tâm), `registrationApi.classes` (`availableSeats`). Nhân viên **không** gọi được `academic/analytics` (xem 4.6).
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
- **Đã làm ở Phase 1** (khác thiết kế ở các điểm sau):
  - Component là `StudentWorkflowSheet` (cùng file `live-staff-workflows.tsx`). Từ Phase 2, `StudentsHub` (`directory-list-view.tsx`) dùng chung cho Nhân viên và Quản lý; Quản lý không có nút Xử lý. Xem/sửa/khóa phụ huynh nằm trong Sheet/Dialog.
  - Sheet có **4 tab** chứ không phải 6: _Nghỉ & học bù_ · _Đổi lớp / lịch cố định_ · _Nghỉ dài hạn_ · _Nghỉ môn / nghỉ hẳn_. Lý do: trong code cũ, ba trang "Nghỉ học và học bù", "Đổi một buổi", "Nghỉ 1 buổi" hiện **cùng một bộ panel** (`SingleAbsence` + `MakeupPanel`), nên tách 3 tab sẽ lặp nội dung.
  - Chưa có cột _Lớp đang học_, _Chuyên cần %_, _Nghỉ/học bù_ và bộ lọc nhanh _Chờ xếp học bù / Đang nghỉ dài hạn / Chưa có lớp_. API danh sách học sinh chưa trả các số này; tính ở FE thì mỗi dòng phải gọi thêm API. Chuyển sang Phase 4, cùng màn chi tiết học sinh.

**`QL-HocSinhChiTiet`, chi tiết học sinh**: `/staff/students/[id]` và `/manager/students/[id]`, component `src/features/directory/components/student-detail-view.tsx`

- Giữ: API `directoryApi.student`, `studentEnrollments`, `studentSchedule`.
- Bỏ: bố cục 3 card xếp dọc (thông tin + lịch tuần + ghi danh).
- Thêm: 4 thẻ số liệu (Chuyên cần % kèm có mặt/tổng buổi, Số buổi vắng kèm số chờ học bù / có phép, Điểm trung bình các bài đã công bố, Học phí đã đóng kèm ngày hết hạn); tab Tổng quan / Lịch học / Điểm & bài tập / Học phí / Nghỉ & học bù; dải ô điểm danh theo từng lớp (Có mặt / Vắng / Có phép / Học bù / Sắp tới, rê chuột xem ngày); bảng buổi gần đây; lớp đang học (còn bao nhiêu tuần); phụ huynh; điểm gần đây. Nút: _Đăng ký thêm lớp_, _Xử lý nghỉ / học bù_, menu ⋯ (_Sửa hồ sơ_, _Xem tài khoản phụ huynh_, _Ngừng học_).
- Thêm/sửa/xóa học sinh:
  - **Thêm**: Web không tạo hồ sơ con. Phụ huynh tạo trên app (quy định domain, giữ nguyên).
  - **Sửa hồ sơ**: chưa có API, **chờ BE-8**. Hiện nút disable kèm nhãn.
  - **Xóa**: dùng _Ngừng học_ đã có (`academicApi.endStudent`). Không xóa cứng.
- Đổi logic: không. Chuyên cần % và số buổi vắng lấy từ `GET academic/classes/:id/attendance-summary` (có `studentId`, trả `attendancePercent`). API này hiện **chỉ cho Giáo viên và Phụ huynh**, nên ở màn Quản lý/Nhân viên cần BE-8. Chưa có BE-8 thì ẩn các khối chuyên cần.

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
- **Đã làm Phase 1–2**: Phòng học nằm trong tab của Lớp học, route `/manager/rooms` chuyển về tab Phòng. `LiveRoomsView` giữ form thêm phòng, bảng phòng và Dialog sửa/ngừng/dùng lại; lưới lớp có 4 cột ở desktop và chuyển Thẻ/Bảng.

**`QL-ChiTietLop`, chi tiết lớp**: `/manager/classes/[id]`, `RegistrationClassEditor` (`registration-flow/components/class-editor.tsx`)

- Giữ: mọi form và API (lưu thông tin lớp, lịch tuần, xác nhận/mở khóa lịch, đổi giáo viên theo ngày hiệu lực, mở/đóng đăng ký, ngừng, xóa lớp chưa dùng).
- Bỏ: 4 card form xếp dọc (~2.200px); form _Đổi giáo viên từ ngày hiệu lực_ luôn mở.
- Thêm: tab Tổng quan / Học sinh / Buổi học / Chuyên cần. Tổng quan chia 2 cột: trái là _Thông tin lớp_ + _Lịch cố định_ (bảng gọn, nhãn Đã khóa, nút _Mở khóa để sửa…_ mở Dialog nhập lý do); phải là _Học sinh đang học_, _Buổi sắp tới_, _Giáo trình đang dùng_ (tiến độ). _Đổi giáo viên…_ mở Dialog. _Ngừng hoạt động / Xóa lớp_ chuyển vào menu ⋯.
- Đổi logic: không.

**`QL-LichHoc`, Lịch học Kanban + Sheet buổi học**: `/manager/schedule`, `/staff/schedule`

- Giữ: `AcademicCalendarView`, `ScheduleBoard`, `SessionDetailSheet` (`features/curriculum/components/`), API đổi giờ (xem trước rồi xác nhận), hủy buổi, xếp dạy thay (`SubstituteForm`, `teachers/components/substitute-form.tsx`, được tách ở Phase 2).
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
- **Đã làm ở Phase 1**:
  - Nút trên dòng đổi theo trạng thái: _Thu phí_ (nháp), _Biên lai_ (hoàn tất), _Xem_ (đã hủy). Bấm mở Sheet bên phải chứa `RegistrationBillPanel` + biên lai. Hộp thoại xác nhận thu tiền mở chồng lên Sheet, giữ nguyên khóa chống trùng.
  - In bill/biên lai từ trong Sheet: thêm CSS in cho `[data-registration-sheet]` trong `globals.css` để bản in nằm đầu trang, không bị khung cuộn cắt.
  - Ô tìm kiếm: BE chỉ tìm theo tên con, email phụ huynh, số biên lai. Khi chuỗi gõ vào trông giống mã đăng ký (≥ 20 ký tự chữ/số), hiện nút _Mở theo mã đăng ký_ gọi `registrationApi.get` như card tra cứu cũ.
  - Lọc nhanh _Hôm nay_, _Tháng này_ (điền sẵn Từ ngày/Đến ngày) và _Tạo trong phiên này_ (danh sách lưu trên thiết bị như card cũ, đăng ký không tải được vẫn có nút mở).
  - Chưa làm: chip _N chờ thu · tổng tiền_. API danh sách chỉ trả tổng số dòng, không trả tổng tiền theo trạng thái. Chuyển sang Phase 4 (dashboard nhân viên dùng cùng số liệu).

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
- **Phase 1 đã làm**: `EmailDeliveriesView` chuyển từ card sang bảng (Email · Người nhận · Trạng thái kèm lỗi gần nhất · Lần gửi · Thời gian · Gửi lại), vẫn ở trang `/manager/notifications/emails`. Chưa có **lọc trạng thái**: `GET academic/email-deliveries` chỉ nhận `page`, `limit`, lọc ở FE trên một trang sẽ sai số liệu. Cần BE nhận thêm `status` (BE-12). Gộp với Gửi thông báo thành một màn 2 phần thuộc **Phase 2**.

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
- Chờ: **BE-10** (tài khoản Thiết kế giáo trình trong cùng bảng; hiện API `staff` chỉ trả vai trò Nhân viên và Quản lý chỉ được tạo Nhân viên). Khi chưa có BE-10: bảng chỉ hiện Nhân viên, ẩn lựa chọn vai trò.
- Số buổi dạy **không cần BE**: đếm buổi `COMPLETED` theo `teacherId` từ `academic/scheduled-sessions` (BE đặt `COMPLETED` khi chốt điểm danh, đổi `teacherId` khi xếp dạy thay). BE-11 chỉ còn là tùy chọn cho nhanh.

**`QL-LichSu`, Lịch sử thay đổi**: `/manager/system/audit-logs`, `LiveAuditLogView` (`features/system/components/live-audit-log-view.tsx`)

- Giữ: bộ lọc đối tượng / hành động / khoảng ngày, giải mã snapshot thay đổi, escape nội dung.
- Bỏ: mỗi bản ghi một card full chiều ngang (19 bản ghi ≈ 5.000px).
- Thêm: **bảng** (Thời gian · Hành động · Đối tượng · Người thực hiện), bấm dòng mở chi tiết thay đổi ngay dưới dòng; lọc thêm theo người thực hiện; 5 bản ghi mới nhất hiện ở Dashboard Quản lý.
- **Phase 1 đã làm**: bảng 5 cột, người thực hiện kèm vai trò; nút _Xem thay đổi / Thu gọn_ mở phần Trước/Sau ngay dưới dòng (`AuditChangeDetails` giờ hiện thẳng nội dung, không còn khối `<details>`). Chưa làm: lọc theo người thực hiện (BE đã nhận `actorUserId`, làm ở P2-10) và 5 bản ghi trên Dashboard (P4-1).

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

- Route mới: `/staff/dashboard`, `/manager/notifications`, `/manager/people`, `/manager/curriculum/overview`. Phải thêm vào `ROUTE_AREAS` trong `role-access.ts`: `/staff/dashboard` → `dashboard`; `/manager/people` → `staff_accounts` (trong màn, tab Giáo viên kiểm thêm area `teachers`); `/manager/notifications` và `/manager/curriculum/overview` đã nằm trong tiền tố có sẵn (`notifications`, `catalog`).
- Redirect route cũ như bảng mục 4.
- Bỏ theme `edugrade-warm` (đã làm ở Phase 1).
- Trang chủ nhân viên → `/staff/dashboard`: **chưa quyết**, giữ như cũ (câu hỏi mở của Phase 4).

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

Các mục dưới là việc phía BE/Mobile. Trong lúc chờ, FE làm đúng cột "FE tạm". Từ 18/10/2026 chủ dự án cho phép sửa BE khi màn hình thật sự cần. Mỗi thay đổi BE phải nhỏ, tách riêng, hỏi trước khi push repo BE. FE chỉ gửi tham số mới khi BE trên `dev` đã nhận tham số đó; nếu chưa, validation whitelist của BE trả 400.

| Mã    | Cần làm                                                                                                                                                            | FE tạm                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| BE-1  | Khóa học có trường **số buổi/tuần**; lưu lịch tuần của lớp thì kiểm tra đúng số khung giờ                                                                          | Cảnh báo khi lớp khác số buổi so với các lớp cùng khóa; ô "Số buổi/tuần" disable |
| BE-2  | Mỗi khóa chỉ **1 giáo trình đã duyệt** có hiệu lực tại một ngày; bản mới bắt đầu thì bản cũ tự lưu trữ                                                             | Cảnh báo chồng ngày trước khi gửi duyệt                                          |
| BE-3  | API trả giáo trình hiệu lực của khóa tại một ngày, kèm các lớp đang dùng                                                                                           | Lọc từ danh sách giáo trình và lớp                                               |
| BE-4  | Bài học thêm **Chương**, **Tài liệu**; CSV nhận thêm 2 cột                                                                                                         | Ẩn/disable 2 cột                                                                 |
| BE-5  | (Tùy chọn) Nhập file **.xlsx**                                                                                                                                     | Chỉ nhận CSV, có file mẫu                                                        |
| BE-6  | (Tùy chọn) Xem trước/sinh lịch **nhiều lớp** trong một yêu cầu                                                                                                     | Gọi API cũ lần lượt từng lớp                                                     |
| BE-7  | Lưu **nét chấm trên ảnh** theo từng câu, trả cho phụ huynh; file bài nộp gắn theo **từng câu** (hiện gắn cả bài nộp)                                               | Xem ảnh trong trang, ẩn công cụ vẽ                                               |
| BE-8  | API **sửa hồ sơ con** từ Web (họ tên, khối, ngày sinh); cho Quản lý và Nhân viên gọi `GET academic/classes/:id/attendance-summary` (**đã làm 19/10**: chuyên cần `e20101f`, sửa hồ sơ `a018a35`) | Đã có Dialog _Sửa hồ sơ_ (10.5)                                                  |
| BE-9  | **Xóa** tài khoản phụ huynh chưa có hồ sơ con/thanh toán (**đã làm 19/10, `50d8dde`**)                                                                             | Đã có nút _Xóa hẳn_ (10.5)                                                       |
| BE-10 | Danh sách + quyền tạo/khóa tài khoản **Thiết kế giáo trình** cho Quản lý, chung bảng với Nhân viên (**đã làm 19/10, `5be6f74`**)                                   | Đã gộp bảng, có chọn vai trò (10.5)                                              |
| BE-11 | (Tùy chọn) API **thống kê buổi dạy** theo giáo viên/tháng                                                                                                          | Đếm ở FE từ danh sách buổi (`COMPLETED` theo `teacherId`), đủ dùng               |
| BE-12 | `GET academic/email-deliveries` nhận thêm `status` (PENDING/PROCESSING/SENT/FAILED) (**đã làm 19/10, commit BE `8e06c69`**)                                         | Đã có bộ lọc `?emailStatus=`                                                     |
| M-1   | App phụ huynh (`WDP301-FEM-System`): **chụp/chọn ảnh** bài tự luận khi nộp (hiện chỉ nhập chữ, chưa có image picker) và gửi `fileIds`                              | Web chỉ hiện bài nhập chữ                                                        |

Chi tiết nghiệp vụ giáo trình (quan hệ dữ liệu, vòng đời theo kỳ) xem artboard `NghiepVu-QuanHe` và `NghiepVu-QuyTrinh` trên canvas.

---

## 10. Tiến độ theo đợt và nghiệm thu

Chia 4 phase (đợt). Ngày 19/10/2026, chủ dự án yêu cầu tiếp tục WIP của Claude và làm lần lượt Phase 2 → 3 → 4, chỉ trong WDPFE/WDPBE, không sửa WDPFEM. Mã việc `P2-1`, `P3-3`… dùng để đánh dấu tiến độ và báo cáo.

### 10.1 Phase 1: đã xong (18/10/2026)

Không cần BE, không có màn mới, không đổi logic.

| Việc                                 | Kết quả                                                                                                                                                                  | File chính                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Một tông xanh cho mọi màn            | Bỏ theme `edugrade-warm` (kem/cam đất), font Noto Serif và cờ `warm` của khung ứng dụng. Dashboard dùng token chung. `.claude/rules/ui.md` ghi lại quyết định mới.       | `globals.css`, `layout.tsx`, `app-shell.tsx`, `sidebar.tsx`, `components/shared/layout/header/header.tsx`, `dashboard-stat-card.tsx`, `live-manager-dashboard.tsx` |
| Menu Nhân viên 11 → 5 mục            | _Học sinh & phụ huynh_ · _Lớp học_ · _Lịch học_ · _Đăng ký học_ · _Đăng ký & biên lai_. Dashboard nhân viên chưa có (Phase 4).                                           | `constants/menu.ts`                                                                                                                                                |
| Học sinh & phụ huynh + Sheet _Xử lý_ | Tab Học sinh/Phụ huynh (`?tab=`), nút _Xử lý_ trên dòng mở Sheet 4 tab, xem [5.2](#52-học-sinh--phụ-huynh). Nút _Nghỉ học và học bù_ ở chi tiết học sinh mở thẳng Sheet. | `directory-list-view.tsx`, `live-staff-workflows.tsx`, `student-detail-view.tsx`, `routes.ts` (`STAFF.STUDENT_ACTION`)                                             |
| Chuyển hướng route cũ                | 5 route `/staff/absences/*` và `/staff/parents` chỉ còn `redirect`, giữ tham số.                                                                                         | `app/(staff)/staff/absences/*/page.tsx`, `features/absences/legacy-routes.ts`, `app/(staff)/staff/parents/page.tsx`                                                |
| Đăng ký & biên lai                   | Bỏ 2 card tra mã / phiên; tìm kiếm chung, lọc nhanh, bill và biên lai trong Sheet, xem [5.5](#55-đăng-ký--thanh-toán).                                                   | `payments-view.tsx`, `payment-history.tsx`, `globals.css` (in)                                                                                                     |
| Thẻ → bảng                           | Phòng học (form trái + bảng, Dialog Sửa/Ngừng), Lịch sử email, Lịch sử thay đổi (dòng mở rộng).                                                                          | `live-rooms-view.tsx`, `email-deliveries-view.tsx`, `live-audit-log-view.tsx`, `audit-change-details.tsx`                                                          |

Kiểm tra đã chạy:

- `npx eslint --fix`, `npm run lint` (0 lỗi; 8 cảnh báo cũ ở file không sửa), `npx tsc --noEmit`, `npx next build --webpack`: đạt.
- Test UI trên DB MySQL riêng (không đụng `edugrade_db`, đã chặn SMTP), Chrome 1440×900, **28/28 bước đạt**, không có lỗi console:
  - menu mới; hai tab; mở Sheet; chọn ghi danh; 4 tab; **gửi thật** form Nghỉ dài hạn trong Sheet; đóng Sheet thì xóa query;
  - 3 kiểu chuyển hướng route cũ;
  - **thu tiền thật** trong Sheet (hộp thoại chồng lên Sheet) rồi ra biên lai; giả lập in thì biên lai nằm đầu trang;
  - mở theo mã đăng ký; lọc _Tạo trong phiên này_ và _Tháng này_;
  - dashboard quản lý không còn theme ấm; **sửa phòng** và **ngừng sử dụng phòng** qua Dialog;
  - bảng email không tràn ngang; mở dòng lịch sử thay đổi;
  - Quản lý vẫn dùng màn Hồ sơ con cũ, không thấy nút _Xử lý_.
- Phần **chưa làm** của các màn Phase 1 đã chuyển thành việc của phase sau: cột chuyên cần và lọc nhanh của bảng học sinh (P4-5), chip tổng tiền của Đăng ký & biên lai (P4-7), lọc trạng thái email (chờ BE-12), lọc người thực hiện ở lịch sử thay đổi (P2-10).

### 10.2 Phase 2: gộp menu Quản lý (code xong 19/10/2026)

Đã tiếp tục từ WIP chưa commit của Claude, hoàn tất P2-1 đến P2-10. Kiểm tra: ESLint các file sửa đạt; `npm run lint` 0 lỗi, 4 cảnh báo import cũ ngoài phạm vi; `npx tsc --noEmit` đạt; `npx next build --webpack` đạt (63 trang tĩnh); 37 kiểm tra hồi quy local đạt. `ROLE_AREAS`, BFF permissions và schema Zod không đổi. **Test trình duyệt (19/10/2026)**: BE build hiện tại chạy cổng riêng với DB riêng `edugrade_ui_qa` (migrate + `seed:dashboard`), tắt mail (`SMTP_URL=''`, `MAIL_FROM=''`); FE bản build `next start`; Playwright 1440×900 với 4 vai trò. Đạt 43/45 kiểm tra: menu 8 mục, 17 redirect giữ query, Sheet/Dialog phụ huynh (xem, khóa/mở khóa), Nhân sự (tạo nhân viên, khóa/mở), Thông báo, Khóa học & giáo trình, lưới lớp 4 cột + tab Phòng (thêm phòng), chi tiết lớp (tab, Dialog đổi giáo viên, menu ⋯, đóng/mở đăng ký), Kanban + Sheet 4 tab (đổi giờ xem trước rồi xác nhận, hủy buổi, xếp dạy thay → thẻ có nhãn _Dạy thay_), tài khoản 2 cột, lọc lịch sử theo người thực hiện (gửi `actorUserId`); Nhân viên không thấy tab Phòng, Sheet buổi chỉ có Nội dung, vào `/manager/people` bị 403; Thiết kế giáo trình chỉ thấy 1 mục menu. Không trang nào tràn ngang ở 1440px, không lỗi hydration. Lượt chạy lại sau khi sửa: Dialog sửa phụ huynh đạt; _Hủy buổi_ chỉ báo lỗi do dữ liệu test dùng lại (buổi đã hủy ở lượt đầu, lượt đầu đạt).

Sửa thêm sau khi test runtime:

- `RowActions` (`components/shared/data-table/row-actions.tsx`): nút ⋯ trước đây render rỗng ở **mọi nơi** vì `Button` cỡ `icon-*` chỉ vẽ `leftIcon` và bỏ `children`. Đã chuyển icon sang `leftIcon` và thêm `aria-label="Hành động"`.
- Nút đóng mặc định của `SheetContent`/`DialogContent` (`components/ui`) mắc cùng lỗi (nút vô hình, không có tên). Không sửa tay `components/ui`; các Sheet mới dùng `SheetCloseButton` (`components/shared/actions/sheet-close-button.tsx`) với `showCloseButton={false}`. Dialog vẫn đóng bằng Esc/bấm ngoài. Xem câu hỏi mở.
- Danh sách lớp/buổi học chỉ trả `teacherId`: tên giáo viên lấy từ danh sách giáo viên đang hoạt động (`registration-flow/teacher-names.ts`).
- Dialog _Sửa thông tin phụ huynh_ và _Sửa tài khoản_: lưu xong dữ liệu đã đổi nhưng Dialog không đóng, không có toast. Nguyên nhân: `key` của `ApiForm` gồm cả tên/SĐT/trạng thái, refetch sau khi lưu làm form remount trước khi `onSuccess` chạy. Đã đổi `key` chỉ theo id.
- Thẻ lớp: giữ nút chính hiện sẵn (Quản lý _Chi tiết_, Nhân viên _Thêm học sinh_) cạnh menu ⋯ theo thiết kế 5.3; các thao tác còn lại trong ⋯.

- [x] P2-1: menu 8 mục, route mới, redirect giữ query lặp.
- [x] P2-2: hub học sinh/phụ huynh, Sheet xem, Dialog sửa/khóa/mở khóa.
- [x] P2-3: hub Nhân sự, form và Sheet tài khoản, lời mời.
- [x] P2-4: màn Thông báo hai phần, giữ gửi lại email lỗi.
- [x] P2-5: hub khóa học/giáo trình theo vai trò, Sheet chi tiết khóa.
- [x] P2-6: lớp 4 cột/Thẻ/Bảng, menu thao tác, tab Phòng theo quyền.
- [x] P2-7: chi tiết lớp chia tab, giữ các form và xác nhận cũ.
- [x] P2-8: Kanban mặc định, chip tuần, lọc giáo viên, Sheet 4 tab.
- [x] P2-9: tài khoản cá nhân hai cột.
- [x] P2-10: lọc lịch sử theo người thực hiện trên URL.

Khác thiết kế: chưa hiện số học viên/điểm danh trong Sheet buổi khi endpoint detail không trả; nhãn dạy thay chỉ suy ra cho buổi SCHEDULED theo phân công có ngày hiệu lực, không suy đoán lịch sử buổi đã chốt. Các phần chờ BE-8/9/10/12 giữ đúng phương án FE tạm. Lỗi API và dữ liệu thiếu được phân biệt với số 0 hoặc danh sách rỗng.

Không cần BE. Vai trò chính: Quản lý trung tâm (`center_manager`). Thiết kế giáo trình chỉ bị ảnh hưởng ở P2-5. Nhân viên bị ảnh hưởng ở P2-6, P2-8 vì dùng chung màn Lớp học và Lịch học.

**P2-1. Menu, route, redirect của Quản lý**: [4.1](#41-quản-lý-trung-tâm-18--8-mục)

- `constants/routes.ts`: thêm `MANAGER.PEOPLE = "/manager/people"` và `MANAGER.NOTIFICATIONS = "/manager/notifications"`.
- `constants/role-access.ts` `ROUTE_AREAS`: thêm `{ prefix: "/manager/people", area: AREA.STAFF_ACCOUNTS }`. Tiền tố `/manager/notifications` đã có. Giữ mọi tiền tố cũ vì trang redirect vẫn nằm ở đó.
- `constants/menu.ts` `MENU_BACK_OFFICE`: Quản lý còn 8 mục, chia nhóm:
  - _TỔNG QUAN_: Dashboard;
  - _HỌC SINH_: Học sinh & phụ huynh (`MANAGER.STUDENTS`, `STUDENTS`);
  - _LỚP HỌC & LỊCH_: Lớp học (`CLASSES`), Lịch học (`MANAGER.SCHEDULE`, `SCHEDULE`);
  - _ĐÀO TẠO_: Khóa học & giáo trình (`MANAGER.CURRICULUM`, `CATALOG`);
  - _TRUNG TÂM_: Nhân sự (`MANAGER.PEOPLE`, `STAFF_ACCOUNTS`), Thông báo (`MANAGER.NOTIFICATIONS`, `NOTIFICATIONS`, chuyển `badgeKey: FAILED_EMAILS` sang mục này), Lịch sử thay đổi (`AUDIT_LOGS`).
- Bỏ khỏi menu: Phụ huynh, Xếp lịch & buổi học, Danh sách giáo viên, Lời mời & duyệt, Dạy thay, Danh mục, Phản hồi giáo trình, Phòng học, Lịch sử email, Gửi thông báo, Nhân sự trung tâm, Quản lý trung tâm.
- Giữ nguyên các mục chỉ admin thấy: Đăng ký học, Lịch sử thanh toán, 5 mục nghỉ/học bù.
- Redirect, giữ query: theo bảng 4.1. Mỗi trang cũ thành `redirect()`.
- Nghiệm thu: Quản lý thấy đúng 8 mục; Thiết kế giáo trình chỉ thấy _Khóa học & giáo trình_; mọi route cũ ở bảng 4.1 chuyển đúng màn.

**P2-2. Học sinh & phụ huynh (Quản lý)**: artboard `QL-HocSinhPhuHuynh`; [5.2](#52-học-sinh--phụ-huynh)

- `/manager/students?tab=students|parents`. Dùng lại `StudentsDirectory` / `ParentsDirectory` (`directory-list-view.tsx`).
  - Cách làm: tổng quát `StaffStudentsHub` thành một hub nhận vai trò, hoặc tạo `ManagerStudentsHub` cùng file.
  - Quản lý **không** có nút Xử lý; trang `/manager/students` vẫn bọc `Suspense`; nhánh admin giữ nguyên.
- Thao tác trên dòng phụ huynh, chỉ cho Quản lý:
  - **Xem**: Sheet `?parentId=<id>`. Thân Sheet tách từ `LiveParentDetailView`: thông tin và danh sách hồ sơ con, mỗi con có link `ROUTES.MANAGER.STUDENT_DETAIL`.
  - **Sửa**: Dialog chứa `ApiForm` `parentUpdateSchema` → `directoryApi.updateParent`. Email chỉ đọc.
  - **Xóa**: Dialog giải thích chưa xóa hẳn được (BE-9), đề xuất **Khóa tài khoản**. `directoryApi.updateParent` kiểm body bằng đủ `parentUpdateSchema`, nên phải gửi lại `displayName` và `phone` hiện tại kèm `status: "DISABLED"` (lấy từ `directoryApi.parent(id)`). Tài khoản đã khóa thì nút là _Mở khóa_ (gửi `status: "ACTIVE"`).
- Redirect: `/manager/parents` → `?tab=parents`; `/manager/parents/[id]` → `?tab=parents&parentId=<id>`.
- Nghiệm thu: sửa tên/SĐT phụ huynh trong Dialog thì bảng cập nhật; khóa rồi mở khóa được; link cũ mở đúng Sheet.

**P2-3. Nhân sự** (`/manager/people`, route mới): artboard `QL-NhanSu`; [5.7](#57-quản-trị)

- Tab `?tab=teachers|staff|managers|invites`:
  - _Giáo viên_ = thân `AccountsView kind="teachers"`;
  - _Nhân viên & thiết kế giáo trình_ = thân `AccountsView kind="staff"`, chỉ hiện Nhân viên vì chờ BE-10, không có ô chọn vai trò;
  - _Quản lý_ = thân `ManagersView`;
  - _Lời mời_ = `InvitationsPanel kind="teacher"` và `kind="manager"`.
- Nút chính đổi theo tab (Tạo nhân viên / Mời giáo viên / Mời quản lý). Form tạo/mời đặt trong Dialog hoặc cột trái theo artboard.
- Bấm _Xem_ mở Sheet `?person=<id>` với thân `AccountDetailView`; _Sửa / Khóa_ dùng `accountUpdateSchema`.
- **Chưa làm ở Phase 2**: cột _Buổi đã dạy_, _Chờ điểm danh_, _Dạy thay_ và Sheet buổi dạy, để Phase 4 (P4-6).
- Redirect: `/manager/teachers` → `?tab=teachers`; `/manager/teachers/invitations` → `?tab=invites`; `/manager/system/staff` → `?tab=staff`; `/manager/system/managers` → `?tab=managers`; `/manager/teachers/[id]` → `?tab=teachers&person=<id>`; `/manager/system/staff/[id]` → `?tab=staff&person=<id>`.
- Tên query của từng view (`search`, `page`, `managersPage`…) không được đụng nhau giữa các tab; đổi tab thì reset.
- Nghiệm thu: tạo nhân viên, gửi lại hoặc thu hồi lời mời, khóa tài khoản đều chạy như trang cũ.

**P2-4. Thông báo** (`/manager/notifications`, route mới): artboard `QL-ThongBao`; [5.7](#57-quản-trị)

- Bố cục 2 phần:
  - trái: form của `LiveAnnouncementsView`, chia tab _Thông báo lớp / Nhắc học phí_;
  - phải: bảng `EmailDeliveriesView` (đã làm ở Phase 1) và danh sách thông báo đã gửi.
- Tách thân hai view, giữ nguyên API và thông báo lỗi. Không có lọc trạng thái email (BE-12).
- Redirect `/manager/notifications/send` và `/manager/notifications/emails` → `/manager/notifications`.
- Nghiệm thu: gửi thông báo lớp và nhắc học phí như cũ; nút _Gửi lại_ email lỗi vẫn chạy.

**P2-5. Khóa học & giáo trình**: artboard `QL-DanhMuc`; [5.4](#54-khóa-học--giáo-trình)

- `/manager/curriculum` theo vai trò:
  - Quản lý: tab `?tab=programs|subjects|feedback`;
  - Thiết kế giáo trình: tab `?tab=curriculum|feedback`.
- Tab _Khóa học & giáo trình_ (Quản lý):
  - trái: form tạo khóa (từ `RegistrationProgramsView`);
  - phải: bảng nhóm theo khóa (`registrationApi` programs). Dưới mỗi khóa là các giáo trình của khóa (`CurriculumUnitsView` lọc `programId`) với trạng thái và nút Xem/Duyệt.
  - **Không** có nút tạo giáo trình cho Quản lý.
- Tab _Môn học_ = phần môn học của `RegistrationProgramsView`.
- Tab _Phản hồi_ = `LiveCurriculumFeedback`.
- `RegistrationProgramsView` đang dùng query `tab=subjects|programs`, phải đổi tên để không đụng tab của hub.
- Chi tiết khóa `/manager/catalog/programs/[id]` → `/manager/curriculum?program=<id>`: Sheet với thân `AcademicProgramDetailView`, đổi tên query `tab` bên trong.
- Redirect: `/manager/catalog` → `/manager/curriculum?tab=subjects`; `/manager/curriculum/feedback` → `?tab=feedback`.
- Nghiệm thu:
  - Quản lý tạo/sửa khóa, môn học như cũ; duyệt/trả lại giáo trình vẫn ở `/manager/curriculum/[id]`;
  - Thiết kế giáo trình vẫn tạo được giáo trình và không thấy tab Môn học/Khóa học.

**P2-6. Lớp học (lưới 4 cột) + tab Phòng học**: artboard `LopHoc`; [5.3](#53-lớp-học-và-lịch)

- `RegistrationClassesView` (dùng cho Quản lý và Nhân viên):
  - thẻ gọn theo `eg-grid4`, nút chuyển Thẻ/Bảng `?view=cards|table`;
  - các nút hiện có trên thẻ chuyển vào menu ⋯: _Thêm học sinh_ (Nhân viên, `ENROLLMENT_NEW_FOR({ classId })`), _Chi tiết_ (Quản lý), _Xem buổi học_.
- Chỉ đưa vào menu ⋯ các thao tác đã có API. _Đóng đăng ký / Ngừng hoạt động_ đang nằm trong `class-editor.tsx`: dùng lại đúng hàm đó; không có thì để ở trang chi tiết.
- Tab **Phòng học** `?tab=rooms` chỉ cho vai trò có area `ROOMS`, dùng thân `LiveRoomsView` (Phase 1). Redirect `/manager/rooms` → `/manager/classes?tab=rooms`.
- Nghiệm thu: ở 1440px lưới có 4 cột; Nhân viên không thấy tab Phòng; thêm/sửa/ngừng phòng chạy trong tab.

**P2-7. Chi tiết lớp**: artboard `QL-ChiTietLop`; [5.3](#53-lớp-học-và-lịch)

- Chia `RegistrationClassEditor` (chỉ khi có `classId`) thành tab _Tổng quan / Học sinh / Buổi học_.
  - _Tổng quan_ 2 cột: trái là Thông tin lớp + Lịch cố định; phải là học sinh, buổi sắp tới, giáo trình đang dùng. Chỉ hiện số liệu API đang trả; thiếu thì bỏ khối đó và ghi lại.
  - _Đổi giáo viên từ ngày hiệu lực_ mở Dialog. _Ngừng hoạt động / Xóa lớp_ chuyển vào menu ⋯ (giữ hộp xác nhận cũ).
  - Tab _Chuyên cần_ để Phase 4.
- Màn tạo lớp `/manager/classes/new` giữ nguyên.
- Nghiệm thu: mọi form cũ (lưu thông tin, lịch tuần, xác nhận/mở khóa lịch, đổi giáo viên, mở/đóng đăng ký, xóa) vẫn chạy.

**P2-8. Lịch học Kanban + Sheet buổi học**: artboard `QL-LichHoc`; [5.3](#53-lớp-học-và-lịch)

- `AcademicCalendarView`:
  - mặc định `view=board` cho Quản lý và Nhân viên (Giáo viên đổi ở Phase 3);
  - thẻ buổi trên `schedule-board.tsx` hiện giờ · lớp · bài · giáo viên · nhãn _Dạy thay_/_Đã hủy_;
  - chip tổng hợp tuần (số buổi, đã hủy, dạy thay);
  - nút _Sinh lịch theo khóa_ dẫn `/manager/sessions`, chỉ Quản lý.
- `SessionDetailSheet` có tab _Nội dung / Đổi giờ / Hủy buổi / Dạy thay_; 3 tab thao tác chỉ cho `center_manager` (Sheet hiện đã kiểm `user?.role === "center_manager"`).
  - Tab _Dạy thay_: tách form của `LiveSubstitutesView` thành component nhận `sessionId` (`academicApi.substituteCandidates`, `academicApi.substitute`).
- Redirect `/manager/teachers/substitutes` → `/manager/schedule?view=board`, giữ `sessionId` thành `session`.
- **Không** kéo-thả.
- Nghiệm thu: đổi giờ (xem trước rồi xác nhận), hủy buổi, xếp dạy thay đều làm được trong Sheet; Nhân viên chỉ thấy tab Nội dung.

**P2-9. Tài khoản cá nhân**: artboard `TaiKhoan`

- `AccountProfile` chia 2 cột: thông tin bên trái, đổi mật khẩu bên phải. Dùng cho mọi vai trò.

**P2-10. Lịch sử thay đổi: lọc theo người thực hiện**: artboard `QL-LichSu`

- Thêm ô chọn _Người thực hiện_ vào `LiveAuditLogView`, giữ trên URL (`?actorUserId=`), gửi `actorUserId` cho `directoryApi.auditLogs`. BE đã nhận tham số này (`AuditLogQueryDto`).
- Danh sách người để chọn lấy từ các API tài khoản Quản lý được gọi (nhân viên, giáo viên, quản lý). Có thêm lựa chọn _Tất cả_.

_Câu hỏi mở Phase 2_:

- `src/components/ui/button.tsx` bỏ `children` khi `size` là `icon-*`, nên nút đóng mặc định của mọi `Dialog`/`Sheet` vô hình và không có tên cho trình đọc màn hình. Sửa đúng gốc là một dòng trong `components/ui` (vẽ `children` khi không có `leftIcon`), nhưng quy định không sửa tay thư mục này. Cần chủ dự án cho phép sửa (hoặc cập nhật qua CLI).
- Các hạn chế BE-8/9/10/12 giữ như mục 9.

### 10.3 Phase 3: Giáo viên + giáo trình (code xong, đã test 19/10/2026)

Có đổi logic nhỏ đã chốt ở [mục 6](#6-những-chỗ-có-đổi-logic).

**Kết quả.** Tiếp tục từ WIP chưa commit (ChatGPT) và hoàn thiện; P3-1 đến P3-9 xong. `npm run lint` 0 lỗi (4 cảnh báo cũ ngoài phạm vi), `npx tsc --noEmit` và `npx next build --webpack` đạt. Test trình duyệt cùng môi trường như 10.2 đạt 20/20:

- [x] P3-1: menu 6 mục; 5 redirect giữ query; `/teacher/grading/[submissionId]` giữ.
- [x] P3-2: bảng bài tập (Bài · Lớp · Hạn nộp · Đã nộp · Chưa chấm · Trạng thái), lọc `?filter=`; trang bài nộp có thẻ tổng hợp, tab lọc, cột _Bài tự luận_; Đề bài + giao bài/đóng/mở lại/công bố đáp án giữ nguyên.
- [x] P3-3: chấm bài 2 phần, khung chấm `sticky`; **Gửi điểm** từ chưa chấm và từ nháp đều ra _Đã công bố_ với đúng 1 phiên bản (không tạo bản trùng); Lưu nháp, chấm trắc nghiệm, gợi ý AI giữ; ảnh bài làm hiện trong trang; nút _Bài chưa chấm tiếp theo_.
- [x] P3-4: tạo/sửa bài tập 2 phần, _Thông tin chung_ cố định khi cuộn, có tổng điểm và nút Lưu nháp.
- [x] P3-5: `/teacher/schedule?view=list|board`, mặc định Danh sách; buổi chưa diễn ra không có nút chốt.
- [x] P3-6: Lớp của tôi 4 cột ở ≥1280px.
- [x] P3-7: Báo cáo: form trái (cố định), bảng phải.
- [x] P3-8: danh sách giáo trình nhóm theo khóa, cột Hiệu lực/Số bài/Trạng thái/Bước tiếp theo, lọc _Cần tôi xử lý_; chi tiết có thanh tiến trình duyệt, bảng bài + cột so sánh với bản gốc, sửa bài trong Sheet, cột Chương disable (BE-4); tạo kỳ mới; nhập CSV 2 phần + file mẫu `public/templates/giao-trinh-mau.csv` (UTF-8 có BOM để Excel đọc đúng); Giáo viên có tab _Phản hồi_. Quản lý không có nút tạo giáo trình.
- [x] P3-9: `/manager/sessions` (Quản lý) sinh lịch theo khóa, tự chọn giáo trình đã duyệt phủ khoảng ngày, xem trước và sinh lần lượt từng lớp, mỗi lớp một idempotency key. Test: sinh 2 lớp Sinh học 6 (8 + 9 buổi tháng 12), sau đó nút còn _0 lớp_ và bị khóa, DB không có buổi trùng.

Khác thiết kế / ghi chú:

- Bảng báo cáo chưa có cột _Phạm vi_ và _Khoảng ngày_: `GET academic/reports` chỉ trả `id`, `classId`, `createdAt` (phạm vi nằm trong `snapshot`, không trả ở danh sách). Không dựng số giả.
- Cột _Bài tự luận_ ghi "N tệp đính kèm" thay vì "N ảnh" vì tệp có thể là PDF.
- Giáo viên chỉ còn 2 cách xem lịch (Danh sách / Kanban) theo P3-5; cách xem Tuần/Ngày vẫn có cho Quản lý và Nhân viên. Cách xem được chọn theo trang (`defaultView`), không theo role, để không nháy màn khi hydrate. `/manager/sessions` cũng chọn màn theo role phía server.
- Gỡ code chết sau redirect: `LiveGradingQueue`/`live-grading-view.tsx`, `LiveAttendanceList`, `LiveCurriculumFeedback`.
- Môi trường: `node_modules` của BE trên máy này từng được trỏ (junction) sang `tests/ui-redesign/be-deps` của repo FE; đã cài lại bằng `pnpm install --frozen-lockfile` + `npx prisma generate` trong BE (không sửa code, không commit BE). Để test sinh lịch, DB test riêng đã xóa 17 buổi tháng 12 chưa diễn ra của khóa Sinh học 6 (không đụng DB thật).

**Chuẩn bị môi trường test**

- Dấu hiệu: API bài tập hoặc giáo trình trả 500 (`PrismaClientValidationError`), hoặc BE không khởi động vì thiếu `mammoth`, `pdf-parse`. Nguyên nhân: `node_modules` của repo BE cũ hơn code BE. Máy chủ dự án đang bị lỗi này.
- Chủ dự án cho phép, ở phase này, chạy trong `WDP301-BE-System`: `pnpm install` rồi `npx prisma generate`.
- Chỉ cài thư viện, **không sửa code BE**, không commit gì vào repo BE.

**P3-1. Menu Giáo viên 10 → 6 mục**: [4.3](#43-giáo-viên-10--6-mục)

- `MENU_TEACHER`, 6 mục:
  - _TỔNG QUAN_: Dashboard;
  - _GIẢNG DẠY_: Lịch dạy & điểm danh (`TEACHER.SCHEDULE`), Lớp của tôi, Giáo trình (`TEACHER.CURRICULUM`);
  - _BÀI TẬP_: Bài tập & chấm bài (`TEACHER.ASSIGNMENTS`);
  - _BÁO CÁO_: Báo cáo.
- Redirect, giữ query:
  - `/teacher/attendance` → `/teacher/schedule?view=list`;
  - `/teacher/attendance/[sessionId]` → `?view=list&session=<id>`;
  - `/teacher/feedback` → `/teacher/curriculum?tab=feedback`;
  - `/teacher/submissions` và `/teacher/grading` → `/teacher/assignments?filter=need-grading`.
- `/teacher/grading/[submissionId]` **giữ** (màn chấm bài).

**P3-2. Bài tập & chấm bài**: artboard `GV-BaiTap`, `GV-BaiNop`; [5.6](#56-bài-tập-chấm-bài-điểm-danh-báo-cáo-giáo-viên)

- `LiveAssignmentsView` thành bảng (Bài · Lớp · Hạn nộp · Đã nộp x/y · Chưa chấm · Trạng thái), lọc `?filter=need-grading|open|draft|closed`. Bấm dòng mở `/teacher/assignments/[id]/submissions`.
- `LiveAssignmentSubmissions`:
  - thẻ tổng hợp, tab lọc, bảng có cột _Bài tự luận: Nhập chữ / N ảnh_, nút _Chấm bài_;
  - _Công bố đáp án_, _Đóng/Mở lại nhận bài_ giữ nguyên.
- Số liệu tính từ `academicApi.assignments` / `academicApi.submissions`. Thiếu số nào thì bỏ cột đó và ghi lại.

**P3-3. Màn chấm bài với Lưu nháp / Gửi điểm**: artboard `GV-ChamBai`, `GV-ChamBaiAnh`; [5.6](#56-bài-tập-chấm-bài-điểm-danh-báo-cáo-giáo-viên), [6.1](#61-chấm-bài-nút-gửi-điểm-đã-chốt-với-chủ-dự-án)

- `LiveGradingDetail` chia 2 phần: trái là bài làm, phải là khung chấm cố định khi cuộn.
- Bỏ 3 card Lưu → Duyệt → Công bố. Thay bằng:
  - **Lưu nháp** = `academicApi.grade`;
  - **Gửi điểm** = Dialog xác nhận rồi gọi lần lượt `grade` → `approveGrade` → `publishGrade`, bỏ qua bước đã đạt. Lỗi giữa chừng thì dừng, báo lỗi, bấm lại thì đi tiếp từ bước đó.
- Gợi ý AI (`gradeAi`) và chấm trắc nghiệm (`gradeObjective`) giữ nguyên.
- Ảnh bài làm hiện ngay trong trang (`academicApi.file`). **Công cụ vẽ ẩn** đến khi có BE-7.
- Nút _Bài chưa chấm tiếp theo_.
- Nghiệm thu: Gửi điểm từ trạng thái chưa chấm, DRAFT và APPROVED đều ra PUBLISHED, không tạo bản chấm trùng.

**P3-4. Tạo/sửa bài tập**: artboard `GV-TaoBaiTap`

- `LiveAssignmentEditor` chia 2 phần: trái _Thông tin chung_ cố định khi cuộn, có tổng điểm; phải là danh sách câu hỏi.
- Giữ `assignmentSchema`, nhập câu hỏi từ file, luồng Lưu nháp → chọn học sinh → Giao bài.

**P3-5. Lịch dạy & điểm danh**: artboard `GV-DiemDanh`

- Với vai trò `teacher`, `/teacher/schedule` có `?view=list|board`.
- `list`: trái là các buổi trong tuần kèm trạng thái (Đã chốt / Chưa điểm danh / Hôm nay / Sắp tới); phải là thân `LiveAttendanceSession` của buổi `?session=<id>`. Ở `board`, `?session=` vẫn mở `SessionDetailSheet` như cũ. `AcademicCalendarView` dùng chung 3 vai trò, nên chỉ đổi nhánh `teacher`.
- Giữ quy tắc: chỉ chốt khi buổi đã kết thúc; chốt rồi không sửa.
- Nghiệm thu: điểm danh và chốt một buổi đã qua; buổi chưa diễn ra không chốt được.

**P3-6. Lớp của tôi**

- `TeacherClassesView` dùng lưới thẻ 4 cột (`eg-grid4`), giữ link chi tiết lớp.

**P3-7. Báo cáo**: artboard `GV-BaoCao`

- `LiveReportsView` chia 2 phần: form tạo bên trái, **bảng** báo cáo đã tạo bên phải (Lớp · Phạm vi · Khoảng ngày · Tạo lúc · Excel/PDF).

**P3-8. Giáo trình: danh sách, chi tiết, tạo kỳ mới, nhập CSV, thẩm định, phản hồi**: artboard `GT-DanhSach`, `GT-ChiTiet`, `GT-TaoMoi`, `GT-ImportCSV`, `GT-ThamDinh`, `GT-PhanHoi`; [5.4](#54-khóa-học--giáo-trình)

- **Danh sách** (Thiết kế giáo trình, tab _Giáo trình_ của P2-5; Giáo viên ở `/teacher/curriculum`). Nếu P2-5 chưa làm thì sửa thẳng `CurriculumUnitsView` ở `/manager/curriculum`:
  - nhãn "Giáo trình [khóa] · [kỳ]" thay "Học phần";
  - nhóm theo khóa; cột hiệu lực, số bài, trạng thái, bước tiếp theo; lọc _Cần tôi xử lý_.
  - Giáo viên có tab _Phản hồi_ (`LiveCurriculumFeedback`).
- **Chi tiết** `CurriculumUnitDetailView`:
  - thanh tiến trình duyệt;
  - **bảng bài học** thay cho card; cột _So với kỳ trước_ tính ở FE theo [6.2](#62-tính-toán-mới-ở-fe-chỉ-đọc-không-ghi);
  - sửa bài trong Sheet (thân `lesson-form.tsx`); cột Chương disable (BE-4).
- **Tạo kỳ mới**: chọn nguồn bài (sao chép kỳ đang dùng = `curriculumApi.revise` / nhập CSV / soạn từ đầu), khung kiểm tra số bài cần.
- **Nhập CSV** `curriculum-import.tsx`: chia 2 phần, thêm file mẫu tĩnh `public/templates/giao-trinh-mau.csv`, cột theo đúng định dạng parser hiện tại.
- **Thẩm định / duyệt** `curriculum-review-forms.tsx`: mặc định chỉ hiện bài thay đổi; dùng `shared/display/change-diff.tsx`; khung kết luận cố định cuối trang.
- Nghiệm thu:
  - Thiết kế giáo trình tạo, sửa, gửi thẩm định được; Giáo viên đạt/trả lại được; Quản lý duyệt/trả lại được;
  - **Quản lý không có nút tạo giáo trình**.

**P3-9. Sinh lịch theo khóa**: artboard `GT-SinhLich`; [5.3](#53-lớp-học-và-lịch), [6.3](#63-sinh-lịch-theo-khóa)

- `/manager/sessions`:
  - trái: khóa, khoảng ngày, giáo trình tự chọn, danh sách lớp có checkbox;
  - phải: xem trước từng lớp;
  - nút _Sinh lịch cho N lớp_ gọi `curriculumApi.preview` / `generate` lần lượt từng lớp, mỗi lớp một idempotency key.
- Redirect `/manager/classes/[id]/sessions` → `/manager/sessions?classId=<id>`.
- Nghiệm thu: sinh lịch 2 lớp cùng khóa; một lớp lỗi không ảnh hưởng lớp kia; bấm lại không sinh trùng.

_Câu hỏi mở Phase 3_:

- Bảng báo cáo cần _Phạm vi_ và _Khoảng ngày_: BE trả thêm `studentId`, `from`, `to` (lấy từ `snapshot`) ở `GET academic/reports`? **Đã làm ở 10.5.**
- Giáo viên có cần giữ cách xem Tuần/Ngày ngoài Danh sách/Kanban không? **Đã thêm lại ở 10.5.**

### 10.4 Phase 4: màn mới và số liệu mới (code xong, đã test 19/10/2026)

**Kết quả.** `npm run lint` 0 lỗi (4 cảnh báo cũ + 1 ở script test bị gitignore), `npx tsc --noEmit`, `npx next build --webpack` đạt. Test trình duyệt (BE build có BE-8/BE-12, DB riêng `edugrade_ui_qa`, mail tắt, 1440px) đạt 10/10 cùng các nhóm Phase 2 liên quan; không trang nào tràn ngang.

- [x] P4-1: Dashboard Quản lý 4 thẻ một hàng (học phí kèm % so với tháng trước, học sinh đang học / hồ sơ, lớp đang mở, buổi tuần này); cột _Học phí theo tháng_ một trục, có tooltip và nút xem dạng bảng; _Học sinh theo khối_; _Lấp chỗ theo lớp_ (8 lớp đầy nhất); _Cần chú ý_ (email lỗi, lớp chưa có giáo viên, khóa đang có lớp chưa có giáo trình kỳ sau, giáo trình chờ duyệt — mỗi dòng mở màn liên quan); 5 hoạt động gần đây. Giữ bộ chọn khoảng ngày và Xuất báo cáo. Bỏ biểu đồ 2 trục, khối thống kê theo loại hoạt động (`dashboard-charts.tsx` đã xóa).
- [x] P4-2: `/staff/dashboard` (route, `ROUTE_AREAS`, mục đầu `MENU_STAFF`): đơn chờ thu + tổng dự kiến, đã thu hôm nay, chờ xếp học bù, buổi hôm nay; 5 đơn chờ thu có nút _Thu phí_; cột học phí 14 ngày; học bù chờ xếp có nút _Xếp học bù_; chỗ trống theo lớp. `ROLE_HOME_ROUTE.staff` giữ nguyên.
- [x] P4-3: Dashboard Giáo viên: thẻ _Buổi chưa điểm danh_ thay _Bản chấm chờ duyệt_; cột chuyên cần theo tuần (`academic/analytics`, 8 tuần); tiến độ giáo trình từng lớp (bài đã dạy / tổng bài, cảnh báo buổi đã qua chưa chốt); _Cần chấm_; _Chờ bạn thẩm định_.
- [x] P4-4: `/manager/curriculum/overview` chỉ Thiết kế giáo trình (mục menu _Tổng quan_ có `roles`, vai trò khác bị chuyển về danh sách): đang soạn, bị trả lại, chờ duyệt, phản hồi chưa xử lý; giáo trình kỳ sau theo khóa; 3 phản hồi mới nhất. `ROLE_HOME_ROUTE.curriculum_designer` giữ nguyên.
- [x] P4-5: Chi tiết học sinh: thẻ Chuyên cần (có mặt/tổng buổi đã chốt), Số buổi vắng (có phép, đã học bù, chờ học bù với Nhân viên), Học phí đã đóng (hết hạn); tab `?tab=overview|schedule|tuition|absences`; dải điểm danh từng lớp (Có mặt/Vắng/Có phép/Học bù/Sắp tới, rê chuột xem ngày); buổi gần đây; lớp đang học (gộp các kỳ gia hạn, còn bao nhiêu tuần); phụ huynh. Nút _Đăng ký thêm lớp_, _Xử lý nghỉ / học bù_ (Nhân viên); menu ⋯: _Sửa hồ sơ_ (disable), _Xem tài khoản phụ huynh_ (Quản lý), _Ngừng học_ (Nhân viên).
- [x] P4-6: tab Giáo viên của Nhân sự thêm cột _Đã dạy T{tháng}_ và _Chờ điểm danh_ (đếm ở FE từ buổi trong tháng); Sheet giáo viên có chọn tháng `?personMonth=` và bảng buổi dạy. Xóa `teachers/components/teacher-detail-view.tsx`, `attendance/components/attendance-list-view.tsx`.
- [x] P4-7: chip "N chờ thu · tổng tiền", "N hoàn tất · tổng tiền" trên Đăng ký & biên lai, dùng chung hàm với P4-2 (`features/dashboard/staff-summary.ts`).
- [x] P4-8: `useMenuBadgeCounts` trong `AppShell`: Quản lý — email lỗi (mục Thông báo); Nhân viên — đơn chờ thu (Đăng ký & biên lai); Giáo viên — bài chưa chấm và buổi đã qua chưa chốt (30 ngày). Mỗi vai trò chỉ gọi API mình được phép.

**Thay đổi BE (repo `WDP301-BE-System`, đã push `dev` 19/10 theo đồng ý của chủ dự án):**

- `e20101f` BE-8 (phần chuyên cần): `GET academic/classes/:id/attendance-summary` cho thêm Quản lý và Nhân viên (mọi lớp; lớp không tồn tại → 404). Giáo viên vẫn chỉ lớp mình, Phụ huynh chỉ con mình. BFF mở thêm 2 vai trò này.
- `8e06c69` BE-12: `GET academic/email-deliveries` nhận `status`; `total` là số dòng sau lọc. FE dùng cho badge, _Cần chú ý_ và bộ lọc trạng thái của bảng Lịch sử email (`?emailStatus=`).
- `9580428` cập nhật `ACADEMIC_API_FLOW.md`.
- Kiểm tra BE: e2e `academic` 11/11 (thêm case Quản lý/Nhân viên đọc chuyên cần, 404, Thiết kế giáo trình 403; lọc email theo trạng thái, `status` sai → 400), unit 124/124, lint/tsc đạt.
- FE gọi 2 tham số/quyền mới này nên BE được push trước FE Phase 4. Môi trường chạy BE cũ hơn sẽ báo lỗi API (403/400) ở khối chuyên cần và đếm email lỗi, không hiện số sai.

Khác thiết kế / ghi chú:

- Không có thẻ/tab _Điểm_ ở chi tiết học sinh: Quản lý/Nhân viên chưa có API đọc điểm của một học sinh. Cột _Chuyên cần %_ ở bảng học sinh chưa thêm vì phải gọi chuyên cần từng lớp cho từng dòng. **Đã làm ở 10.5** (API điểm và số liệu trong `GET students`).
- _Sửa hồ sơ_ con vẫn disable: phần "API sửa hồ sơ" của BE-8 chưa làm. **Đã làm ở 10.5.**
- Cột _Dạy thay_ ở tab Giáo viên bỏ: BE không lưu cờ dạy thay cho buổi đã chốt. **Đã làm ở 10.5** (đọc lịch sử xếp dạy thay).
- Dashboard Thiết kế giáo trình chưa có "bài cần": vai trò này không đọc được lịch lớp (`GET classes` 403) và khóa chưa có số buổi/tuần (BE-1); hiện số bài đã soạn và số tuần hiệu lực.
- Học bù chờ xếp: `academic/makeup-sources` không trả tổng, dashboard chỉ đọc 100 dòng đầu và hiện "100+" khi đầy. **Đã sửa ở 10.5**: đọc hết, chỉ buổi vắng đã ghi nhận.
- Sửa thêm (Phase 2): hai bảng ở màn Thông báo gộp cột (người nhận, lần gửi, thời gian vào cột Email/Trạng thái; thời gian tạo vào cột Lớp) để cột Thao tác không bị khuất ở 1440px.

Nội dung các màn mới lấy theo artboard và [5.1](#51-dashboard). Chủ dự án đã cho làm theo tài liệu này. Chỗ nào số liệu không lấy được từ API thì bỏ khối đó và ghi lại, **không dựng số giả**.

**P4-1. Dashboard Quản lý**: artboard `QL-Dashboard`, `live-manager-dashboard.tsx`

- 4 thẻ số liệu một hàng; cột _Học phí theo tháng_ một trục (bỏ biểu đồ 2 trục y); _Học sinh theo khối_; _Lấp chỗ theo lớp_; _Cần chú ý_; _Hoạt động gần đây_ (5 dòng `directoryApi.auditLogs`).
- Nguồn: `dashboardApi.analytics`, `directoryApi.dashboard`, `registrationApi.classes`.
- Giữ bộ chọn khoảng ngày và nút xuất Excel.

**P4-2. Dashboard Nhân viên** (`/staff/dashboard`, màn mới): artboard `NV-Dashboard`

- Thêm `STAFF.DASHBOARD`, `ROUTE_AREAS` `{ prefix: "/staff/dashboard", area: AREA.DASHBOARD }`, mục đầu tiên trong `MENU_STAFF`.
- Nguồn: **không** dùng `academic/analytics` (nhân viên bị chặn).
  - Chờ thu và tổng tiền: `directoryApi.registrations({ status: "DRAFT" })` đọc hết các trang, cộng `quotedAmount`.
  - Thu hôm nay: `directoryApi.payments` với `fromDate`/`toDate` = hôm nay.
  - Buổi hôm nay: `academicApi.sessions`.
  - Chờ xếp học bù: `academic/makeup-sources` **không truyền `studentId`**. Thêm hàm mới trong `academicApi`, không đổi hàm cũ.
  - Chỗ trống: `registrationApi.classes`.
- Nút trên các khối dẫn tới màn sẵn có: _Thu phí_ → `/staff/payments?registrationId=`, _Xếp học bù_ → `ROUTES.STAFF.STUDENT_ACTION`.
- **Không đổi** `ROLE_HOME_ROUTE.staff`. Việc đổi trang chủ là câu hỏi mở cho chủ dự án.

**P4-3. Dashboard Giáo viên**: artboard `GV-Dashboard`, `live-teacher-dashboard.tsx`

- Thẻ _Buổi chưa điểm danh_ thay _Bản chấm chờ duyệt_; biểu đồ chuyên cần (`dashboardApi.analytics` hoặc `attendance-summary` của lớp mình); tiến độ giáo trình từng lớp; danh sách _Cần chấm_, _Chờ bạn thẩm định_.

**P4-4. Dashboard Thiết kế giáo trình** (`/manager/curriculum/overview`, màn mới): artboard `TK-Dashboard`

- Tiền tố `/manager/curriculum` đã thuộc `CATALOG`. Thêm `MANAGER.CURRICULUM_OVERVIEW` và mục menu chỉ vai trò này thấy.
- Nguồn: danh sách giáo trình (`curriculumApi`), phản hồi (`LiveCurriculumFeedback` API), `dashboardApi.analytics`.
- **Không đổi** `ROLE_HOME_ROUTE.curriculum_designer` (câu hỏi mở).

**P4-5. Chi tiết học sinh + cột chuyên cần**: artboard `QL-HocSinhChiTiet`, `student-detail-view.tsx`

- Thẻ số liệu, tab, dải điểm danh, buổi gần đây, lớp đang học, phụ huynh, điểm gần đây.
- Nút _Xử lý nghỉ / học bù_ (Nhân viên) dẫn `ROUTES.STAFF.STUDENT_ACTION`. _Sửa hồ sơ_ disable (BE-8).
- **Chuyên cần % cần BE-8**: `GET academic/classes/:id/attendance-summary` hiện chỉ cho Giáo viên và Phụ huynh.
  - Chưa có BE-8: ẩn thẻ chuyên cần và dải điểm danh, giữ các khối còn lại.
  - Có BE-8: thêm vai trò vào BFF rồi hiện số; thêm cột _Chuyên cần %_ vào bảng học sinh (P1) **chỉ khi** không phải gọi API riêng cho từng dòng.

**P4-6. Số buổi dạy của giáo viên**: artboard `QL-NhanSu` (tab Giáo viên)

- Đếm ở FE, không cần BE: buổi `academicApi.sessions({ fromDate, toDate })` của tháng có `status === "COMPLETED"`, nhóm theo `teacherId`. BE đặt `COMPLETED` khi chốt điểm danh, và đổi `teacherId` sang người dạy thay.
  - _Chờ điểm danh_ = buổi `SCHEDULED` đã qua giờ kết thúc.
  - _Dạy thay_ = buổi có thay giáo viên. Đọc từ audit log hoặc trường BE trả; không có thì bỏ cột.
- Thêm cột vào tab Giáo viên của Nhân sự (P2-3); Sheet giáo viên có bộ chọn tháng và bảng buổi dạy.
- Xóa `features/work-credits/`, `teachers/components/teacher-detail-view.tsx`, `attendance/components/attendance-list-view.tsx` sau khi `grep` xác nhận không còn chỗ nào import.

**P4-7. Chip tổng hợp ở Đăng ký & biên lai**

- `N chờ thu · tổng tiền`, `N hoàn tất · tổng tiền` trên `/staff/payments`. Dùng chung hàm tổng hợp với P4-2.

**P4-8. Badge số trên menu**: [5.8](#58-khung-ứng-dụng)

- `AppShell` / `Sidebar` đã có prop `badgeCounts` và `badgeKey`, nhưng **chưa layout nào truyền số**.
- Thêm một hook phía client trong `AppShell` lấy số theo vai trò rồi truyền xuống:
  - email lỗi (Quản lý);
  - đơn chờ thu (Nhân viên);
  - chưa chấm và buổi chưa điểm danh (Giáo viên).
- Chỉ gọi API vai trò đó được phép gọi (4.6).

_Câu hỏi mở Phase 4_:

- Đổi trang chủ sau đăng nhập của Nhân viên sang `/staff/dashboard` và của Thiết kế giáo trình sang `/manager/curriculum/overview`? Mặc định giữ như cũ. **Đã đổi ở 10.5.**
- Làm tiếp phần còn lại của BE-8 (API sửa hồ sơ con) và một API điểm của học sinh cho Quản lý/Nhân viên để có tab _Điểm & bài tập_? **Đã làm ở 10.5.**

### 10.5 Đợt sửa sau Phase 4 (code xong, đã test 19/10/2026 tối)

Chủ dự án yêu cầu sửa hết phần còn thiếu sau Phase 4, chỉ trong WDPFE và WDPBE (không đụng WDPFEM).

**Kết quả.** FE: `npm run lint` 0 lỗi (5 cảnh báo cũ), `npx tsc --noEmit`, `npx next build --webpack` đạt. BE: e2e `academic` 11/11, `registration-flow` 37/37, unit 124/124, lint/tsc đạt. Test trình duyệt (BE build mới, DB riêng `edugrade_ui_qa`, mail tắt, 1440px, 4 vai trò) đạt 17/17; không lỗi trang, không request lỗi, không trang nào tràn ngang và bảng Học sinh không khuất cột.

FE:

- Nút đóng mặc định của Dialog/Sheet hiện lại. `Button` cỡ icon chỉ vẽ `leftIcon` nên làm mất icon truyền qua children; giờ không có `leftIcon` thì vẽ children (chủ dự án cho sửa `components/ui/button.tsx`). Nhãn đọc màn hình đổi thành "Đóng".
- Trang chủ sau đăng nhập: Nhân viên vào `/staff/dashboard`, Thiết kế giáo trình vào `/manager/curriculum/overview`.
- Lịch dạy của Giáo viên có lại Tuần và Ngày, sau Danh sách (mặc định) và Kanban.
- Báo cáo: bảng có _Phạm vi_ (Toàn lớp hoặc tên học sinh) và _Khoảng ngày_. Báo cáo tạo trước khi BE lưu phạm vi hiện "—".
- Tab Học sinh: cột Học sinh (khối, ngày sinh) · Phụ huynh · _Lớp đang học_ · _Chuyên cần_ · _Nghỉ / học bù_ (_Chờ học bù N_, _Nghỉ dài hạn_) · Trạng thái · Xem / Xử lý. Lọc nhanh `?quick=pending-makeup|long-leave|no-class`, BE lọc trên toàn bộ danh sách.
  - Nút _Đăng ký học_ trên dòng học sinh bỏ để bảng không khuất cột ở 1440px. Vẫn có ở chi tiết học sinh (_Đăng ký thêm lớp_) và tab Phụ huynh.
- Tab Phụ huynh: cột _Hồ sơ con_ hiện tên các con; thêm cột _Đã đóng_.
- _Xóa_ phụ huynh: tài khoản chưa có hồ sơ con có nút _Xóa hẳn_. BE vẫn từ chối nếu đã có đăng ký hay hoạt động (`PARENT_IN_USE`, câu báo lỗi đề xuất khóa). Có hồ sơ con thì như cũ, chỉ khóa.
- Chi tiết học sinh:
  - thẻ _Điểm trung bình_ (bài đã công bố, quy về thang 10) và khối _Điểm gần đây_;
  - tab `?tab=grades` _Điểm & bài tập_: bài, lớp, hạn nộp, bài nộp, điểm;
  - _Sửa hồ sơ_ mở Dialog (họ tên, khối, ngày sinh). Ô Khối khóa khi còn ghi danh đang học hoặc sắp học, giống BE.
- Số chờ học bù (Dashboard Nhân viên, chi tiết học sinh) chỉ tính buổi vắng đã ghi nhận, không tính buổi tương lai. Dashboard bỏ giới hạn "100+" và có link _Xem theo học sinh_ mở lọc _Chờ học bù_.
- Nhân sự:
  - tab _Nhân viên & thiết kế giáo trình_ gộp hai API vào một bảng (cột Vai trò, lọc `?role=`). Dialog tạo tài khoản có chọn vai trò; sửa/khóa gọi đúng API theo vai trò của dòng.
  - tab Giáo viên thêm cột _Dạy thay T{tháng}_. Sheet giáo viên tách _buổi dạy thay_ và _buổi người khác dạy thay_, có nhãn trên từng buổi. Số liệu đọc từ lịch sử `SESSION_SUBSTITUTE_ASSIGNED`: giáo viên ghi ở lần xếp đầu tiên là người dạy gốc. Không cần thêm API BE.
- Chi tiết lớp: khối _Học sinh đang học_ có dòng phụ huynh; tab Học sinh có cột _Phụ huynh_. Chỉ Quản lý và Nhân viên nhận liên hệ phụ huynh.
- BFF mở thêm `PATCH students/:id` và `GET academic/students/:id/grades` (Quản lý, Nhân viên); `curriculum-designers` GET/POST/PATCH và `DELETE parents/:id` (Quản lý). Lịch sử thay đổi có nhãn cho `STUDENT_PROFILE_UPDATED`, `PARENT_ACCOUNT_DELETE`, `CURRICULUM_DESIGNER_ACCOUNT_CREATE/UPDATE`.

**Thay đổi BE** (repo `WDP301-BE-System`, đã push `dev` 19/10 theo đồng ý của chủ dự án, trước FE):

- `dec275f`: `GET academic/makeup-sources` nhận `completedOnly=true`.
- `c225be9`: `GET academic/reports` trả `from`, `to`, `scope`, `studentId`, `studentName`.
- `a413f8a`: `GET academic/students/:id/grades` cho Quản lý, Nhân viên.
- `a018a35`: BE-8 phần còn lại. `PATCH students/:id` (khóa đổi khối khi còn ghi danh, ghi audit). `GET students` thêm `currentClasses`, `attendancePercent`, `pendingMakeups`, `onLongLeave` và tham số `quick`.
- `5be6f74`: BE-10, `curriculum-designers` cho Quản lý.
- `f835cab`, `81567e0`: liên hệ phụ huynh trong danh sách lớp `GET classes/:id`; Giáo viên không nhận.
- `50d8dde`: BE-9. `GET parents` có danh sách con và `paidAmount`; `DELETE parents/:id`.
- `c4f8dd9`, `880e69f`: cập nhật `ACADEMIC_API_FLOW.md`.
- FE gọi các tham số và quyền mới này, nên phải push BE trước FE. Chạy với BE cũ thì các khối mới báo lỗi API (400/403/404), không hiện số sai.

Còn lại sau đợt này: BE-1 … BE-7, BE-11 (tùy chọn) và M-1 (app phụ huynh, ngoài phạm vi Web). Xem [mục 9](#9-việc-cần-be--mobile).

### 10.6 Chờ BE / Mobile

Bảng ở [mục 9](#9-việc-cần-be--mobile). Theo phase:

- Phase 3: chấm trên ảnh bằng bút vẽ (BE-7, M-1); chương/tài liệu (BE-4); file `.xlsx` (BE-5); sinh lịch nhiều lớp trong một yêu cầu (BE-6); số buổi/tuần (BE-1); một giáo trình hiệu lực mỗi khóa (BE-2, BE-3).
- Phase 2 và 4: sửa hồ sơ con (BE-8), xóa phụ huynh (BE-9), tài khoản Thiết kế giáo trình chung bảng (BE-10) và lọc email theo trạng thái (BE-12) **đã làm**.

### 10.7 Nghiệm thu mỗi phase

Tóm tắt; bản đầy đủ ở [0.6](#06-kiểm-tra-trước-khi-coi-là-xong).

- `npx eslint --fix <các file đã sửa>`, `npm run lint`, `npx tsc --noEmit`, `npx next build --webpack`.
- Test giao diện trên DB riêng, tắt gửi mail, không đụng DB thật. Harness `tests/` chỉ có trên máy chủ dự án (bị gitignore); bộ flow cũ trong đó đã hỏng từ bước F1, Phase 1 dùng script Playwright viết riêng theo màn mới.
- Mọi route cũ trong mục 4 vẫn mở được và chuyển đúng màn.
- Quyền: Nhân viên không thấy tab Phòng; Thiết kế giáo trình không thấy tab Môn học/Khóa học; **Quản lý không có nút tạo giáo trình**; Giáo viên chỉ thấy lớp của mình.
- Màn 1440px không tràn ngang; bảng rộng cuộn trong khung riêng; ở màn nhỏ form 2 phần xếp dọc.
- Xong phase thì cập nhật mục 10 này, commit rồi push `dev` (xem [0.7](#07-kết-thúc-một-phase)).

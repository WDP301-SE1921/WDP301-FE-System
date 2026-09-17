# EduGrade — UI Reference: Quản lý trung tâm (Manager)

> File này mô tả toàn bộ màn hình web dành cho role **Quản lý trung tâm**, dùng làm
> nguồn tham chiếu khi implement UI từ ảnh chụp Stitch. Khi prompt cho Claude Code,
> trỏ tới **Reference code** tương ứng (vd `PROMPT 3C`) để nó đọc đúng phần mô tả.
>
> Áp dụng chung: desktop 1440px, toàn bộ text tiếng Việt, dùng đúng design system và
> app shell đã định nghĩa ở `PROMPT 0`. Component thật phải lấy từ
> `src/components/shared/` và `src/components/ui/` theo `.claude/rules/implement-ui.md`,
> nội dung dưới đây chỉ mô tả bố cục/nội dung hiển thị, không phải code hay style gốc.

## Mục lục nhanh (Reference code → Route dự kiến)

| Reference code | Màn hình | Route dự kiến |
|---|---|---|
| PROMPT 0 | Design system & App shell | — |
| PROMPT 1 | Đăng nhập | `(auth)/login` |
| PROMPT 1B | Quên mật khẩu | `(auth)/forgot-password` |
| PROMPT 1C | Chấp nhận lời mời | `(auth)/accept-invite` |
| PROMPT 2 | Dashboard | `(manager)/dashboard` |
| PROMPT 3 | Danh sách học sinh | `(manager)/students` |
| PROMPT 3B | Chi tiết học sinh — Tổng quan | `(manager)/students/[id]` |
| PROMPT 3C | Chi tiết học sinh — Điểm danh | `(manager)/students/[id]?tab=attendance` |
| PROMPT 3D | Chi tiết học sinh — Lịch sử | `(manager)/students/[id]?tab=history` |
| PROMPT 4 | Danh sách phụ huynh | `(manager)/parents` |
| PROMPT 4B | Chi tiết phụ huynh | `(manager)/parents/[id]` |
| PROMPT 5 | Đăng ký học — Bước 1: Loại | `(manager)/enrollments/new` |
| PROMPT 5B | Đăng ký học — Bước 2: Thông tin | `(manager)/enrollments/new` |
| PROMPT 5C | Đăng ký học — Bước 3: Môn & lớp | `(manager)/enrollments/new` |
| PROMPT 5D | Đăng ký học — Bước 4: Học phí & thanh toán | `(manager)/enrollments/new` |
| PROMPT 5E | Đăng ký học — Bước 5: Hoàn tất | `(manager)/enrollments/new` |
| PROMPT 6 | Link / mã liên kết | `(manager)/link-codes` |
| PROMPT 7 | Lịch sử thanh toán | `(manager)/payments` |
| PROMPT 7B | Biên lai (modal) | modal trên `(manager)/payments` |
| PROMPT 8 | Danh sách lớp | `(manager)/classes` |
| PROMPT 8B | Tạo lớp | `(manager)/classes/new` |
| PROMPT 8C | Chi tiết lớp | `(manager)/classes/[id]` |
| PROMPT 9 | Lịch học tổng | `(manager)/schedule` |
| PROMPT 9B | Lịch học tổng — theo phòng + drawer | `(manager)/schedule?groupBy=room` |
| PROMPT 9C | Buổi học | `(manager)/sessions` |
| PROMPT 10 | Báo nghỉ & xếp học bù | `(manager)/absences/makeup` |
| PROMPT 10B | Học bù — không có buổi phù hợp | `(manager)/absences/makeup` |
| PROMPT 10C | Đổi 1 buổi cụ thể | `(manager)/absences/swap` |
| PROMPT 10D | Đổi lịch cố định | `(manager)/absences/change-class` |
| PROMPT 10E | Nghỉ dài hạn | `(manager)/absences/long-leave` |
| PROMPT 10F | Nghỉ môn / Nghỉ hẳn / Cho học lại | `(manager)/absences/withdraw` |
| PROMPT 11 | Danh sách giáo viên | `(manager)/teachers` |
| PROMPT 11B | Chi tiết giáo viên | `(manager)/teachers/[id]` |
| PROMPT 11C | Lời mời & duyệt giáo viên | `(manager)/teachers/invitations` |
| PROMPT 11D | Xếp giáo viên dạy thay | `(manager)/teachers/substitutes` |
| PROMPT 11E | Đổi giáo viên phụ trách (modal) | modal trên `(manager)/classes/[id]` |
| PROMPT 12 | Danh mục đào tạo | `(manager)/catalog` |
| PROMPT 12B | Chi tiết chương trình & bài học | `(manager)/catalog/programs/[id]` |
| PROMPT 12C | Modal thêm/sửa chương trình | modal trên `(manager)/catalog` |
| PROMPT 13 | Lịch sử email | `(manager)/notifications/emails` |
| PROMPT 13B | Gửi thông báo | `(manager)/notifications/send` |
| PROMPT 14 | Quản lý viên | `(manager)/system/managers` |
| PROMPT 14B | Lịch sử thay đổi | `(manager)/system/audit-logs` |
| PROMPT 15 | Tài khoản cá nhân | `(manager)/profile` |
| PROMPT 16 | Trạng thái chung (component states) | `/dev/components` |
| PROMPT 16B | Trang lỗi 403/404/500 | `app/not-found.tsx`, `app/error.tsx` |
| PROMPT 16C | Hết phiên đăng nhập | overlay toàn cục |

---

## PROMPT 0 — Design system & App shell

Thiết kế giao diện web desktop (1440px) cho hệ thống quản lý trung tâm dạy thêm tên "EduGrade", dành cho người Quản lý trung tâm. Toàn bộ text tiếng Việt.

Phong cách: hiện đại, sạch, chuyên nghiệp, thân thiện giáo dục, nhiều khoảng trắng, bo góc 8–12px, shadow nhẹ, không dùng gradient đậm.

Màu:
- Primary: xanh dương (#2563EB)
- Nền trang: xám rất nhạt (#F8FAFC), card nền trắng, viền xám nhạt (#E2E8F0)
- Success xanh lá, Danger đỏ, Warning cam, Info xanh dương nhạt, Neutral xám
- Màu theo môn: Toán xanh dương, Lý tím, Hóa cam, Sinh xanh lá

Font: Inter hoặc Be Vietnam Pro. Tiêu đề trang 24px semibold, text thường 14px.

App shell:
- Sidebar trái rộng 260px, nền trắng, có thể thu gọn thành icon.
  - Trên cùng: logo EduGrade + tên trung tâm.
  - Menu chia nhóm, tiêu đề nhóm chữ nhỏ in hoa màu xám:
    - TỔNG QUAN: Dashboard
    - HỌC SINH & PHỤ HUYNH: Học sinh, Phụ huynh, Đăng ký học, Link / mã liên kết (badge số cam "3")
    - THANH TOÁN: Lịch sử thanh toán
    - LỚP HỌC & LỊCH: Lớp học, Lịch học tổng, Buổi học
    - NGHỈ HỌC & HỌC BÙ: Học bù, Đổi buổi, Đổi lịch cố định, Nghỉ dài hạn, Nghỉ môn / Nghỉ hẳn
    - GIÁO VIÊN: Danh sách giáo viên, Lời mời & duyệt, Dạy thay
    - DANH MỤC ĐÀO TẠO: Danh mục
    - THÔNG BÁO: Lịch sử email (badge đỏ "2"), Gửi thông báo
    - HỆ THỐNG: Quản lý viên, Lịch sử thay đổi
  - Menu đang chọn: nền xanh nhạt, chữ và icon xanh primary, thanh dọc bên trái.
  - Dưới cùng: nút thu gọn sidebar.
- Header trên cùng cao 64px, nền trắng, viền dưới:
  - Ô tìm kiếm toàn cục "Tìm học sinh, phụ huynh, lớp... (Ctrl+K)"
  - Nút primary "+ Tạo nhanh" (dropdown: Đăng ký học, Tạo lớp, Báo nghỉ, Mời giáo viên)
  - Icon chuông có chấm đỏ
  - Avatar + tên "Nguyễn Thị Lan" + chữ nhỏ "Quản lý"
- Vùng nội dung: breadcrumb nhỏ màu xám, dưới là tiêu đề trang + mô tả ngắn bên trái, nút hành động bên phải, rồi tới nội dung.

Hiển thị app shell với trang Dashboard trống để làm khung.

---

## PROMPT 1 — Đăng nhập

Màn hình đăng nhập EduGrade, không có sidebar/header.
- Chia 2 cột: trái 50% là ảnh minh họa giáo dục nền xanh primary nhạt, logo EduGrade, câu "Quản lý trung tâm dạy thêm dễ dàng hơn".
- Phải: card form căn giữa, tiêu đề "Đăng nhập", mô tả "Dành cho Quản lý và Giáo viên".
- Field: Email, Mật khẩu (icon con mắt ẩn/hiện), checkbox "Ghi nhớ đăng nhập", link "Quên mật khẩu?" bên phải.
- Nút primary full width "Đăng nhập".
- Hiển thị 1 alert đỏ phía trên form: "Email hoặc mật khẩu không đúng".

## PROMPT 1B — Quên mật khẩu

Cùng layout 2 cột như Đăng nhập. Card form: tiêu đề "Quên mật khẩu", mô tả "Nhập email để nhận link đặt lại mật khẩu", field Email, nút "Gửi link", link "Quay lại đăng nhập". Thêm trạng thái thành công: icon email xanh lá, "Đã gửi email đặt lại mật khẩu tới lan@edugrade.vn".

## PROMPT 1C — Chấp nhận lời mời

Cùng layout 2 cột. Card: tiêu đề "Kích hoạt tài khoản", dòng "Bạn được mời tham gia EduGrade với vai trò Quản lý". Field: Email (disabled, đã điền sẵn), Họ tên, Mật khẩu, Xác nhận mật khẩu, gợi ý "Tối thiểu 8 ký tự". Nút "Kích hoạt tài khoản".

---

## PROMPT 2 — Dashboard

Dùng đúng design system và app shell EduGrade. Menu đang chọn: Dashboard.
Page header: "Dashboard", mô tả "Tổng quan hoạt động hôm nay, Thứ 3, 15/09/2026".

Hàng 1 — 4 KPI card ngang nhau (icon tròn màu nhạt, số lớn, dòng so sánh nhỏ):
- Học sinh đang học: 248 (+12 tháng này, xanh lá)
- Lớp đang mở: 32
- Thanh toán hôm nay: 6 giao dịch
- Tỷ lệ đi học tuần: 94,2% (-0,8%, đỏ)

Hàng 2 — 2 cột (2/3 và 1/3):
- Trái: card "Buổi học hôm nay" dạng bảng: Giờ | Lớp | Bài học | Giáo viên | Phòng | Điểm danh.
  Dữ liệu: 15:00–16:30 Toán 8A | Bài 5: Hằng đẳng thức | Trần Văn Minh | P.101 | badge xanh "Đã điểm danh";
  17:00–18:30 Hóa 9B | Bài 3: Axit | Lê Thu Hà | P.203 | badge cam "Chưa điểm danh";
  18:45–20:15 Lý 7A | Bài 8: Ánh sáng | badge đỏ "Chưa có giáo viên"...
  Link "Xem lịch học tổng" cuối card.
- Phải: card "Việc cần xử lý" dạng danh sách, mỗi dòng có icon màu + text + số + mũi tên:
  Link/mã sắp hết hạn (3, cam), Email gửi thất bại (2, đỏ), Học sinh sắp hết gói học phí (8, cam), Buổi chưa có giáo viên (1, đỏ), Nghỉ dài hạn sắp kết thúc (2, xanh).

Hàng 3 — 2 cột:
- Trái: card "Thanh toán gần đây": 5 dòng gồm tên con, môn/lớp, số tháng, số tiền (1.500.000 ₫), thời gian tương đối.
- Phải: card "Tỷ lệ đi học 7 ngày qua": biểu đồ cột T2 → CN.

---

## PROMPT 3 — Danh sách học sinh

App shell EduGrade, menu: Học sinh.
Page header: "Học sinh", mô tả "Quản lý hồ sơ học sinh theo tài khoản phụ huynh". Nút phải: "Xuất Excel" (outline), "+ Đăng ký học" (primary).

Tabs trạng thái có số: Tất cả (260) | Đang học (248) | Tạm nghỉ (7) | Đã nghỉ (5).

Filter bar: ô tìm "Tìm tên học sinh, email phụ huynh...", select Môn, select Khối, select Lớp, nút "Xóa bộ lọc".

Bảng: checkbox | Học sinh (avatar chữ cái + tên + "Khối 8") | Phụ huynh (email + SĐT nhỏ) | Môn đang học (tag màu theo môn: Toán, Hóa) | Tỷ lệ đi học (thanh progress + 92%) | Gói học phí (ngày hết hạn, đỏ nếu còn <7 ngày) | Trạng thái (badge) | nút ⋮.
Dropdown ⋮ mở ở 1 dòng: Xem chi tiết, Đăng ký thêm môn, Báo nghỉ buổi, Nghỉ dài hạn, Nghỉ môn / Nghỉ hẳn.
8 dòng dữ liệu tên Việt Nam thực tế, badge: Đang học (xanh lá), Tạm nghỉ (xám), Chờ liên kết (cam).
Phân trang cuối bảng: "Hiển thị 1–10 trên 260", chọn số dòng/trang, số trang.

## PROMPT 3B — Chi tiết học sinh

App shell EduGrade, menu: Học sinh. Breadcrumb: Học sinh / Nguyễn Minh Khang.

Header card:
- Avatar lớn + "Nguyễn Minh Khang", badge "Đang học", dòng "Khối 8 · Mã HS-00124".
- Thông tin phụ huynh: email phuhuynh.khang@gmail.com (link), SĐT 0912 345 678.
- Nút phải: "Đăng ký thêm môn" (primary), "Nghỉ dài hạn" (outline), menu ⋮ (Nghỉ môn, Nghỉ hẳn màu đỏ).
- 3 chỉ số nhỏ: Môn đang học 2 | Tỷ lệ đi học 92% | Gói học phí gần nhất hết hạn 30/10/2026.

Tabs: Tổng quan | Lịch học | Điểm danh | Thanh toán | Lịch sử.

Nội dung tab Tổng quan: danh sách card Enrollment, mỗi card:
- Tag môn "Toán", tên lớp "Toán 8A", chương trình "Toán 8 cơ bản", lịch "T2 - T4 - T6 · 15:00–16:30", giáo viên, phòng.
- Thanh tiến độ chương trình "Bài 12/36".
- Gói: "3 tháng · 01/08/2026 – 30/10/2026", badge "Đang học".
- Nút nhỏ: Học bù, Đổi lịch, Nghỉ môn.

## PROMPT 3C — Chi tiết học sinh, tab Điểm danh

Giống 3B nhưng tab "Điểm danh" đang chọn.
- Select môn phía trên + 4 thẻ đếm nhỏ: Có mặt 22 (xanh lá), Vắng 1 (đỏ), Đã học bù 2 (xanh dương), Nghỉ có phép 3 (xám). Tỷ lệ: 96%.
- Bảng: Ngày | Lớp | Bài học | Trạng thái (badge) | Ghi chú (vd "Học bù tại Toán 8B – 12/09").

## PROMPT 3D — Chi tiết học sinh, tab Lịch sử

Tab "Lịch sử" dạng timeline dọc: chấm tròn màu + thời gian + người thực hiện + mô tả.
Ví dụ: "Xác nhận thanh toán Hóa 9B – 3 tháng" · "Xếp học bù buổi 10/09 sang Toán 8B 12/09" · "Đổi lịch cố định từ Toán 8A sang Toán 8C" · "Nghỉ dài hạn 01/07 – 15/07".

---

## PROMPT 4 — Danh sách phụ huynh

App shell, menu: Phụ huynh. Page header "Phụ huynh", mô tả "Mỗi tài khoản phụ huynh quản lý một hoặc nhiều hồ sơ con".
Filter: tìm email / SĐT, select Trạng thái tài khoản.
Bảng: Email | SĐT | Số con (kèm avatar group tên con) | Trạng thái tài khoản (badge: Đã kích hoạt xanh lá / Chờ liên kết cam) | Ngày tạo | ⋮.

## PROMPT 4B — Chi tiết phụ huynh

Breadcrumb: Phụ huynh / phuhuynh.khang@gmail.com.
- Card thông tin: email, SĐT, trạng thái tài khoản, ngày kích hoạt. Nút "+ Thêm con".
- Section "Hồ sơ con": lưới card, mỗi card có avatar, tên con, khối, tag các môn, badge trạng thái, link "Xem hồ sơ". 2 card: Nguyễn Minh Khang (Khối 8), Nguyễn Bảo Ngọc (Khối 6).
- Section "Link / mã liên kết": bảng nhỏ mã, tên con, môn/lớp, hết hạn, trạng thái, nút Gửi lại.
- Section "Email đã gửi gần đây": danh sách 5 dòng với badge Đã gửi / Thất bại.

---

## PROMPT 5 — Đăng ký học, bước 1: chọn loại

App shell, menu: Đăng ký học. Page header "Đăng ký học".
Stepper ngang 5 bước: 1 Loại đăng ký · 2 Thông tin · 3 Môn & lớp · 4 Học phí & thanh toán · 5 Hoàn tất. Bước 1 đang active.

Bố cục 2 cột: trái (2/3) nội dung, phải (1/3) card "Tóm tắt đăng ký" sticky (lúc này đa phần trống, hiển thị "Chưa có thông tin").
Nội dung trái: 3 card lựa chọn lớn dạng radio, có icon, tiêu đề, mô tả:
- "Con đầu tiên" — Phụ huynh chưa có tài khoản trên hệ thống (đang chọn, viền xanh primary)
- "Thêm con cho phụ huynh đã có" — Phụ huynh đã có tài khoản, đăng ký cho con mới
- "Đăng ký thêm môn cho con cũ" — Học sinh đã có hồ sơ
Footer: nút "Hủy" (ghost), "Tiếp tục" (primary).

## PROMPT 5B — Đăng ký học, bước 2: thông tin

Giống layout 5, stepper ở bước 2.
Card form "Thông tin học sinh": Họ tên con, Khối (select 6/7/8/9).
Card form "Thông tin phụ huynh": Email phụ huynh (có gợi ý nhỏ "Email này dùng để đăng nhập và nhận thông báo"), SĐT (gợi ý "Chỉ dùng để liên hệ").
Hiển thị alert cam dưới ô email: "Email này đã có tài khoản phụ huynh. Chuyển sang \"Thêm con cho phụ huynh đã có\"" kèm nút nhỏ "Chuyển".
Card tóm tắt bên phải đã có tên con và email.

## PROMPT 5C — Đăng ký học, bước 3: chọn môn & lớp

Stepper bước 3.
- Hàng chọn môn dạng segmented/tag: Toán | Lý | Hóa | Sinh (Toán đang chọn).
- Danh sách lớp phù hợp Khối 8 dạng card list, mỗi card: tên lớp "Toán 8A", chương trình, lịch "T2 - T4 - T6 · 15:00–16:30", giáo viên, phòng, sĩ số dạng progress "18/20", nút radio chọn.
- 1 card lớp "Toán 8B" hiển thị mờ, badge đỏ "Đã đủ sĩ số", không chọn được.
- Card đang chọn viền primary.
Tóm tắt bên phải cập nhật môn + lớp + lịch.

## PROMPT 5D — Đăng ký học, bước 4: học phí & thanh toán

Stepper bước 4.
- Card "Số tháng": number stepper (- 3 +), gợi ý "Từ 1 đến 12 tháng", các chip nhanh 1 / 3 / 6 / 12 tháng.
- Card "Học phí": bảng nhỏ: Học phí/tháng 500.000 ₫ · Số tháng 3 · Thời gian 01/10/2026 – 31/12/2026 · Tổng cộng 1.500.000 ₫ (to, đậm, primary).
- Card "Xác nhận thanh toán" nền vàng nhạt: checkbox "Tôi đã nhận đủ 1.500.000 ₫ từ phụ huynh", ghi chú nhỏ "Không phân biệt tiền mặt hay chuyển khoản. Thao tác không thể hoàn tác".
- Nút primary lớn "Xác nhận thanh toán" (disabled cho tới khi tick checkbox).
Tóm tắt bên phải đầy đủ.

## PROMPT 5E — Đăng ký học, bước 5: hoàn tất

Stepper bước 5 hoàn tất (tất cả tick xanh).
- Khối trên cùng: icon check tròn xanh lá lớn, "Đăng ký thành công", mô tả "Đã tạo thanh toán và đăng ký học cho Nguyễn Minh Khang".
- 3 card ngang:
  1. "Biên lai" — mã BL-20260915-0012, số tiền, nút "Xem biên lai", "In".
  2. "Link / mã liên kết" — mã lớn dạng monospace "K7Q2M9XA", link rút gọn, nút copy, dòng "Hết hạn sau 7 ngày (22/09/2026)".
  3. "Email thông báo" — badge "Đã gửi" xanh lá, tới phuhuynh.khang@gmail.com, nút "Gửi lại".
- Nút cuối: "Xem hồ sơ học sinh" (outline), "Đăng ký học mới" (primary).
Thêm biến thể: card Email hiển thị badge đỏ "Gửi thất bại" + nút "Gửi lại" primary, và alert cam trên cùng "Đã xác nhận thanh toán nhưng gửi email thất bại".

---

## PROMPT 6 — Link / mã liên kết

App shell, menu: Link / mã liên kết. Page header "Link / mã liên kết", mô tả "Phụ huynh dùng link/mã để tạo tài khoản hoặc liên kết hồ sơ con. Mỗi mã dùng 1 lần, hết hạn sau 7 ngày".
Tabs: Chưa dùng (12) | Đã dùng (340) | Hết hạn (5).
Filter: tìm mã / tên con / email, date range ngày tạo.
Bảng: Mã (monospace + nút copy) | Học sinh | Email phụ huynh | Môn / lớp | Ngày tạo | Hết hạn (badge đếm ngược "Còn 2 ngày" cam, "Còn 6 ngày" xám) | Trạng thái | Hành động (Gửi lại email, Tạo mã mới).

---

## PROMPT 7 — Lịch sử thanh toán

App shell, menu: Lịch sử thanh toán. Page header "Lịch sử thanh toán", nút "Xuất Excel".
- 3 thẻ tổng: Hôm nay 6 giao dịch · 9.000.000 ₫ | Tháng này 84 giao dịch · 126.500.000 ₫ | Tổng số tháng đã bán tháng này 210.
- Filter: date range, select Môn, select Người xác nhận, tìm tên học sinh.
- Bảng: Mã giao dịch | Học sinh | Phụ huynh | Môn / lớp | Số tháng | Số tiền (căn phải, đậm) | Người xác nhận | Thời gian | nút "Biên lai".

## PROMPT 7B — Biên lai (modal)

Modal cỡ vừa trên nền trang Lịch sử thanh toán mờ.
Nội dung giống tờ biên lai giấy, nền trắng:
- Trên: logo + tên trung tâm, địa chỉ, SĐT. Bên phải: "BIÊN LAI THU HỌC PHÍ", mã BL-20260915-0012, ngày 15/09/2026.
- Thông tin: Học sinh, Phụ huynh (email), Môn, Lớp, Lịch học, Thời gian học.
- Bảng: Nội dung | Số tháng | Đơn giá | Thành tiền; dòng tổng cộng đậm; "Bằng chữ: Một triệu năm trăm nghìn đồng".
- Dưới: "Người xác nhận: Nguyễn Thị Lan" + thời gian.
Footer modal: nút "Đóng", "In biên lai" (primary, icon máy in).

---

## PROMPT 8 — Danh sách lớp

App shell, menu: Lớp học. Page header "Lớp học", nút "+ Tạo lớp".
Filter: tìm tên lớp, select Môn, Khối, Chương trình, Giáo viên, select Trạng thái (Đang mở / Đã kết thúc).
Bảng: Tên lớp | Môn (tag màu) | Khối | Chương trình | Lịch cố định ("T2-T4-T6 · 15:00–16:30") | Giáo viên (avatar + tên) | Phòng | Sĩ số (progress "18/20", đỏ khi đầy) | Tiến độ ("Bài 12/36") | ⋮.

## PROMPT 8B — Tạo lớp

App shell, menu: Lớp học. Breadcrumb: Lớp học / Tạo lớp. Page header "Tạo lớp".
Bố cục: trái form (2/3), phải card "Xem trước buổi học" (1/3).

Form chia section card:
1. "Thông tin lớp": Tên lớp, Môn (select), Khối (select), Chương trình (select, lọc theo môn + khối, hiện "36 bài học"), Sĩ số tối đa.
2. "Lịch cố định": chọn thứ dạng toggle chip T2 T3 T4 T5 T6 T7 CN (T2, T4, T6 đang chọn), Giờ bắt đầu, Giờ kết thúc, Ngày bắt đầu.
3. "Phân công": Giáo viên (select có avatar), Phòng học (select có sức chứa). Alert đỏ inline: "Phòng P.101 đã có lớp Hóa 9B vào T4 15:00–16:30".

Card phải: "Sẽ sinh 36 buổi học · 05/10/2026 – 25/01/2027", danh sách cuộn: "Buổi 1 · T2 05/10 · Bài 1: Nhân đơn thức với đa thức", "Buổi 2 · T4 07/10 · Bài 2: ..."
Footer sticky: "Hủy", "Tạo lớp & sinh buổi học" (primary).

## PROMPT 8C — Chi tiết lớp

Breadcrumb: Lớp học / Toán 8A.
Header card: tên "Toán 8A", tag Toán, Khối 8, chương trình, lịch cố định, giáo viên, phòng, sĩ số 18/20, tiến độ Bài 12/36. Nút: "Đổi giáo viên", "Sửa lớp", ⋮.
Tabs: Học sinh | Buổi học | Giáo viên | Lịch sử.
Tab Buổi học đang chọn: bảng Buổi | Ngày | Bài học | Giáo viên (badge tím nhỏ "Dạy thay" nếu có) | Trạng thái (Đã điểm danh / Chưa điểm danh / Sắp diễn ra) | Học bù đến (số "+2") | nút xem. Dòng buổi hôm nay được highlight.

---

## PROMPT 9 — Lịch học tổng

App shell, menu: Lịch học tổng. Page header "Lịch học tổng".
Toolbar: nút "Hôm nay", mũi tên trước/sau, text "14/09 – 20/09/2026", segmented Ngày | Tuần | Tháng (Tuần đang chọn), segmented "Xem theo: Thời gian | Phòng", select Giáo viên, select Môn.
Calendar tuần: cột T2 → CN, hàng giờ 7:00 → 21:00. Các block buổi học bo góc, màu theo môn, trong block: tên lớp, bài học, giáo viên, phòng, sĩ số. 1 block viền đỏ "Chưa có giáo viên".
Chú thích màu môn ở góc.

> Lưu ý implement: phạm vi thực tế của `schedule-calendar` chỉ hỗ trợ view **Ngày | Tuần**
> và xem theo **Thời gian | Phòng** (không làm view Tháng). Nếu Stitch vẽ có "Tháng",
> bỏ qua khi code, chỉ giữ Ngày/Tuần.

## PROMPT 9B — Lịch học tổng, xem theo phòng + drawer

Chế độ "Ngày" + "Xem theo Phòng": cột là P.101, P.102, P.201, P.202, P.203; hàng là giờ. Block buổi học trong từng cột.
Drawer phải mở (rộng 440px) "Chi tiết buổi học":
- Toán 8A · Buổi 12 · T3 15/09/2026 · 15:00–16:30 · P.101
- Bài học: Bài 12: Phân tích đa thức thành nhân tử
- Giáo viên: Trần Văn Minh, nút "Xếp dạy thay"
- Danh sách học sinh (18) với badge điểm danh; nhóm riêng "Học bù đến (2)"
- Nút cuối: "Mở lớp"

## PROMPT 9C — Buổi học

App shell, menu: Buổi học. Page header "Buổi học".
Tabs: Hôm nay | Sắp diễn ra | Chưa điểm danh (badge đỏ 3) | Đã diễn ra.
Filter: date range, lớp, giáo viên, môn.
Bảng: Ngày giờ | Lớp | Bài học | Giáo viên | Phòng | Sĩ số (có mặt/tổng) | Trạng thái | nút xem (mở drawer như 9B).

---

## PROMPT 10 — Báo nghỉ & xếp học bù

App shell, menu: Học bù. Page header "Báo nghỉ & xếp học bù".
Bố cục 2 cột:

Cột trái (40%) — card "1. Chọn buổi nghỉ":
- Ô tìm học sinh (combobox), đã chọn "Nguyễn Minh Khang – Khối 8" dạng chip.
- Select môn/lớp: "Toán 8A".
- Danh sách buổi sắp tới/gần đây dạng radio: "T6 18/09 · Bài 13: ..." (đang chọn), mỗi dòng có badge trạng thái.
- Checkbox "Đánh dấu Vắng cho buổi này", ô Ghi chú lý do.

Cột phải (60%) — card "2. Chọn buổi học bù":
- Dòng điều kiện dạng chip xám: Cùng chương trình · Cùng Bài 13 · Chưa diễn ra · Còn chỗ.
- Bảng buổi thay thế: Ngày giờ | Lớp | Giáo viên | Phòng | Chỗ trống ("2 chỗ") | nút radio chọn. 3 dòng, 1 dòng đang chọn highlight.
- Footer card: nút primary "Xác nhận xếp học bù", ghi chú "Phụ huynh sẽ nhận email thông báo".

Dưới cùng full width: card "Lịch học bù đang chờ" bảng: Học sinh | Buổi gốc | Buổi học bù | Người xếp | Trạng thái (Chờ học bù / Đã học bù / Không đi) | ⋮.

## PROMPT 10B — Học bù không có buổi phù hợp

Giống 10 nhưng cột phải hiển thị empty state: icon lịch xám, "Không có buổi phù hợp để học bù", mô tả "Không có buổi cùng bài học, chưa diễn ra và còn chỗ", nút outline "Chỉ đánh dấu Vắng".

## PROMPT 10C — Đổi 1 buổi cụ thể

Layout giống 10, page header "Đổi 1 buổi", có alert xanh info trên cùng: "Chỉ đổi buổi được chọn. Lịch cố định của học sinh không thay đổi".
Cột trái chỉ hiện các buổi chưa diễn ra, không có checkbox đánh dấu Vắng.
Nút "Xác nhận đổi buổi".

## PROMPT 10D — Đổi lịch cố định (chuyển lớp)

App shell, menu: Đổi lịch cố định. Page header "Đổi lịch cố định".
- Card trên: chọn học sinh + chọn Enrollment "Toán 8A".
- 2 cột so sánh:
  - Trái card "Lớp hiện tại": Toán 8A, lịch T2-T4-T6 15:00–16:30, GV, phòng, tiến độ Bài 12/36.
  - Giữa: mũi tên lớn.
  - Phải: danh sách card "Lớp có thể chuyển" (cùng chương trình, lịch khác, còn chỗ): Toán 8C T3-T5-T7 17:00–18:30 · 16/20 · Bài 11/36; Toán 8D ... ; card đang chọn viền primary. Cảnh báo cam nhỏ nếu tiến độ lớp mới chậm/nhanh hơn: "Lớp mới đang ở Bài 11, chênh 1 bài".
- Card dưới: Ngày áp dụng (date picker), Lý do (textarea).
- Nút primary "Xác nhận chuyển lớp".
- Dialog confirm (hiện chồng lên): "Đổi lịch cố định", "Từ 21/09/2026, Nguyễn Minh Khang sẽ học Toán 8C (T3-T5-T7 17:00–18:30)".

## PROMPT 10E — Nghỉ dài hạn

App shell, menu: Nghỉ dài hạn. Page header "Nghỉ dài hạn", nút "+ Tạo nghỉ dài hạn".
Tabs: Đang nghỉ (4) | Sắp tới (2) | Đã kết thúc (18).
Bảng: Học sinh | Môn áp dụng (tag, hoặc "Tất cả môn") | Từ ngày | Đến ngày | Số buổi nghỉ có phép | Lý do | Trạng thái | ⋮.

Modal "Tạo nghỉ dài hạn" mở chồng:
- Chọn học sinh, radio "Tất cả môn" / "Chọn môn" (checkbox Toán 8A, Hóa 9B).
- Date range Từ ngày – Đến ngày.
- Lý do.
- Box xám preview: "6 buổi sẽ chuyển thành Nghỉ có phép" + danh sách ngày rút gọn.
- Nút "Hủy", "Xác nhận".

## PROMPT 10F — Nghỉ môn / Nghỉ hẳn / Cho học lại

App shell, menu: Nghỉ môn / Nghỉ hẳn. Page header "Nghỉ môn / Nghỉ hẳn".
Tabs: Nghỉ 1 môn | Nghỉ hẳn | Cho học lại.

Tab Nghỉ hẳn đang chọn:
- Chọn học sinh "Nguyễn Minh Khang".
- Card "Các môn sẽ kết thúc": list Toán 8A, Hóa 9B với lịch và ngày hết gói.
- Alert xanh info: "Tài khoản phụ huynh và hồ sơ các con khác không bị ảnh hưởng".
- Ngày kết thúc, Lý do.
- Nút đỏ "Cho nghỉ hẳn".
- Dialog confirm danger chồng lên: icon cảnh báo đỏ, tiêu đề "Cho nghỉ hẳn", mô tả hậu quả, ô nhập "Gõ tên học sinh để xác nhận", nút đỏ "Xác nhận nghỉ hẳn".

Biến thể tab Cho học lại: bảng học sinh đã nghỉ (tên, môn đã học, ngày nghỉ, lý do) + nút "Đăng ký lại" từng dòng.

---

## PROMPT 11 — Danh sách giáo viên

App shell, menu: Danh sách giáo viên. Page header "Giáo viên", nút "+ Mời giáo viên".
Tabs: Đang hoạt động (14) | Ngưng (2).
Filter: tìm tên/email, select Môn dạy.
Bảng: Giáo viên (avatar + tên + email) | Môn dạy (tag) | Số lớp phụ trách | Số buổi tuần này | Trạng thái | ⋮ (Xem chi tiết, Ngưng hoạt động).

## PROMPT 11B — Chi tiết giáo viên

Breadcrumb: Giáo viên / Trần Văn Minh.
Header: avatar, tên, email, SĐT, tag môn Toán, badge "Hoạt động", 3 chỉ số: 4 lớp · 12 buổi/tuần · 2 lần dạy thay tháng này.
Tabs: Lớp phụ trách | Lịch dạy | Dạy thay | Lịch sử.
Tab Lịch dạy: calendar tuần mini với các block lớp.

## PROMPT 11C — Lời mời & duyệt giáo viên

App shell, menu: Lời mời & duyệt. Page header "Lời mời & duyệt giáo viên", nút "+ Mời giáo viên".
Tabs: Chờ duyệt (3) | Lời mời đã gửi (5).
Tab Chờ duyệt: danh sách card: avatar, tên, email, môn đăng ký, ngày kích hoạt, nút "Từ chối" (outline đỏ), "Duyệt" (primary).
Modal "Mời giáo viên" chồng lên: Email, Họ tên, Môn dạy (multi select tag), nút "Gửi lời mời".

## PROMPT 11D — Xếp giáo viên dạy thay

App shell, menu: Dạy thay. Page header "Xếp giáo viên dạy thay".
Bố cục 2 cột:
- Trái: card "Chọn buổi học": tabs "Cần dạy thay (1)" | "Tất cả buổi"; list buổi: Lý 7A · T3 15/09 18:45 · badge đỏ "Chưa có giáo viên"; buổi đang chọn highlight.
- Phải: card "Giáo viên rảnh & cùng môn": list GV với avatar, tên, số buổi hôm nay, badge "Rảnh" xanh lá, nút chọn; 1 GV mờ badge "Trùng lịch". Ô Lý do. Nút "Xác nhận dạy thay".
Dưới: bảng "Lịch sử dạy thay": Buổi | GV chính | GV dạy thay | Lý do | Người xếp | Thời gian.

## PROMPT 11E — Đổi giáo viên phụ trách (modal)

Trên nền Chi tiết lớp, modal "Đổi giáo viên phụ trách – Toán 8A":
- Giáo viên hiện tại (readonly, avatar).
- Select giáo viên mới (avatar, số lớp đang dạy), alert cam nếu trùng lịch.
- Ngày áp dụng, Lý do.
- Nút "Hủy", "Xác nhận đổi".

---

## PROMPT 12 — Danh mục đào tạo

App shell, menu: Danh mục. Page header "Danh mục đào tạo".
Tabs: Môn học | Khối | Chương trình | Phòng học.
Tab Chương trình đang chọn: nút "+ Thêm chương trình"; filter Môn, Khối; bảng: Tên chương trình | Môn | Khối | Số bài học | Học phí/tháng | Số lớp đang dùng | Trạng thái | ⋮ (Sửa, Quản lý bài học).

Biến thể tab Phòng học: bảng Tên phòng | Sức chứa | Số lớp đang dùng | Trạng thái | ⋮.

## PROMPT 12B — Chi tiết chương trình & bài học

Breadcrumb: Danh mục / Chương trình / Toán 8 cơ bản.
Header: tên, tag Toán, Khối 8, học phí 500.000 ₫/tháng, 36 bài, nút "Sửa".
Card "Danh sách bài học": nút "+ Thêm bài học"; danh sách có icon kéo thả (6 chấm) bên trái, số thứ tự, tên bài, mô tả ngắn, nút sửa/xóa. 1 dòng đang được kéo (shadow, lệch nhẹ).
Alert info nhỏ: "Thứ tự bài học quyết định bài được gắn vào buổi học khi tạo lớp".

## PROMPT 12C — Modal thêm/sửa chương trình

Modal "Thêm chương trình": Tên, Môn (select), Khối (select), Học phí/tháng (input tiền có đuôi ₫), Mô tả, Switch "Đang sử dụng". Nút "Hủy", "Lưu". Hiển thị lỗi đỏ dưới ô Tên "Vui lòng nhập tên chương trình".

---

## PROMPT 13 — Lịch sử email

App shell, menu: Lịch sử email. Page header "Lịch sử email", nút "Gửi lại tất cả email lỗi" (outline đỏ).
3 thẻ: Đã gửi 1.284 (xanh lá) | Thất bại 2 (đỏ) | Đang chờ 5 (cam).
Filter: loại email (Link/mã, Thanh toán, Điểm danh, Học bù, Đổi lịch, Nghỉ học, Nhắc học phí, Thông báo chung), trạng thái, date range, tìm email người nhận.
Bảng: Loại (tag) | Người nhận | Tiêu đề | Thời gian | Trạng thái | Số lần thử ("2/3") | ⋮ (Xem nội dung, Gửi lại).
Dòng thất bại có tooltip lỗi "SMTP timeout".

## PROMPT 13B — Gửi thông báo

App shell, menu: Gửi thông báo. Page header "Gửi thông báo".
Bố cục 2 cột:
- Trái form: Loại thông báo (segmented: Nghỉ lễ | Nhắc học phí | Thông báo quan trọng), Tiêu đề, Nội dung (rich text editor đơn giản: bold, list, link).
  Người nhận: radio Tất cả phụ huynh | Theo lớp | Theo môn | Chọn phụ huynh; khi chọn "Theo lớp" hiện multi select lớp dạng tag.
  Dòng đếm: "Sẽ gửi tới 86 phụ huynh".
- Phải: card "Xem trước email" mô phỏng hộp thư: logo trung tâm, tiêu đề, nội dung, footer.
Footer: "Hủy", "Gửi thông báo" (primary).

---

## PROMPT 14 — Quản lý viên

App shell, menu: Quản lý viên. Page header "Quản lý viên", mô tả "Tất cả quản lý có đầy đủ quyền trên hệ thống", nút "+ Mời quản lý".
Bảng: Quản lý (avatar + tên) | Email | Trạng thái (Hoạt động / Chờ kích hoạt / Vô hiệu hóa) | Ngày tham gia | ⋮ (Gửi lại lời mời, Vô hiệu hóa).
Dòng của chính người đăng nhập có badge nhỏ "Bạn" và không có ⋮.
Modal "Mời quản lý": Email, Họ tên, nút "Gửi lời mời". Không có phần chọn quyền — mọi quản lý có đủ quyền như nhau, không phân quyền chi tiết.

## PROMPT 14B — Lịch sử thay đổi

App shell, menu: Lịch sử thay đổi. Page header "Lịch sử thay đổi".
Filter: select Loại thao tác (Đổi giáo viên, Dạy thay, Xếp học bù, Đổi buổi, Đổi lịch cố định, Nghỉ dài hạn, Cho học lại, Nghỉ môn, Nghỉ hẳn, Xác nhận thanh toán, Sửa kết quả AI), Người thực hiện, date range, tìm đối tượng.
Bảng: Thời gian | Người thực hiện (avatar) | Hành động (tag màu) | Đối tượng (link) | Thay đổi (text cũ gạch ngang → text mới xanh, vd "Toán 8A → Toán 8C") | nút mở rộng.
1 dòng mở rộng hiện chi tiết dạng description list: Lý do, Ngày áp dụng, IP.

---

## PROMPT 15 — Tài khoản cá nhân

App shell, không chọn menu (mở từ avatar). Page header "Tài khoản".
Tabs dọc bên trái: Thông tin cá nhân | Đổi mật khẩu.
- Thông tin cá nhân: avatar lớn + nút đổi ảnh, Họ tên, Email (disabled, ghi chú "Email đăng nhập không thể thay đổi"), SĐT, nút "Lưu thay đổi".
- Đổi mật khẩu: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới, thanh độ mạnh mật khẩu, nút "Đổi mật khẩu".

---

## PROMPT 16 — Trạng thái chung (bảng component)

Tạo 1 trang tổng hợp các trạng thái UI của EduGrade, cùng design system, bố cục lưới:
1. Toast góc trên phải: success "Xác nhận thanh toán thành công"; error "Không thể tải dữ liệu" có nút X; warning "Đã xác nhận thanh toán nhưng gửi email thất bại" có nút "Gửi lại"; info "AI đang chấm bài, bạn sẽ nhận thông báo khi xong".
2. Alert inline 4 màu.
3. Skeleton: bảng 5 dòng, 4 KPI card, header chi tiết.
4. Empty state: "Chưa có lớp học" + nút "Tạo lớp"; "Không tìm thấy kết quả" + nút "Xóa bộ lọc".
5. Error state trong card: icon, "Không thể tải dữ liệu", nút "Thử lại".
6. Confirm dialog default và danger.
7. Button: primary, outline, ghost, danger, loading "Đang lưu...", disabled.
8. Badge trạng thái: Có mặt, Vắng, Đã học bù, Nghỉ có phép, Đang học, Tạm nghỉ, Đã nghỉ, Chờ liên kết, Chưa dùng, Đã dùng, Hết hạn, Đã gửi, Thất bại, Đang chờ.
9. Tag môn: Toán, Lý, Hóa, Sinh.
10. Input: default, focus, error kèm text lỗi, disabled.

## PROMPT 16B — Trang lỗi

3 trang lỗi toàn màn hình (không sidebar), minh họa đơn giản + mã lỗi lớn + mô tả + nút:
- 403 "Bạn không có quyền truy cập trang này" — nút "Về Dashboard"
- 404 "Không tìm thấy trang" — nút "Về Dashboard"
- 500 "Hệ thống đang gặp sự cố" — nút "Thử lại"

## PROMPT 16C — Hết phiên đăng nhập

Trang Danh sách học sinh làm nền mờ, modal nhỏ không đóng được: icon khóa, "Phiên đăng nhập đã hết hạn", mô tả "Đăng nhập lại để tiếp tục, dữ liệu đang nhập sẽ được giữ", field Mật khẩu (email hiển thị sẵn), nút "Đăng nhập lại".
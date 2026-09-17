# EduGrade — UI Reference: Giáo viên (Teacher)

> File này mô tả toàn bộ màn hình web dành cho role **Giáo viên**, dùng làm nguồn
> tham chiếu khi implement UI từ ảnh chụp Stitch. Khi prompt cho Claude Code, trỏ tới
> **Reference code** tương ứng (vd `PROMPT T4B`) để nó đọc đúng phần mô tả.
>
> Dùng chung design system và app shell với role Quản lý (xem `ui-screens-manager.md`
> — `PROMPT 0`), chỉ đổi sidebar/header theo `PROMPT T0`. Component thật phải lấy từ
> `src/components/shared/` và `src/components/ui/` theo `.claude/rules/implement-ui.md`,
> nội dung dưới đây chỉ mô tả bố cục/nội dung hiển thị, không phải code hay style gốc.

## Mục lục nhanh (Reference code → Route dự kiến)

| Reference code | Màn hình | Route dự kiến |
|---|---|---|
| PROMPT T0 | App shell Giáo viên | — |
| PROMPT T1 | Dashboard giáo viên | `(teacher)/dashboard` |
| PROMPT T2 | Lịch dạy | `(teacher)/schedule` |
| PROMPT T3 | Lớp của tôi — danh sách | `(teacher)/classes` |
| PROMPT T3B | Chi tiết lớp (giáo viên) | `(teacher)/classes/[id]` |
| PROMPT T4 | Điểm danh — danh sách buổi | `(teacher)/attendance` |
| PROMPT T4B | Điểm danh 1 buổi | `(teacher)/attendance/[sessionId]` |
| PROMPT T5 | Bài tập / Đề kiểm tra — danh sách | `(teacher)/assignments` |
| PROMPT T5B | Tạo bài tập / đề kiểm tra | `(teacher)/assignments/new` |
| PROMPT T5C | Bài nộp theo bài tập | `(teacher)/assignments/[id]/submissions` |
| PROMPT T6 | Chấm bài AI — hàng đợi | `(teacher)/grading` |
| PROMPT T6B | Chấm bài chi tiết (duyệt AI) | `(teacher)/grading/[submissionId]` |
| PROMPT T6C | Trạng thái AI đang chấm | biến thể của `(teacher)/grading` |
| PROMPT T7 | Báo cáo | `(teacher)/reports` |
| PROMPT T8 | Tài khoản cá nhân (giáo viên) | `(teacher)/profile` |
| PROMPT T9 | Trạng thái chung (giáo viên) | `/dev/components` |

---

## PROMPT T0 — App shell Giáo viên

Thiết kế giao diện web desktop (1440px) cho hệ thống EduGrade, dành cho Giáo viên.
Toàn bộ text tiếng Việt. Dùng đúng design system: primary xanh dương #2563EB, nền
trang #F8FAFC, card trắng viền #E2E8F0, success/danger/warning/info/neutral, màu môn
Toán xanh dương / Lý tím / Hóa cam / Sinh xanh lá, font Be Vietnam Pro, bo góc 8–12px.

App shell:
- Sidebar trái 260px, nền trắng, có thể thu gọn.
  - Logo EduGrade + tên trung tâm.
  - Menu chia nhóm:
    - TỔNG QUAN: Dashboard
    - GIẢNG DẠY: Lịch dạy, Lớp của tôi, Điểm danh (badge cam "2" buổi chưa điểm danh hôm nay)
    - BÀI TẬP & KIỂM TRA: Bài tập / Đề kiểm tra, Bài nộp của học sinh (badge xanh dương "12" bài chưa chấm)
    - CHẤM BÀI AI: Chấm bài (badge cam "5" chờ duyệt)
    - BÁO CÁO: Báo cáo
  - Menu đang chọn: nền xanh nhạt, chữ/icon primary, thanh dọc trái.
- Header 64px:
  - Không có ô "Tạo nhanh" như Quản lý (giáo viên không tạo lớp/đăng ký).
  - Icon chuông có chấm đỏ.
  - Avatar + "Trần Văn Minh" + chữ nhỏ "Giáo viên · Toán".
- Vùng nội dung: breadcrumb, tiêu đề trang + mô tả + action bên phải.

Hiển thị app shell với trang Dashboard trống làm khung.

---

## PROMPT T1 — Dashboard giáo viên

App shell Giáo viên, menu: Dashboard.
Page header: "Dashboard", mô tả "Xin chào Trần Văn Minh, Thứ 3, 15/09/2026".

Hàng 1 — 4 KPI card:
- Buổi dạy hôm nay: 3
- Lớp phụ trách: 4
- Bài chờ chấm: 12
- Bài AI chờ duyệt: 5 (cam)

Hàng 2 — 2 cột (2/3 và 1/3):
- Trái: card "Lịch dạy hôm nay" dạng danh sách theo giờ: 15:00–16:30 Toán 8A · P.101 ·
  18 học sinh · badge "Chưa điểm danh" (cam, nút "Điểm danh" primary nhỏ);
  17:00–18:30 Toán 7A · P.102 · badge "Đã điểm danh" (xanh lá, mờ hơn).
- Phải: card "Cần xử lý": Bài AI chờ duyệt (5, cam), Buổi chưa điểm danh (1, đỏ),
  Bài tập sắp hết hạn nộp (2, cam).

Hàng 3: card full width "Bài nộp gần đây": bảng Học sinh | Lớp | Bài tập | Thời gian nộp |
Trạng thái (Chờ chấm / AI đã chấm / Đã công bố).

---

## PROMPT T2 — Lịch dạy

App shell, menu: Lịch dạy. Page header "Lịch dạy".
Toolbar: nút "Hôm nay", mũi tên trước/sau, "14/09 – 20/09/2026", segmented Ngày | Tuần,
select Lớp (lọc theo lớp mình dạy).
Calendar tuần: cột T2 → CN, hàng giờ 7:00 → 21:00. Chỉ hiện buổi của giáo viên này
(không thấy buổi của giáo viên khác). Block màu theo môn, trong block: tên lớp, bài
học, phòng, sĩ số, badge nhỏ "Dạy thay" nếu có. Click buổi mở drawer chi tiết (giống
Quản lý nhưng KHÔNG có nút "Xếp dạy thay").

---

## PROMPT T3 — Lớp của tôi (danh sách)

App shell, menu: Lớp của tôi. Page header "Lớp của tôi", mô tả "4 lớp đang phụ trách".
Lưới card (không phải bảng), mỗi card:
- Tag môn, tên lớp "Toán 8A", chương trình, lịch cố định, phòng.
- Sĩ số "18/20", tiến độ "Bài 12/36" (progress bar).
- Tỷ lệ đi học trung bình lớp "94%".
- Nút "Xem lớp".
4 card: Toán 8A, Toán 7A, Toán 8C, Toán 9A.

## PROMPT T3B — Chi tiết lớp (giáo viên)

Breadcrumb: Lớp của tôi / Toán 8A.
Header: tên lớp, tag môn, khối, chương trình, lịch cố định, phòng, sĩ số, tiến độ.
KHÔNG có nút "Đổi giáo viên"/"Sửa lớp" (chỉ Quản lý mới có).
Tabs: Học sinh | Buổi học | Tỷ lệ đi học.

Tab Học sinh: bảng Học sinh (avatar+tên) | Tỷ lệ đi học (progress) | Điểm trung bình |
Trạng thái | nút xem nhanh (mở popover thông tin học sinh, không sang trang khác vì
giáo viên không có quyền xem hồ sơ đầy đủ như Quản lý).

Tab Buổi học: bảng Buổi | Ngày | Bài học | Trạng thái điểm danh | nút "Điểm danh"
(nếu chưa điểm danh) / "Xem" (nếu đã điểm danh).

Tab Tỷ lệ đi học: bảng học sinh + % đi học + biểu đồ cột theo tuần của cả lớp.

---

## PROMPT T4 — Điểm danh (danh sách buổi)

App shell, menu: Điểm danh. Page header "Điểm danh".
Tabs: Hôm nay (3) | Chưa điểm danh (1, badge đỏ) | Đã điểm danh.
Bảng: Giờ | Lớp | Bài học | Phòng | Sĩ số | Trạng thái | nút "Điểm danh"/"Xem lại".

## PROMPT T4B — Màn điểm danh 1 buổi

Breadcrumb: Điểm danh / Toán 8A · 15/09/2026.
Header card: tên lớp, bài học "Bài 12: Phân tích đa thức thành nhân tử", giờ, phòng.
Danh sách học sinh dạng bảng lớn, mỗi dòng: avatar + tên, 4 nút chọn trạng thái dạng
segmented lớn dễ bấm: Có mặt (xanh lá) | Vắng (đỏ) | Đã học bù (xanh dương) | Nghỉ có
phép (xám, disabled nếu học sinh không trong thời gian nghỉ dài hạn). Mặc định tất cả
"Có mặt". Ô ghi chú nhỏ mỗi dòng (tùy chọn, hiện khi hover).
Thanh trên cùng: "18 học sinh · Đã chọn: 18 Có mặt" cập nhật realtime.
Footer sticky: "Hủy", "Lưu điểm danh" (primary), ghi chú nhỏ "Phụ huynh sẽ nhận email
sau khi lưu".

---

## PROMPT T5 — Bài tập / Đề kiểm tra (danh sách)

App shell, menu: Bài tập / Đề kiểm tra. Page header "Bài tập / Đề kiểm tra", nút
"+ Tạo bài tập".
Filter: tìm tên, select Lớp, select Loại (Bài tập / Kiểm tra), select Trạng thái
(Nháp / Đã giao / Đã đóng).
Bảng: Tên bài | Lớp | Loại (tag) | Ngày giao | Hạn nộp | Số bài đã nộp ("15/18") |
Trạng thái | ⋮ (Sửa, Xem bài nộp, Đóng bài tập).

## PROMPT T5B — Tạo bài tập / đề kiểm tra

Page header "Tạo bài tập".
Card "Thông tin chung": Tên bài, Lớp (select), Loại (segmented Bài tập | Kiểm tra),
Ngày giao, Hạn nộp, Mô tả/hướng dẫn (textarea).
Card "Câu hỏi & đáp án": danh sách câu hỏi có thể thêm nhiều, mỗi câu: số thứ tự,
nội dung câu hỏi (textarea), Loại (Trắc nghiệm / Tự luận), nếu Trắc nghiệm hiện 4 ô
đáp án + radio chọn đáp án đúng; nếu Tự luận hiện ô "Đáp án mẫu / Tiêu chí chấm".
Nút "+ Thêm câu hỏi" cuối danh sách, nút xóa từng câu.
Footer sticky: "Lưu nháp" (outline), "Giao bài" (primary).

## PROMPT T5C — Bài nộp của học sinh (theo bài tập)

Breadcrumb: Bài tập / Đề kiểm tra / Bài 12: Kiểm tra 15 phút.
Header: tên bài, lớp, hạn nộp, "15/18 đã nộp".
Tabs: Tất cả | Chờ chấm | AI đã chấm – chờ duyệt | Đã công bố | Chưa nộp (badge xám).
Bảng: Học sinh | Thời gian nộp | Điểm (nếu có) | Trạng thái (badge) | nút "Chấm bài"/"Xem".

---

## PROMPT T6 — Chấm bài AI (hàng đợi)

App shell, menu: Chấm bài. Page header "Chấm bài", mô tả "Kết quả AI luôn cần giáo
viên kiểm tra trước khi công bố".
Tabs: Chờ duyệt (5, cam) | Đã duyệt – chưa công bố (3) | Đã công bố (42).
Filter: select Lớp, select Bài tập.
Bảng: Học sinh | Bài tập | Lớp | Điểm AI đề xuất | Thời gian AI chấm | nút "Kiểm tra & duyệt".

## PROMPT T6B — Màn chấm bài chi tiết (duyệt kết quả AI)

Breadcrumb: Chấm bài / Nguyễn Minh Khang · Bài 12.
Alert cam trên cùng: "Kết quả do AI đề xuất. Vui lòng kiểm tra trước khi công bố cho
phụ huynh".
Bố cục 2 cột:
- Trái (60%): nội dung bài làm của học sinh từng câu — câu hỏi, câu trả lời học sinh
  viết/chọn, đáp án đúng hiển thị cạnh nhau để so sánh.
- Phải (40%) sticky: card "Kết quả AI đề xuất": điểm từng câu (input số, sửa được),
  Tổng điểm lớn (8.5/10, đậm), Nhận xét AI (textarea, sửa được).
  Nút "Lưu thay đổi" (outline), "Duyệt & công bố" (primary), "Duyệt nhưng chưa công bố"
  (ghost).
Điều hướng nhanh cuối trang: "‹ Học sinh trước", "Học sinh sau ›" để chấm liên tục
cả lớp không phải quay lại danh sách.

## PROMPT T6C — Trạng thái chấm tự luận đang xử lý

Biến thể của T6: 1 dòng trong bảng hiện badge tím "AI đang chấm..." với spinner nhỏ
thay vì nút hành động, tooltip "Bài tự luận, AI xử lý trong nền, có thể mất vài phút".

---

## PROMPT T7 — Báo cáo

App shell, menu: Báo cáo. Page header "Báo cáo".
Card "Tạo báo cáo mới": select Lớp (hoặc multi-select), select Học sinh (tùy chọn, để
trống = cả lớp), date range Từ – Đến, checkbox nội dung gồm (Điểm số, Tỷ lệ đi học,
Tiến độ học tập — mặc định tick hết). Nút "Tạo báo cáo" (primary), hiện trạng thái
"Đang tổng hợp..." với progress khi bấm.

Bên dưới: bảng "Lịch sử báo cáo": Tên báo cáo (tự đặt theo lớp+thời gian) | Lớp |
Khoảng thời gian | Ngày tạo | nút "Tải Excel", "Tải PDF".

---

## PROMPT T8 — Tài khoản cá nhân (giáo viên)

Giống PROMPT 15 của Quản lý nhưng đổi mô tả: Page header "Tài khoản".
Tabs dọc: Thông tin cá nhân | Đổi mật khẩu.
Thông tin cá nhân thêm dòng "Môn dạy: Toán" (readonly, do Quản lý phân công, không tự
sửa được).

---

## PROMPT T9 — Trạng thái chung (giáo viên)

Tương tự PROMPT 16 của Quản lý, chỉ thêm các badge riêng của giáo viên nếu Stitch cần
tách riêng project:
- Badge chấm bài: "Chờ chấm" (xám), "AI đang chấm" (tím, có spinner), "AI đã chấm"
  (cam), "Đã duyệt" (xanh dương), "Đã công bố" (xanh lá).
- Badge điểm danh buổi: "Chưa điểm danh" (đỏ), "Đã điểm danh" (xanh lá).
- Empty state riêng: "Chưa có bài tập nào" + nút "Tạo bài tập"; "Không có bài chờ
  duyệt" (khi hàng đợi AI trống).
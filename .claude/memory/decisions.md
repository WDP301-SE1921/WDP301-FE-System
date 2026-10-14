# Decisions

- **2026-10-14, yêu cầu cuối** — Người dùng đổi lựa chọn dashboard sang màu cam/kem và hiển thị sát ảnh mẫu, dùng API dự án. Sáu KPI hàng ba; theme cream/terracotta và Noto Serif chỉ ở dashboard (kể cả header/sidebar), các màn còn lại dùng token hiện tại. Biểu đồ dùng doanh thu/buổi hoàn thành và phân bố hồ sơ theo khối thật, không đổi domain sang Tiểu học/THPT hay thêm chuỗi học sinh lịch sử không có trong API. Lựa chọn này thay yêu cầu giữ màu dashboard ở đầu lượt.

- **2026-10-14** — Người dùng chọn dashboard theo bố cục ảnh, rà soát bảng/card/menu cho các vai trò Web và thêm lịch Kanban, giữ màu/font hiện tại. Dashboard chỉ dùng số liệu thật; không giả tỷ lệ tăng trưởng hoặc chuỗi số học sinh quá khứ. Danh sách dày dùng bảng, lớp/giáo trình card gọn; biểu mẫu nằm cạnh kết quả khi đủ rộng. Kanban theo bảy ngày để mở chi tiết, không kéo thả đổi lịch. Tìm kiếm header điều hướng màn hình được phép; chuông chỉ đọc thông báo thật cho Manager/Teacher.

- **2026-10-14** — Theo xác nhận người dùng: giữ Kiểm tra giáo trình (cấu trúc), tách kiểm tra tháng khỏi giáo trình và lịch mới. Designer chọn giáo viên phụ trách khóa để thẩm định chuyên môn; Manager xác nhận áp dụng sau đó. Bản đã dùng không sửa trực tiếp; nháp kế tiếp có kỳ áp dụng sau kỳ gốc và hôm nay. Teacher tạo kiểm tra riêng theo buổi/loại, import CSV/DOCX/PDF có chữ qua preview rồi chỉnh và lưu nháp. AI chỉ trích đề xuất, không tự giao bài/công bố.

- **2026-10-09** — Web Academic dùng contract hiện tại của BE: Subject → Program → Class/CurriculumUnit theo đúng programId; Designer validation/submit, Manager review, rồi preview/generate lịch. Lịch manager/staff/teacher và lớp teacher dùng API thật. BFF có whitelist method/path/role và multipart; thao tác import/generate/reschedule/cancel lưu nguyên body/key theo user và đối tượng trước request. Chi tiết tại `docs/ACADEMIC_API_INTEGRATION.md`.

- **2026-09** — Single-tenant scope: the whole system serves exactly one education center. No multi-tenant/Center model, no tenant isolation logic.
- **2026-09** — Account model is parent-only: one login account belongs to a parent, who holds one or more `StudentProfile` children. There is no separate student login, ever.
- **2026-09** — Parent role is Mobile-only per the latest spec (Web + Mobile for manager/teacher, Mobile for parent) — don't build a parent web UI unless this changes.
- **2026-09** — Shadcn preset: **Maia** (soft, rounded, generous spacing) — chosen for a friendly, non-clinical feel for parents.
- **2026-09** — Route groups by role: `(public)`, `(auth)`, `(manager)`, `(teacher)`, `(parent)` — each with its own layout.
- **2026-09** — State management: TanStack Query for server state, `nuqs` for URL state, plain React state for local UI. No Redux/Zustand.
- **2026-10** — Split the manager role into 3: Quản lý trung tâm (staff/teacher CRUD, dashboard, class creation), Thiết kế giáo trình (curriculum content, new), Nhân viên (registration, payment confirmation, schedule/makeup/leave — new). Added route groups `(curriculum)` and `(staff)`. Existing UI under `(manager)` is being reassigned, not rebuilt. Payment confirmation moved from manager to staff.
- **2026-10** — Teacher platform is ambiguous in the spec (role list says Web-only, §1.3 heading still says Web+Mobile) — treated as Web-only pending confirmation.

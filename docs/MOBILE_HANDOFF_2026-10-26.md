# Bàn giao cho team Mobile — đợt BE CLO + phân trang (26/10/2026)

Nguồn: BE `dev` từ `3c3f61e` đến `e2cb844` (PR #10 `feture/data-sees-clo`), cộng commit BE `c9ecbcd` (chưa push lúc viết). Web đã cập nhật phần của Web. **Repo Mobile không bị sửa**; các mục dưới đây để team Mobile tự làm. Đối chiếu với `WDP301-FEM-System` nhánh `dev` tại `633296f`.

Hợp đồng chung: `docs/data-list-api.md` của BE. Tóm tắt:

- `page` 1–1.000.000 (mặc định 1), `limit` 1–100 (mặc định **20**).
- Endpoint vốn trả mảng: bỏ `paginated` thì **vẫn chỉ trả 20 dòng đầu**; thêm `paginated=true` để nhận `{ items, page, limit, total }`.
- Ngày `YYYY-MM-DD` = trọn ngày theo UTC+7; khoảng ngày đảo ngược trả `400 INVALID_DATE_RANGE`.
- Gửi query không có trong DTO của route sẽ bị `400` (validation whitelist).

## M-1. Danh sách của phụ huynh bị cắt còn 20 dòng (ưu tiên cao)

- **Hiện tại:** `parentDashboardApi.getStudents` và `childrenApi` gọi `GET /me/students` không có `page`/`limit`; `getTuitionEnrollments` gọi `GET /me/students/:id/enrollments` cũng vậy (`src/features/parent-dashboard/api/parent-dashboard-api.ts:78,253`, `src/features/children/api/children-api.ts:10`).
- **Hậu quả:** con có hơn 20 ghi danh (kể cả đã kết thúc) thì app thiếu môn/học phí; phụ huynh hơn 20 hồ sơ con thì thiếu hồ sơ (hiếm nhưng có thể).
- **Cần làm:** đọc hết các trang như `readAllPages` đang dùng cho `scheduled-sessions`: `?page=N&limit=100`, dừng khi trang trả ít hơn 100 dòng (hoặc dùng `paginated=true` và `total`).
- **Nghiệm thu:** học sinh có 25 ghi danh → app hiện đủ 25; phụ huynh có 1 con vẫn chỉ gọi 1 trang.

## M-2. Mục tiêu bài (CLO) trong chi tiết bài tập (đề xuất)

- **BE:** `GET /academic/assignments/:id` trả thêm `outcomeSetId`, `learningTargets: [{ id, code, title, statement }]` và `questions[].outcomeId`. Rubric vẫn chỉ trả cho giáo viên.
- **Lưu ý:** `learningTargets` là **toàn bộ CLO của bộ** mà bài chọn, không phải chỉ các CLO bài đo. Web lọc theo `questions[].outcomeId` (giữ thứ tự trong bộ); Mobile nên làm giống để không ghi quá mục tiêu.
- **Cần làm (nếu sản phẩm muốn):** ở màn làm bài, hiện khối "Mục tiêu bài" liệt kê `code · title` của các CLO được câu hỏi đo và gắn mã CLO cạnh câu hỏi có `outcomeId`. Bài cũ không có CLO thì ẩn khối.
- **Nghiệm thu:** bài có CLO hiện đúng danh sách; bài không có CLO không hiện khối trống.

## M-3. Chuẩn đầu ra của khóa học (đề xuất)

- **BE:** `GET /academic/programs/:programId/outcome-sets` cho phụ huynh chỉ trả bộ **đã duyệt** của khóa mà con đang/đã học, các trường `{ id, programId, level, version, outcomes: [{ id, code, title, statement, required }] }`. Con không học khóa đó → `403 FORBIDDEN`.
- **Cần làm (nếu sản phẩm muốn):** ở chi tiết môn/khóa của con, hiện "Mục tiêu khóa học" từ bộ có `version` lớn nhất. Không hiện chữ "đạt chuẩn": BE **chưa tính** mức đạt CLO của học sinh.

## M-4. Bộ lọc mới có thể dùng

| Route | Bộ lọc mới |
| --- | --- |
| `GET /me/students` | `search` (tên), `grade`, `status=ACTIVE/INACTIVE` |
| `GET /me/students/:id/enrollments` | `status=ACTIVE/ENDED`, `classId`, `subject`, `search` (tên lớp) |
| `GET /me/students/:id/schedule` | `weekday` 1–7, `classId`, `subject`, `search`; trả 20 slot/trang |
| `GET /me/bills` | `status`, `classId`, `studentId`, `search` (tên con/số biên lai), `fromDate`, `toDate` (ngày tạo) |
| `GET /academic/me/students/:id/grades` | `search`, `classId`, `subject`, `kind`, `fromDate`/`toDate` theo ngày **công bố điểm**; chỉ `history` phân trang, trung bình môn tính trên toàn bộ kết quả lọc |
| `GET /academic/me/students/:id/attendance` | thêm `search`; `history` phân trang 20 dòng, `counts` và phần trăm vẫn tính toàn kỳ |
| `GET /notifications` | `classId`, `search`, `fromDate`, `toDate` |

Khi nối BE thật cho chuyên cần (app đang dùng mock `/parent/students/:id/attendance`), nhớ đọc hết các trang của `history`.

## M-5. Lỗi mới cần thông báo tiếng Việt

`INVALID_DATE_RANGE` (khoảng ngày sai), `FORBIDDEN` khi xem CLO của khóa con không học. Các mã CLO khác chỉ dành cho Web (giáo viên, thiết kế giáo trình, quản lý).

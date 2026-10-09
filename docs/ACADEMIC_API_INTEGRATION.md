# Tích hợp Academic API cho Web WDP301-FE-System

Cập nhật 09/10/2026. Thực hiện theo kế hoạch `D:/WDP/ACADEMIC_API_INTEGRATION_PLAN.md`, sau khi người dùng duyệt. Đối chiếu `WDP301-BE-System/ACADEMIC_API_FLOW.md`, controller/DTO/service, Prisma và các tài liệu/quy tắc FE. Đã áp dụng skill UI/UX và shared-ui của dự án.

Luồng theo vai trò và kịch bản mẫu để đọc/nghiệm thu: [ACADEMIC_USER_FLOW.md](ACADEMIC_USER_FLOW.md).

## Luồng và điểm vào

| Vai trò               | Trang                                                       | API và hành vi                                                                                                                                              |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manager               | `/manager/catalog`                                          | Subject/Program: đọc, lọc, tạo, sửa, xóa hoặc ngừng sử dụng theo kết quả BE. Program chọn Subject thật.                                                     |
| Manager/Designer      | `/manager/catalog/programs/:id`                             | Chi tiết khóa, giáo trình và các lớp áp dụng; tạo lớp hoặc nháp với programId điền sẵn.                                                                     |
| Manager               | `/manager/classes/new`, `/manager/classes/:id`              | GET chi tiết, chọn giáo viên ACTIVE, sức chứa/học phí, mở/đóng đăng ký, kích hoạt/ngừng hoạt động, xóa lớp chưa sử dụng, roster ghi danh gốc có phân trang. |
| Manager               | Cấu hình lớp                                                | GET/PUT lịch tuần, PATCH/DELETE từng khung. UI khóa theo scheduleLocked của BE. Giờ Việt Nam, ISO weekday 1–7.                                              |
| Designer              | `/manager/curriculum`, `/:id`                               | Phân trang/lọc URL, soạn nháp, bài/kiểm tra tháng, sắp bài, xóa nội dung, CSV, validation, submit, tạo revision từ bản duyệt.                               |
| Manager               | Chi tiết học phần                                           | Xem PENDING_REVIEW, approve hoặc request-changes kèm lý do; archive bản APPROVED.                                                                           |
| Manager               | `/manager/sessions`, `/manager/classes/:id/sessions`        | Preview và generate bản APPROVED của **đúng programId**; lịch sử đợt sinh và danh sách buổi thật.                                                           |
| Manager/Teacher/Staff | `/manager/schedule`, `/teacher/schedule`, `/staff/schedule` | Lịch ngày/tuần từ scheduled-sessions, lọc lớp/ngày bằng nuqs, giờ UTC+7, chi tiết nội dung thật. Không tạo thông tin phòng từ dữ liệu thiếu.                |
| Manager               | Chi tiết buổi trong lịch/danh sách                          | Reschedule-preview → reschedule, hoặc cancel có lý do và expectedRevision.                                                                                  |
| Teacher               | `/teacher/classes`, `/teacher/classes/:id`                  | Lớp được phân công, chi tiết lớp/ghi danh gốc/buổi/giáo trình APPROVED; không hiển thị số liệu điểm danh mẫu.                                               |

Học phần có trạng thái DRAFT → PENDING_REVIEW → APPROVED → ARCHIVED. Request-changes trả về DRAFT cùng reviewNote. Duyệt cấu trúc giáo trình không phụ thuộc việc đã tạo lớp; đủ bài/kiểm tra cho lịch cụ thể được BE kiểm tra lúc preview/generate.

## Giao tiếp và retry

Browser vẫn gọi BFF `/api/backend/*`, Bearer token chỉ ở server và cookie HttpOnly. BFF định nghĩa rõ method/path/role cho GET/POST/PATCH/PUT/DELETE, kiểm tra cùng origin cho thao tác ghi; BE giữ kiểm tra sở hữu, trạng thái và ràng buộc cuối cùng.

- Multipart CSV giữ File/FormData, không ép Content-Type JSON; fetch tự tạo boundary, kể cả khi refresh token rồi gửi lại.
- CSV tối đa 5 MiB/1.000 dòng. Preview hiển thị từng dòng và lỗi code/field của BE. Commit bỏ diagnostics, giữ nguyên strings/nullable fields, previewId và expectedRevision.
- Vì BE main.ts giới hạn JSON 1 MiB, FE kiểm tra **byte UTF-8 của JSON commit** và yêu cầu chia nhỏ file khi vượt giới hạn này.
- Preview sinh lịch hết hạn sau thời gian BE trả; FE mới luôn gửi previewId khi generate và không cho xác nhận preview khác input/có xung đột.
- Import, generate, reschedule và cancel lưu UUID cùng nguyên body trong sessionStorage theo user và đối tượng **trước** request. Reload hoặc lỗi mạng/5xx dùng lại đúng body/key. Lỗi nghiệp vụ xác định xóa attempt; lỗi phiên/quyền/408/429/idempotency conflict giữ attempt.
- Các thao tác sửa nháp gửi expectedRevision khi API hỗ trợ. Ngày học phần dùng YYYY-MM-DD; input đổi giờ địa phương được đổi sang UTC ISO.
- Sau mutation, invalidate dữ liệu chi tiết/lịch/lịch sử tương ứng; không thay query detail bằng response scalar thiếu class/lesson.
- Programs/classes/teachers/sessions đọc đủ các trang; teacher không có giáo trình được normalize từ [] về trang rỗng.

## Sửa nhỏ tại BE

`registration-flow.service.ts`: PUT/POST thay toàn bộ lịch tuần dùng chung assertScheduleEditable với PATCH/DELETE, bao gồm enrollmentPlacement. GET class detail thêm scheduleLocked bằng cùng điều kiện. Không đổi schema, auth, quy trình payment hay business rule khác.

Test MySQL bổ sung kiểm tra placement khóa PUT, GET báo locked và slot cũ còn nguyên khi yêu cầu bị từ chối. `ACADEMIC_API_FLOW.md` đã ghi field mới.

## Trạng thái database và chạy local

Prisma Client đã được generate lại từ schema hiện tại. Kiểm tra migrate status cho thấy DB ứng dụng local `edugrade_db` ở cổng 3307 còn thiếu **20261008000000_academic_flow**. Chưa deploy migration này vào DB ứng dụng; không reset DB ứng dụng. Kiểm thử dùng database riêng có prefix test và tự dọn sau khi chạy.

Khi triển khai theo quy trình của BE, áp dụng migration có sẵn, generate và khởi động lại BE:

```powershell
# Trong WDP301-BE-System, với DATABASE_URL của môi trường triển khai
corepack pnpm prisma:migrate:deploy
corepack pnpm prisma:generate
corepack pnpm build
corepack pnpm dev
# Trong WDP301-FE-System; BACKEND_API_URL trỏ tới BE /api/v1
npm run dev -- --port 3001
```

## Xác minh

- FE TypeScript và production build đạt.
- 55 kiểm thử logic/BFF Academic/auth/registration/bill/progress wizard đạt.
- BE TypeScript, ESLint và Prettier của các file thay đổi đạt; 36 e2e curriculum/registration trên MySQL riêng đạt.
- Lượt kiểm thử lại trước push: 55/55 FE, HTTP production 1/1 và 36/36 BE đạt. BE chạy với testTimeout=30000; lần đầu ca tạo nhiều tài khoản bị timeout mặc định 5 giây, lần chạy lại giữ nguyên các assertion và đạt.
- Nghiệm thu production Next BFF + Nest + MySQL riêng đạt: CSV UTF-8 nhiều dòng, replay import/generate/reschedule/cancel không tạo thao tác lặp, đúng programId, khóa lịch tuần, teacher chỉ đọc lớp được giao. UI CSV → submit → request-changes → submit → approve, đổi giờ và nội dung thật cho Teacher/Staff đạt; màn 390px không tràn ngang, không có lỗi JavaScript.
- HTTP production registration fixture đạt. Hồi quy desktop fixture đạt từ Subject/Program/lớp/lịch tuần → giáo trình/gửi duyệt/sinh 3 buổi → chọn con khối 8 → bill/thu 2.400.000 VND → một ghi danh ACTIVE → reload biên lai/tra cứu bill. Có 12 ảnh và evidence.json local tại `docs/screenshots/desktop-enrollment-2026-10-06`; tên thư mục giữ theo runner cũ, lượt hồi quy này chạy ngày 09/10/2026.
- Theo yêu cầu kiểm thử lại trước khi đẩy dev, toàn bộ luồng desktop trên đã chạy thêm qua **Nest + MySQL thật trong DB riêng**. Run `mv135a3m` đạt: ba buổi, một registration COMPLETED, một payment 2.400.000 VND, một enrollment ACTIVE; replay sinh lịch/thanh toán và reload không tạo trùng. Parent API đọc được ba buổi, bill PAID và danh sách bill; giá bill giữ snapshot 800.000 đ/tháng sau khi học phí lớp thay đổi. Không có lỗi JavaScript. Login gặp một 429 do giới hạn đăng nhập, runner chờ đúng cửa sổ rồi đăng nhập lại thành công. [Evidence](screenshots/academic-desktop-real-2026-10-09/evidence.json) cùng 12 ảnh giữ local; DB test đã được dọn.
- Sửa lớp positioner Select để picker trong Dialog nhận click bình thường; lịch giữ tên môn trả từ BE thay cho nhãn fallback ở môn mới.
- Bốn warning unused import ở shared components cũ nằm ngoài phạm vi; file thay đổi không có warning.
- Tests/fixtures và ảnh chứng cứ giữ local theo .gitignore hiện tại. Không thêm dependency vào package.json/lockfile. Browser trong app báo thiếu sandboxPolicy; nghiệm thu UI dùng runner Playwright local.

Các luồng ngoài Academic như điểm danh/chấm bài/nghỉ/học bù chưa được tích hợp thêm ở lượt này.

## Ảnh nghiệm thu BE thật

Ảnh chụp từ database test biệt lập, không phải DB ứng dụng. Teacher/Staff không có nút đổi hoặc hủy buổi.

| Kiểm tra                                | Ảnh local                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Lớp khóa lịch tuần sau khi đã sinh buổi | [01-class-locked.png](screenshots/academic-api-2026-10-09/01-class-locked.png)                   |
| Designer nhập CSV và gửi duyệt          | [02-csv-submitted.png](screenshots/academic-api-2026-10-09/02-csv-submitted.png)                 |
| Manager đổi giờ, giữ nội dung đúng buổi | [03-session-rescheduled.png](screenshots/academic-api-2026-10-09/03-session-rescheduled.png)     |
| Teacher xem nội dung buổi đã được giao  | [04-teacher-session.png](screenshots/academic-api-2026-10-09/04-teacher-session.png)             |
| Staff xem lịch trên viewport 390px      | [05-staff-calendar-mobile.png](screenshots/academic-api-2026-10-09/05-staff-calendar-mobile.png) |

## Chạy lại kiểm thử local

Build trước khi chạy các test HTTP/browser; không build trong lúc test đang dùng `.next`. Playwright được cài trong thư mục tạm, không thêm dependency vào repo.

```powershell
# Trong FE
node --test tests/academic-api.test.cjs tests/curriculum-flow.test.cjs tests/registration-flow.test.cjs tests/registration-bill.test.cjs tests/registration-progress.test.cjs
npm run lint
npm run build
npm run test:registration:http

$academicToolDirectory = Join-Path $env:TEMP 'wdp-academic-test-tools'
npm install --prefix $academicToolDirectory --no-save --package-lock=false playwright-core
$env:ACADEMIC_PLAYWRIGHT_MODULE = Join-Path $academicToolDirectory 'node_modules/playwright-core'
# Chỉ định đường dẫn Chromium/Chrome có sẵn ở máy
$env:ACADEMIC_BROWSER_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
# Chạy cả luồng desktop tạo lớp → giáo trình → ghi danh/thanh toán qua cùng BE/DB riêng
$env:ACADEMIC_DESKTOP_REAL_FLOW = 'true'
node --test tests/academic-real-http.test.cjs

# Hồi quy desktop với fixture, không đặt DESKTOP_REAL_API_URL
$env:DESKTOP_PLAYWRIGHT_MODULE = $env:ACADEMIC_PLAYWRIGHT_MODULE
$env:DESKTOP_BROWSER_PATH = $env:ACADEMIC_BROWSER_PATH
node tests/desktop-flow.test.cjs
```

`academic-real-http.test.cjs` đọc cấu hình MySQL local của BE, chỉ chấp nhận host loopback, tự tạo/deploy migration vào DB có prefix `edugrade_web_academic_test_`, chạy Nest và Next tại cổng trống rồi đóng/dọn DB đó. Có thể dùng `ACADEMIC_TEST_DATABASE_URL` trỏ tới MySQL local riêng. Không deploy migration vào `edugrade_db` trong bài test này.

Khi bật `ACADEMIC_DESKTOP_REAL_FLOW`, runner desktop được truyền URL của chính DB test đó qua `DESKTOP_TEST_DATABASE_URL`; helper kiểm tra cả host loopback và tên DB test. Không đặt riêng DESKTOP_REAL_API_URL trỏ vào ứng dụng thật để chạy lại kịch bản biệt lập này.

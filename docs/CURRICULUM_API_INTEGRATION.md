# Nối API giáo trình và nhân viên thêm học sinh vào lớp

Contract Academic mới ngày 09/10/2026, gồm Subject/Program, review, CSV, lịch thật và đổi/hủy buổi, được cập nhật tại [ACADEMIC_API_INTEGRATION.md](ACADEMIC_API_INTEGRATION.md). Các kết quả bên dưới là lịch sử tích hợp ngày 06/10.

Ngày: 06/10/2026. Đã đọc `CLAUDE.md`, `AGENTS.md`, `.claude/rules`, memory và `CURRICULUM_SCHEDULING_API.md`; đối chiếu controller, DTO, service và Prisma của BE.

## Các sửa đổi FE đã báo trước

- Thay màn giáo trình đang dùng mock bằng học phần thật: tạo/sửa DRAFT, soạn bài theo thứ tự, soạn/cập nhật kiểm tra tháng, xem chi tiết, duyệt và tạo phiên bản mới.
- Nối bước quản lý xem trước/sinh lịch và đọc các buổi học đã sinh.
- Tái sử dụng wizard ghi danh thật; bổ sung chọn sẵn lớp, kiểm tra còn chỗ theo ngày/gói tháng và khóa idempotency khi tạo nháp.
- Chọn tài khoản Gmail sẽ mở ngay danh sách con. Khối lấy từ hồ sơ con; bỏ bước chọn môn, danh sách lớp tự lọc theo khối và hiển thị môn/lịch/học phí.
- Bổ sung quyền tại BFF và route/menu theo vai trò; dịch lỗi nghiệp vụ sang tiếng Việt.
- Ô chọn chương trình/học phần/lớp hiển thị tên từ API sau khi chọn, thay vì mã nội bộ.

## Điểm vào

| Vai trò             | Đường dẫn                                            | Hành vi                                                                                                      |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Thiết kế giáo trình | `/manager/curriculum`                                | Trang chủ sau đăng nhập; danh sách học phần thật, tìm theo tên/môn/khối và tạo nháp                          |
| Thiết kế giáo trình | `/manager/curriculum/:id`                            | Sửa học phần nháp, thêm/sửa bài học, kiểm tra tháng; tạo phiên bản mới từ học phần đã duyệt                  |
| Quản lý             | `/manager/curriculum/:id`                            | Xem nội dung và duyệt học phần; lỗi thiếu bài/thiếu kiểm tra hiển thị từ BE                                  |
| Quản lý             | `/manager/classes/:id/sessions`, `/manager/sessions` | Chọn học phần APPROVED cùng môn/khối; xem trước xung đột và sinh lịch                                        |
| Nhân viên           | `/staff/classes`                                     | Danh sách lớp thật; nút thêm học sinh mở wizard với `classId`                                                |
| Nhân viên           | `/staff/enrollments/new?classId=...`                 | Tìm/chọn phụ huynh, chọn con; điền sẵn lớp khi đúng khối; kiểm tra theo kỳ học, lập nháp và xác nhận đủ tiền |
| Nhân viên           | `/staff/schedule?classId=...`                        | Xem buổi học thật và bài/kiểm tra tháng; không có thao tác sinh lịch                                         |

`/manager/catalog` của designer và `/manager/catalog/programs/:id` cũng đọc học phần thật để đường dẫn cũ không mở lại phần soạn mock. Quản lý tiếp tục tạo chương trình ở catalog thật đã có.

Không tạo tài khoản/hồ sơ học sinh bằng nhân viên. Chỉ xác nhận thu đủ học phí thành công mới tạo Enrollment; phụ huynh không cần xác nhận thêm. FE không tự tạo roster điểm danh.

## API và phiên

- Browser gọi `/api/backend/*`; server gửi Bearer token tới `BACKEND_API_URL`. Token tiếp tục nằm trong cookie HttpOnly và dùng cơ chế refresh hiện có.
- BFF cho phép đúng GET/POST/PATCH trong contract. Designer được tạo/sửa nội dung và tạo revision; manager được duyệt/xem trước/sinh lịch; staff chỉ đọc scheduled sessions. BE vẫn kiểm tra sở hữu và quyền.
- List học phần không phân trang trong BE; scheduled sessions đọc đủ các trang 100 dòng, giữ AbortSignal. Programs/classes dùng loader phân trang sẵn có.
- Dữ liệu giữ đúng field BE: `programId`, `fromDate`, `toDate`, `sequence`, `monthKey`, `targetStudentId`, `packageMonths`, `availableSeats`, `isEligible`.
- Khi ngày/gói tháng hợp lệ, lớp được tải với `studentId`, `startDate`, `packageMonths`; BE lấy khối từ hồ sơ con. Không gửi môn hoặc khối do nhân viên nhập, không dùng `_count.enrollments` để suy ra còn chỗ.
- Ngày học phần gửi `YYYY-MM-DD`; giờ buổi học hiển thị theo `Asia/Ho_Chi_Minh`.

## Retry

- Sinh lịch: lưu UUID + nguyên body trong sessionStorage theo user/lớp trước khi gửi. Sau timeout/lỗi mạng/5xx, khóa form và cho thử lại cùng key/body, kể cả tải lại trang. Chỉ xóa thao tác sau khi thành công hoặc BE trả lỗi nghiệp vụ xác định; giữ thao tác khi lỗi phiên/quyền, 408/429 hoặc idempotency conflict.
- Không cho sinh lịch từ preview có xung đột hoặc preview không khớp lựa chọn hiện tại. BE kiểm tra lại trước khi ghi.
- Tạo registration nháp: lưu key theo user và body để thử lại cùng yêu cầu không tạo hai nháp. Xóa key khi đã nhận ID đăng ký.
- Thu tiền: giữ luồng key/body + đọc lại COMPLETED/receipt đã có. Không tự retry lỗi nghiệp vụ.

## BE cần xử lý

Xem [CURRICULUM_API_BE_NOTES.md](CURRICULUM_API_BE_NOTES.md): theo yêu cầu chạy BE test, đã khôi phục dependency/workspace, áp dụng migration giáo trình có sẵn, generate/build/start BE với Docker DB. Không sửa controller/service nghiệp vụ. API bill/phương thức thu mới còn cần bổ sung, đã ghi ở [BILL_PAYMENT_API_CONTRACT.md](BILL_PAYMENT_API_CONTRACT.md).

## Xác minh

- `node --test tests/curriculum-flow.test.cjs tests/registration-flow.test.cjs`: 29 kiểm thử đạt, gồm validation ngày/thứ tự, contract, phân trang, route/quyền BFF và retry key/body.
- `npx next build --webpack`: bản mới nhất đạt, gồm TypeScript và các route giáo trình/lớp/buổi học mới. `npm run build` đã đạt ở lượt tích hợp trước.
- `npm run lint`: 0 lỗi, 4 cảnh báo import thừa có sẵn ở `session-drawer`, `section-card`, `entity-picker-presets`, `entity-picker`; không có cảnh báo trong các file đã sửa. Đã chạy ESLint auto-fix cho phần sửa.
- `npm run test:registration:http`: 1 kiểm thử HTTP production đạt; designer soạn/sửa bài và kiểm tra, manager duyệt/xem trước/sinh lịch, retry cùng key không tạo thêm buổi, key/body khác trả conflict, staff chỉ đọc buổi và thực hiện ghi danh/thu tiền. Các request sai quyền bị BFF chặn trước khi ghi tới fixture.
- Prettier check cho toàn bộ file đã sửa/thêm: đạt; `git diff --check`: đạt.
- `node tests/desktop-flow.test.cjs`: luồng UI production đạt, từ tạo chương trình/lớp/lịch tuần, soạn và duyệt học phần, sinh ba buổi đến tra Gmail, chọn con khối 8, chọn lớp đúng khối và xác nhận học phí 2.400.000 đ. Tải lại vẫn hiện biên lai; đúng một khoản thu và một ghi danh; không có lỗi JavaScript. Nhân viên chỉ xem lịch. Ô chọn hiển thị tên được kiểm tra trực tiếp.
- Đã chụp **10 ảnh desktop 1440 × 1000**; xem [DESKTOP_ENROLLMENT_TEST.md](DESKTOP_ENROLLMENT_TEST.md) và evidence JSON được liên kết trong báo cáo. Browser trong app vẫn báo thiếu `sandboxPolicy`; đã dùng Chrome riêng qua Playwright để kiểm thử và chụp ảnh.
- Kiểm thử cập nhật: 35 logic/BFF đạt (thêm bill/time/storage/429), 33 e2e registration với MySQL thật đạt. Luồng UI desktop với BE thật đạt, replay không tạo thêm dữ liệu, phụ huynh đọc được lịch/ghi danh trong kỳ đã đóng tiền. Chứng cứ và ID ở [DESKTOP_ENROLLMENT_TEST.md](DESKTOP_ENROLLMENT_TEST.md). HTTP test production riêng vẫn dùng fixture.
- Các màn vận hành khác như nghỉ/học bù, điểm danh, chấm bài và lịch tổng cũ không thuộc lần nối API này.

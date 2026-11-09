# Tạo giáo viên bởi Quản lý và xuất CSV

## Phạm vi

Triển khai Task 2 và Task 5 theo kế hoạch người dùng đã duyệt ngày 08/11/2026. Admin trong nghiệp vụ này là `MANAGER` của BE, được Web ánh xạ thành `center_manager`. Không thêm vai trò mới, không đổi schema hoặc migrate/seed database ứng dụng, không sửa Mobile.

## Tài khoản giáo viên

- Vào **Nhân sự → Giáo viên → Tạo giáo viên**, nhập họ tên, email và mật khẩu ban đầu. Tạo thành công đóng form và làm mới danh sách. Giáo viên đăng nhập ngay; Quản lý cung cấp thông tin qua kênh riêng.
- Web BFF chỉ cho Quản lý gọi `POST /teachers`; BE tiếp tục kiểm `MANAGER`, validation email/mật khẩu, hash bcrypt, email duy nhất và ghi audit trong transaction. Không trả hoặc ghi audit mật khẩu/hash.
- Đăng ký công khai vẫn chỉ tạo Phụ huynh. Không thể gửi thêm `role` để tự tạo Giáo viên hoặc Quản lý.
- Luồng lời mời Giáo viên đã ngừng: không tạo mới, gửi lại, nhận token cũ hoặc duyệt để kích hoạt. Endpoint cũ trả `410 TEACHER_INVITATION_DISABLED`; Web hiện hướng dẫn tạo trực tiếp. Email lời mời Giáo viên cũ chưa gửi cũng bị chặn.
- Lịch sử lời mời và quyền thu hồi lời mời chưa nhận được giữ. Tài khoản, ID, lớp và lịch sử cũ không bị xóa hoặc tự kích hoạt. Tài khoản đã nhận lời mời nhưng còn khóa vẫn khóa; email trùng báo xung đột để Quản lý chủ động xử lý hồ sơ có sẵn.
- Lời mời Quản lý và luồng quên/đổi mật khẩu hiện có vẫn hoạt động. Không thêm yêu cầu đổi mật khẩu bắt buộc lần đầu.

## Tải mẫu và xuất CSV

Hai nhóm import dữ liệu trên Web có **Tải mẫu CSV** và **Xuất CSV**. Upload avatar và tệp bài nộp là upload tệp, không thuộc import dữ liệu.

| Màn hình                                 | Nội dung xuất                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Giáo viên tạo/sửa bài tập                | Câu hỏi đang trên form, gồm chỉnh sửa chưa lưu                                   |
| Chi tiết bài tập, kể cả đã giao/đóng     | Toàn bộ câu hỏi đã lưu từ API có kiểm quyền                                      |
| Thiết kế giáo trình, màn chi tiết/import | Toàn bộ bài học `LESSON` đã lưu, sắp theo thứ tự; không phụ thuộc bộ lọc so sánh |

Form trống giải thích cần nhập nội dung câu hỏi. Giáo trình đang sửa cần lưu trước khi xuất bản đã lưu. Xuất/tải mẫu không tự lưu, giao bài, duyệt, tạo revision hoặc thay nội dung database.

CSV chỉ mang nội dung mà import hỗ trợ. Lớp, tiêu đề/hướng dẫn chung của bài tập, hạn nộp, người nhận, loại/buổi kiểm tra, liên kết CLO, tên/khoảng ngày giáo trình, trạng thái duyệt và ID nội bộ không được sao lưu qua CSV. Khi tái sử dụng cần chọn lại những thông tin đó trên form. Rubric là văn bản dễ đọc trong một ô, không phải JSON.

Các cột của file xuất mới:

- Bài tập: `kind,prompt,choices,correctAnswer,rubric,maxScore,csvVersion`.
- Giáo trình: `kind,sequence,title,content,monthKey,csvVersion`.
- `csvVersion` là cột cuối, giá trị `1` trên mọi dòng. Giữ cột này khi chỉnh file do hệ thống xuất.
- Giáo trình chỉ xuất `LESSON`, `monthKey` trống; kiểm tra do Giáo viên tạo riêng theo buổi.

File dùng UTF-8 BOM, xuống dòng CRLF giữa các bản ghi, escape dấu phẩy/ngoặc kép/nội dung nhiều dòng. Lựa chọn dùng `|` phân cách; phiên bản 1 escape dấu `|` và `\` trong chính lựa chọn. Nội dung mở đầu bằng công thức hoặc dấu nháy được bảo vệ khi xuất và giải mã khi nhập, giữ quy tắc trim sẵn có. Không thay âm thầm ký tự hoặc cắt dữ liệu.

File cũ không có `csvVersion` vẫn dùng cách đọc cũ. Định dạng hoặc phiên bản không hỗ trợ được báo lỗi. Giới hạn file 5 MiB, tối đa 100 câu hỏi hoặc 1.000 bài học được giữ. Import giáo trình còn có giới hạn JSON commit 1 MiB; xuất được không bảo đảm mọi nội dung lớn đều commit được một lần.

Nhập lại toàn bộ giáo trình vào bản nháp mới hoặc chọn **Thay thế**. Chế độ **Thêm tiếp** yêu cầu thứ tự bắt đầu sau bài cuối đang có. Import vẫn đi qua xem trước/xác nhận, kiểm revision và chống lặp; không tự sửa giáo trình đã duyệt hoặc dữ liệu đang sử dụng.

## Kiểm tra

| Kiểm tra                                                    | Kết quả                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| FE hồi quy: tạo giáo viên/BFF, CSV, lỗi, grading, menu/lịch | 63/63 đạt                                                                                                           |
| BE unit toàn bộ, gồm HTTP upload và MinIO QA tạm            | 38 suite, 283/283 đạt                                                                                               |
| BE registration e2e với MySQL riêng                         | 43/43 đạt                                                                                                           |
| FE TypeScript và production build Webpack                   | Đạt; prerender 68 trang                                                                                             |
| BE TypeScript và build                                      | Đạt                                                                                                                 |
| Lint các file sửa                                           | Đạt                                                                                                                 |
| Lint toàn FE                                                | 0 lỗi; 5 warning cũ, gồm một test local                                                                             |
| Lint toàn BE                                                | Còn 124 lỗi trong các file storage/auth/AI và test không thuộc thay đổi; các file này không được sửa trong lượt này |

Các ca CSV kiểm byte thực, tiếng Việt, dấu phẩy/ngoặc kép/xuống dòng, điểm thập phân, dấu nháy/công thức, pipe/backslash, file cũ, phiên bản lạ, giới hạn, tên file và dọn object URL. File tạo bởi FE được đưa qua parser thật của BE để kiểm tra nhập lại.

Review độc lập hai phần và toàn thay đổi đều đạt; phản hồi về giải thích nút xuất khi form trống đã được sửa và review lại. Trước push đã đồng bộ FE `dccd6a3` và BE `1f23dfd` có chat/web push, giữ đầy đủ remote, cài đúng lockfile và tạo lại Prisma Client. Kết quả trong bảng là lượt chạy lại trên bản đã đồng bộ; 124 lỗi lint BE nằm ngoài file sửa, gồm 8 lỗi test chat từ commit mới. Một test local đếm cứng tám menu đã được cập nhật để kiểm menu có Chat và không trùng/quá quyền; không sửa menu ứng dụng để giữ kỳ vọng cũ.

Chromium production với API Nest/MySQL thật đạt **7/7 nhóm**, desktop 1536px và màn hình 390px:

1. Quản lý tạo Giáo viên ACTIVE trên UI; tên hiện trong bảng và tài khoản mới đăng nhập được; response/audit không lộ mật khẩu/hash.
2. BE/BFF từ chối các vai trò khác và role injection qua đăng ký công khai; đăng ký Phụ huynh vẫn đúng vai trò.
3. Lời mời Giáo viên cũ không tạo/nhận/gửi lại/duyệt được; history và lời mời Quản lý vẫn hoạt động.
4. Tải mẫu/xuất câu hỏi chưa lưu, kiểm byte và ký tự đặc biệt, hướng dẫn form trống; preview thật không tạo assignment, nhập lại trên UI rồi lưu nháp mới tạo đúng một bản.
5. Xuất bài đã giao và đã đóng; dữ liệu/trạng thái nguồn không đổi.
6. Xuất đủ bài học đã lưu dù bộ lọc không có bài; tải mẫu, preview và commit vào nháp mới, giữ nguyên giáo trình nguồn và chặn người khác. Preview không tạo bài; commit rõ ràng mới tạo ba bài.
7. Không có pageerror, hydration mismatch hoặc tràn ngang trong các lượt desktop/màn nhỏ được kiểm tra.

Database trình duyệt có tên QA riêng đã drop thành công; cổng 3210/3211 và MinIO QA tạm được dọn. Registration e2e cũng tự dọn database. Không gửi email/push ra ngoài, không dùng AI trong lượt kiểm thử này. Báo cáo chi tiết và byte tải thực ở `../implementation-20261108/QA-report.md` và `task25-results.json`.

Bằng chứng local ở `../implementation-20261108/`: kế hoạch, báo cáo worker/review, các file kết quả Jest, harness và ảnh/download trình duyệt. Các test FE local tiếp tục tuân theo `.gitignore` hiện tại (`tests/`); test BE được lưu cùng source. Lượt kiểm tra dùng database có tên QA riêng và MinIO tạm không gắn volume ứng dụng.

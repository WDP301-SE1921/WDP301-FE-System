# Hồi quy theo vai trò và lỗi hiển thị JSON — 16/10/2026

## Phạm vi

Rà các màn đang được sử dụng bởi Quản lý, Nhân viên, Giáo viên, Thiết kế giáo trình trên Web; đối chiếu vai trò Phụ huynh qua API và ứng dụng Mobile. Backend hiện có đúng năm vai trò này, không có tài khoản Học sinh hoặc Founder riêng.

Kiểm thử dùng database MySQL riêng, không reset/seed database ứng dụng. API nghiệp vụ là Nest và MySQL thật; chỉ các dịch vụ ngoài được thay bằng fixture hoặc để trống như ghi ở phần giới hạn.

## Lỗi tìm thấy và đã sửa

| Vị trí                                      | Nguyên nhân                                                                                              | Hành vi sau sửa                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thông báo lỗi API, biểu mẫu, error boundary | `ZodError.message` là mảng JSON; lỗi backend chưa có bản dịch cũng có thể mang JSON lồng trong `message` | Dùng chung bộ diễn giải lỗi; hiển thị tên trường và hướng dẫn tiếng Việt, giữ thông báo nghiệp vụ đã dịch; dữ liệu kỹ thuật không nhận diện được dùng lời nhắc phù hợp |
| Lịch sử email                               | Hiện thẳng `lastError` được lưu từ dịch vụ gửi mail                                                      | Hiện hướng dẫn kiểm tra người nhận/cấu hình; không in JSON phản hồi của dịch vụ                                                                                        |
| Chấm bài AI                                 | Hiện thẳng lỗi worker; job FAILED không có lỗi thì không giải thích                                      | Luôn giải thích cách thử lại hoặc chấm tay, giữ nguyên bước lưu/duyệt/công bố của Giáo viên                                                                            |
| Nhập CSV giáo trình                         | Một số mã chẩn đoán mới có thể hiện như mã kỹ thuật                                                      | Diễn giải mã hiện có và dùng hướng dẫn theo trường khi gặp mã mới                                                                                                      |
| Chi tiết nhật ký                            | Bản ghi cũ có thể lưu snapshot thành chuỗi JSON thay vì object                                           | Giải mã snapshot gốc thành trường/danh sách; giữ nguyên nội dung ghi chú/bài học và escape HTML; giới hạn dữ liệu quá lớn hoặc quá sâu                                 |
| Nghỉ/học bù                                 | Mã trạng thái/lý do chưa biết được dùng trực tiếp làm nhãn                                               | Dùng nhãn tiếng Việt dự phòng                                                                                                                                          |
| Sức chứa phòng                              | Giới hạn trên có thể dùng thông báo chung của kiểu số                                                    | Thông báo rõ sức chứa tối đa 10.000                                                                                                                                    |
| Phạm vi báo cáo                             | Giá trị rỗng tương ứng toàn lớp nhưng Select hiển thị “Chọn…”                                            | Hiện sẵn “Toàn lớp”; khi gửi API vẫn bỏ studentId, chọn từng học sinh vẫn gửi đúng ID                                                                                  |

`ApiError` vẫn giữ `code`, `status`, `requestId`, `details` cho xử lý chương trình. Các metadata này không được đổ lên giao diện. Không đổi endpoint, phân quyền, schema database hoặc quy trình duyệt.

Rà tĩnh lần cuối đã đi từ 80 entrypoint qua 367 file phụ thuộc. Không phát hiện JSX trực tiếp render object, `response/details`, `JSON.stringify` hay khối dump `<pre>/<code>` ở các màn đang mount ngoài những đường đã xử lý. `JSON.stringify` còn lại dùng cho lưu trữ, key hoặc so sánh dữ liệu. Kết quả rà tĩnh không thay thế kiểm thử lúc chạy.

Rà thêm Mobile Parent: API normalizer hiện chỉ dùng code/status để chọn thông báo tiếng Việt, bỏ `message/details/requestId` từ backend; không phát hiện đường hiển thị JSON thô ở các màn đang mount. Không cần sửa Mobile trong lượt này.

## Kết quả kiểm tra tự động

| Bộ kiểm tra                                                 | Kết quả                                     |
| ----------------------------------------------------------- | ------------------------------------------- |
| FE: diễn giải lỗi, snapshot nhật ký, AI/import, menu/Kanban | 29/29 đạt                                   |
| FE TypeScript                                               | Đạt                                         |
| FE production build                                         | Đạt, 61 trang được tạo trong bước prerender |
| FE lint                                                     | 0 lỗi, 4 warning cũ ngoài file thay đổi     |
| BE unit                                                     | 15 suite, 124/124 đạt                       |
| BE e2e MySQL                                                | 7 suite, 66/66 đạt, không bỏ qua ca nào     |
| Mobile Parent Jest                                          | 32 suite, 436/436 đạt                       |
| Mobile TypeScript và Expo lint                              | Đạt                                         |

BE e2e gồm auth, registration, academic, curriculum, demo seed, dashboard seed và health. Mã dashboard seed đang có sẵn trong working tree BE cũng được kiểm thử; không đưa các thay đổi BE đó vào commit sửa lỗi FE.

29 ca FE có dùng Zod thật để tái hiện lỗi account/assignment, JSON lồng, giới hạn số/chuỗi, thông báo mới chưa biết, vòng tham chiếu, payload quá lớn, prototype và dữ liệu thành công. Các test và ảnh local giữ theo quy định ignore hiện tại của repo.

## Kiểm tra trình duyệt

Production Chromium dùng API Nest/MySQL thật trên cổng riêng. Desktop 1536px và màn hình nhỏ 390px được kiểm tra theo các luồng trong harness.

| Nhóm                      | Kết quả và phạm vi                                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hồi quy theo vai trò      | 11/11 nhóm đạt; 48 lượt trang: Quản lý 21, Giáo viên 14, Thiết kế giáo trình 2, Nhân viên 11                                                                                                                                                     |
| Giáo trình và import      | 11/11 nhóm đạt: kiểm tra cấu trúc, người duyệt đúng môn, chặn bỏ qua thẩm định, trả nháp, duyệt hai cấp, bài học không sinh kiểm tra tháng, revision giữ dữ liệu cũ, quyền import, gắn loại kiểm tra/buổi, CSV → preview → sửa đáp án → lưu nháp |
| Dashboard, lịch và layout | 11/11 nhóm đạt: số liệu API khớp DB, giới hạn quyền/BFF, dashboard và XLSX thật, Kanban/chuyển tuần/detail, bảng tài khoản/danh mục/thanh toán, lời mời, menu active, tìm không dấu, thông báo và sidebar reload                                 |

Luồng thao tác theo vai trò:

- **Quản lý:** đăng nhập, tạo/sửa nhân viên, xác nhận giáo trình sau khi giáo viên duyệt, đọc email lỗi đã lưu, nhận lỗi API JSON rồi thử lại với API thật.
- **Nhân viên:** tạo đơn nghỉ, duyệt đơn phụ huynh, chọn đăng ký chưa thu, xác nhận thu tiền, mở và reload biên lai; xác nhận chỉ tạo một payment.
- **Giáo viên:** chuẩn bị/chốt điểm danh; bài nộp trắc nghiệm → chấm → duyệt → công bố; tự luận → đề xuất AI → kiểm tra/lưu → duyệt → công bố; job AI lỗi; tạo/tải báo cáo PDF và XLSX; gửi phản hồi giáo trình; duyệt chuyên môn.
- **Thiết kế giáo trình:** nhận/xử lý phản hồi, soạn/gửi duyệt và theo dõi giáo trình; chu kỳ revision và CSV được kiểm tra trong bộ giáo trình.
- **Phụ huynh:** nộp bài và đọc kết quả đã công bố qua API thật; đơn nghỉ được Nhân viên xử lý; kết hợp 436 kiểm tra Mobile, không tính là kiểm thử thiết bị thật.

Lượt quét theo vai trò không ghi nhận pageerror, hydration mismatch, JSON/object thô hoặc tràn ngang. Snapshot lỗi email/AI và lỗi API không nhận diện được cố tình chứa JSON để kiểm tra đường hiển thị lỗi, sau đó bỏ interception và thử lại thành công. Kiểm tra quyền từ bộ layout xác nhận BFF từ chối những truy vấn analytics/tài chính/lớp giáo viên ngoài quyền.

## Bằng chứng local và giới hạn

- `../audit-20261016-be-unit.json`
- `../audit-20261016-be-e2e.json`
- `../audit-20261016-fem-jest.json`
- `../role-qa-20261016/`: harness trình duyệt, kết quả và ảnh.
- `../curriculum-qa-20261014/results.json`, `layout-results.json`, `layout-*.png`: hai bộ giáo trình/layout được chạy lại ngày 16/10; tên thư mục giữ ngày tạo harness.
- `tests/api-error-presentation.test.cjs`, `tests/error-message-adversarial.test.cjs`, `tests/audit-change-details.test.cjs`, `tests/teacher-curriculum-presentation.test.cjs`, `tests/layout-navigation-schedule.test.cjs`.

Chưa chạy ứng dụng Parent trên thiết bị Android/iOS thật. AI dùng test double để kiểm tra quy trình; không xác nhận chất lượng chấm của provider thật. SMTP và S3 bên ngoài không được cấu hình trong lượt này. Các ca hiển thị lỗi dùng fixture có đánh dấu để xác nhận không lộ payload; thao tác nghiệp vụ còn lại gọi API thật.

Hai npm script FE cũ `test:registration` và `test:registration:http` hiện trỏ tới test local không tồn tại; lượt này chạy trực tiếp các file kiểm thử thực có, không tính hai script đó là đã đạt.

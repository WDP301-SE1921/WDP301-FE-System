# Thông tin môn học, lớp học và giáo trình

Bạn thay các ô `CHƯA ĐIỀN` bằng dữ liệu của trung tâm. Có thể hoàn thiện một môn của một khối trước, rồi bổ sung các môn/khối còn lại.

“Khối 6–9” là khối của học sinh. “Toán 8A”, “Toán 8B” là các lớp học tại trung tâm. Các lớp cùng môn và khối dùng chung giáo trình, còn giáo viên, học phí, sĩ số và lịch tuần được cấu hình theo từng lớp.

## 1. Thông tin cần có

| Phần           | Bạn cung cấp                                                     | Dùng để làm gì                                                   |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Chương trình   | Tên chương trình, tên môn thống nhất, khối 6/7/8/9               | Tạo chương trình và xác định lớp phù hợp với khối của con        |
| Lớp            | Tên lớp, chương trình tương ứng, sĩ số tối đa, học phí mỗi tháng | Tạo lớp tại trung tâm                                            |
| Giáo viên      | Tên và email tài khoản giáo viên                                 | Đối chiếu giáo viên đang hoạt động để phân công và sinh buổi học |
| Lịch tuần      | Thứ học, giờ bắt đầu và kết thúc của từng khung giờ              | Mở đăng ký và xác định các ngày có buổi học                      |
| Học phần       | Tên học phần, ngày bắt đầu, ngày kết thúc                        | Xác định khoảng áp dụng giáo trình                               |
| Bài học        | Thứ tự từ 1, tên bài và nội dung cho từng buổi học thường        | Gắn nội dung vào các buổi học                                    |
| Kiểm tra tháng | Tháng, tên bài kiểm tra và nội dung kiểm tra                     | Gắn kiểm tra vào buổi cuối của từng tháng                        |

API tạo lớp cho phép chưa gán giáo viên, nhưng để sinh lịch học phải có giáo viên đang hoạt động. Lớp được tạo ở trạng thái chưa mở đăng ký; lưu lịch tuần rồi mới mở đăng ký.

Bạn có thể ghi tên chương trình và email giáo viên; ID liên kết được lấy từ hệ thống khi tạo dữ liệu.

## 2. Danh sách môn và nội dung theo khối

Toán, Vật lý, Hóa học và Sinh học là danh sách trong mô tả dự án. Bạn sửa theo các môn trung tâm thực sự dạy; điền `Có` hoặc `Không` ở cột mở môn. Đây là bảng thu thập nội dung, chưa phải danh sách chương trình đã được tạo.

Các chủ đề ghi theo thứ tự dạy. Tài liệu/bộ sách giúp xác định nội dung cần bám theo; đây là thông tin soạn giáo trình, không phải trường bắt buộc của API tạo lớp.

| Khối | Môn      | Có mở môn? | Chủ đề/chương theo thứ tự | Tài liệu/bộ sách/niên khóa |
| ---- | -------- | ---------- | ------------------------- | -------------------------- |
| 6    | Toán     | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 6    | Vật lý   | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 6    | Hóa học  | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 6    | Sinh học | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 7    | Toán     | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 7    | Vật lý   | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 7    | Hóa học  | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 7    | Sinh học | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 8    | Toán     | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 8    | Vật lý   | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 8    | Hóa học  | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 8    | Sinh học | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 9    | Toán     | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 9    | Vật lý   | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 9    | Hóa học  | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |
| 9    | Sinh học | CHƯA ĐIỀN  | CHƯA ĐIỀN                 | CHƯA ĐIỀN                  |

## 3. Các lớp cần mở tại trung tâm

Mỗi dòng là một lớp. Một chương trình môn/khối có thể có nhiều lớp.

| Tên lớp   | Tên chương trình | Môn       | Khối      | Giáo viên / email | Sĩ số tối đa | Học phí tháng (VND) |
| --------- | ---------------- | --------- | --------- | ----------------- | ------------ | ------------------- |
| CHƯA ĐIỀN | CHƯA ĐIỀN        | CHƯA ĐIỀN | CHƯA ĐIỀN | CHƯA ĐIỀN         | CHƯA ĐIỀN    | CHƯA ĐIỀN           |

Sĩ số là số nguyên từ 1 đến 1.000; học phí tháng từ 0 trở lên. Ghi số tiền bằng số, ví dụ `800000`.

### Lịch tuần từng lớp

Mỗi khung giờ ghi một dòng. Thứ và giờ theo Việt Nam, giờ dạng `HH:mm`; ví dụ thứ 2, `18:00`–`20:00`. Giờ kết thúc phải sau giờ bắt đầu; các khung giờ của lớp không được chồng nhau.

| Tên lớp   | Thứ học   | Bắt đầu   | Kết thúc  |
| --------- | --------- | --------- | --------- |
| CHƯA ĐIỀN | CHƯA ĐIỀN | CHƯA ĐIỀN | CHƯA ĐIỀN |

## 4. Giáo trình chi tiết cho từng môn và khối

Sao chép mẫu học phần dưới đây cho mỗi học phần của mỗi môn/khối có mở. Một chương có thể cần nhiều buổi; chia thành các bài theo từng buổi để hệ thống xếp lịch.

### Học phần: CHƯA ĐIỀN

- Tên chương trình: CHƯA ĐIỀN
- Môn: CHƯA ĐIỀN
- Khối: CHƯA ĐIỀN
- Ngày bắt đầu (`YYYY-MM-DD`): CHƯA ĐIỀN
- Ngày kết thúc (`YYYY-MM-DD`): CHƯA ĐIỀN
- Mục tiêu học phần: CHƯA ĐIỀN
- Tài liệu/bộ sách: CHƯA ĐIỀN

#### Bài học 1

- Thứ tự: 1
- Tên bài: CHƯA ĐIỀN
- Nội dung giảng dạy: CHƯA ĐIỀN
- Bài tập / hướng dẫn / đáp án nếu có: CHƯA ĐIỀN
- Tài liệu tham khảo nếu có: CHƯA ĐIỀN

Sao chép phần bài học cho bài 2, 3, 4… Nội dung giảng dạy là phần bắt buộc; mục tiêu, bài tập và tài liệu có thể viết chung trong nội dung bài. API hiện lưu thứ tự, tên bài và nội dung, chưa có trường riêng cho từng mục phụ này.

#### Kiểm tra tháng: CHƯA ĐIỀN

- Tháng (`YYYY-MM`): CHƯA ĐIỀN
- Tên bài kiểm tra: CHƯA ĐIỀN
- Phạm vi kiến thức: CHƯA ĐIỀN
- Nội dung / câu hỏi kiểm tra: CHƯA ĐIỀN
- Đáp án / hướng dẫn chấm nếu có: CHƯA ĐIỀN

Lặp phần kiểm tra cho mỗi tháng có buổi học trong khoảng học phần. API hiện lưu tháng, tên bài kiểm tra và nội dung; phạm vi/đáp án có thể viết trong nội dung.

## 5. Quy tắc để hoàn tất việc tạo lịch

- Dùng nhất quán tên môn và khối giữa chương trình, lớp và giáo trình.
- Khoảng học phần tối đa 366 ngày, ngày đầu và cuối đều thuộc khoảng học phần. Khoảng sinh lịch phải nằm trong khoảng này.
- Thứ tự bài học thường bắt đầu từ 1 và liên tục. Một buổi thường gắn một bài; kiểm tra tháng có nội dung riêng và chiếm buổi cuối tháng.
- Cần đủ bài cho lớp có nhiều buổi thường nhất trong các lớp cùng môn/khối. Số bài cần có được đối chiếu từ lịch tuần và khoảng ngày, không tự mặc định 8 hay 12 bài mỗi tháng.
- Cần một bài kiểm tra cho mỗi tháng có lịch học. Người thiết kế soạn nội dung, quản lý duyệt rồi mới xem trước và sinh buổi học.
- Xử lý giờ trùng của lớp hoặc giáo viên trong bước xem trước trước khi sinh lịch.

Thứ tự đưa dữ liệu vào hệ thống: tạo chương trình → tạo lớp và phân công giáo viên → lưu lịch tuần → soạn học phần/bài/kiểm tra → quản lý duyệt → xem trước và sinh lịch. Sau khi có lịch tuần, quản lý có thể mở đăng ký lớp; nhân viên dùng luồng chọn phụ huynh/con, lập bill và xác nhận thanh toán đã nối API.

## 6. Nguồn đối chiếu

- [API giáo trình và sinh lịch của BE](../../WDP301-BE-System/CURRICULUM_SCHEDULING_API.md).
- [DTO tạo chương trình, lớp và lịch tuần](../../WDP301-BE-System/src/modules/registration-flow/dto/registration-flow.dto.ts).
- [DTO học phần, bài học và kiểm tra tháng](../../WDP301-BE-System/src/modules/curriculum-scheduling/curriculum-scheduling.dto.ts).

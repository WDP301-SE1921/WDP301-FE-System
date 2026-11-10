# Luồng Academic trên web

Ngày cập nhật: 10/11/2026 (đợt chuẩn bị khóa, mục tiêu khóa học, hủy buổi và ngày nghỉ; xem mục "Cập nhật 10/11/2026" bên dưới). Phạm vi: Manager, Designer, Teacher và Staff trên WDP301-FE-System.

Thay đổi nghiệp vụ: giữ kiểm tra cấu trúc giáo trình; giáo viên phụ trách khóa học duyệt nội dung trước khi Quản lý xác nhận áp dụng. Bài kiểm tra được tạo riêng trong luồng bài tập của giáo viên, chọn buổi và loại 15 phút/một tiết/giữa kỳ/học kỳ. Lịch mới không tự chèn kiểm tra vào cuối tháng. Lịch và nội dung đã dùng giữ nguyên; chỉnh giáo trình bằng nháp cho kỳ tiếp theo.

## Từ danh mục đến buổi học

```mermaid
flowchart TD
    A[Manager tạo môn học] --> B[Manager tạo khóa học theo môn và khối]
    B --> C[Manager tạo lớp, chọn giáo viên và lịch tuần]
    B --> B1[Designer soạn Mục tiêu khóa học]
    B1 --> D[Designer tạo giáo trình cho khóa học]
    D --> E[Soạn bài học hoặc nhập CSV, gắn mục tiêu vào bài]
    E --> F[Kiểm tra cấu trúc rồi Gửi duyệt, chọn giáo viên duyệt nội dung]
    F --> R{Giáo viên duyệt nội dung}
    R -->|Yêu cầu sửa kèm nhận xét| E
    R -->|Đồng ý nội dung, duyệt cùng bộ mục tiêu đủ điều kiện| G{Manager Duyệt áp dụng}
    G -->|Yêu cầu sửa kèm lý do| E
    G -->|Duyệt| H[Giáo trình đã duyệt]
    C --> I[Manager xem trước lịch]
    H --> I
    I --> J[Tạo lịch học]
    J --> K[Teacher và Staff xem lịch và nội dung]
    J --> L[Manager xem trước đổi giờ hoặc xác nhận hủy]
    C --> M[Mở đăng ký]
    M --> N[Staff chọn phụ huynh, con và lớp]
    N --> O[Lập đăng ký nháp và bill]
    O --> P[Nhận học phí và xác nhận biên lai]
    P --> Q[Ghi danh thành công]
```

Quản lý theo dõi từng khóa ở checklist **Chuẩn bị khóa** (Thông tin khóa → Lớp & giáo viên → Mục tiêu khóa học → Giáo trình → Lịch học); mỗi bước chỉ hiện nút cho đúng vai trò phụ trách. Lớp và giáo trình cùng gắn với một khóa học. Hai khóa cùng môn và khối vẫn có giáo trình riêng. Có thể soạn giáo trình trước khi tạo lớp; gửi thẩm định cần giáo viên đang phụ trách một lớp của cùng khóa học. Mở đăng ký cần lớp hoạt động và có lịch tuần, không bắt buộc đã sinh buổi.

## Bố cục và thao tác trên web

- Dashboard Quản lý theo mẫu cam/kem có sáu KPI (ba thẻ/hàng), biểu đồ doanh thu/buổi hoàn thành sáu tháng, phân bố hồ sơ học sinh theo khối, hoạt động gần đây/thống kê hoạt động và lịch nhanh. Chọn kỳ bằng nút khoảng ngày ở đầu trang; học phí và export Excel theo kỳ, biểu đồ tháng lấy sáu tháng kết thúc tại kỳ đó. Số hồ sơ/tài khoản/lớp là số hiện tại. Phân bố dùng khối thật của hồ sơ hoạt động; thống kê hoạt động ghi rõ nếu chỉ lấy 100 sự kiện mới nhất. Dashboard Giáo viên cùng tông màu, hiển thị lớp được giao, lịch hôm nay, bài nộp và việc chấm/duyệt/công bố. Theme không đổi màu các màn hình còn lại.
- Danh sách tài khoản, lời mời, danh mục và thanh toán dùng bảng có bộ lọc/phân trang; bảng cuộn trong vùng riêng khi màn hình hẹp. Lớp và giáo trình dùng card gọn, tối đa bốn card trên màn rộng. Biểu mẫu tạo và danh sách nằm cạnh nhau khi đủ chiều rộng, xếp dọc trên mobile.
- Lịch học có ba cách xem **Ngày / Tuần / Kanban**. Kanban chia theo bảy ngày, sắp buổi theo giờ và hiển thị trạng thái thật. Dùng Tuần trước/Tuần sau/Hôm nay, lọc lớp rồi chọn card để mở chi tiết. Manager vẫn đổi/hủy buổi qua luồng xác nhận hiện có; Teacher/Staff xem lịch. Không kéo thả card để đổi lịch.
- Menu chỉ đánh dấu một mục khớp đường dẫn sâu nhất; Designer chỉ có một lối vào giáo trình. Ô tìm kiếm hoặc Ctrl/⌘ K mở các màn hình/tác vụ thuộc quyền của vai trò hiện tại, hỗ trợ tìm không dấu. Chuông của Manager/Teacher đọc năm thông báo lớp mới nhất; không hiển thị số chưa đọc giả.

## Các thao tác theo vai trò

1. **Manager chuẩn bị khóa và lớp.** Ở Khóa học & giáo trình, tạo khóa học chọn môn, khối 6–9 và số buổi mỗi tuần (mỗi lớp của khóa học đúng số buổi này); danh mục môn nằm ở tab riêng. Tạo lớp bằng wizard 3 bước: thông tin, lịch học (đúng số buổi/tuần của khóa), giáo viên và phòng. Mở đăng ký khi cần.
2. **Designer soạn Mục tiêu khóa học trước, rồi giáo trình.** Tạo bộ mục tiêu (nguồn căn cứ không bắt buộc), thêm hoặc dán nhiều mục tiêu, gắn vào bài bằng "Gắn bài" (nhiều bài cùng lúc) hoặc "Gắn mục tiêu" ở từng bài. Giáo trình: chọn đúng khóa học, tên và khoảng ngày; thêm bài liên tục từ 1 hoặc nhập CSV bài học. File có bước xem trước và lỗi từng dòng; thay toàn bộ bài cần xác nhận. Không soạn/import kiểm tra tháng trong giáo trình.
3. **Designer gửi duyệt.** Giữ nút Kiểm tra giáo trình để kiểm tra cấu trúc, sau đó chọn giáo viên duyệt nội dung (thứ tự gợi ý: giáo viên đang dạy khóa này, rồi giáo viên dạy cùng môn, rồi mọi giáo viên đang hoạt động; chỉ gửi một lần, cảnh báo nếu còn mục tiêu chưa gắn bài nhưng không chặn). Gửi thành công chuyển sang Chờ giáo viên duyệt nội dung và khóa nội dung nháp.
4. **Giáo viên và Manager duyệt theo thứ tự.** Giáo viên được chỉ định đọc từng bài tại `/teacher/curriculum`, đồng ý nội dung hoặc trả lại nháp với nhận xét bắt buộc. Chỉ sau khi giáo viên đồng ý, Manager được Xác nhận áp dụng. Manager trả lại nháp sẽ hủy kết quả thẩm định cũ. Bản đã duyệt giữ nguyên; Chuẩn bị cho kỳ tiếp theo yêu cầu ngày bắt đầu sau kỳ gốc và sau hôm nay, rồi thực hiện lại đầy đủ quy trình duyệt.
5. **Manager tạo lịch học.** Vào Tạo lịch học (`/manager/sessions`, hoặc nút ở checklist). Lần đầu mỗi buổi gán bài theo vị trí buổi từ đầu kỳ, bỏ qua ngày nghỉ; lớp đã có buổi thì bắt đầu từ bài liền sau bài của buổi cuối chưa hủy, và khoảng ngày đã có buổi từ ngày bắt đầu trở đi bị chặn (`SESSIONS_AFTER_RANGE_EXIST`). Chọn lớp, giáo trình được xác nhận của đúng khóa và khoảng ngày. Mỗi buổi mới dùng một bài học thường, kể cả buổi cuối tháng. Xem trước số bài và xung đột rồi tạo lịch học; đổi đầu vào/hết hạn phải xem trước lại. Lịch sử dùng tên giáo trình và khoảng áp dụng thay nhãn phiên bản kỹ thuật.
6. **Teacher và Staff đọc dữ liệu.** Teacher xem lớp/buổi được giao, giáo trình đã duyệt và bản chờ duyệt nội dung được chỉ định. Staff xem lịch phục vụ ghi danh. Hai vai trò không có nút sinh/đổi giờ/hủy buổi. Kiểm tra mới do Teacher tạo tại Bài tập / Đề kiểm tra, chọn đúng buổi chưa kết thúc được giao và loại kiểm tra; không thay lessonId của buổi.
7. **Manager xử lý một buổi.** Chỉ đổi/hủy buổi chưa diễn ra và còn lên lịch. Đổi giờ nhập giờ Việt Nam và lý do, xem trước rồi xác nhận. BE kiểm tra cùng tháng/phạm vi giáo trình, thứ tự bài, trùng lịch và các ràng buộc của học viên. Hủy buổi có ba cách, theo thứ tự khuyên dùng: "Đổi sang ngày khác" (giữ bài, mặc định), "Hủy và dời bài sang buổi sau" (các buổi sau lấy bài sớm hơn một bài, lớp chậm một bài, có bảng so sánh), "Hủy, bỏ bài này" (bài không xếp lại, các buổi sau giữ nguyên bài; riêng buổi cuối cùng đã tạo thì bài quay lại ở lần tạo lịch học sau, buổi ở giữa thì bài bị bỏ). Hủy cần lý do và xác nhận; đơn nghỉ đang chờ hoặc đã duyệt chặn việc hủy. Lịch và chi tiết được tải lại sau khi thành công; phụ huynh có học sinh trong buổi nhận thông báo.
9. **Manager đặt ngày nghỉ trung tâm.** Ở Lịch học, "Ngày nghỉ trung tâm": thêm khoảng ngày (tối đa 92 ngày, không trùng ngày nghỉ khác) với lý do. Thêm hoặc sửa ngày nghỉ không tự hủy buổi và không gửi thông báo; hệ thống chỉ liệt kê buổi bị ảnh hưởng. "Hủy và dời bài" hủy theo lô (lô gom theo lớp, tối đa 200 buổi, một lớp không bị tách giữa hai lô) và phụ huynh nhận một thông báo cho mỗi lớp; nếu có buổi không hủy được thì chưa buổi nào của lô bị hủy, bỏ buổi đó ra rồi xem trước lại. Tạo lịch sau đó bỏ qua ngày nghỉ và nối tiếp bài. Mọi nhân sự web (Quản lý, Nhân viên, Giáo viên, Thiết kế giáo trình) xem được ngày nghỉ; chỉ Quản lý thêm, sửa, xóa và hủy lô. Giới hạn đã chấp nhận: đổi sang ngày khác hoặc tạo buổi lẻ vào ngày nghỉ không bị chặn, chỉ cảnh báo.
10. **Staff ghi danh và thu học phí.** Tra email phụ huynh, chọn con; khối lấy từ hồ sơ. Chọn lớp phù hợp, ngày bắt đầu và số tháng. Lập đăng ký nháp để xem bill; lúc này chưa có thanh toán/ghi danh thành công. Khi đã nhận đủ học phí, nhập số biên lai, xác nhận đã nhận tiền rồi xác nhận thanh toán. Kết quả: đăng ký Hoàn tất, bill Đã thanh toán, ghi danh Đang học. Reload hoặc tra cứu lại vẫn đọc được bill/biên lai.

Phụ huynh có tài khoản và hồ sơ con trên mobile; không tạo tài khoản đăng nhập riêng cho học sinh. Test tạo các điều kiện này trong DB riêng, không gửi email thật.

## Các điểm phải giữ đúng

- Học phần: Bản nháp → Chờ duyệt → Đã duyệt → Lưu trữ; yêu cầu sửa trả về Bản nháp kèm ghi chú.
- Không dùng giáo trình của khóa khác dù cùng môn/khối. Kiểm tra cấu trúc hợp lệ chưa bảo đảm đủ bài cho mọi lịch; bước xem trước sinh lịch kiểm tra đủ bài học thường cho từng buổi.
- Lịch tuần bị khóa khi có ghi danh chưa kết thúc, học viên chuyển vào chưa kết thúc hoặc bất kỳ buổi đã sinh, kể cả buổi đã hủy. Đổi giờ một buổi dùng chức năng riêng.
- Import, sinh lịch, đổi/hủy buổi và thanh toán phải dùng lại đúng dữ liệu/khóa khi retry. Reload hoặc gửi lại không được tạo bản ghi trùng.
- Mọi giờ hiển thị trên lịch và form đổi giờ là giờ Việt Nam. Teacher không đọc lớp của giáo viên khác; Staff/Designer không thực hiện lệnh thuộc quyền Manager.

## Cập nhật 10/11/2026

- Thuật ngữ: "Mục tiêu khóa học" (trước đây gọi là chuẩn đầu ra, CLO) và "Tạo lịch học" (trước đây Sinh lịch).
- Giáo viên bấm "Đồng ý nội dung" thì giáo trình và bộ mục tiêu đủ điều kiện (có mục tiêu, mỗi mục tiêu gắn ít nhất một bài) cùng được duyệt nội dung; mục tiêu chưa gắn bài không chặn giáo trình, bộ đó giữ bản nháp. Quản lý "Duyệt áp dụng" duyệt kèm bộ. Cảnh báo mục tiêu chưa gắn bài hiện lúc gửi duyệt và lúc giáo viên duyệt, đều không chặn giáo trình.
- CSV giáo trình: xuất ra có cột `csvVersion` (1); để trống khi sửa rồi nhập lại. "Thay toàn bộ bài học" gỡ mục tiêu đã gắn cho các bài đó.
- E2E trình duyệt thật (Playwright, project `academic`) phủ các luồng này trên BE và DB thử riêng: xem `e2e/README.md`.

## Kịch bản nghiệm thu mẫu

| Giai đoạn     | Thao tác mẫu                                                                                  | Kết quả mong đợi                                            |
| ------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Lớp           | Khóa Toán khối 8; lớp 8A, giáo viên thật, học phí 800.000 đ/tháng; thứ 2/4/6 lúc 18:00–20:00  | Tạo/lưu/mở đăng ký thành công                               |
| Giáo trình    | Học phần 04–08/01/2027; ba bài học; kiểm tra cấu trúc → Gửi duyệt, chọn giáo viên → Đồng ý nội dung → Duyệt áp dụng | Nội dung được duyệt theo hai cấp cho đúng khóa              |
| Lịch          | Xem trước rồi sinh lịch                                                                       | Ba buổi dùng ba bài học thường, không tự chèn kiểm tra      |
| Ghi danh      | Chọn con khối 8, ngày 04/01/2027 và gói ba tháng                                              | Bill 2.400.000 đ; lớp khối 6 không được chọn cho con khối 8 |
| Thanh toán    | Xác nhận đã nhận tiền và số biên lai                                                          | Một khoản thu, một ghi danh ACTIVE, đăng ký COMPLETED       |
| Tải lại/retry | Reload biên lai; replay sinh lịch và xác nhận thanh toán                                      | Vẫn ba buổi, một khoản thu, một ghi danh                    |
| CSV/review    | Nhập CSV UTF-8 nhiều dòng; gửi duyệt, Manager trả sửa, Designer gửi lại và Manager duyệt      | Nội dung đúng và trạng thái đúng ở từng vai trò             |
| Đổi/hủy       | Manager đổi giờ qua preview rồi hủy một buổi khác, gửi lại cùng yêu cầu                       | Revision/trạng thái cập nhật; không tạo thao tác lặp        |
| Phân quyền    | Teacher/Staff mở lịch; Teacher đọc giáo trình; Staff mở màn 390px                             | Dữ liệu thật, quyền đúng, không tràn ngang                  |

Luồng mẫu đã đạt qua trình duyệt với Nest/MySQL thật, run `mv135a3m`: ba buổi, một khoản thu 2.400.000 đ, một ghi danh ACTIVE; retry/reload không tạo trùng. CSV/review, đổi-hủy buổi, nội dung Teacher/Staff và màn 390px cũng đạt. Có [12 ảnh/evidence của luồng desktop thật](screenshots/academic-desktop-real-2026-10-09/evidence.json).

Kết quả chạy lại được cập nhật tại [ACADEMIC_API_INTEGRATION.md](ACADEMIC_API_INTEGRATION.md). Bài test BE và luồng trình duyệt thật dùng MySQL riêng; DB ứng dụng local vẫn cần migration Academic theo hướng dẫn trong tài liệu tích hợp.

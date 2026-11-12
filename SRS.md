# **EduGrade — Đặc tả Yêu cầu Phần mềm (SRS)**

WDP301-SE1921 · 3 thg 10, 2026

Cập nhật 2026-11-10: mô hình Khóa học – Giáo trình – Mục tiêu khóa học (xem mục 1.4, 3.1, 3.2, 5.4, 6.2, 7, 8).

## **1\. Giới thiệu**

### **1.1 Mục đích tài liệu**

Tài liệu đặc tả yêu cầu phần mềm (SRS) cho EduGrade — nền tảng quản lý học tập của một trung tâm dạy thêm (Toán, Lý, Hóa, Sinh — khối 6–9), đồ án WDP301-SE1921. Làm cơ sở thống nhất về phạm vi, chức năng và quy tắc nghiệp vụ giữa nhóm phát triển và giảng viên hướng dẫn.

### **1.2 Phạm vi hệ thống**

Single-tenant — không có khái niệm nhiều trung tâm. Không có tài khoản học sinh riêng: mỗi tài khoản đăng nhập thuộc về phụ huynh, quản lý một hoặc nhiều hồ sơ học sinh (con). Hai nền tảng: Web (4 vai trò nhân sự trung tâm) và Mobile (phụ huynh).

### **1.3 Đối tượng người dùng**

| Vai trò | Nền tảng | Mô tả ngắn |
| ----- | ----- | ----- |
| Quản lý trung tâm | Web | CRUD nhân viên/giáo viên/phụ huynh, dashboard, tạo lớp, assign giáo viên |
| Thiết kế giáo trình | Web | Soạn giáo trình và mục tiêu khóa học theo môn |
| Nhân viên | Web | Đăng ký học sinh, thu học phí, đổi lịch/học bù/nghỉ |
| Giáo viên | Web (xem ghi chú) | Điểm danh, bài tập, chấm bài AI, báo cáo |
| Phụ huynh | Mobile | Quản lý hồ sơ con, xem lịch/điểm, nộp bài |

Ghi chú: danh sách vai trò gốc ghi "Giáo viên — Web", trong khi mục nghiệp vụ chi tiết vẫn ghi "(Web \+ Mobile)" — tài liệu này tạm theo Web-only, xem mục 9 (Vấn đề cần xác nhận).

### **1.4 Định nghĩa, từ viết tắt**

* **SRS**: Software Requirements Specification  
* **Enrollment**: một lượt đăng ký học (1 học sinh – 1 môn – 1 lớp – số tháng)  
* **Debounce**: trì hoãn gọi API tìm kiếm đến khi người dùng ngừng gõ một khoảng ngắn, tránh gọi liên tục theo từng ký tự  
* **StudentProfile**: hồ sơ học sinh (con), gắn dưới 1 tài khoản phụ huynh  
* **ClassSession**: một buổi học cụ thể, được tạo khi Quản lý trung tâm bấm "Tạo lịch học" cho lớp  
* **Khóa học (Program)**: môn \+ khối, ví dụ Toán 7; lớp thuộc về một khóa học  
* **Giáo trình (CurriculumUnit)**: các bài học của khóa học, chia theo kỳ (kỳ là một khoảng ngày: từ ngày – đến ngày). Mỗi giáo trình có "bản N" (mỗi lần sửa sau khi đã duyệt là một bản mới) và các trạng thái: bản nháp, chờ duyệt, đã duyệt, lưu trữ. Khi chờ duyệt, người dùng thấy giáo trình đang "chờ giáo viên duyệt nội dung" hay "chờ Quản lý duyệt áp dụng"  
* **Mục tiêu khóa học (OutcomeSet/LearningOutcome; trước đây gọi là "CLO")**: những điều học sinh cần đạt, viết bằng tên phụ huynh đọc được, kèm mô tả và loại Bắt buộc hoặc Mở rộng; nguồn (sách, chương trình) là tùy chọn  
* **Ngày nghỉ của trung tâm (CenterClosure)**: khoảng ngày trung tâm không có buổi học (nghỉ lễ, nghỉ Tết...) kèm lý do  
* **Tạo lịch học**: thao tác của Quản lý trung tâm để tạo các buổi học của lớp từ lịch cố định, có xem trước

  ## **2\. Mô tả tổng quan**

  ### **2.1 Bối cảnh sản phẩm**

Trung tâm hiện quản lý học sinh, lịch học, điểm danh và học phí thủ công. EduGrade số hóa toàn bộ quy trình này trên một hệ thống dùng chung, với điểm danh/học phí/lịch học đồng bộ tức thời giữa Web và Mobile.

### **2.2 Mô hình vai trò (5 vai trò, tách từ 3 vai trò ban đầu)**

Ban đầu hệ thống chỉ có 3 vai trò: Quản lý, Giáo viên, Phụ huynh. Vai trò Quản lý sau đó được tách thành 3: **Quản lý trung tâm** (giữ quyền CRUD nhân sự, dashboard, tạo lớp, tạo lịch học, duyệt áp dụng giáo trình), **Thiết kế giáo trình** (mới — tách riêng phần soạn giáo trình và mục tiêu khóa học; chỉ soạn, không duyệt), **Nhân viên** (mới — tách riêng phần vận hành hằng ngày: đăng ký học sinh, thu học phí, đổi lịch/học bù/nghỉ). Giáo viên và Phụ huynh giữ nguyên vai trò, có bổ sung chi tiết nghiệp vụ (xem mục 3).

### **2.3 Ràng buộc chung**

* Không tích hợp cổng thanh toán — xác nhận thủ công bởi Nhân viên.  
* Không dùng SMS — toàn bộ thông báo qua email.  
* Không có tài khoản học sinh — học sinh thao tác qua phiên đăng nhập của phụ huynh.

  ## **3\. Yêu cầu chức năng**

  ### **3.1 Quản lý trung tâm**

* Mời, duyệt giáo viên; xem danh sách/thông tin giáo viên  
* Xếp/đổi giáo viên phụ trách lớp, xếp giáo viên dạy thay (giáo viên không tự nhận lớp)  
* Mời thêm quản lý khác, xem danh sách, phân quyền trong phạm vi trung tâm  
* CRUD nhân viên, giáo viên, phụ huynh — xem danh sách, tìm kiếm, xem thông tin  
* Tạo lớp: chọn khóa học (môn \+ khối), phòng, lịch cố định, giáo viên. Tạo lớp chưa tạo buổi học  
* Duyệt áp dụng giáo trình và mục tiêu khóa học (cấp duyệt thứ hai, sau khi giáo viên duyệt nội dung)  
* Tạo lịch học cho lớp: bấm tay, có xem trước, không tự tạo  
* Hủy buổi học (có dời bài) và hủy nhiều buổi một lần  
* Quản lý ngày nghỉ của trung tâm (khoảng ngày \+ lý do)  
* Dashboard: tổng doanh thu học phí, số học sinh, số giáo viên, số nhân viên  
* Dashboard: thẻ "Lớp cần tạo lịch học" (lớp chưa có buổi học nào, hoặc buổi cuối cách hôm nay dưới 14 ngày) kèm nút Tạo lịch học

  ### **3.2 Thiết kế giáo trình (vai trò mới)**

* Soạn Giáo trình theo kỳ cho từng khóa học (Toán, Lý, Hóa, Sinh), dựa theo sách giáo khoa, và soạn Mục tiêu khóa học (bản nhẹ: tên phụ huynh đọc được, mô tả, Bắt buộc hoặc Mở rộng; nguồn tùy chọn). Gắn mục tiêu cho câu hỏi là tùy chọn; mỗi mục tiêu cần ít nhất 1 bài trước khi được duyệt  
* Mọi người dùng vai trò Thiết kế giáo trình đều sửa được bản nháp giáo trình và mục tiêu  
* Gửi duyệt một lần: giáo viên duyệt nội dung, Quản lý duyệt áp dụng (xem 3.4 và 3.1)  
* Thiết lập nhịp độ: 1 buổi học 1 bài; 1 tháng 1 bài kiểm tra là khuyến nghị — hệ thống chỉ nhắc giáo viên, không chặn  
* Quản lý Bài học (Lesson), gắn đúng thứ tự trong Giáo trình  
* Không duyệt, không tạo lớp, không tạo lịch, không xếp phòng — thuộc về Quản lý trung tâm

  ### **3.3 Nhân viên (vai trò mới)**

* Đăng ký môn/lớp mới cho học sinh (qua điện thoại/trực tiếp — không đăng ký online)  
* Tra cứu tài khoản phụ huynh qua email (debounce), chọn hồ sơ con, đăng ký môn/lớp (chi tiết mục 6\)  
* Xác nhận thanh toán học phí (xem 3.6)  
* Đổi lịch học cố định cho học sinh; xếp lịch học bù / đổi 1 buổi cụ thể  
* Cho học sinh tạm nghỉ, cho học lại, nghỉ 1 môn, nghỉ hẳn  
* Tạo lịch nghỉ dài hạn cho học sinh

  ### **3.4 Giáo viên**

* Xem lịch dạy, lớp phụ trách, danh sách học sinh, tỷ lệ đi học  
* Điểm danh từng buổi — cũng là dữ liệu đầu vào tính công cho giáo viên (xem mục 9\)  
* Tạo bài tập/đề kiểm tra, đáp án/tiêu chí chấm  
* Xem/sửa/duyệt/công bố kết quả AI chấm (xem 3.9)  
* Yêu cầu tổng hợp kết quả, tải báo cáo Excel/PDF (xem 3.10)  
* Xác nhận ("set cứng") lịch cố định cho lớp được phân công  
* Duyệt nội dung giáo trình và mục tiêu khóa học (cấp duyệt thứ nhất). Giáo viên duyệt được chọn khi gửi duyệt; danh sách ưu tiên giáo viên của khóa, rồi giáo viên cùng môn, rồi các giáo viên đang hoạt động khác  
* Nhận nhắc "Lớp X: tháng này chưa có bài kiểm tra" (chỉ nhắc, không chặn)

  ### **3.5 Phụ huynh**

* Tự tạo tài khoản ngay trên app (không qua link/mã); đăng nhập  
* Tự tạo hồ sơ cho con ngay trên app  
* Quản lý nhiều hồ sơ học sinh (con) trong 1 tài khoản, chuyển đổi giữa các con  
* Theo từng con: xem môn học, lớp, lịch học, lịch học bù, gói học phí  
* Nhận và nộp bài tập về nhà, qua phiên đăng nhập của phụ huynh  
* Xem điểm \+ đáp án đúng, lịch sử điểm, tỷ lệ đi học, tiến độ học tập  
* Nhận thông báo qua email  
* Không tự đăng ký/hủy lớp, không thanh toán trực tiếp trên hệ thống

  ### **3.6 Thanh toán (Nhân viên thực hiện)**

Xác nhận thanh toán sau khi nhận đủ tiền (không phân biệt tiền mặt/chuyển khoản, không tích hợp cổng thanh toán). Số tháng: 1–12. Sau xác nhận: Payment → Enrollment gắn ngay vào hồ sơ con đã chọn → biên lai (có nút In) → email gồm tên con, môn, lớp, lịch học.

### **3.7 Điểm danh (Giáo viên thực hiện)**

Điểm danh từng học sinh mỗi buổi. Trạng thái: present, absent, made\_up, excused. Sau điểm danh: cập nhật tỷ lệ đi học \+ gửi email phụ huynh.

### **3.8 Nghỉ học / học bù / đổi lịch (Nhân viên thực hiện)**

* Nghỉ một buổi \+ học bù: tìm buổi thay thế cùng khóa học, cùng bài học, chưa diễn ra, còn chỗ  
* Đổi 1 buổi cụ thể, không đổi lịch cố định — bản chất là một dạng học bù  
* Đổi lịch học cố định: thay đổi lâu dài, chuyển sang lớp khác cùng khóa học  
* Nghỉ dài hạn: có ngày bắt đầu/kết thúc, các buổi trong khoảng tự động excused  
* Nghỉ 1 môn / nghỉ hẳn: lưu lịch sử, gửi email xác nhận

  ### **3.9 Chấm bài bằng AI (Giáo viên duyệt)**

Con nộp bài qua tài khoản phụ huynh → AI chấm điểm \+ đáp án đúng → Giáo viên kiểm tra/sửa → duyệt → công bố → Phụ huynh/con xem. AI không được tự động công bố điểm.

### **3.10 Tổng hợp kết quả & báo cáo (Giáo viên thực hiện)**

Giáo viên chọn lớp/học sinh \+ khoảng thời gian → hệ thống lấy điểm, kết quả kiểm tra, tỷ lệ đi học, tiến độ → AI tổng hợp → xuất Excel/PDF. Chỉ giáo viên xem/tải.

### **3.11 Email thông báo**

Không dùng SMS. Mọi thông báo gửi tới email tài khoản phụ huynh (đồng thời là email đăng nhập): xác nhận đăng ký, xác nhận thanh toán, biên lai, điểm danh, nghỉ học, học bù, đổi lịch, nhắc học phí, nghỉ lễ, thông báo quan trọng khác.

## **4\. Yêu cầu phi chức năng**

### **4.1 Bảo mật**

Mật khẩu hash. Dữ liệu học sinh dưới 18 tuổi được bảo vệ. Phân quyền nghiêm ngặt theo 5 vai trò: mỗi route/API chỉ phục vụ đúng vai trò của nó; Nhân viên và Quản lý trung tâm **không** dùng chung quyền truy cập dù cùng là nhân sự trung tâm. Giáo viên chỉ xem lớp được phân công. Phụ huynh chỉ xem hồ sơ con thuộc tài khoản mình.

### **4.2 Dùng chung Web và Mobile**

Cùng dữ liệu, cùng cách tính toán — điểm danh trên Web hiện ngay trên Mobile.

### **4.3 Đăng nhập**

1 tài khoản phụ huynh dùng cho cả Web và Mobile (nếu có), quản lý nhiều hồ sơ con, chuyển đổi giữa các con trong cùng phiên đăng nhập.

### **4.4 Hiệu năng**

Chấm trắc nghiệm dưới 3 giây. Bài tự luận xử lý nền, thông báo khi hoàn thành.

### **4.5 Độ tin cậy AI**

Kết quả AI luôn ở trạng thái đề xuất, phải qua giáo viên duyệt trước khi hiển thị cho phụ huynh/con.

### **4.6 Độ tin cậy thanh toán**

Chỉ ghi nhận khi Nhân viên chủ động xác nhận. Chặn xác nhận trùng cho cùng 1 đăng ký.

### **4.7 Email**

Gửi tự động sau các sự kiện cần thông báo. Gửi thất bại → lưu trạng thái, thử lại, không ảnh hưởng dữ liệu chính (Payment/Enrollment vẫn tạo dù email lỗi).

### **4.8 Khả năng mở rộng**

Mở rộng theo số lượng học sinh, giáo viên, nhân viên, môn học; có thể đổi nhà cung cấp AI mà không xây lại toàn hệ thống.

## **5\. Quy tắc nghiệp vụ (Business Rules)**

### **5.1 Tổ chức**

1. Trung tâm có thể có nhiều Quản lý trung tâm.

   ### **5.2 Tài khoản Phụ huynh – Học sinh**

2. Tài khoản đăng nhập thuộc về phụ huynh, không phải học sinh.  
3. Email phụ huynh \= email đăng nhập, duy nhất trên toàn hệ thống.  
4. 1 tài khoản phụ huynh quản lý được nhiều Hồ sơ học sinh (con).  
5. Nhân viên không tạo tài khoản/mật khẩu cho phụ huynh.  
6. Phụ huynh tự đặt email, mật khẩu khi tự đăng ký tài khoản trên app — không qua link/mã.  
7. Con đã có hồ sơ thì không tạo hồ sơ mới khi đăng ký thêm môn — chỉ tạo Enrollment mới gắn vào hồ sơ cũ.  
8. Thêm con mới dùng lại tài khoản phụ huynh hiện có nếu Nhân viên nhập đúng email đã tồn tại; không tạo tài khoản mới.

   ### **5.3 Tài khoản & tra cứu hồ sơ**

9. Phụ huynh tự tạo tài khoản và hồ sơ con trên app — Nhân viên không tạo thay, không có link/mã kích hoạt trong bất kỳ trường hợp nào.  
10. Nhân viên tra cứu tài khoản phụ huynh qua ô tìm kiếm email (debounce, gợi ý sau 1–2 ký tự).  
11. Nhân viên chỉ được chọn đúng hồ sơ con thuộc tài khoản đã tra cứu, không tạo hồ sơ mới thay phụ huynh.  
12. Enrollment được tạo và gắn vào hồ sơ con ngay sau khi Nhân viên xác nhận thanh toán — không qua bước xác nhận nào khác từ phụ huynh.

    ### **5.4 Lớp và lịch**

13. Mỗi lớp thuộc một khóa học, có một lịch cố định.  
14. Hai lớp hỗ trợ học bù cho nhau phải cùng khóa học.  
15. Buổi học không tự sinh. Quản lý trung tâm bấm "Tạo lịch học" cho lớp: xem trước các buổi rồi mới tạo. Chỉ tạo lịch học được khi giáo trình đã được duyệt áp dụng.  
    * Gắn bài học theo ngày, theo thứ tự giáo trình: lần tạo lịch đầu của lớp gán bài theo vị trí buổi tính từ đầu kỳ, bỏ qua ngày nghỉ của trung tâm. Lần tạo lịch tiếp theo nối từ bài sau bài của buổi cuối chưa hủy. Hết buổi mà còn bài thì bài đó chưa xếp buổi, và vào buổi đầu của lần tạo lịch sau.  
    * Ngày nghỉ của trung tâm (khoảng ngày \+ lý do) do Quản lý trung tâm quản lý, mọi nhân sự xem được. Thêm ngày nghỉ không tự hủy buổi đã có: Quản lý hủy các buổi đó bằng hủy nhiều buổi.  
    * Hủy một buổi có ba cách, theo thứ tự khuyên dùng: (1) "Đổi sang ngày khác" — giữ bài; (2) "Hủy và dời bài sang buổi sau"; (3) "Hủy, bỏ bài".  
    * Hủy và dời bài sang buổi sau: bài của buổi cuối bị đẩy ra khỏi các buổi đã tạo và vào buổi đầu của lần tạo lịch sau. Hủy, bỏ bài: bài của buổi bị hủy không được xếp lại; riêng khi buổi bị hủy là buổi cuối cùng đã tạo thì bài đó quay lại ở lần tạo lịch sau (vì lịch mới nối từ bài sau bài của buổi cuối chưa hủy).  
    * Hủy nhiều buổi một lần: chỉ Quản lý trung tâm, tối đa 200 buổi, được cả hoặc không được buổi nào. Phụ huynh của lớp nhận thông báo hủy buổi kèm lý do (không có thông báo riêng khi tạo ngày nghỉ).  
16. Chỉ Quản lý trung tâm được xếp/đổi giáo viên phụ trách và xếp giáo viên dạy thay.

    ### **5.5 Điểm danh**

17. Trạng thái: present, absent, made\_up, excused.  
18. Tỷ lệ đi học \= (present \+ made\_up) / tổng số buổi phải học.  
19. Excused trong thời gian tạm nghỉ không tính là buổi phải học.  
    * Buổi bị hủy không tính vào số buổi phải học.  
20. Tỷ lệ đi học cập nhật ngay khi điểm danh thay đổi.

    ### **5.6 Học bù / đổi buổi**

21. Chỉ Nhân viên được xếp học bù/đổi 1 buổi cụ thể.  
22. Buổi thay thế phải: cùng khóa học, cùng bài học, chưa diễn ra, còn chỗ.  
    * Không dời bài khi buổi bị đổi bài là buổi gốc hoặc buổi thay thế của một học bù đã đặt.  
23. Đi học bù → buổi gốc thành made\_up; không đi → giữ absent.  
24. Đổi 1 buổi cụ thể không thay đổi lịch cố định.

    ### **5.7 Đổi lịch cố định**

25. Chỉ Nhân viên thực hiện; là thay đổi lâu dài.  
26. Lớp mới phải cùng khóa học, lịch khác, còn chỗ.  
27. Các buổi tiếp theo dùng lịch mới; lưu lịch sử.

    ### **5.8 Nghỉ dài hạn**

28. Phải có ngày bắt đầu/kết thúc, chỉ Nhân viên xác nhận.  
29. Các buổi trong khoảng nghỉ tự động excused.  
30. Hết thời gian, trở lại trạng thái đang học; lưu lịch sử.

    ### **5.9 Nghỉ môn / Nghỉ hẳn**

31. Nghỉ 1 môn chỉ kết thúc Enrollment của môn đó; nghỉ hẳn kết thúc toàn bộ Enrollment của hồ sơ con, không ảnh hưởng tài khoản phụ huynh hay các con khác.  
32. Cả 2 đều lưu lịch sử \+ gửi email.  
33. Quay lại học: dùng hồ sơ cũ, tạo Enrollment mới.

    ### **5.10 Thanh toán**

34. Số tháng: tối thiểu 1, tối đa 12\.  
35. Chỉ 1 hình thức xác nhận: Nhân viên bấm "Xác nhận thanh toán" sau khi nhận đủ tiền.  
36. Một giao dịch không được ghi nhận nhiều lần.  
37. Chỉ thanh toán đã xác nhận mới coi là thành công.  
38. Sau xác nhận: tạo Enrollment, biên lai, gửi email.  
39. Biên lai hiển thị màn hình \+ nút In, không tích hợp máy in.

    ### **5.11 Email**

40. Không dùng SMS cho thông báo tự động.  
41. Email phụ huynh vừa là email đăng nhập vừa nhận thông báo; SĐT chỉ để liên hệ.  
42. Phải lưu trạng thái gửi thành công/thất bại, có cơ chế gửi lại.

    ### **5.12 AI chấm bài**

43. AI chỉ đưa kết quả đề xuất; giáo viên bắt buộc kiểm tra, có thể sửa.  
44. Phụ huynh/con chỉ xem sau khi giáo viên duyệt và công bố.  
45. AI không được tự động công bố kết quả.

    ### **5.13 Báo cáo**

46. Giáo viên chọn lớp/học sinh \+ khoảng thời gian; hệ thống tổng hợp điểm \+ tỷ lệ đi học.  
47. Xuất Excel/PDF; chỉ giáo viên xem/tải, không tự động gửi cho phụ huynh.

    ### **5.14 Lịch sử thay đổi**

48. Phải lưu lịch sử: đổi giáo viên, giáo viên dạy thay, xếp học bù, đổi 1 buổi, đổi lịch cố định, nghỉ dài hạn, cho học lại, nghỉ 1 môn, nghỉ hẳn, xác nhận thanh toán, sửa kết quả AI.

    ## **6\. Luồng nghiệp vụ (Workflow)**

    ### **6.1 Đăng ký, thanh toán, liên kết**

**A1 — Con đầu tiên:** Nếu phụ huynh chưa có tài khoản: Nhân viên hướng dẫn tải app → phụ huynh tự tạo tài khoản (email \+ mật khẩu) → phụ huynh tự tạo hồ sơ cho con, ngay tại quầy. Không có link/mã ở bước này — sau đó vào thẳng bước tìm kiếm chung bên dưới.

**A2 — Thêm con thứ 2+:** Nếu phụ huynh đã có tài khoản nhưng con là hồ sơ mới: phụ huynh tự tạo thêm hồ sơ con trên app bằng tài khoản hiện có — không cần link/mã. Sau đó cũng vào bước tìm kiếm chung bên dưới.

**Bước chung — áp dụng cho A1, A2 và A3:** Nhân viên gõ email phụ huynh vào ô tìm kiếm có gợi ý theo thời gian thực (debounce, gõ 1–2 ký tự là hiện danh sách email khớp) → chọn đúng email → hệ thống hiện các hồ sơ con có sẵn dưới tài khoản đó → Nhân viên chọn đúng con → chọn khối/môn/lớp (theo lịch cố định của lớp) → tính phí → xác nhận thanh toán → Payment → Enrollment mới gắn thẳng vào hồ sơ con đã chọn. Không tạo link/mã — phụ huynh không cần xác nhận gì thêm, mở app sẽ thấy môn mới ngay.

Không còn link/mã kích hoạt trong bất kỳ trường hợp nào — tài khoản và hồ sơ con luôn do phụ huynh tự tạo trên app; Nhân viên chỉ tra cứu theo email và gắn Enrollment. Vì thao tác diễn ra trực tiếp tại quầy (offline), không cần thêm bước xác thực nào khác.

\[embed: node/7201825e-4b84\]

### **6.2 Tạo lịch học cho lớp**

Quản lý trung tâm tạo khóa học (môn \+ khối) và lớp (chọn lịch cố định, giáo viên, phòng; lớp chưa có buổi học) → Thiết kế giáo trình soạn Giáo trình và Mục tiêu khóa học → gửi duyệt một lần → giáo viên Duyệt nội dung → Quản lý Duyệt áp dụng → Quản lý bấm Tạo lịch học (xem trước rồi tạo) → hệ thống tạo ClassSession và gắn bài học theo thứ tự giáo trình.

Hủy buổi: Quản lý chọn buổi → chọn một trong ba cách ("Đổi sang ngày khác", "Hủy và dời bài sang buổi sau", "Hủy, bỏ bài") → buổi thành đã hủy kèm lý do → phụ huynh của lớp nhận thông báo. Hủy nhiều buổi (tối đa 200) làm cùng cách trong một lần, được cả hoặc không được buổi nào.

Ngày nghỉ của trung tâm: Quản lý thêm khoảng ngày \+ lý do → lần Tạo lịch học sau bỏ qua các ngày đó → buổi đã có trong khoảng ngày không tự hủy, Quản lý hủy bằng hủy nhiều buổi.

### **6.3 Điểm danh bình thường**

Giáo viên mở buổi → điểm danh → lưu → tính lại tỷ lệ đi học → gửi email phụ huynh.

### **6.4 Nghỉ một buổi \+ học bù**

Phụ huynh báo nghỉ → Nhân viên đánh dấu absent → tìm buổi khác (cùng khóa học \+ bài học \+ chưa diễn ra \+ còn chỗ) → xếp học bù → gửi email → đi bù? Có → made\_up / Không → absent.

### **6.5 Đổi một buổi cụ thể**

Lịch cố định 2-4-6, bận thứ 2 → Nhân viên tìm lớp dạy cùng bài vào ngày khác → xếp con vào buổi đó → tuần đó thực tế đổi, lịch cố định giữ nguyên.

### **6.6 Đổi lịch cố định**

Lịch cũ 2-4-6, con bận cố định → Nhân viên tìm lớp khác (cùng khóa học, khác lịch, còn chỗ) → chuyển sang lớp mới → áp dụng lâu dài → ghi lịch sử.

### **6.7 Nghỉ dài hạn**

Báo nghỉ → Nhân viên nhập từ ngày–đến ngày → các buổi trong khoảng → excused → gửi email → ghi lịch sử → hết thời gian → tiếp tục học.

### **6.8 Nghỉ hẳn / nghỉ một môn**

Nghỉ 1 môn → kết thúc Enrollment môn đó. Nghỉ hẳn → kết thúc toàn bộ Enrollment của hồ sơ con → ghi lịch sử → gửi email. Tài khoản phụ huynh và các con khác không đổi. Nhân viên thực hiện cả hai.

### **6.9 Chấm bài AI & báo cáo**

Con nộp bài qua tài khoản phụ huynh → AI chấm → điểm \+ đáp án đúng → Giáo viên kiểm tra/sửa → duyệt → công bố → Phụ huynh/con xem. Báo cáo: Giáo viên chọn lớp/học sinh → khoảng thời gian → lấy điểm \+ chuyên cần → AI tổng hợp → tạo báo cáo → xuất Excel/PDF → giáo viên tải.

## **7\. Mô hình dữ liệu**

Chuỗi thực thể chính đi từ tài khoản phụ huynh xuống từng buổi điểm danh; Payment và Program là các thực thể phụ gắn vào Enrollment và Class.

\[embed: node/dae0cbff-2dc1\]

Không còn thực thể ActivationLink trong mô hình — tài khoản và hồ sơ con do phụ huynh tự tạo trên app, Nhân viên chỉ tra cứu và gắn Enrollment (xem mục 6.1).

### **Bảng định nghĩa thực thể**

| Thực thể | Trường chính | Ghi chú |
| ----- | ----- | ----- |
| ParentAccount | id, email, phone | email \= email đăng nhập, duy nhất toàn hệ thống; phone chỉ để liên hệ |
| StudentProfile | id, parentAccountId, name | 1 phụ huynh có thể có nhiều hồ sơ con |
| Enrollment | id, studentProfileId, subjectId, classId, months, status | months trong khoảng 1–12 |
| Class | id, subjectId, gradeLevel, programId, roomId, teacherId, fixedSchedule | tạo bởi Quản lý trung tâm |
| Payment | id, enrollmentId, confirmedAt, confirmedBy | confirmedBy luôn là Nhân viên |
| ClassSession | id, classId, lessonId, programId, date, capacity | tạo khi Quản lý bấm Tạo lịch học (từ fixedSchedule của Class); buổi có thể bị hủy kèm lý do |
| AttendanceRecord | id, classSessionId, studentProfileId, status | status ∈ {present, absent, made\_up, excused} |
| Program (Khóa học) | id, subjectId, gradeLevel, sessionsPerWeek | môn \+ khối; lớp thuộc một khóa học |
| CurriculumUnit | id, programId, title, fromDate, toDate, version, status (DRAFT, PENDING\_REVIEW, APPROVED, ARCHIVED), lessons (có thứ tự) | Giáo trình theo kỳ (khoảng ngày) do Thiết kế giáo trình soạn, theo sách giáo khoa; duyệt hai cấp |
| OutcomeSet | id, programId, level, version, status | Bộ Mục tiêu khóa học của một khóa học |
| LearningOutcome | id, outcomeSetId, code, title, statement, required, nguồn (tùy chọn) | Một mục tiêu khóa học; gắn cho câu hỏi là tùy chọn |
| CenterClosure | id, fromDate, toDate, reason, createdById | Ngày nghỉ của trung tâm; do Quản lý tạo |

## **8\. Ma trận phân quyền**

✓ \= được làm · — \= không có quyền

| Chức năng | Quản lý trung tâm | Thiết kế giáo trình | Nhân viên | Giáo viên | Phụ huynh |
| ----- | ----- | ----- | ----- | ----- | ----- |
| CRUD nhân viên/giáo viên/phụ huynh | ✓ | — | — | — | — |
| Dashboard (doanh thu, số lượng) | ✓ | — | — | — | — |
| Tạo lớp, assign giáo viên | ✓ | — | — | — | — |
| Soạn Giáo trình và Mục tiêu khóa học (Lesson) | — | ✓ | — | — | — |
| Duyệt nội dung giáo trình và mục tiêu | — | — | — | ✓ | — |
| Duyệt áp dụng giáo trình và mục tiêu | ✓ | — | — | — | — |
| Tạo lịch học cho lớp | ✓ | — | — | — | — |
| Hủy buổi, hủy nhiều buổi | ✓ | — | — | — | — |
| Ngày nghỉ của trung tâm (ghi / xem) | ✓ (ghi, xem) | ✓ (xem) | ✓ (xem) | ✓ (xem) | — |
| Đăng ký học sinh / tra cứu qua email | — | — | ✓ | — | — |
| Xác nhận thanh toán | — | — | ✓ | — | — |
| Đổi lịch / học bù / nghỉ | — | — | ✓ | — | — |
| Điểm danh | — | — | — | ✓ | — |
| Bài tập, chấm bài \+ duyệt AI | — | — | — | ✓ | — |
| Báo cáo Excel/PDF | — | — | — | ✓ | — |
| Set cứng lịch lớp được phân công | — | — | — | ✓ | — |
| Tự tạo tài khoản và hồ sơ con | — | — | — | — | ✓ |
| Xem lịch/điểm, nộp bài | — | — | — | — | ✓ |

Nhân viên và Quản lý trung tâm không dùng chung quyền truy cập dù cùng là nhân sự trung tâm — một API/route chỉ phục vụ đúng vai trò của nó (xem mục 4.1).

## **9\. Vấn đề cần xác nhận**

* **Nền tảng Giáo viên**: danh sách vai trò ghi "Web", nhưng mục nghiệp vụ chi tiết vẫn ghi "(Web \+ Mobile)". Tài liệu này tạm theo Web-only.  
* **"Set cứng lịch"**: hiểu là Giáo viên xác nhận/khoá lịch cố định cho lớp được phân công, không phải Giáo viên tự tạo lớp — cần xác nhận lại.  
* **"Admin"**: dòng "admin: có tất cả, quản lí các nhân viên" được hiểu là mô tả quyền hạn của Quản lý trung tâm, không phải một vai trò thứ 6 riêng biệt.  
* **Luồng A3 (mới cập nhật)**: đã bỏ bước link/mã — Nhân viên nhập email phụ huynh, hệ thống hiện sẵn danh sách con, Nhân viên chọn trực tiếp. Đã xác nhận: không cần thêm bước xác thực, vì đây là quy trình trực tiếp tại quầy — phụ huynh có mặt khi Nhân viên thao tác. Ô nhập email có gợi ý tự động (debounce, 1–2 ký tự). Nếu phụ huynh chưa có tài khoản (trường hợp A1), Nhân viên hướng dẫn tải app để phụ huynh tự tạo tài khoản \+ hồ sơ con ngay tại chỗ.  
* **Mô hình Khóa học – Giáo trình – Mục tiêu khóa học** — đã chốt ngày 2026-11-09/10:  
  * Bài gắn theo ngày; hủy buổi có ba cách (đổi sang ngày khác, hủy và dời bài, hủy bỏ bài) (5.4).  
  * Mục tiêu khóa học bản nhẹ; gắn cho câu hỏi là tùy chọn; mỗi mục tiêu cần ít nhất 1 bài trước khi duyệt (3.2).  
  * Duyệt hai cấp, một lần gửi: giáo viên duyệt nội dung, Quản lý duyệt áp dụng (3.1, 3.4).  
  * Tạo lịch học bấm tay, không tự tạo; dashboard nhắc "Lớp cần tạo lịch học".  
  * "1 tháng 1 bài kiểm tra" là khuyến nghị, hệ thống chỉ nhắc giáo viên, không chặn (3.2, 3.4).  
  * Mọi Thiết kế giáo trình sửa được bản nháp giáo trình và mục tiêu.  
  * Ngày nghỉ của trung tâm do Quản lý quản lý, thêm ngày nghỉ không tự hủy buổi đã có; hủy nhiều buổi chỉ Quản lý, tối đa 200 buổi (5.4).  
    
  

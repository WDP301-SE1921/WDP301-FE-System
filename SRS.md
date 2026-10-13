# **EduGrade — Đặc tả Yêu cầu Phần mềm (SRS)**

WDP301-SE1921 · 3 thg 10, 2026

## **1\. Giới thiệu**

### **1.1 Mục đích tài liệu**

Tài liệu đặc tả yêu cầu phần mềm (SRS) cho EduGrade — nền tảng quản lý học tập của một trung tâm dạy thêm (Toán, Lý, Hóa, Sinh — khối 6–9), đồ án WDP301-SE1921. Làm cơ sở thống nhất về phạm vi, chức năng và quy tắc nghiệp vụ giữa nhóm phát triển và giảng viên hướng dẫn.

### **1.2 Phạm vi hệ thống**

Single-tenant — không có khái niệm nhiều trung tâm. Không có tài khoản học sinh riêng: mỗi tài khoản đăng nhập thuộc về phụ huynh, quản lý một hoặc nhiều hồ sơ học sinh (con). Hai nền tảng: Web (4 vai trò nhân sự trung tâm) và Mobile (phụ huynh).

### **1.3 Đối tượng người dùng**

| Vai trò | Nền tảng | Mô tả ngắn |
| ----- | ----- | ----- |
| Quản lý trung tâm | Web | CRUD nhân viên/giáo viên/phụ huynh, dashboard, tạo lớp, assign giáo viên |
| Thiết kế giáo trình | Web | Soạn nội dung chương trình học theo môn |
| Nhân viên | Web | Đăng ký học sinh, thu học phí, đổi lịch/học bù/nghỉ |
| Giáo viên | Web (xem ghi chú) | Điểm danh, bài tập, chấm bài AI, báo cáo |
| Phụ huynh | Mobile | Quản lý hồ sơ con, xem lịch/điểm, nộp bài |

Ghi chú: danh sách vai trò gốc ghi "Giáo viên — Web", trong khi mục nghiệp vụ chi tiết vẫn ghi "(Web \+ Mobile)" — tài liệu này tạm theo Web-only, xem mục 9 (Vấn đề cần xác nhận).

### **1.4 Định nghĩa, từ viết tắt**

* **SRS**: Software Requirements Specification  
* **Enrollment**: một lượt đăng ký học (1 học sinh – 1 môn – 1 lớp – số tháng)  
* **Debounce**: trì hoãn gọi API tìm kiếm đến khi người dùng ngừng gõ một khoảng ngắn, tránh gọi liên tục theo từng ký tự  
* **StudentProfile**: hồ sơ học sinh (con), gắn dưới 1 tài khoản phụ huynh  
* **ClassSession**: một buổi học cụ thể, sinh từ lịch cố định của lớp

  ## **2\. Mô tả tổng quan**

  ### **2.1 Bối cảnh sản phẩm**

Trung tâm hiện quản lý học sinh, lịch học, điểm danh và học phí thủ công. EduGrade số hóa toàn bộ quy trình này trên một hệ thống dùng chung, với điểm danh/học phí/lịch học đồng bộ tức thời giữa Web và Mobile.

### **2.2 Mô hình vai trò (5 vai trò, tách từ 3 vai trò ban đầu)**

Ban đầu hệ thống chỉ có 3 vai trò: Quản lý, Giáo viên, Phụ huynh. Vai trò Quản lý sau đó được tách thành 3: **Quản lý trung tâm** (giữ quyền CRUD nhân sự, dashboard, tạo lớp), **Thiết kế giáo trình** (mới — tách riêng phần nội dung chương trình học), **Nhân viên** (mới — tách riêng phần vận hành hằng ngày: đăng ký học sinh, thu học phí, đổi lịch/học bù/nghỉ). Giáo viên và Phụ huynh giữ nguyên vai trò, có bổ sung chi tiết nghiệp vụ (xem mục 3).

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
* Tạo lớp: chọn môn, khối, chương trình, phòng, lịch cố định, giáo viên  
* Dashboard: tổng doanh thu học phí, số học sinh, số giáo viên, số nhân viên

  ### **3.2 Thiết kế giáo trình (vai trò mới)**

* Soạn nội dung chương trình học theo môn (Toán, Lý, Hóa, Sinh), dựa theo sách giáo khoa  
* Thiết lập nhịp độ: 1 buổi học 1 bài, 1 tháng 1 bài kiểm tra  
* Quản lý Bài học (Lesson), gắn đúng thứ tự trong Chương trình (Program)  
* Không can thiệp việc tạo lớp hay xếp phòng/lịch — thuộc về Quản lý trung tâm

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

* Nghỉ một buổi \+ học bù: tìm buổi thay thế cùng chương trình, cùng bài học, chưa diễn ra, còn chỗ  
* Đổi 1 buổi cụ thể, không đổi lịch cố định — bản chất là một dạng học bù  
* Đổi lịch học cố định: thay đổi lâu dài, chuyển sang lớp khác cùng chương trình  
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

13. Mỗi lớp thuộc một chương trình, có một lịch cố định.  
14. Hai lớp hỗ trợ học bù cho nhau phải cùng chương trình.  
15. Hệ thống tự tạo buổi học từ lịch cố định, gắn bài học theo thứ tự chương trình.  
16. Chỉ Quản lý trung tâm được xếp/đổi giáo viên phụ trách và xếp giáo viên dạy thay.

    ### **5.5 Điểm danh**

17. Trạng thái: present, absent, made\_up, excused.  
18. Tỷ lệ đi học \= (present \+ made\_up) / tổng số buổi phải học.  
19. Excused trong thời gian tạm nghỉ không tính là buổi phải học.  
20. Tỷ lệ đi học cập nhật ngay khi điểm danh thay đổi.

    ### **5.6 Học bù / đổi buổi**

21. Chỉ Nhân viên được xếp học bù/đổi 1 buổi cụ thể.  
22. Buổi thay thế phải: cùng chương trình, cùng bài học, chưa diễn ra, còn chỗ.  
23. Đi học bù → buổi gốc thành made\_up; không đi → giữ absent.  
24. Đổi 1 buổi cụ thể không thay đổi lịch cố định.

    ### **5.7 Đổi lịch cố định**

25. Chỉ Nhân viên thực hiện; là thay đổi lâu dài.  
26. Lớp mới phải cùng chương trình, lịch khác, còn chỗ.  
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

### **6.2 Sinh lịch học từ lớp**

Quản lý trung tâm tạo lớp → chọn môn → khối → chương trình → lịch cố định → giáo viên → phòng → hệ thống tạo ClassSession → gắn bài học theo thứ tự.

### **6.3 Điểm danh bình thường**

Giáo viên mở buổi → điểm danh → lưu → tính lại tỷ lệ đi học → gửi email phụ huynh.

### **6.4 Nghỉ một buổi \+ học bù**

Phụ huynh báo nghỉ → Nhân viên đánh dấu absent → tìm buổi khác (cùng chương trình \+ bài học \+ chưa diễn ra \+ còn chỗ) → xếp học bù → gửi email → đi bù? Có → made\_up / Không → absent.

### **6.5 Đổi một buổi cụ thể**

Lịch cố định 2-4-6, bận thứ 2 → Nhân viên tìm lớp dạy cùng bài vào ngày khác → xếp con vào buổi đó → tuần đó thực tế đổi, lịch cố định giữ nguyên.

### **6.6 Đổi lịch cố định**

Lịch cũ 2-4-6, con bận cố định → Nhân viên tìm lớp khác (cùng chương trình, khác lịch, còn chỗ) → chuyển sang lớp mới → áp dụng lâu dài → ghi lịch sử.

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
| ClassSession | id, classId, lessonId, programId, date, capacity | sinh tự động từ fixedSchedule của Class |
| AttendanceRecord | id, classSessionId, studentProfileId, status | status ∈ {present, absent, made\_up, excused} |
| Program | id, subjectId, gradeLevel, lessons (có thứ tự) | nội dung do Thiết kế giáo trình soạn, theo sách giáo khoa |

## **8\. Ma trận phân quyền**

✓ \= được làm · — \= không có quyền

| Chức năng | Quản lý trung tâm | Thiết kế giáo trình | Nhân viên | Giáo viên | Phụ huynh |
| ----- | ----- | ----- | ----- | ----- | ----- |
| CRUD nhân viên/giáo viên/phụ huynh | ✓ | — | — | — | — |
| Dashboard (doanh thu, số lượng) | ✓ | — | — | — | — |
| Tạo lớp, assign giáo viên | ✓ | — | — | — | — |
| Soạn nội dung chương trình (Program/Lesson) | — | ✓ | — | — | — |
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
    
  

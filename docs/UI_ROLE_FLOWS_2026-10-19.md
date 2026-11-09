# Test giao diện Web theo vai trò — 19/10/2026

Chạy BE + FE Web rồi đi lần lượt từng màn hình, từng thao tác của 4 vai trò Web, chụp ảnh sau mỗi bước. Không test app Mobile (Phụ huynh).

## Môi trường

- BE: Nest chạy trong tiến trình test, DB MySQL riêng `edugrade_uiroles_*` trên container `edugrade_mysql`, xóa sau khi chạy. Không đụng DB thật `edugrade_db`.
- Dữ liệu: seed demo + seed dashboard của BE (352 tài khoản, 440 hồ sơ con, 25+ lớp, 1308 buổi học), ngày tham chiếu 19/10/2026.
- FE: `next start` bản build production hiện tại của `dev` (`da1d5fd`).
- Chặn gửi ra ngoài: SMTP/AI/storage bị xóa khỏi env, việc gửi email và AI chấm bài được stub. Giới hạn 5 lần đăng nhập/phút chỉ tắt trong tiến trình test.
- Trình duyệt: Chrome headless 1440×900. Ảnh "toàn trang" được chụp bằng cách nới cao cửa sổ.
- Ảnh: `docs/screenshots/ui-roles-2026-10-19/<vai-trò>/`. Mở `index.html` trong thư mục đó để xem toàn bộ theo vai trò.

## Kết quả

| Vai trò | Bước | Đạt |
| --- | ---: | ---: |
| Chung: đăng nhập, phân quyền, đăng xuất | 12 | 12 |
| Thiết kế giáo trình (designer@edugrade.local) | 32 | 32 |
| Giáo viên (teacher@edugrade.local) | 53 | 53 |
| Quản lý trung tâm (manager@edugrade.local) | 105 | 105 |
| Nhân viên (staff@edugrade.local) | 40 | 40 |
| **Tổng** | **242** | **242** |

Thứ tự chạy là Chung → Thiết kế GT → Giáo viên → Quản lý → Nhân viên, để các luồng liên vai trò dùng chung dữ liệu.

### Luồng liên vai trò đã chạy thông

1. **Giáo trình → lịch học:** Thiết kế GT tạo giáo trình "Toán 6 - Học kỳ 2 tháng 1/2027 (QA)" (4 bài, 04–31/01/2027), kiểm tra rồi gửi GV Nguyễn Minh Đức. GV thẩm định "Đồng ý và chuyển quản lý". Quản lý Xác nhận áp dụng → Đã duyệt. Quản lý tạo lớp "Toán 6 QA" (Thứ 7 08:00–10:00) rồi Sinh lịch theo khóa: **đã sinh 4 buổi**, mỗi buổi một bài.
2. **Nghỉ → học bù:** Nhân viên ghi nhận nghỉ buổi 22/10 của Bùi Anh Thịnh (Toán 8 Nâng cao), xếp học bù vào Toán 8B 20/10.
3. **Đăng ký → thu phí → biên lai:** wizard 5 bước cho Nguyễn Minh An. Vật lý 8A bị chặn đúng ("Con đã đăng ký lớp này"); chọn Sinh học 8 Cuối tuần, lập nháp, xác nhận thanh toán, ra biên lai.
4. **Bài tập:** GV tạo bài (tự luận + trắc nghiệm), giao cho 5 học sinh. Chấm bài nộp có sẵn: Gợi ý AI (stub) → nhập điểm → Lưu nháp → Gửi điểm → "Đã công bố".

### Quy tắc nghiệp vụ được hệ thống chặn đúng

- Đổi giờ buổi Vật lý 6A: 409 "Xử lý điểm danh và đơn nghỉ liên quan trước khi đổi hoặc hủy buổi". Đổi giờ +1 tiếng bị báo trùng lịch; đổi sớm 2 tiếng thì thành công.
- Điểm danh: không chốt được khi còn học viên chưa chọn kết quả; nút "Có phép" bị khóa khi không có đơn nghỉ đã duyệt.
- Học bù: buổi gốc chưa có đơn nghỉ đã duyệt thì không có buổi thay thế.
- Phân quyền: 6 trường hợp mở trang chéo vai trò đều ra "Không có quyền truy cập".

## Phát hiện UI/UX

| # | Vấn đề | Chi tiết | Ảnh |
| --- | --- | --- | --- |
| 1 | Cột Thao tác bị khuất ở bảng Khóa học & giáo trình (Quản lý) | Ở 1440px, bảng rộng 781px nằm trong khung 642px; nút Duyệt/Xem của từng giáo trình chỉ thấy khi cuộn ngang trong bảng. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/057-manager-tab-khoa-hoc-giao-trinh.png) |
| 2 | Tên đọc của nút Duyệt khác chữ hiển thị | Nút hiện chữ "Duyệt" nhưng aria-label là "Mở giáo trình …" (thẻ <a role=button>), nên trình đọc màn hình và điều khiển giọng nói không gọi được bằng chữ "Duyệt". | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/068-manager-giao-trinh-cho-xac-nhan-ap-dung-trong-danh-sach-khoa.png) |
| 3 | Bảng Lời mời giáo viên bị cắt | Tab Nhân sự → Lời mời: badge trạng thái bị cắt và cột thao tác (Xem lời mời/Duyệt tài khoản) nằm ngoài khung ở 1440px. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/085-manager-tab-loi-moi.png) |
| 4 | Checkbox xác nhận nằm lệch sau chữ | Ô tick xuất hiện sau câu xác nhận và lệch lên trên (Gửi email thông báo, Đóng nhận bài, Yêu cầu AI viết nhận xét, Xác nhận lịch cố định). Trong khi đó, màn điểm danh đặt ô tick trước chữ. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/093-manager-gui-email-thong-bao-vua-luu.png) |
| 5 | Nhập CSV xong vẫn hỏi "Bỏ thay đổi chưa lưu?" | Sau khi "Đã nhập 2 nội dung", bấm Đóng vẫn hiện cảnh báo bỏ thay đổi, dễ làm người dùng tưởng chưa lưu. | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/024-designer-bam-dong-sau-khi-nhap-csv.png) |
| 6 | Gửi thẩm định khi khóa chưa có lớp có GV | Chỉ khi mở hộp Gửi thẩm định mới thấy "Chưa có giáo viên phù hợp". UI không báo trước điều kiện khóa → lớp → giáo viên (ghi nhận ở lượt chạy thử với khóa QA chưa có lớp). | — |
| 7 | Lịch sử thay đổi hiện mã kỹ thuật | Chi tiết thay đổi dạy thay hiện "Mã giáo viên seed_bulk_v1_user_teacher_…" thay vì tên giáo viên (thấy ở lượt chạy thử; lượt cuối lọc theo "Tạo dữ liệu demo" nên ảnh 099 không có dòng này). | — |
| 8 | Danh sách email xếp hàng bị ngắt giữa chữ | Thẻ "Kết quả xếp hàng email" xuống dòng giữa từ ("Đã xếp hàn g"). | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/094-manager-tick-xac-nhan-va-bam-gui-email.png) |
| 9 | Chọn lớp không phù hợp vẫn điền tóm tắt | Ở bước 3 Đăng ký học, chọn lớp "Không phù hợp" thì thẻ vẫn sáng và khung Thông tin đăng ký vẫn hiện lớp và học phí; chỉ khi bấm Lập bản nháp mới báo lỗi. | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/029-staff-thu-chon-lop-vat-ly-8a-con-dang-hoc.png) |
| 10 | Gọi API sau khi đăng xuất | Sau Đăng xuất còn một request GET /classes trả 401 (chỉ là nhiễu console, không ảnh hưởng người dùng). | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/011-staff-menu-tai-khoan-dang-xuat.png) |

Chưa sửa code. Các mục trên chỉ ghi lại để quyết định.

## Chi tiết từng bước

### Chung: đăng nhập, phân quyền, đăng xuất

| # | Chức năng | Thao tác | Quan sát | Ảnh |
| --- | --- | --- | --- | --- |
| 001 | Đăng nhập | Mở trang đăng nhập |  | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/001-mo-trang-dang-nhap.png) |
| 002 | Đăng nhập | Bấm Đăng nhập khi bỏ trống | * \| \| Trường này là bắt buộc | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/002-bam-dang-nhap-khi-bo-trong.png) |
| 003 | Đăng nhập | Sai mật khẩu | Email hoặc mật khẩu không đúng. Vui lòng liên hệ Trưởng ban quản trị EduGrade: 0913 345 678 \ · API: POST /api/backend/auth/login → 401 | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/003-sai-mat-khau.png) |
| 004 | Đăng nhập | Trang Quên mật khẩu |  | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/004-trang-quen-mat-khau.png) |
| 005 | Đăng nhập | Gửi yêu cầu đặt lại mật khẩu | Nếu staff@edugrade.local có tài khoản, mã đặt lại mật khẩu đã được gửi Kiểm tra hộp thư đến (hoặc hòm thư rác), sao chép mã trong email và đặt mật khẩu mới trong vòng 30 phút. Nhập mã và đặt mật khẩu | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/005-gui-yeu-cau-dat-lai-mat-khau.png) |
| 006 | Phân quyền theo vai trò | Nhân viên mở Dashboard Quản lý → bị chặn | Không có quyền truy cập · /manager/dashboard | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/006-staff-nhan-vien-mo-dashboard-quan-ly-bi-chan.png) |
| 007 | Phân quyền theo vai trò | Giáo viên mở Lớp học của Quản lý → bị chặn | Không có quyền truy cập · /manager/classes | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/007-teacher-giao-vien-mo-lop-hoc-cua-quan-ly-bi-chan.png) |
| 008 | Phân quyền theo vai trò | Quản lý mở Đăng ký học của Nhân viên → bị chặn | Không có quyền truy cập · /staff/enrollments/new | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/008-manager-quan-ly-mo-dang-ky-hoc-cua-nhan-vien-bi-chan.png) |
| 009 | Phân quyền theo vai trò | Thiết kế giáo trình mở Nhân sự → bị chặn | Không có quyền truy cập · /manager/people | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/009-designer-thiet-ke-giao-trinh-mo-nhan-su-bi-chan.png) |
| 010 | Phân quyền theo vai trò | Thiết kế giáo trình mở cổng Giáo viên → bị chặn | Không có quyền truy cập · /teacher/dashboard | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/010-designer-thiet-ke-giao-trinh-mo-cong-giao-vien-bi-chan.png) |
| 011 | Đăng xuất | Menu tài khoản → Đăng xuất |  · API: GET /api/backend/classes?page=1&limit=100 → 401 | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/011-staff-menu-tai-khoan-dang-xuat.png) |
| 012 | Đăng xuất | Sau đăng xuất mở lại trang nội bộ → về đăng nhập | /login | [ảnh](screenshots/ui-roles-2026-10-19/0-chung/012-staff-sau-dang-xuat-mo-lai-trang-noi-bo-ve-dang-nhap.png) |

### Thiết kế giáo trình (designer@edugrade.local)

| # | Chức năng | Thao tác | Quan sát | Ảnh |
| --- | --- | --- | --- | --- |
| 001 | Đăng nhập | Đăng nhập tài khoản Thiết kế giáo trình | Vào /manager/curriculum/overview; menu: Tổng quan, Khóa học & giáo trình | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/001-designer-dang-nhap-tai-khoan-thiet-ke-giao-trinh.png) |
| 002 | Tổng quan | Tổng quan giáo trình (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/002-designer-tong-quan-giao-trinh-toan-trang.png) |
| 003 | Tổng quan | Bấm 'Danh sách giáo trình' |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/003-designer-bam-danh-sach-giao-trinh.png) |
| 004 | Danh sách giáo trình | Danh sách giáo trình | 18 dòng | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/004-designer-danh-sach-giao-trinh.png) |
| 005 | Danh sách giáo trình | Lọc: Cần tôi xử lý | 2 dòng | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/005-designer-loc-can-toi-xu-ly.png) |
| 006 | Danh sách giáo trình | Lọc: Đã duyệt | 12 dòng | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/006-designer-loc-da-duyet.png) |
| 007 | Danh sách giáo trình | Lọc: Đang soạn & chờ duyệt | 3 dòng | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/007-designer-loc-dang-soan-cho-duyet.png) |
| 008 | Danh sách giáo trình | Lọc: Lưu trữ | 8 dòng | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/008-designer-loc-luu-tru.png) |
| 009 | Danh sách giáo trình | Mở một giáo trình đã duyệt | Toán 6 - Học phần 2026-09 đến 2026-12 | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/009-designer-mo-mot-giao-trinh-da-duyet.png) |
| 010 | Soạn giáo trình mới | Mở form Tạo giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/010-designer-mo-form-tao-giao-trinh.png) |
| 011 | Soạn giáo trình mới | Bấm Tạo giáo trình nháp | Bản nháp | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/011-designer-bam-tao-giao-trinh-nhap.png) |
| 012 | Soạn giáo trình mới | Thêm bài học 1: Số nguyên âm và trục số |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/012-designer-them-bai-hoc-1-so-nguyen-am-va-truc-so.png) |
| 013 | Soạn giáo trình mới | Thêm bài học 2: Cộng trừ số nguyên |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/013-designer-them-bai-hoc-2-cong-tru-so-nguyen.png) |
| 014 | Soạn giáo trình mới | Thêm bài học 3: Nhân chia số nguyên |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/014-designer-them-bai-hoc-3-nhan-chia-so-nguyen.png) |
| 015 | Soạn giáo trình mới | Thêm bài học 4: Ôn tập chương số nguyên |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/015-designer-them-bai-hoc-4-on-tap-chuong-so-nguyen.png) |
| 016 | Soạn giáo trình mới | Giáo trình sau khi thêm 4 bài (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/016-designer-giao-trinh-sau-khi-them-4-bai-toan-trang.png) |
| 017 | Soạn giáo trình mới | Kiểm tra giáo trình | Cấu trúc giáo trình hợp lệ, có thể gửi thẩm định. · 4 bài học | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/017-designer-kiem-tra-giao-trinh.png) |
| 018 | Soạn giáo trình mới | Mở hộp Gửi thẩm định chuyên môn |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/018-designer-mo-hop-gui-tham-dinh-chuyen-mon.png) |
| 019 | Soạn giáo trình mới | Gửi thẩm định cho GV Nguyễn Minh Đức | Chờ thẩm định chuyên môn · đã khóa thêm bài học | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/019-designer-gui-tham-dinh-cho-gv-nguyen-minh-duc.png) |
| 020 | Nhập bài học từ CSV | Tạo giáo trình nháp cho CSV |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/020-designer-tao-giao-trinh-nhap-cho-csv.png) |
| 021 | Nhập bài học từ CSV | Mở 'Nhập bài học từ CSV' |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/021-designer-mo-nhap-bai-hoc-tu-csv.png) |
| 022 | Nhập bài học từ CSV | Chọn tệp CSV 2 bài và Xem trước | 2 dòng hợp lệ · 0 dòng lỗi | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/022-designer-chon-tep-csv-2-bai-va-xem-truoc.png) |
| 023 | Nhập bài học từ CSV | Nhập vào bản nháp | Đã nhập 2 nội dung. | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/023-designer-nhap-vao-ban-nhap.png) |
| 024 | Nhập bài học từ CSV | Bấm Đóng sau khi nhập CSV | Hiện cảnh báo 'Bỏ thay đổi chưa lưu?' dù đã nhập xong | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/024-designer-bam-dong-sau-khi-nhap-csv.png) |
| 025 | Nhập bài học từ CSV | Giáo trình sau khi nhập CSV | Bài học (2) | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/025-designer-giao-trinh-sau-khi-nhap-csv.png) |
| 026 | Nhập bài học từ CSV | CSV lỗi (thiếu tên bài) → báo lỗi từng dòng | 0 dòng hợp lệ · 2 dòng lỗi | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/026-designer-csv-loi-thieu-ten-bai-bao-loi-tung-dong.png) |
| 027 | Phản hồi giáo trình | Danh sách phản hồi từ giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/027-designer-danh-sach-phan-hoi-tu-giao-vien.png) |
| 028 | Phản hồi giáo trình | Mở phản hồi mới |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/028-designer-mo-phan-hoi-moi.png) |
| 029 | Phản hồi giáo trình | Chuyển 'Đang xử lý' + trả lời giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/029-designer-chuyen-dang-xu-ly-tra-loi-giao-vien.png) |
| 030 | Phản hồi giáo trình | Lưu phản hồi |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/030-designer-luu-phan-hoi.png) |
| 031 | Hồ sơ | Hồ sơ cá nhân |  | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/031-designer-ho-so-ca-nhan.png) |
| 032 | Hồ sơ | Mở thẳng Dashboard quản lý → bị chặn | Không có quyền truy cập · /manager/dashboard | [ảnh](screenshots/ui-roles-2026-10-19/2-thiet-ke-giao-trinh/032-designer-mo-thang-dashboard-quan-ly-bi-chan.png) |

### Giáo viên (teacher@edugrade.local)

| # | Chức năng | Thao tác | Quan sát | Ảnh |
| --- | --- | --- | --- | --- |
| 001 | Đăng nhập | Đăng nhập tài khoản Giáo viên | Vào /teacher/dashboard; menu: Dashboard, Lịch dạy & điểm danh 3, Lớp của tôi, Giáo trình, Bài tập & chấm bài 1, Báo cáo | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/001-teacher-dang-nhap-tai-khoan-giao-vien.png) |
| 002 | Dashboard | Tổng quan giảng dạy (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/002-teacher-tong-quan-giang-day-toan-trang.png) |
| 003 | Lịch dạy & điểm danh | Danh sách buổi dạy trong tuần |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/003-teacher-danh-sach-buoi-day-trong-tuan.png) |
| 004 | Lịch dạy & điểm danh | Chế độ Kanban |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/004-teacher-che-do-kanban.png) |
| 005 | Lịch dạy & điểm danh | Chế độ Tuần |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/005-teacher-che-do-tuan.png) |
| 006 | Lịch dạy & điểm danh | Chế độ Ngày |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/006-teacher-che-do-ngay.png) |
| 007 | Lịch dạy & điểm danh | Chọn buổi Toán 6A hôm nay (đã kết thúc) | 0 có mặt | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/007-teacher-chon-buoi-toan-6a-hom-nay-da-ket-thuc.png) |
| 008 | Lịch dạy & điểm danh | Chuẩn bị / cập nhật danh sách học viên |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/008-teacher-chuan-bi-cap-nhat-danh-sach-hoc-vien.png) |
| 009 | Lịch dạy & điểm danh | Chốt khi chưa chọn kết quả → báo lỗi | Chọn kết quả cho học viên này. \| Chọn kết quả cho học viên này. | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/009-teacher-chot-khi-chua-chon-ket-qua-bao-loi.png) |
| 010 | Lịch dạy & điểm danh | Đánh dấu: tất cả có mặt, 1 vắng, 1 có phép | 18 học viên · nút 'Có phép' bị khóa (chỉ dùng khi có đơn nghỉ được duyệt) · 17 có mặt | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/010-teacher-danh-dau-tat-ca-co-mat-1-vang-1-co-phep.png) |
| 011 | Lịch dạy & điểm danh | Ghi chú buổi + tick xác nhận |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/011-teacher-ghi-chu-buoi-tick-xac-nhan.png) |
| 012 | Lịch dạy & điểm danh | Chốt điểm danh |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/012-teacher-chot-diem-danh.png) |
| 013 | Lớp của tôi | Danh sách lớp phụ trách |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/013-teacher-danh-sach-lop-phu-trach.png) |
| 014 | Lớp của tôi | Xem lớp Toán 6A | Toán 6A | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/014-teacher-xem-lop-toan-6a.png) |
| 015 | Lớp của tôi | Chi tiết lớp — tab Học sinh |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/015-teacher-chi-tiet-lop-tab-hoc-sinh.png) |
| 016 | Lớp của tôi | Chi tiết lớp — tab Chuyên cần |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/016-teacher-chi-tiet-lop-tab-chuyen-can.png) |
| 017 | Lớp của tôi | Chi tiết lớp — tab Buổi học |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/017-teacher-chi-tiet-lop-tab-buoi-hoc.png) |
| 018 | Lớp của tôi | Chi tiết lớp — tab Giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/018-teacher-chi-tiet-lop-tab-giao-trinh.png) |
| 019 | Lớp của tôi | Xác nhận lịch cố định của lớp |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/019-teacher-xac-nhan-lich-co-dinh-cua-lop.png) |
| 020 | Giáo trình & thẩm định | Danh sách giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/020-teacher-danh-sach-giao-trinh.png) |
| 021 | Giáo trình & thẩm định | Lọc 'Cần tôi xử lý' | 4 dòng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/021-teacher-loc-can-toi-xu-ly.png) |
| 022 | Giáo trình & thẩm định | Mở giáo trình chờ thẩm định: Toán 6 - Học kỳ 2 tháng 1/2027 (QA) |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/022-teacher-mo-giao-trinh-cho-tham-dinh-toan-6-hoc-ky-2-thang-1-.png) |
| 023 | Giáo trình & thẩm định | Nhập nhận xét chuyên môn |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/023-teacher-nhap-nhan-xet-chuyen-mon.png) |
| 024 | Giáo trình & thẩm định | Đồng ý và chuyển quản lý | Chờ xác nhận áp dụng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/024-teacher-dong-y-va-chuyen-quan-ly.png) |
| 025 | Giáo trình & thẩm định | Tab Phản hồi giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/025-teacher-tab-phan-hoi-giao-trinh.png) |
| 026 | Giáo trình & thẩm định | Gửi phản hồi về một bài học |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/026-teacher-gui-phan-hoi-ve-mot-bai-hoc.png) |
| 027 | Bài tập & chấm bài | Danh sách bài tập |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/027-teacher-danh-sach-bai-tap.png) |
| 028 | Bài tập & chấm bài | Lọc: Cần chấm | 1 dòng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/028-teacher-loc-can-cham.png) |
| 029 | Bài tập & chấm bài | Lọc: Còn hạn | 2 dòng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/029-teacher-loc-con-han.png) |
| 030 | Bài tập & chấm bài | Lọc: Nháp | 1 dòng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/030-teacher-loc-nhap.png) |
| 031 | Bài tập & chấm bài | Lọc: Đã đóng | 3 dòng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/031-teacher-loc-da-dong.png) |
| 032 | Bài tập & chấm bài | Mở form Tạo bài tập / đề kiểm tra |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/032-teacher-mo-form-tao-bai-tap-de-kiem-tra.png) |
| 033 | Bài tập & chấm bài | Lưu nháp khi bỏ trống → báo lỗi | Vui lòng chọn một mục. \| Vui lòng nhập nội dung. \| Chọn ngày giờ hợp lệ. | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/033-teacher-luu-nhap-khi-bo-trong-bao-loi.png) |
| 034 | Bài tập & chấm bài | Điền thông tin chung |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/034-teacher-dien-thong-tin-chung.png) |
| 035 | Bài tập & chấm bài | Câu 1 tự luận + Câu 2 trắc nghiệm | Câu hỏi · 2 câu · 10 điểm | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/035-teacher-cau-1-tu-luan-cau-2-trac-nghiem.png) |
| 036 | Bài tập & chấm bài | Lưu nháp bài tập | · /teacher/assignments/cmvffd7to002sm1fssadu28l5/submissions | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/036-teacher-luu-nhap-bai-tap.png) |
| 037 | Bài tập & chấm bài | Giao bài khi chưa chọn học sinh → báo lỗi | Chọn ít nhất một học sinh. \| Xác nhận trước khi thực hiện. | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/037-teacher-giao-bai-khi-chua-chon-hoc-sinh-bao-loi.png) |
| 038 | Bài tập & chấm bài | Chọn 5 học sinh + tick xác nhận |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/038-teacher-chon-5-hoc-sinh-tick-xac-nhan.png) |
| 039 | Bài tập & chấm bài | Bấm Giao bài | · 0 | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/039-teacher-bam-giao-bai.png) |
| 040 | Bài tập & chấm bài | Mở bài cần chấm | /teacher/assignments/seed_demo_v1_assignment_open/submissions | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/040-teacher-mo-bai-can-cham.png) |
| 041 | Bài tập & chấm bài | Mở một bài nộp để chấm | /teacher/grading/seed_demo_v1_submission_open_an-math_2 | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/041-teacher-mo-mot-bai-nop-de-cham.png) |
| 042 | Bài tập & chấm bài | Gợi ý AI (đề xuất điểm, chưa công bố) |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/042-teacher-goi-y-ai-de-xuat-diem-chua-cong-bo.png) |
| 043 | Bài tập & chấm bài | Nhập điểm + nhận xét | 1 câu được nhập điểm | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/043-teacher-nhap-diem-nhan-xet.png) |
| 044 | Bài tập & chấm bài | Lưu nháp điểm | Đã lưu bản chấm nháp. | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/044-teacher-luu-nhap-diem.png) |
| 045 | Bài tập & chấm bài | Gửi điểm → hộp xác nhận | Gửi điểm cho phụ huynh?: Kiểm tra lại, Xác nhận gửi điểm, Đóng | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/045-teacher-gui-diem-hop-xac-nhan.png) |
| 046 | Bài tập & chấm bài | Xác nhận gửi điểm (lưu → duyệt → công bố) | Đã gửi điểm cho phụ huynh. · Đã công bố, Đã có đề xuất | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/046-teacher-xac-nhan-gui-diem-luu-duyet-cong-bo.png) |
| 047 | Báo cáo | Màn Báo cáo học tập |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/047-teacher-man-bao-cao-hoc-tap.png) |
| 048 | Báo cáo | Chọn lớp Toán 6A |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/048-teacher-chon-lop-toan-6a.png) |
| 049 | Báo cáo | Tạo báo cáo toàn lớp (có nhận xét AI) |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/049-teacher-tao-bao-cao-toan-lop-co-nhan-xet-ai.png) |
| 050 | Báo cáo | Tải báo cáo Excel | Tải về: report-cmvffe6gp0034m1fsbxgyrsf5.xlsx | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/050-teacher-tai-bao-cao-excel.png) |
| 051 | Báo cáo | Tải báo cáo PDF | Tải về: report-cmvffe6gp0034m1fsbxgyrsf5.pdf | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/051-teacher-tai-bao-cao-pdf.png) |
| 052 | Hồ sơ | Hồ sơ giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/052-teacher-ho-so-giao-vien.png) |
| 053 | Hồ sơ | Mở thẳng trang Lớp học của Quản lý → bị chặn | Không có quyền truy cập · /manager/classes | [ảnh](screenshots/ui-roles-2026-10-19/3-giao-vien/053-teacher-mo-thang-trang-lop-hoc-cua-quan-ly-bi-chan.png) |

### Quản lý trung tâm (manager@edugrade.local)

| # | Chức năng | Thao tác | Quan sát | Ảnh |
| --- | --- | --- | --- | --- |
| 001 | Đăng nhập | Đăng nhập tài khoản Quản lý | Vào /manager/dashboard; menu: Dashboard, Học sinh & phụ huynh, Lớp học, Lịch học, Khóa học & giáo trình, Nhân sự, Thông báo, Lịch sử thay đổi | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/001-manager-dang-nhap-tai-khoan-quan-ly.png) |
| 002 | Dashboard | Xem Dashboard tổng quan (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/002-manager-xem-dashboard-tong-quan-toan-trang.png) |
| 003 | Dashboard | Mở bộ chọn khoảng ngày |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/003-manager-mo-bo-chon-khoang-ngay.png) |
| 004 | Dashboard | Đổi khoảng ngày sang 01/09–30/09/2026 | 01/09/2026 – 30/09/2026 | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/004-manager-doi-khoang-ngay-sang-01-09-30-09-2026.png) |
| 005 | Dashboard | Xuất báo cáo Excel | Tải về: edugrade-thong-ke-2026-09-01-2026-09-30.xlsx | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/005-manager-xuat-bao-cao-excel.png) |
| 006 | Dashboard | Hoạt động gần đây → Xem tất cả | Chuyển tới /manager/system/audit-logs | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/006-manager-hoat-dong-gan-day-xem-tat-ca.png) |
| 007 | Học sinh & phụ huynh | Danh sách học sinh | 435 hồ sơ con | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/007-manager-danh-sach-hoc-sinh.png) |
| 008 | Học sinh & phụ huynh | Lọc nhanh: Chờ học bù | 220 hồ sơ con · 10 dòng trang đầu | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/008-manager-loc-nhanh-cho-hoc-bu.png) |
| 009 | Học sinh & phụ huynh | Lọc nhanh: Nghỉ dài hạn | 1 hồ sơ con · 1 dòng trang đầu | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/009-manager-loc-nhanh-nghi-dai-han.png) |
| 010 | Học sinh & phụ huynh | Lọc nhanh: Chưa có lớp | 57 hồ sơ con · 10 dòng trang đầu | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/010-manager-loc-nhanh-chua-co-lop.png) |
| 011 | Học sinh & phụ huynh | Lọc khối 8 | 118 hồ sơ con | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/011-manager-loc-khoi-8.png) |
| 012 | Học sinh & phụ huynh | Tìm kiếm học sinh 'Bùi Anh' | 1 dòng | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/012-manager-tim-kiem-hoc-sinh-bui-anh.png) |
| 013 | Học sinh & phụ huynh | Mở chi tiết học sinh — tab Tổng quan | Học sinh Bùi Anh Thịnh | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/013-manager-mo-chi-tiet-hoc-sinh-tab-tong-quan.png) |
| 014 | Học sinh & phụ huynh | Chi tiết học sinh — tab Lịch học |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/014-manager-chi-tiet-hoc-sinh-tab-lich-hoc.png) |
| 015 | Học sinh & phụ huynh | Chi tiết học sinh — tab Điểm & bài tập |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/015-manager-chi-tiet-hoc-sinh-tab-diem-bai-tap.png) |
| 016 | Học sinh & phụ huynh | Chi tiết học sinh — tab Học phí |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/016-manager-chi-tiet-hoc-sinh-tab-hoc-phi.png) |
| 017 | Học sinh & phụ huynh | Chi tiết học sinh — tab Nghỉ & học bù |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/017-manager-chi-tiet-hoc-sinh-tab-nghi-hoc-bu.png) |
| 018 | Học sinh & phụ huynh | Menu ⋮ của học sinh | Sửa hồ sơ, Xem tài khoản phụ huynh | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/018-manager-menu-cua-hoc-sinh.png) |
| 019 | Học sinh & phụ huynh | Tab Phụ huynh | 10 dòng trang đầu | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/019-manager-tab-phu-huynh.png) |
| 020 | Học sinh & phụ huynh | Xem hồ sơ phụ huynh (Sheet) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/020-manager-xem-ho-so-phu-huynh-sheet.png) |
| 021 | Học sinh & phụ huynh | Sửa thông tin phụ huynh (mở form) | \| Email đăng nhập, Họ tên, Số điện thoại liên hệ, Trạng thái | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/021-manager-sua-thong-tin-phu-huynh-mo-form.png) |
| 022 | Học sinh & phụ huynh | Lưu số điện thoại mới cho phụ huynh | Đã lưu thông tin phụ huynh. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/022-manager-luu-so-dien-thoai-moi-cho-phu-huynh.png) |
| 023 | Lớp học | Danh sách lớp dạng thẻ | 46 lớp học | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/023-manager-danh-sach-lop-dang-the.png) |
| 024 | Lớp học | Chuyển sang dạng bảng |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/024-manager-chuyen-sang-dang-bang.png) |
| 025 | Lớp học | Lọc môn Toán | 16 lớp học | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/025-manager-loc-mon-toan.png) |
| 026 | Lớp học | Menu Hành động của lớp | Xem buổi học, Đóng đăng ký, Ngừng hoạt động | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/026-manager-menu-hanh-dong-cua-lop.png) |
| 027 | Lớp học | Chi tiết lớp — Tổng quan | Lớp Chi tiết lớp | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/027-manager-chi-tiet-lop-tong-quan.png) |
| 028 | Lớp học | Chi tiết lớp — tab Học sinh |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/028-manager-chi-tiet-lop-tab-hoc-sinh.png) |
| 029 | Lớp học | Chi tiết lớp — tab Buổi học |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/029-manager-chi-tiet-lop-tab-buoi-hoc.png) |
| 030 | Lớp học | Mở dialog Đổi giáo viên | Giáo viên mới, Hiệu lực từ (giờ Việt Nam), Lý do#_r_ft_-reason \ | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/030-manager-mo-dialog-doi-giao-vien.png) |
| 031 | Lớp học | Mở form Tạo lớp học |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/031-manager-mo-form-tao-lop-hoc.png) |
| 032 | Lớp học | Điền form tạo lớp Toán 6 QA-EJB8 |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/032-manager-dien-form-tao-lop-toan-6-qa-ejb8.png) |
| 033 | Lớp học | Bấm Tạo lớp học | Đã lưu thông tin lớp. · URL /manager/classes/cmvffg0ln003am1fstfolnabj | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/033-manager-bam-tao-lop-hoc.png) |
| 034 | Lớp học | Đặt lịch tuần: Thứ 7 08:00–10:00 | Đã lưu thông tin lớp. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/034-manager-dat-lich-tuan-thu-7-08-00-10-00.png) |
| 035 | Lớp học | Tab Phòng học | 14 phòng | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/035-manager-tab-phong-hoc.png) |
| 036 | Lớp học | Thêm phòng bỏ trống tên → báo lỗi | Hiện lỗi bắt buộc nhập Tên phòng | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/036-manager-them-phong-bo-trong-ten-bao-loi.png) |
| 037 | Lớp học | Thêm phòng mới P.QA-EJB8 |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/037-manager-them-phong-moi-p-qa-ejb8.png) |
| 038 | Lớp học | Sửa phòng P.QA-EJB8 (sức chứa 30) | Đã lưu phòng P.QA-EJB8. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/038-manager-sua-phong-p-qa-ejb8-suc-chua-30.png) |
| 039 | Lớp học | Ngừng sử dụng phòng P.QA-EJB8 | Đã lưu phòng P.QA-EJB8. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/039-manager-ngung-su-dung-phong-p-qa-ejb8.png) |
| 040 | Lịch học | Lịch tuần dạng Kanban |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/040-manager-lich-tuan-dang-kanban.png) |
| 041 | Lịch học | Chế độ Tuần |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/041-manager-che-do-tuan.png) |
| 042 | Lịch học | Chế độ Ngày |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/042-manager-che-do-ngay.png) |
| 043 | Lịch học | Lọc theo giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/043-manager-loc-theo-giao-vien.png) |
| 044 | Lịch học | Tuần sau | Lịch tuần 26/10 – 01/11/2026 | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/044-manager-tuan-sau.png) |
| 045 | Lịch học | Mở Sheet buổi Vật lý 6A tuần sau — tab Nội dung | Lực và tác dụng của lực - Khái niệm và ví dụ | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/045-manager-mo-sheet-buoi-vat-ly-6a-tuan-sau-tab-noi-dung.png) |
| 046 | Lịch học | Sheet buổi học — tab Đổi giờ | Bắt đầu (giờ Việt Nam), Kết thúc (giờ Việt Nam), Lý do đổi giờ | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/046-manager-sheet-buoi-hoc-tab-doi-gio.png) |
| 047 | Lịch học | Sheet buổi học — tab Hủy buổi | Lý do hủy | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/047-manager-sheet-buoi-hoc-tab-huy-buoi.png) |
| 048 | Lịch học | Sheet buổi học — tab Dạy thay | Giáo viên dạy thay, Lý do | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/048-manager-sheet-buoi-hoc-tab-day-thay.png) |
| 049 | Lịch học | Dạy thay: chọn Đỗ Tuấn Anh + lý do |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/049-manager-day-thay-chon-do-tuan-anh-ly-do.png) |
| 050 | Lịch học | Bấm Xếp dạy thay | Đã xếp giáo viên dạy thay cho buổi học. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/050-manager-bam-xep-day-thay.png) |
| 051 | Lịch học | Đổi giờ buổi Vật lý 6A (lùi 1 tiếng) → Xem trước | Giờ cũ 2026-10-26 16:00 · Cảnh báo: Xử lý điểm danh và đơn nghỉ liên quan trước khi đổi hoặc hủy buổi. · API: POST /api/backend/academic/sessions/seed_demo_v1_session_physics-6-a_16/reschedule-preview → 409 | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/051-manager-doi-gio-buoi-vat-ly-6a-lui-1-tieng-xem-truoc.png) |
| 052 | Lịch học | Đổi giờ buổi Hóa học 6A (sớm 2 tiếng) → Xem trước | Giờ cũ 2026-10-26 16:00 | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/052-manager-doi-gio-buoi-hoa-hoc-6a-som-2-tieng-xem-truoc.png) |
| 053 | Lịch học | Xác nhận đổi giờ | Đã đổi giờ buổi học. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/053-manager-xac-nhan-doi-gio.png) |
| 054 | Lịch học | Hủy buổi Sinh học 6A tuần sau | Đã hủy buổi học. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/054-manager-huy-buoi-sinh-hoc-6a-tuan-sau.png) |
| 055 | Lịch học | Lịch tuần sau sau khi đổi giờ / hủy / dạy thay |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/055-manager-lich-tuan-sau-sau-khi-doi-gio-huy-day-thay.png) |
| 056 | Lịch học | Sinh lịch theo khóa (/manager/sessions) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/056-manager-sinh-lich-theo-khoa-manager-sessions.png) |
| 057 | Khóa học & giáo trình | Tab Khóa học & giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/057-manager-tab-khoa-hoc-giao-trinh.png) |
| 058 | Khóa học & giáo trình | Tạo khóa học mới (form nội tuyến) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/058-manager-tao-khoa-hoc-moi-form-noi-tuyen.png) |
| 059 | Khóa học & giáo trình | Menu Hành động của khóa |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/059-manager-menu-hanh-dong-cua-khoa.png) |
| 060 | Khóa học & giáo trình | Sửa khóa (dialog) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/060-manager-sua-khoa-dialog.png) |
| 061 | Khóa học & giáo trình | Xem chi tiết khóa — Tổng quan |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/061-manager-xem-chi-tiet-khoa-tong-quan.png) |
| 062 | Khóa học & giáo trình | Chi tiết khóa — tab Giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/062-manager-chi-tiet-khoa-tab-giao-trinh.png) |
| 063 | Khóa học & giáo trình | Chi tiết khóa — tab Các lớp áp dụng |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/063-manager-chi-tiet-khoa-tab-cac-lop-ap-dung.png) |
| 064 | Khóa học & giáo trình | Tab Môn học |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/064-manager-tab-mon-hoc.png) |
| 065 | Khóa học & giáo trình | Tạo môn học mới (mã TIN) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/065-manager-tao-mon-hoc-moi-ma-tin.png) |
| 066 | Khóa học & giáo trình | Tab Phản hồi giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/066-manager-tab-phan-hoi-giao-trinh.png) |
| 067 | Khóa học & giáo trình | Xem một phản hồi (panel xử lý) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/067-manager-xem-mot-phan-hoi-panel-xu-ly.png) |
| 068 | Duyệt giáo trình & sinh lịch theo khóa | Giáo trình chờ xác nhận áp dụng trong danh sách khóa | Toán 6 - Học kỳ 2 tháng 1/2027 (QA) · v1 04/01/2027 → 31/01/2027 4 Chờ xác nhận áp dụng Duyệt | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/068-manager-giao-trinh-cho-xac-nhan-ap-dung-trong-danh-sach-khoa.png) |
| 069 | Duyệt giáo trình & sinh lịch theo khóa | Bấm Duyệt → mở giáo trình | Toán 6 - Học kỳ 2 tháng 1/2027 (QA) | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/069-manager-bam-duyet-mo-giao-trinh.png) |
| 070 | Duyệt giáo trình & sinh lịch theo khóa | Xác nhận áp dụng (hộp xác nhận) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/070-manager-xac-nhan-ap-dung-hop-xac-nhan.png) |
| 071 | Duyệt giáo trình & sinh lịch theo khóa | Giáo trình Đã duyệt |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/071-manager-giao-trinh-da-duyet.png) |
| 072 | Duyệt giáo trình & sinh lịch theo khóa | Sinh lịch theo khóa — chọn khóa Toán 6 |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/072-manager-sinh-lich-theo-khoa-chon-khoa-toan-6.png) |
| 073 | Duyệt giáo trình & sinh lịch theo khóa | Chọn khoảng 04/01–31/01/2027 → Xem trước | 2 buổi/tuần \| 2 buổi/tuần \| 2 buổi/tuần \| 1 buổi/tuần | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/073-manager-chon-khoang-04-01-31-01-2027-xem-truoc.png) |
| 074 | Duyệt giáo trình & sinh lịch theo khóa | Sinh lịch | Đã sinh 4 buổi · 04/01/2027 – 31/01/2027 | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/074-manager-sinh-lich.png) |
| 075 | Nhân sự | Tab Giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/075-manager-tab-giao-vien.png) |
| 076 | Nhân sự | Xem hồ sơ giáo viên (Sheet) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/076-manager-xem-ho-so-giao-vien-sheet.png) |
| 077 | Nhân sự | Sửa tài khoản giáo viên (dialog) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/077-manager-sua-tai-khoan-giao-vien-dialog.png) |
| 078 | Nhân sự | Mời giáo viên — nhập email |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/078-manager-moi-giao-vien-nhap-email.png) |
| 079 | Nhân sự | Mời giáo viên — Tạo lời mời | \| Tạo lời mời, Sao chép, Đóng | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/079-manager-moi-giao-vien-tao-loi-moi.png) |
| 080 | Nhân sự | Tab Nhân viên & thiết kế giáo trình |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/080-manager-tab-nhan-vien-thiet-ke-giao-trinh.png) |
| 081 | Nhân sự | Mở dialog Tạo tài khoản nhân viên | Vai trò, Họ tên, Email, Mật khẩu ban đầu#_r_11_-password \ | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/081-manager-mo-dialog-tao-tai-khoan-nhan-vien.png) |
| 082 | Nhân sự | Tạo tài khoản nhân viên QA | Đã tạo tài khoản nhân viên. | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/082-manager-tao-tai-khoan-nhan-vien-qa.png) |
| 083 | Nhân sự | Khóa tài khoản nhân viên QA | Đã khóa tài khoản Nhân viên QA EJB8. · trạng thái dòng: QE Nhân viên QA EJB8 nv.qa.ejb8@edugrade.test Nhân viên Đã khóa Sửa Mở khóa | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/083-manager-khoa-tai-khoan-nhan-vien-qa.png) |
| 084 | Nhân sự | Tab Quản lý |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/084-manager-tab-quan-ly.png) |
| 085 | Nhân sự | Tab Lời mời |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/085-manager-tab-loi-moi.png) |
| 086 | Nhân sự | Xem lời mời |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/086-manager-xem-loi-moi.png) |
| 087 | Nhân sự | Thu hồi lời mời vừa tạo |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/087-manager-thu-hoi-loi-moi-vua-tao.png) |
| 088 | Nhân sự | Mở hồ sơ chờ duyệt (candidate.pending) | Duyệt tài khoản, Từ chối, Đóng / Ghi chú duyệt, Lý do từ chối | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/088-manager-mo-ho-so-cho-duyet-candidate-pending.png) |
| 089 | Nhân sự | Duyệt tài khoản giáo viên |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/089-manager-duyet-tai-khoan-giao-vien.png) |
| 090 | Thông báo | Màn Thông báo (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/090-manager-man-thong-bao-toan-trang.png) |
| 091 | Thông báo | Soạn thông báo lớp |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/091-manager-soan-thong-bao-lop.png) |
| 092 | Thông báo | Lưu thông báo |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/092-manager-luu-thong-bao.png) |
| 093 | Thông báo | Gửi email thông báo vừa lưu |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/093-manager-gui-email-thong-bao-vua-luu.png) |
| 094 | Thông báo | Tick xác nhận và bấm Gửi email |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/094-manager-tick-xac-nhan-va-bam-gui-email.png) |
| 095 | Thông báo | Tab Nhắc học phí |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/095-manager-tab-nhac-hoc-phi.png) |
| 096 | Thông báo | Lịch sử email — lọc trạng thái | Tùy chọn: | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/096-manager-lich-su-email-loc-trang-thai.png) |
| 097 | Lịch sử thay đổi | Danh sách nhật ký |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/097-manager-danh-sach-nhat-ky.png) |
| 098 | Lịch sử thay đổi | Lọc theo hành động | Chọn: Tạo dữ liệu demo (39 lựa chọn) | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/098-manager-loc-theo-hanh-dong.png) |
| 099 | Lịch sử thay đổi | Xem thay đổi (mở chi tiết) |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/099-manager-xem-thay-doi-mo-chi-tiet.png) |
| 100 | Hồ sơ & thanh đầu trang | Menu Tạo nhanh |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/100-manager-menu-tao-nhanh.png) |
| 101 | Hồ sơ & thanh đầu trang | Tìm màn hình (Ctrl+K) 'lớp' |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/101-manager-tim-man-hinh-ctrl-k-lop.png) |
| 102 | Hồ sơ & thanh đầu trang | Chuông thông báo |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/102-manager-chuong-thong-bao.png) |
| 103 | Hồ sơ & thanh đầu trang | Menu tài khoản | Tài khoản, Đổi mật khẩu, Đăng xuất | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/103-manager-menu-tai-khoan.png) |
| 104 | Hồ sơ & thanh đầu trang | Hồ sơ cá nhân |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/104-manager-ho-so-ca-nhan.png) |
| 105 | Hồ sơ & thanh đầu trang | Đổi họ tên hiển thị |  | [ảnh](screenshots/ui-roles-2026-10-19/1-quan-ly/105-manager-doi-ho-ten-hien-thi.png) |

### Nhân viên (staff@edugrade.local)

| # | Chức năng | Thao tác | Quan sát | Ảnh |
| --- | --- | --- | --- | --- |
| 001 | Đăng nhập | Đăng nhập tài khoản Nhân viên | Vào /staff/dashboard; menu: Dashboard, Học sinh & phụ huynh, Lớp học, Lịch học, Đăng ký học, Đăng ký & biên lai 7 | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/001-staff-dang-nhap-tai-khoan-nhan-vien.png) |
| 002 | Dashboard | Dashboard nhân viên (toàn trang) |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/002-staff-dashboard-nhan-vien-toan-trang.png) |
| 003 | Học sinh & phụ huynh | Danh sách học sinh | 435 hồ sơ con | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/003-staff-danh-sach-hoc-sinh.png) |
| 004 | Học sinh & phụ huynh | Lọc 'Chờ học bù' | 220 hồ sơ con | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/004-staff-loc-cho-hoc-bu.png) |
| 005 | Học sinh & phụ huynh | Mở panel Xử lý của học sinh chờ học bù | Xử lý cho học sinh · tabs: | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/005-staff-mo-panel-xu-ly-cua-hoc-sinh-cho-hoc-bu.png) |
| 006 | Học sinh & phụ huynh | Ghi nhận nghỉ một buổi: chọn ghi danh + buổi nghỉ | Buổi nghỉ: 17:30 22/10/26 · Hằng đẳng thức và phân tích nhân tử - Ôn tập và củng cố | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/006-staff-ghi-nhan-nghi-mot-buoi-chon-ghi-danh-buoi-nghi.png) |
| 007 | Học sinh & phụ huynh | Bấm Ghi nhận nghỉ |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/007-staff-bam-ghi-nhan-nghi.png) |
| 008 | Học sinh & phụ huynh | Xếp học bù: chọn buổi gốc vừa nghỉ | Buổi gốc Toán 8 Nâng cao · 17:30 22/10/26 · Hằng đẳng thức và phân tích nhân tử - Ôn tập và củng cố Buổi thay thế Chọn… Buổi cùng bài không xếp được Toán 8C - Đủ sĩ số · 20:00 21/10/26: đã đủ sĩ số Toán 8B · 14:00 22/10/ | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/008-staff-xep-hoc-bu-chon-buoi-goc-vua-nghi.png) |
| 009 | Học sinh & phụ huynh | Chọn buổi thay thế | Buổi bù: Toán 8B · 18:00 20/10/26 · Còn 8 chỗ · nút: Xếp học bù · Tôi xác nhận xếp buổi thay thế đã chọn. | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/009-staff-chon-buoi-thay-the.png) |
| 010 | Học sinh & phụ huynh | Xác nhận xếp học bù |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/010-staff-xac-nhan-xep-hoc-bu.png) |
| 011 | Học sinh & phụ huynh | Panel Xử lý — tab Nghỉ & học bù | Ghi danh cần xử lý, Buổi nghỉ, Lý do nghỉ, Buổi gốc, Xác nhận hủy lịch học bù này, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ / Toán 8 Nâng cao · Đang học · 08/10/2026–08/1 | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/011-staff-panel-xu-ly-tab-nghi-hoc-bu.png) |
| 012 | Học sinh & phụ huynh | Panel Xử lý — tab Đổi lớp / lịch cố định | Ghi danh cần xử lý, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ / Toán 8 Nâng cao · Đang học · 08/10/2026–08/11/2026, Hủy đơn, Đóng \| / Toán 8 Nâng cao · Đang học · 08/10/2 | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/012-staff-panel-xu-ly-tab-doi-lop-lich-co-dinh.png) |
| 013 | Học sinh & phụ huynh | Panel Xử lý — tab Nghỉ dài hạn | Ghi danh cần xử lý, Ngày bắt đầu, Ngày kết thúc, Lý do, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ / Toán 8 Nâng cao · Đang học · 08/10/2026–08/11/2026, Xác nhận nghỉ dài h | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/013-staff-panel-xu-ly-tab-nghi-dai-han.png) |
| 014 | Học sinh & phụ huynh | Panel Xử lý — tab Nghỉ môn / nghỉ hẳn | Ghi danh cần xử lý, Tôi xác nhận kết thúc ghi danh tại Toán 8 Nâng cao ngay bây giờ., Tôi xác nhận ngừng toàn bộ việc học ngay bây giờ., Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đơn nghỉ, Xác nhận hủy đ | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/014-staff-panel-xu-ly-tab-nghi-mon-nghi-han.png) |
| 015 | Học sinh & phụ huynh | Xem chi tiết học sinh | Hồ sơ học sinh | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/015-staff-xem-chi-tiet-hoc-sinh.png) |
| 016 | Học sinh & phụ huynh | Tab Phụ huynh |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/016-staff-tab-phu-huynh.png) |
| 017 | Lớp học | Danh sách lớp | 47 lớp học | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/017-staff-danh-sach-lop.png) |
| 018 | Lớp học | Dạng bảng |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/018-staff-dang-bang.png) |
| 019 | Lớp học | Bấm 'Thêm học sinh' trên thẻ lớp → mở đăng ký với lớp chọn sẵn | /staff/enrollments/new?classId=seed_bulk_v1_class_chemistry-6-ct | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/019-staff-bam-them-hoc-sinh-tren-the-lop-mo-dang-ky-voi-lop-chon.png) |
| 020 | Lớp học | Menu Hành động của lớp | Xem buổi học | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/020-staff-menu-hanh-dong-cua-lop.png) |
| 021 | Lịch học | Lịch tuần (Kanban) |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/021-staff-lich-tuan-kanban.png) |
| 022 | Lịch học | Mở Sheet buổi học | Tabs: | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/022-staff-mo-sheet-buoi-hoc.png) |
| 023 | Đăng ký học | Bước 1 — tra cứu phụ huynh |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/023-staff-buoc-1-tra-cuu-phu-huynh.png) |
| 024 | Đăng ký học | Tìm email không tồn tại |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/024-staff-tim-email-khong-ton-tai.png) |
| 025 | Đăng ký học | Tìm phụ huynh parent@edugrade.local |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/025-staff-tim-phu-huynh-parent-edugrade-local.png) |
| 026 | Đăng ký học | Chọn phụ huynh Nguyễn Văn Nam |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/026-staff-chon-phu-huynh-nguyen-van-nam.png) |
| 027 | Đăng ký học | Bước 2 — chọn hồ sơ con Nguyễn Minh An |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/027-staff-buoc-2-chon-ho-so-con-nguyen-minh-an.png) |
| 028 | Đăng ký học | Bước 3 — danh sách lớp phù hợp khối 8 | 15 lớp | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/028-staff-buoc-3-danh-sach-lop-phu-hop-khoi-8.png) |
| 029 | Đăng ký học | Thử chọn lớp Vật lý 8A (con đang học) | Vật lý 8A: Con đã đăng ký lớp này trong kỳ học trùng nhau. · Không phù hợp | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/029-staff-thu-chon-lop-vat-ly-8a-con-dang-hoc.png) |
| 030 | Đăng ký học | Chọn lớp đầu tiên còn phù hợp | Lớp: Sinh học 8 Cuối tuần · ngày bắt đầu 2026-10-24 | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/030-staff-chon-lop-dau-tien-con-phu-hop.png) |
| 031 | Đăng ký học | Lập bản nháp | Đã lưu bản nháp. Chỉ xác nhận sau khi thu đủ học phí. | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/031-staff-lap-ban-nhap.png) |
| 032 | Đăng ký học | Bước 4 — xác nhận thanh toán |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/032-staff-buoc-4-xac-nhan-thanh-toan.png) |
| 033 | Đăng ký học | Bước 5 — đăng ký thành công + biên lai |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/033-staff-buoc-5-dang-ky-thanh-cong-bien-lai.png) |
| 034 | Đăng ký & biên lai | Danh sách đăng ký |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/034-staff-danh-sach-dang-ky.png) |
| 035 | Đăng ký & biên lai | Mở Thu phí | Hà Mai Vân · Sinh học 7 Nâng cao · Số tiền phải thu 4.800.000 ₫ | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/035-staff-mo-thu-phi.png) |
| 036 | Đăng ký & biên lai | Bấm Xác nhận thanh toán |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/036-staff-bam-xac-nhan-thanh-toan.png) |
| 037 | Đăng ký & biên lai | Nhập số biên lai + tick đã nhận đủ tiền → Đã thanh toán | Đã xác nhận học phí và ghi danh cho con. | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/037-staff-nhap-so-bien-lai-tick-da-nhan-du-tien-da-thanh-toan.png) |
| 038 | Đăng ký & biên lai | Biên lai sau khi thu phí | Hà Mai Vân · Sinh học 7 Nâng cao · Bill học phí · Biên lai thu học phí | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/038-staff-bien-lai-sau-khi-thu-phi.png) |
| 039 | Đăng ký & biên lai | Mở Biên lai | Nguyễn Minh An · Sinh học 8 Cuối tuần / Đóng đăng ký, In bill, In biên lai | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/039-staff-mo-bien-lai.png) |
| 040 | Đăng ký & biên lai | Tab Thanh toán đã xác nhận |  | [ảnh](screenshots/ui-roles-2026-10-19/4-nhan-vien/040-staff-tab-thanh-toan-da-xac-nhan.png) |

## Giới hạn

- AI chấm bài và gửi email dùng stub: chỉ kiểm tra luồng giao diện, không kiểm tra chất lượng AI hay việc thư đến hộp thư.
- Không test app Mobile của phụ huynh. Bài nộp dùng dữ liệu seed.
- Mỗi lần chạy tạo dữ liệu QA mới (lớp, phòng, khóa, tài khoản) trên DB riêng, DB bị xóa sau khi chạy.
- Script test để ngoài repo (scratchpad của phiên), không thêm vào `tests/`.

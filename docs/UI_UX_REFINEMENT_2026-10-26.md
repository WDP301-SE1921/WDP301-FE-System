# Cải thiện UI/UX — 2026-10-26

Phạm vi: 19 file UI/auth của `WDP301-FE-System`, thực hiện trên nhánh `feature/ui-ux-refinement`. Giữ hệ màu xanh, font, bo góc Maia và nhận diện EduGrade hiện tại. Không thêm thư viện, không sửa UI primitive, API, dữ liệu hoặc logic nghiệp vụ.

## Thay đổi

- **Đăng nhập:** ô nhập/nút có kích thước dễ thao tác hơn; phân cấp tiêu đề và khoảng cách rõ hơn; hiện trạng thái đang đăng nhập; lỗi được thông báo và nhận focus; nút hiện/ẩn mật khẩu có nhãn và trạng thái truy cập.
- **Bảng và tìm kiếm:** phân trang dùng nút native với trạng thái disabled; thao tác vào checkbox/nút/link trong dòng không kích hoạt nhầm mở dòng; chọn một phần có trạng thái indeterminate; ô tìm kiếm và nút xóa có nhãn, vùng bấm mobile lớn hơn.
- **Layout và responsive:** thêm liên kết đi thẳng đến nội dung chính; giới hạn thông tin tài khoản ở header; các tab, nhóm hành động và thanh thao tác nhiều dòng được giới hạn theo viewport, có xuống dòng và khoảng cách safe area khi cần. Sửa cả tab tại màn Nhân sự.
- **Loading/lỗi/trống:** thống nhất khoảng cách và token màu; nút thử lại dễ bấm; skeleton co giãn ở màn nhỏ và có thông báo tải cho trình đọc màn hình; overlay dùng `inert` để nội dung bị che không còn nhận thao tác bàn phím.
- **Chuyển động:** chuyển tiếp nhẹ ở form, nút và ô nhập; bổ sung đường xử lý `prefers-reduced-motion` cho spinner, skeleton, sidebar và các overlay/popover. Giữ phản hồi trạng thái dễ nhận biết khi giảm chuyển động.

## Kiểm tra

| Hạng mục | Kết quả hiện tại |
| --- | --- |
| TypeScript toàn dự án | Đạt, 0 lỗi. |
| ESLint toàn dự án | 0 lỗi; 14 warning đều ở file không sửa. |
| Hồi quy đăng ký/biên lai/tiến trình | 40 test: 39 đạt, 1 lỗi có sẵn từ trước; xem chi tiết bên dưới. |
| Impeccable mechanical detector | Trả `[]` ở lượt shared/auth ban đầu. |
| Production build cuối cùng | Đạt: `next build --webpack`, bao gồm TypeScript và tạo đủ 65 trang tĩnh. |
| Browser cuối cùng | 20/20 kiểm tra đạt; không có lỗi JavaScript trên các luồng đã kiểm tra. Đăng nhập/Nhân sự/Lớp học ở 320, 390, 768 và 1440px; có tab mobile, menu, skip navigation, phân trang bàn phím, giảm chuyển động, loading/empty/error, thử lại và focus lỗi đăng nhập. |

Browser dùng backend fixture có sẵn trong repo, không kết nối database nghiệp vụ. Các kết quả trên xác nhận phạm vi đã kiểm tra, không thay cho kiểm thử mọi màn hình/vai trò với backend thật.

### Lỗi hồi quy có sẵn

Test `Missing suggestion endpoint only falls back for complete emails and never invents accounts` tại `tests/registration-flow.test.cjs:103` chờ thông báo `/Disconnected/`, trong khi API normalizer trả `Không thể hoàn tất thao tác. Vui lòng thử lại.`.

Đã tái hiện cùng lỗi trên source nguyên bản của HEAD `e6a04dec4cd55a7fdb76f8dc00ef2f7f3e135c19` trong snapshot riêng: 1 test được chọn, 1 thất bại. Source được lấy bằng `git archive`; bộ test hiện có được sao chép vì thư mục `tests/` không được track ở HEAD. Không sửa lỗi này trong đợt UI/UX.

## Evidence

Ảnh trước/sau, báo cáo browser và helper QA được lưu cục bộ tại [`../../artifacts/ui-ux-refinement`](../../artifacts/ui-ux-refinement/). Kết quả browser cuối: [`report.json`](../../artifacts/ui-ux-refinement/after/report.json).

Ảnh tiêu biểu: [Đăng nhập mobile](../../artifacts/ui-ux-refinement/after/login-390.png), [Nhân sự mobile](../../artifacts/ui-ux-refinement/after/people-390.png), [Lỗi và thử lại](../../artifacts/ui-ux-refinement/after/people-error-mobile.png).

Snapshot xác minh lỗi có sẵn: `D:\WDP\artifacts\ui-ux-refinement\baseline-head-302ba06542e84b9fbf55acdc245bf834`.

Các kiểm tra responsive dùng Chrome với viewport mô phỏng; chưa kiểm tra trên thiết bị di động thật. Không thay đổi dữ liệu nghiệp vụ trong lượt QA.

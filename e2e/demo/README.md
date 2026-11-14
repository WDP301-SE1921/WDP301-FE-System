# WDP — Playwright E2E theo các luồng demo

Bộ mở rộng kiểm tra toàn hệ thống và production nằm ở [hướng dẫn hệ thống](../system/README.md) và [hướng dẫn production](../production/README.md). Nhánh mobile hiện dùng `develop` với Expo 58, đã có ảnh/PDF theo từng câu.

Bộ test chạy trên **API NestJS, MySQL, MinIO, web Next.js và app phụ huynh Expo web thật**, dùng môi trường riêng. Không giả lập API nghiệp vụ bằng `page.route()` hay mock backend. Dữ liệu chuẩn bị riêng cho từng test có tiền tố `E2E`, kiểm tra kết quả bằng UI, HTTP và database.

## Chạy lại

Yêu cầu Node.js 22+, Docker Desktop đang chạy; cài các dependency đúng lockfile trong BE, FE và FEM. Ba thư mục phải cùng cấp:

```text
WDP301-BE-System/
WDP301-FE-System/
WDP301-FEM-System/
```

Tại `WDP301-FE-System`:

```powershell
# Dựng môi trường riêng, migrate/seed, build bản mới, chạy có cửa sổ trình duyệt.
npm run test:e2e:demo:headed

# Nếu môi trường kiểm thử đã chạy từ phiên hiện tại:
npm run test:e2e:demo:headed -- --reuse

# Mở báo cáo có ảnh, video và trace của lần chạy gần nhất:
npm run test:e2e:demo:report
```

Mặc định dùng Microsoft Edge trên Windows. Có thể chọn Chrome bằng `$env:E2E_CHANNEL='chrome'`. Không dùng app production hay tài khoản thật.

Để giữ môi trường chạy và mở giao diện Playwright tương tác, dùng hai terminal:

```powershell
# Terminal 1: giữ API, web và app chạy; Ctrl+C dừng các server.
node e2e/demo/run.mjs --serve

# Terminal 2: danh sách test, nút Run, các bước và trace.
npm run test:e2e:demo:ui
```

Chạy một luồng trên môi trường đang mở:

```powershell
npm run test:e2e:demo:headed -- --reuse 03-homework.spec.ts
```

Mỗi lần chạy đầy đủ sinh lại báo cáo. Muốn giữ một lần chạy trước thì sao chép cả `e2e/.demo-report/` và `e2e/.demo-results/` trước khi chạy lượt mới.

## Phạm vi 13 test

| Test | Luồng và điều kiện được kiểm chứng                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | Designer nhập CSV; bản nháp bị khóa khi gửi duyệt; teacher nhận xét; manager thấy nhận xét, duyệt và tạo đúng thứ tự bài/lịch.                                                           |
| 02   | Parent tạo hồ sơ con; staff chọn đúng khối/kỳ học; lớp hết chỗ bị khóa; thanh toán mới tạo payment/enrollment/receipt; sai khối và hết chỗ cũng bị API từ chối.                          |
| 03   | Teacher soạn/giao bài; parent thay mặt con nộp ảnh câu 1 và PDF câu 2; giữ đúng ánh xạ file; AI chỉ gợi ý; nháp không lộ cho parent; teacher xác nhận công bố thì parent mới xem được.   |
| 04   | Parent gửi đơn nghỉ; trước khi duyệt không đặt bù được; staff duyệt và xếp bù; chỉ cùng bài/còn chỗ/không trùng lịch; lý do loại rõ ràng; chống đặt trùng; teacher thấy học sinh học bù. |
| 05   | Teacher chọn Có mặt/Vắng và chốt; API và UI khóa sửa; chốt Có mặt tại lớp bù tự hoàn tất booking; web/mobile cùng `(present + made up) / required`; Có phép không vào mẫu số.            |
| 06   | Report chỉ lấy buổi đã chốt và điểm công bố; AI summary; tải PDF/Excel thật và kiểm tra file; snapshot không thay đổi khi nguồn đổi; staff bị chặn tải.                                  |
| 07   | Staff tạm nghỉ theo khoảng; chỉ các buổi trong khoảng thành Có phép; ghi danh vẫn hoạt động.                                                                                             |
| 08   | Từ chối khác khóa; chuyển cùng khóa/học phí; đóng placement cũ và mở placement mới đúng ngày hiệu lực; giữ lịch sử, đổi ghế tương lai.                                                   |
| 09   | Kết thúc môn có xác nhận; giữ buổi đã học và hủy ghế tương lai; học lại phải có đăng ký, khoản thu và enrollment mới.                                                                    |
| 10   | Gợi ý dạy thay loại giáo viên bận; API chống trùng; dạy thay một buổi; đổi dài hạn chỉ chuyển từ ngày hiệu lực; audit và quyền manager.                                                  |
| 11   | Dời buổi giữ bài/roster; hủy và dời bài; ngày nghỉ và hủy theo lô; giữ buổi ngoài lô; parent có thông báo.                                                                               |
| 12   | Manager soạn thông báo; parent nhận realtime không refresh; gửi SMTP cục bộ và chống trùng; nhắc kỳ sắp hết và lưu thông báo.                                                            |
| 13   | Chat quản lý/nhân viên realtime hai chiều; teacher/designer cũng dùng được; người ngoài cuộc trò chuyện và parent bị chặn.                                                               |

## Giới hạn đã nêu rõ

- **Mobile chạy qua Expo web trong trình duyệt Playwright**, chưa kiểm thử Android/iOS native, camera thật hoặc quyền của hệ điều hành.
- Mobile hiện chưa có form báo nghỉ. Bước parent báo nghỉ ở test 04 gọi **API thật với quyền parent**; staff duyệt/xếp bù và teacher đọc roster qua UI thật.
- Không có khóa AI thật: transcription, grading và summary dùng provider HTTP cục bộ có kết quả xác định. Pipeline file/AI, kiểm tra dữ liệu và cơ chế teacher duyệt/công bố là thật; không đánh giá độ chính xác của mô hình AI bên ngoài.
- Email gửi qua SMTP thật vào bộ thu cục bộ, không gửi tới hộp thư phụ huynh. Chưa kiểm tra khả năng vào inbox của nhà cung cấp mail ngoài.
- Realtime Socket.IO được kiểm tra thật. **OS Web Push chưa được kiểm chứng** do môi trường riêng không có VAPID key/subscription; test xác nhận API báo đúng trạng thái tắt.
- Một fixture học bù được chuyển timestamp từ tương lai về quá khứ sau khi đặt bù thật để mô phỏng thời gian đã trôi qua. Trạng thái BOOKED → COMPLETED vẫn do API chốt điểm danh thực hiện.
- Đây là coverage các luồng demo, không phải chứng nhận mọi màn hình, mọi kiểu dữ liệu và mọi trường hợp cạnh tranh của toàn hệ thống.

## Môi trường và an toàn dữ liệu

| Thành phần                | Địa chỉ                       |
| ------------------------- | ----------------------------- |
| Web                       | http://localhost:3001         |
| App phụ huynh             | http://localhost:8081         |
| API                       | http://localhost:3000/api/v1  |
| MySQL riêng               | `127.0.0.1:3308/edugrade_e2e` |
| MinIO riêng               | http://127.0.0.1:9002         |
| AI test + bằng chứng SMTP | http://127.0.0.1:3900         |
| Báo cáo khi mở            | http://127.0.0.1:9323         |

`environment.cjs` chỉ chứa credential development của môi trường E2E cục bộ. Bộ test từ chối database khác `127.0.0.1:3308/edugrade_e2e` và từ chối token API có issuer khác `wdp-e2e`. Không đọc credential thật từ `.env` BE để test. Docker volumes giữ nguyên giữa các lần chạy; không chạy reset/reseed hay `down -v`.

Lần chạy thường tự dừng server khi kết thúc. `--serve` giữ server cho người dùng thao tác; báo cáo HTML xem lại được mà không cần server ứng dụng. File session/token, kết quả, video, trace và log nằm trong các thư mục `e2e/.demo-*` đã được bỏ qua bởi Git.

## Các nhánh đã kiểm tra

Chi tiết từng nhánh, commit và phần chưa tích hợp nằm trong [branch-audit.json](./branch-audit.json). Cập nhật báo cáo bằng `node e2e/demo/audit-branches.mjs` sau khi đã fetch.

- BE: `dev`; có dashboard admin mới hơn `main`.
- FE: nền `main` mới nhất, test bổ sung trên `feature/demo-e2e`; `main` và `dev` cùng tree tại lúc kiểm tra, khác lịch sử CI.
- Admin: `dev` cập nhật; cùng tree với `main`. Các hình gửi không có luồng admin tổng nên bộ demo này không kiểm tra toàn bộ admin UI.
- FEM: `dev` để có nộp ảnh/PDF riêng từng câu. `develop` có 11 commit riêng (push, hồ sơ, phát hành…) nhưng thiếu commit `2bc8be8` của `dev`; đã tải và cập nhật local `develop`, giữ riêng để tránh tự trộn hai hướng phát triển.

Không commit hoặc push thay người dùng.

# Playwright Production — dành cho team

Project Playwright riêng tên **`production`**, chạy trực tiếp trên:

- [Web production](https://edugrade.45.77.168.110.sslip.io)
- [Admin production](https://admin.edugrade.45.77.168.110.sslip.io)
- [API readiness](https://api.edugrade.45.77.168.110.sslip.io/api/v1/health/ready)
- [API Swagger](https://api.edugrade.45.77.168.110.sslip.io/api/docs)

Chỉ cần checkout **repo frontend này**, Node.js 22+ và mạng Internet. Không cần clone/build backend hoặc Admin, không cần Docker, database local, Next dev server hay MinIO local.

## Chuẩn bị một lần sau khi pull

```powershell
npm ci
npm run test:e2e:production:setup
```

Lệnh setup cài Chromium và tạo **`e2e/production/.env`** từ [`.env.example`](./.env.example). Chạy lại không ghi đè cấu hình đã có. Nhận file `.env` thật từ người phụ trách dự án qua kênh riêng hoặc điền các giá trị vào file này. File thật được Git/Docker bỏ qua; file mẫu trong Git không chứa mật khẩu hoặc API key.

- Kiểm tra public không cần tài khoản/key: `npm run test:e2e:production:public -- --headed`.
- Route có đăng nhập: điền `E2E_PRODUCTION_PASSWORD`, các `E2E_*_EMAIL`, đặc biệt `E2E_PARENT_EMAIL` là đúng tài khoản phụ huynh được phép nhận email thử. Có thể dùng mật khẩu riêng theo vai trò, ví dụ `E2E_TEACHER_PASSWORD`.
- Kiểm tra provider thật: thêm `AI_API_KEY`, model/URL text và vision, `SMTP_URL`, `MAIL_FROM`. Vision có thể dùng key riêng hoặc dùng chung key text.
- Biến môi trường của máy/CI được ưu tiên hơn file. Có thể đổi vị trí file bằng `E2E_PRODUCTION_ENV_FILE`. Không cần file `settings.json` cũ.
- Mặc định dùng Chromium đi kèm Playwright, chạy được Windows/Linux/macOS. Chỉ đặt `E2E_CHANNEL=msedge` nếu muốn dùng Edge đã cài trên máy.

## Trang Production trong Playwright

```powershell
npm run test:e2e:production:ui
```

Mở [Playwright Production](http://127.0.0.1:9326), chọn project `production` và chạy test. Mặc định có trang giới thiệu production, các route web, phân quyền và API đọc. Metadata của báo cáo và bài `Production web — live entry page and team links` có liên kết tới ứng dụng/API/Admin thật.

Để hiện bảy bài AI/email thật trong UI:

```powershell
npm run test:e2e:production:ui -- --services
```

Các bài nghiệp vụ trong file `04-business.spec.ts` dùng chung hồ sơ theo thứ tự; chạy cả file hoặc Run all. UI giữ hồ sơ thử để xem trực tiếp; dùng lệnh cleanup khi xong. Chỉ một lượt nghiệp vụ chạy cùng lúc với bộ tài khoản seed dùng chung.

## Lệnh chạy

| Lệnh                                               | Phạm vi                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run test:e2e:production -- --headed`          | Public + đăng nhập, route và API đọc; không tạo hồ sơ nghiệp vụ.                                        |
| `npm run test:e2e:production:public -- --headed`   | Web, Admin login, health; không cần `.env` hoặc tài khoản.                                              |
| `npm run test:e2e:production:services -- --headed` | Bảy bài AI text/vision, SMTP, biên lai thật, chấm ảnh/PDF, báo cáo AI và giáo viên sửa bài.             |
| `npm run test:e2e:production:full -- --headed`     | Toàn bộ production: route/API, AI/email, ghi danh 0 đồng, giáo trình, điểm danh, báo cáo, tệp và Admin. |
| `npm run test:e2e:production:full -- --list`       | Liệt kê toàn bộ bài; không đăng nhập, gọi mạng hoặc tạo dữ liệu.                                        |
| `npm run test:e2e:production:report`               | Mở báo cáo production gần nhất tại [localhost:9324](http://127.0.0.1:9324).                             |
| `npm run test:e2e:production:cleanup`              | Dọn đúng hồ sơ E2E đang được giữ lại.                                                                   |
| `npm run test:e2e:production:contracts`            | Kiểm tra cấu hình/runner/provider bằng dữ liệu tổng hợp, không gọi production.                          |

Các cờ cũ `--write --providers --recheck-ai` vẫn được hỗ trợ. Dùng `--keep-fixture` nếu muốn giữ hồ sơ sau khi chạy CLI. `--grep`, `--list` và các cờ Playwright thông thường được chuyển tiếp.

## Hồ sơ và email thật

Chế độ `services`/`full` tạo hoặc tiếp tục một manifest riêng ở `e2e/.production-runtime/fixture.json`, tên bắt đầu bằng `E2E-PROD` và mã ngẫu nhiên. Học phí **0 VND**; chỉ thao tác các ID trong manifest. Không reset/seed database production, không đổi mật khẩu người dùng, không hủy/chuyển/đổi lịch hồ sơ đang sử dụng.

CLI tự cleanup khi kết thúc test, kể cả khi có bài fail: kết thúc ghi danh, xóa giáo trình nháp bằng đúng designer sở hữu hoặc lưu trữ giáo trình đã duyệt bằng manager, và xóa mềm đúng học sinh/lớp/khóa thử. Biên lai 0 đồng, điểm, tệp, snapshot và audit được giữ làm lịch sử. Nếu bước chuẩn bị dừng giữa chừng, manifest được giữ để chẩn đoán/tiếp tục; không tự xóa dữ liệu chưa xác minh quyền sở hữu.

Ảnh/PDF gửi AI là bài toán tổng hợp. Bảy bài dịch vụ gọi provider thật và pipeline của API production; không cần bản build backend trên máy. Các bài backend luôn tạo tác vụ AI mới trong profile services/full. AI chỉ đề xuất; test vẫn kiểm tra bước giáo viên duyệt/công bố.

Email biên lai phải khớp đúng registration, dedupe key, người nhận và thời điểm của fixture hiện tại. Test chờ worker gửi tối đa 90 giây, bắt buộc `SENT`, số lần gửi và thời điểm gửi. SMTP `verify()` chứng minh kết nối/xác thực; outbox `SENT` chứng minh ứng dụng đã chuyển thư cho SMTP. Chưa mở hộp thư nhận thì không kết luận thư nằm trong Inbox/Spam.

## Chạy cùng team trên GitHub

Workflow thủ công [Playwright Production](https://github.com/WDP301-SE1921/WDP301-FE-System/actions/workflows/e2e-production.yml) có các profile public/read-only/services/full. Workflow sẽ xuất hiện trong Actions sau khi file được merge vào nhánh mặc định.

Người quản trị repo thêm secret **`PRODUCTION_E2E_ENV`** chứa nguyên nội dung `.env` thật. Profile public không cần secret. Workflow tạo file `.env` tạm, chạy Chromium trên Linux, cleanup hồ sơ thử và xóa file cấu hình tạm. Phần Summary có link production và link tải báo cáo của lần chạy. Các lượt workflow được xếp hàng để tránh cùng sử dụng tài khoản seed.

Repo hiện là public nên workflow chỉ chia sẻ bản tổng hợp gồm số lượng pass/fail, trạng thái hoàn tất và link production, giữ bảy ngày. Không upload ảnh, traces, nội dung lỗi, kết quả AI hoặc phiên đăng nhập lên artifact public. Báo cáo Playwright đầy đủ được xem trên máy qua lệnh report; workflow chỉ upload bản đầy đủ khi repo có quyền riêng tư private. Link `localhost:9324/9326` là trang trên máy người đang chạy, không phải link báo cáo online dùng chung.

CI luôn thử cleanup thêm lần nữa cho services/full, kể cả khi bước chuẩn bị hoặc teardown thất bại. Nếu vẫn chưa dọn được, artifact tổng hợp có `recovery-fixture.json`: chỉ marker E2E, ID/tên tổng hợp của hồ sơ thử và các cờ cleanup; không có thông tin phụ huynh, token, thanh toán hoặc cấu hình. Để khôi phục, dùng một checkout chưa có hồ sơ thử chưa dọn, chép file này thành `e2e/.production-runtime/fixture.json`, đặt `.env` riêng rồi chạy lệnh cleanup. Lệnh này tự chuẩn bị phiên đăng nhập từ `.env`, không tạo fixture mới; các ID/tên vẫn được đối chiếu lại với production trước khi ghi.

## Kết quả đã ghi nhận

- [Bộ production dành cho team ngày 18/11/2026](./RESULTS-TEAM-2026-11-18.md): 96/96 production, 7/7 services, 3/3 public và kiểm chứng cấu hình/UI.
- [AI/email thật ngày 18/11/2026](./RESULTS-2026-11-18.md): 7/7 đạt; có thời điểm gửi thư và giới hạn xác nhận inbox.
- Kết quả JSON, phiên đăng nhập, manifest, report/traces ở `e2e/.production-*` đều được giữ ngoài Git.

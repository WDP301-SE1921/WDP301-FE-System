# E2E web (Playwright)

Chạy trên bản build production của web và BE thật. Không tự bật server (`next dev` lỗi EPERM trên Windows).

## Chuẩn bị (mỗi bước chạy lần lượt, máy yếu dễ đứng nếu chạy song song)

1. BE chạy ở `http://localhost:3000/api/v1` trên **database thử riêng** đã migrate và seed (không dùng `edugrade_db`).
   BE cần `WEB_ORIGIN`/CORS có `http://localhost:3001`.
2. Web trỏ đúng BE: `.env.local` có `BACKEND_API_URL=http://localhost:3000/api/v1` (không in file này ra ngoài).
3. `npm run build`, rồi `npm run start` (cổng 3001) ở một terminal khác. Sửa web xong phải build lại trước khi chạy lại spec.
4. Đặt `E2E_PASSWORD` là mật khẩu seed của database thử. Không đọc `.env` của BE.

## Chạy

```bash
E2E_PASSWORD='<mật khẩu seed>' E2E_WORKERS=1 npx playwright test --project=academic
E2E_PASSWORD='<mật khẩu seed>' E2E_WORKERS=1 npx playwright test --project=academic e2e/web/academic-setup.spec.ts
```

- `academic`: 4 luồng nhiều vai trò (`academic-setup`, `curriculum-csv`, `session-cancel-shift`, `center-closure`), mỗi spec tự đổi vai bằng `inRole` (`helpers.ts`). Chạy tuần tự.
- `guest`, theo role (`center_manager`, `staff`, ...): `login.spec.ts`, `role-pages.spec.ts`.
- Video mặc định tắt (cần `npx playwright install ffmpeg`); bật bằng `E2E_VIDEO=1`.

## Giới hạn đăng nhập của BE

BE cứng 5 lần đăng nhập mỗi phút theo IP. `auth.setup.ts` dùng lại `e2e/.auth/*.json` còn hạn (dưới 10 phút) thay vì đăng nhập lại.
Chạy `--project=academic` riêng, đừng chạy chung `guest` ngay sau đó. Helper đăng nhập API (`backendToken`, cho phụ huynh) nhớ token trong lượt chạy
và chờ theo `Retry-After` khi gặp 429.

## Dữ liệu

- Dữ liệu tạo mới có hậu tố ngẫu nhiên nên chạy lại được; mỗi lần chạy `academic-setup` để lại một khóa, lớp, giáo trình `E2E ...` trong database thử.
  Muốn sạch thì reseed database thử.
- `academic-setup` dùng giáo viên `teacher@edugrade.local` và chọn một tuần ngẫu nhiên khác mỗi lần để buổi học không trùng lịch giáo viên của lần chạy trước.
- Ngày tính theo giờ Việt Nam (`vnDate` trong `helpers.ts`), không dùng `toISOString()` cho ngày.
- `session-cancel-shift` dùng lớp seed `Toán 9A` (hủy khoảng 4 buổi mỗi lần; đơn nghỉ thử trên `Vật lý 8A`, không hủy buổi nào), `center-closure` dùng `Toán 8B` (hủy buổi trong 1 khoảng 2 buổi, từ hôm nay + 35 ngày). Seed không tự bù buổi: chạy nhiều lần thì hết buổi và spec báo "dựng database thử MỚI (migrate + seed)". Không reseed lên database cũ; dựng database mới cần người dùng đồng ý.
- Ngày nghỉ tạo ra có lý do `e2e-...`; spec xóa ngày nghỉ `e2e-` còn sót trước và sau khi chạy.
- Phiên đăng nhập: access token BE sống 15 phút; spec ghi lại phiên đã làm mới vào `e2e/.auth` khi đóng context (`closeSessions`). Đã chạy lâu hơn 15 phút thì chạy lại để `auth.setup.ts` đăng nhập mới.

## Giới hạn của kiểm tra

- Kiểm "không có thông báo khi thêm ngày nghỉ" chờ 3 giây rồi đếm: đây là kiểm yếu (thông báo đi qua outbox, trễ hơn 3 giây thì không bắt được).
- Đổi sang database thử khác thì xóa `e2e/.auth/week-counter.json` và `e2e/.auth/*.json`.

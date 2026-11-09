# Tích hợp Storage trên Web — 27/10/2026

Phạm vi: avatar của tài khoản Web và xem/tải tệp bài nộp của giáo viên. Không thay đổi FEM/mobile, không mở chức năng upload/nộp bài của phụ huynh trên Web.

## Hành vi đã triển khai

- Trang tài khoản của Manager, Staff, Curriculum Designer và Teacher có chọn ảnh, xem trước cục bộ, lưu, hủy và xóa avatar. Chỉ nhận PNG/JPEG, dung lượng lớn hơn 0 và tối đa 5 MiB.
- Ảnh cập nhật đồng thời trên trang tài khoản và header. Khi chưa có ảnh hoặc tải ảnh lỗi, dùng chữ cái đại diện; có thao tác thử lại trên trang tài khoản.
- Chọn ảnh chưa tạo request upload. Hủy lựa chọn giải phóng preview cục bộ. Xung đột hoặc kết quả upload chưa xác định không tự gửi PUT lại.
- Màn chấm bài có nút “Xem tệp” và “Tải tệp” riêng cho từng file. Preview chỉ được gọi sau khi mở vùng xem.
- PNG/JPEG dùng preview trực tiếp. PDF và tệp không nhận diện được có hướng dẫn tải xuống; chưa có PDF viewer inline vì BE hiện trả PDF dạng attachment.
- Mỗi lần bấm “Tải tệp” gọi API ký download mới. Tệp mở trong ngữ cảnh riêng; nếu cửa sổ bị chặn, hiện link tải trực tiếp còn hạn. Điểm đang nhập không bị xóa khi xem/tải thất bại.
- File bài nộp chỉ có `fileId` trong response hiện tại, nên Web dùng nhãn “Tệp 1”, “Tệp 2”…; không tự tạo tên gốc hoặc dung lượng.

## API đi qua BFF

Browser gọi `/api/backend/*`. BFF gọi BE theo `BACKEND_API_URL`; access/refresh token vẫn ở cookie HttpOnly.

| Method | Path ở BE | Role Web | Kết quả |
| --- | --- | --- | --- |
| GET | `auth/me` | Các role Web hỗ trợ | Hồ sơ có `hasAvatar`. |
| GET | `auth/me/avatar` | Manager, Staff, Designer, Teacher | `{ url, expiresIn: 900 }` hoặc `{ url: null, expiresIn: null }`. |
| PUT | `auth/me/avatar` | Như trên | Multipart đúng một field `file`; trả URL ảnh mới. |
| DELETE | `auth/me/avatar` | Như trên | `{ deleted: true }`; xóa lặp vẫn thành công. |
| GET | `academic/files/:id/preview` | Teacher | URL 300 giây; BE kiểm tra quyền với lớp/bài nộp. |
| GET | `academic/files/:id/download` | Teacher | URL 60 giây; đọc object dạng attachment. |

`POST academic/files` và `POST academic/submissions` vẫn không có trong whitelist BFF Web. Role Parent sử dụng app mobile. Role admin legacy của FE chưa có ánh xạ BE mới nên không được thêm quyền bằng suy diễn.

## URL có hạn và quyền truy cập

- URL chỉ tồn tại trong bộ nhớ; không ghi vào localStorage/sessionStorage, hồ sơ phiên, URL trang hoặc log.
- Cache avatar theo user: `["auth-avatar", userId]`. Cache preview theo user/file: `["web-api", userId, "submission-file-preview", fileId]`.
- Avatar được làm mới trước hạn 30 giây; preview trước hạn 15 giây khi đang mở. Lấy lại quyền/URL khi tab được mở lại theo cơ chế query; lỗi không tạo vòng retry vô hạn.
- Đóng preview hoặc đổi bài hủy request đọc đang chạy. Đổi tài khoản không sử dụng URL của tài khoản trước. Request tải đang chuẩn bị bị hủy và đóng cửa sổ trống nếu component bị bỏ.
- Lỗi tải ảnh chỉ thử tự cấp lại URL tối đa một lần cho mỗi lần phục hồi; sau đó có fallback và nút thử lại chủ động.
- Signed URL là quyền đọc tạm thời của object. Không sửa hostname/query sau khi ký, không gửi bearer token đến MinIO và không mở bucket public.

## Sửa BE cần thiết

Kiểm thử qua Nest/Multer thật phát hiện file đúng `5 * 1024 * 1024` byte bị trả 413 do parser báo lỗi ngay tại giới hạn. `AuthController` tăng giới hạn parser lên `MAX + 1` byte; validator nghiệp vụ vẫn giữ `size <= MAX`. Test HTTP mới bao phủ `MAX - 1`, `MAX` và `MAX + 1`.

Không thay đổi định dạng file được phép, schema hay API của FEM/mobile. Các thay đổi BE trong công việc này nhằm sửa tính đúng đắn của endpoint avatar dùng chung.

## Xử lý lỗi

| Trường hợp | Hành vi Web |
| --- | --- |
| `INVALID_FILE_SIZE`, `INVALID_FILE_TYPE` ở 400 hoặc 409 | Thông báo tiếng Việt; giữ ảnh cũ và lựa chọn đang sửa. |
| Upload 413 | Yêu cầu chọn ảnh nhỏ hơn hoặc bằng 5 MiB. |
| `AVATAR_CONFLICT` | Đọc lại ảnh hiện tại; giữ lựa chọn cục bộ; người dùng quyết định lưu lại. |
| PUT timeout/network/5xx | Thông báo kết quả chưa xác định, đối chiếu hồ sơ; không tự replay PUT. |
| Storage 503/`HTTP_ERROR` | Hiển thị gián đoạn lưu/tải; không khóa các chức năng khác. |
| File 403 | Báo không có quyền; không retry tự động. |
| File 404 | Báo tệp không còn tồn tại. |
| File 5xx hoặc ảnh hỏng | Fallback và thử lại chủ động; giữ điểm đang nhập. |

Bảng lỗi trong guide có một số khác biệt so với implementation BE; Web dùng cả `error.code` và HTTP status. BE đang dùng `findUniqueOrThrow` cho FileAsset nên fileId không tồn tại có thể trở thành 500 qua filter tổng; Web không suy diễn mọi 500 là file đã bị xóa.

BFF cũng giữ cookie được refresh ở bước kiểm tra role khi request sau đó bị lỗi validation. Nhờ vậy upload sai file không làm mất phiên đã được xoay token.

## Điều kiện môi trường trước khi sử dụng

1. BE generate Prisma client và áp dụng migration `20261027000000_add_user_avatar_storage_key` vào database của môi trường triển khai. Lệnh theo README BE: `pnpm prisma:generate`, `pnpm prisma:migrate:deploy`.
2. MinIO healthy, có bucket private và credentials của ứng dụng đúng. `STORAGE_ENDPOINT` dành cho BE; `STORAGE_PUBLIC_ENDPOINT` phải tới được từ browser.
3. `BACKEND_API_URL` của Web trỏ đúng BE. Không hardcode cổng 3002 theo ví dụ; dùng cổng thực tế của môi trường.
4. Môi trường HTTPS cần URL storage HTTPS tương ứng. Kiểm tra browser tải được signed URL; unsigned object URL bị từ chối.

Kiểm thử phát triển sử dụng database biệt lập `edugrade_avatar_phase1_*`, tài khoản và object thử, cùng MinIO tạm có phiên bản `RELEASE.2025-09-07T16-13-09Z`/commit `07c3a429bfed433e49018cb0f78a52145d4bedeb`. Không chạy migration trên database ứng dụng đang dùng.

## Kiểm chứng

Lệnh FE:

```text
node --test tests/storage-avatar.test.cjs tests/storage-files.test.cjs tests/academic-api.test.cjs
npx tsc --noEmit
npm run lint
npm run build -- --webpack
```

Lệnh BE:

```text
node node_modules/jest/bin/jest.js --runInBand tests/unit/avatar-upload-boundary.spec.ts tests/unit/avatar-service.spec.ts tests/unit/file-validation.spec.ts tests/unit/academic-storage.spec.ts tests/unit/object-storage.service.spec.ts
node node_modules/typescript/bin/tsc --noEmit
```

Kiểm thử browser dùng `tests/storage-phase1-env.cjs` để dựng môi trường riêng, sau đó `node tests/ui-roles/flow-storage.cjs`. Runner có cấu hình đường dẫn Chrome/Playwright theo máy phát triển; tests và ảnh bằng chứng được giữ local theo `.gitignore` hiện có. Ảnh chụp nằm tại `docs/screenshots/storage-web-2026-10-27/`.

**Trạng thái nghiệm thu: hoàn thành cả 3 phase.**

| Kiểm tra | Kết quả |
| --- | --- |
| FE storage/avatar và hồi quy academic/profile/password | 22/22 đạt. Có test token refresh + validation lỗi, multipart đúng 5 MiB, URL/TTL, quyền và hủy request. |
| BE storage/avatar | 24/24 đạt trong 5 suite; gồm mốc MAX−1, MAX, MAX+1 qua Nest/Multer thật. |
| Chrome với BFF/Nest/MySQL/MinIO thật | 12 nhóm đạt: 9 nhóm avatar trên 4 role và 3 nhóm tệp bài nộp. Có ca lỗi được mô phỏng rõ ràng ở BFF/browser để kiểm tra fallback. |
| TypeScript FE và BE | Đạt; production build cũng kiểm tra TypeScript. |
| Lint các file source đã sửa và test BE mới | Không lỗi/warning. Lint toàn FE có 0 lỗi, 14 warning sẵn có ngoài file sửa. |
| Production build | Đạt với `next build --webpack`. |
| Kiểm tra thiết kế | Detector không có finding trên hai component mới; đã nhìn ảnh chụp ở Web 390/768/1440 px, không tràn ngang. |
| Rà soát độc lập | Một lỗi P2 về cookie sau refresh được tìm thấy và sửa; test tái hiện thất bại trước, sau sửa đạt. Không có finding khác được xác nhận. |

Trong kiểm thử, ảnh chụp còn giúp phát hiện native FileList rỗng bị coi là ảnh đang chọn sau reload. Đã sửa để chỉ File thật kích hoạt preview/nút lưu; browser regression đã đạt.

**Giới hạn build:** `next build` dùng Turbopack mặc định gặp lỗi nội bộ khi khởi tạo tiến trình xử lý CSS trên máy này. Lượt chạy trong môi trường hạn chế mạng còn không tải được Google Fonts. Không thay font hoặc script build của dự án; production build Webpack với quyền truy cập mạng đã hoàn tất. Có thể dùng lệnh Webpack ở trên để xác minh trên máy tương tự.

Môi trường nghiệm thu đã được dọn: database thử bị xóa, BE/Web thử dừng và container MinIO tạm bị dừng/xóa. Không sửa database ứng dụng đang dùng; môi trường thật vẫn cần migration/cấu hình nêu ở phần điều kiện chạy.

Giới hạn bộ test cũ: `tests/web-workflows.test.cjs` hiện import `src/features/classes/attendance-by-student.ts` đã không còn trong HEAD, nên không khởi chạy được. Không thêm production code không liên quan để làm test cũ này chạy; các quyền và luồng storage có test riêng và kiểm thử với API thật.

## Cải tiến sau

- PDF inline khi BE có contract tương ứng.
- Metadata tên gốc/MIME/dung lượng cho Teacher.
- Quyền đọc bài lịch sử sau khi đổi giáo viên; hiện tuân thủ điều kiện BE đang có.
- Kiểm tra/chuyển object lịch sử nếu đổi bucket hoặc nhà cung cấp storage; cần mẫu dữ liệu thật để xác nhận tương thích.

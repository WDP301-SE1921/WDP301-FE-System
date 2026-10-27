# MinIO Storage Web Integration — Kế hoạch triển khai

> **Trạng thái: ĐÃ TRIỂN KHAI 3 PHASE — 27/10/2026.** Người dùng đã duyệt triển khai và cho phép sửa BE khi cần. Kết quả nghiệm thu và các giới hạn được ghi tại mục 5 và `docs/STORAGE_WEB_INTEGRATION.md`.
>
> **For agentic workers:** Dùng `superpowers:executing-plans` để triển khai từng task sau khi người dùng duyệt. Theo dõi bằng checkbox. Phương án đề xuất là triển khai trong chat hiện tại; tài liệu này không tự cấp quyền bắt đầu triển khai.

**Goal:** Tích hợp avatar cho tài khoản Web và cải thiện xem/tải tệp bài nộp của giáo viên bằng API MinIO mới, trong tối đa **3 phase**.

**Architecture:** Browser gọi BFF `/api/backend/*` của Next.js; BFF giữ access/refresh token trong cookie HttpOnly và gọi BE. Browser nhận signed URL để đọc ảnh/tệp từ MinIO; signed URL chỉ ở bộ nhớ TanStack Query, có thời điểm hết hạn và được cấp lại khi cần. Mở rộng các màn và component hiện có.

**Tech Stack:** Next.js 16.3.5, React 19, TypeScript, TanStack Query, Axios, React Hook Form + Zod, Shadcn/Base UI và Tailwind hiện có. Không thêm dependency trong phạm vi đề xuất.

**Spec:** [STORAGE_API_GUIDE.md](D:/WDP/WDP301-BE-System/STORAGE_API_GUIDE.md), đối chiếu code BE tại `ab5e85f` với `c9ecbcd`; FE đang ở `3ea5b56`. Khi tài liệu khác code, các quyết định bên dưới ghi rõ hành vi được hỗ trợ.

## Global Constraints

- **Phạm vi chính là `WDP301-FE-System`; người dùng cho phép sửa BE khi cần. Không đọc tiếp, chỉnh sửa, chạy lệnh trong hoặc tạo tài liệu tại `WDP301-FEM-System` (mobile).**
- Chỉ sửa BE ở điểm cần thiết để tính năng chạy đúng; hiện đã sửa giới hạn upload avatar đúng 5 MiB và bổ sung test biên.
- Kế hoạch đã được người dùng duyệt trước khi sửa code, đúng `CLAUDE.md` §2.3.
- Phụ huynh sử dụng mobile; không tạo màn Parent Web, không mở `POST /academic/files` hay `POST /academic/submissions` trên BFF Web.
- Giữ token màu, font, bo góc và Shadcn Maia hiện có; không đổi theme hoặc thiết kế lại dashboard. Component tính năng nằm trong `src/features/`; không sửa primitive `src/components/ui/`.
- Form dùng React Hook Form + Zod; chuẩn hóa lỗi tiếng Việt qua hệ thống hiện có. Không hiện JSON, requestId, storageKey hoặc URL có chữ ký trong thông báo lỗi.
- Avatar chỉ nhận PNG/JPEG, `0 < size <= 5 * 1024 * 1024` byte. Không chuyển sang WebP theo quy tắc ảnh chung vì BE chưa nhận WebP cho avatar.
- Mọi quyền đọc file vẫn do BE kiểm tra. BFF chỉ mở đúng method/path/role; không gửi bearer token đến MinIO và không đưa storage credentials vào FE.
- Chỉ signed URL ở bộ nhớ; không ghi vào localStorage, sessionStorage, hồ sơ đã lưu, URL trang hoặc log. Chỉ cờ `hasAvatar` được bổ sung vào hồ sơ lưu phiên.
- Giữ nguyên các thay đổi chưa commit sẵn có. Không commit/push, đổi branch, dựng container hay thay cấu hình môi trường trong lượt lập kế hoạch này.

## Review Focus

Năm tình huống phải có bằng chứng nghiệm thu trong task tương ứng:

1. Multipart avatar vẫn đúng bytes, tên `file` và boundary sau một lần refresh token — Task 1.1.
2. URL hết hạn, tab trở lại foreground hoặc đổi user không hiển thị ảnh của phiên trước — Task 1.2 và 2.1.
3. PUT bị `409 AVATAR_CONFLICT` hoặc timeout sau khi BE có thể đã ghi thành công không gây tự động upload lặp — Task 1.2.
4. Click tải sau khi đã mở bài lâu phải lấy URL mới; lỗi/popup bị chặn không làm mất điểm đang nhập — Task 2.2.
5. PDF, thiếu metadata, file không tồn tại và giáo viên không được phân công có fallback rõ ràng, không cấp thêm quyền — Task 2.1, 2.2 và 3.1.

## 1. Căn cứ và kết quả khảo sát

| ID | Nguồn | Phát hiện có ảnh hưởng trực tiếp |
| --- | --- | --- |
| S1 | [AGENTS.md](D:/WDP/WDP301-FE-System/AGENTS.md), [CLAUDE.md](D:/WDP/WDP301-FE-System/CLAUDE.md), `.claude/rules/`, `.claude/memory/` | Phải duyệt plan trước code; dùng component chung, RHF/Zod và UI tokens; Parent mobile-only. |
| S2 | [Hướng dẫn Storage](D:/WDP/WDP301-BE-System/STORAGE_API_GUIDE.md) | Avatar GET/PUT/DELETE; signed URL avatar 900s, preview 300s, download 60s; upload bài nộp dành cho Parent. |
| S3 | [auth.service.ts](D:/WDP/WDP301-BE-System/src/modules/auth/auth.service.ts:524), [auth.controller.ts](D:/WDP/WDP301-BE-System/src/modules/auth/auth.controller.ts:231) | Avatar thuộc user hiện tại; PUT kiểm tra file, thay key có optimistic lock; DELETE idempotent. |
| S4 | [academic-storage.service.ts](D:/WDP/WDP301-BE-System/src/integrations/academic-storage.service.ts:64), [test PDF](D:/WDP/WDP301-BE-System/tests/unit/academic-storage.spec.ts:64) | Preview chỉ đặt inline cho ảnh; PDF đang là attachment. Teacher phải đồng thời là người tạo assignment và teacher hiện tại của lớp theo điều kiện truy vấn. |
| S5 | [file-validation.ts](D:/WDP/WDP301-BE-System/src/integrations/file-validation.ts), [assertRule](D:/WDP/WDP301-BE-System/src/modules/academic/academic-access.service.ts:8), [exception filter](D:/WDP/WDP301-BE-System/src/common/filters/all-exceptions.filter.ts) | Validation file đang dùng mặc định HTTP 409; HttpException 503 được bọc thành `HTTP_ERROR`; khác bảng lỗi trong guide. |
| S6 | [BackendUser](D:/WDP/WDP301-FE-System/src/types/backend.ts:3), [webUser](D:/WDP/WDP301-FE-System/src/lib/api/server.ts:261), [AuthUser](D:/WDP/WDP301-FE-System/src/types/auth.ts) | Chưa khai báo/truyền `hasAvatar`; hồ sơ có `avatarUrl?` nhưng chưa nối API avatar thật. |
| S7 | [BFF permissions](D:/WDP/WDP301-FE-System/src/lib/api/backend-permissions.ts:203), [BFF route](D:/WDP/WDP301-FE-System/src/app/api/backend/%5B...path%5D/route.ts) | Đã cho Teacher download; chưa cho preview/avatar. Multipart chỉ có nhánh import, PUT avatar đi qua nhánh text nếu chỉ thêm whitelist. |
| S8 | [AccountProfile](D:/WDP/WDP301-FE-System/src/features/auth/components/account-profile.tsx), [Header](D:/WDP/WDP301-FE-System/src/components/shared/layout/header/header.tsx) | Có màn tài khoản dùng lại ở manager/staff/teacher; header đọc hồ sơ phiên, cần dùng chung cache avatar với màn tài khoản. |
| S9 | [GradingWorkspace](D:/WDP/WDP301-FE-System/src/features/grading/components/grading-workspace.tsx:693), [academicApi.file](D:/WDP/WDP301-FE-System/src/features/academic/api.ts:377) | Đang lấy URL download 60s để hiển thị ảnh; một nút “Mở / tải tệp”; chưa có thời điểm hết hạn. Route chấm bài thật dùng GradingWorkspace. |
| S10 | [SubmissionRecord](D:/WDP/WDP301-FE-System/src/types/academic-workflows.ts:144), [BE assessment](D:/WDP/WDP301-BE-System/src/modules/academic/assessment.service.ts:794) | Danh sách bài nộp chỉ trả `files: [{ fileId }]`; chưa có name/mimeType/size cho Teacher. |
| S11 | [ObjectStorageService](D:/WDP/WDP301-BE-System/src/integrations/object-storage.service.ts), [BE README](D:/WDP/WDP301-BE-System/README.md:41), hai `.env.example` | Có internal/public endpoint. Guide minh họa BE 3002 nhưng env example FE/BE đang dùng 3000; phải xác nhận port thực tế. |

**Cách dùng các skill được ưu tiên:** Superpowers `writing-plans` cho đầu việc và cách kiểm chứng; Business Analyst cho yêu cầu, gap và tiêu chí nghiệm thu; BMAD Method cho chuỗi phân tích → thực hiện → kiểm chứng, gói gọn trong tài liệu này. Taste Skill, Hallmark và Impeccable áp dụng tư duy màn làm việc: giữ nhận diện, ưu tiên thao tác và trạng thái thật. UI UX Pro Max dùng hướng dẫn validation/focus/loading đã đối chiếu với component hiện có. GSAP Core cung cấp giới hạn motion; **chưa cần thêm GSAP**, vì các chuyển trạng thái ở đây dùng CSS hiện có là đủ. Không chạy quy trình đổi theme hoặc sinh bộ design system mới.

## 2. Phạm vi và yêu cầu nghiệp vụ

Các role Web có ánh xạ BE thật trong phạm vi: `MANAGER`, `STAFF`, `CURRICULUM_DESIGNER`, `TEACHER`. Role `admin` còn trong UI legacy nhưng không có trong `BACKEND_ROLE_MAP`; không suy diễn thêm contract BE cho admin.

| ID | Yêu cầu | Mức ưu tiên | Nguồn | Task |
| --- | --- | --- | --- | --- |
| FR-01 | Đọc `hasAvatar`, lấy ảnh của chính tài khoản khi có, fallback chữ cái khi chưa có/lỗi. | Must | S2, S3, S6 | 1.1–1.2 |
| FR-02 | Chọn, xem trước cục bộ, lưu/thay và xóa avatar PNG/JPEG tối đa 5 MiB; đồng bộ profile/header. | Must | S2, S3, S8 | 1.1–1.2 |
| FR-03 | Teacher được phân công xem ảnh bài nộp bằng endpoint preview 300s. | Must | S2, S4, S9 | 2.1–2.2 |
| FR-04 | Mỗi lần yêu cầu tải file lấy download URL 60s mới; PDF có đường tải rõ ràng. | Must | S2, S4 | 2.1–2.2 |
| FR-05 | Xử lý hết hạn, thiếu quyền, file lỗi, xung đột avatar và storage không sẵn sàng bằng thông báo có hành động tiếp theo. | Must | S3–S5 | 1.2, 2.2 |
| NFR-01 | Token ở BFF; URL có chữ ký không được lưu bền; cache tách theo user, không rò ảnh giữa phiên. | Must | S1, S2 | 1.1–2.2 |
| NFR-02 | Giữ UI hiện tại; dùng bàn phím được, focus rõ, loading không nhảy bố cục, reduced motion. | Must | S1, S8 | 1.2, 2.2, 3.1 |
| NFR-03 | Không gọi API avatar khi biết `hasAvatar=false`; không ký download hàng loạt khi mở màn; không retry vô hạn. | Should | S2, S9 | 1.2, 2.1–2.2 |

**Ngoài phạm vi:** upload/nộp bài của Parent trên Web; sửa FEM; sửa schema hoặc hạ tầng không liên quan; crop ảnh, nén/chuyển định dạng; upload tài liệu cho Teacher/Designer; sửa avatar người khác; mở bucket public; OCR/chấm ảnh AI; PDF viewer mới hoặc thư viện mới. BE được phép sửa khi cần theo yêu cầu bổ sung của người dùng; hiện chỉ sửa giới hạn avatar. Import đề CSV/DOCX/PDF hiện có giữ luồng riêng.

### As-is → To-be

| Khu vực | Hiện tại | Sau triển khai | Tác động |
| --- | --- | --- | --- |
| Tài khoản | Chữ cái đại diện; chưa có thao tác avatar thật. | Chọn ảnh → preview → Lưu ảnh → cập nhật profile và header; Xóa ảnh → chữ cái. | Dùng lại một cụm UI cho các role Web. |
| Ảnh bài nộp | Dùng link download 60s để render ảnh. | Lấy preview khi cần; cấp lại có giới hạn khi hết hạn/lỗi. | Giáo viên đọc bài lâu hơn mà không phải tải lại cả trang. |
| Tải bài làm | Dùng lại link đã lấy khi mở màn. | Click tải → ký URL mới → tải trong ngữ cảnh không mất form chấm điểm. | Tránh bấm link cũ đã hết hạn. |
| PDF | Có fallback tải, không có inline reader. | Giữ tải xuống rõ ràng; không hứa xem PDF inline khi BE chưa hỗ trợ. | Có thể hoàn tất FE mà không cần sửa BE. |

## 3. Các quyết định contract cần giữ khi triển khai

| Điểm | Quyết định đề xuất để duyệt |
| --- | --- |
| PDF: guide nói inline, code và test BE nói attachment | Bản này hỗ trợ **preview ảnh và tải PDF**. Nếu cần PDF inline, bổ sung yêu cầu riêng cho BE; chỉ bật sau khi contract và test BE thay đổi. Không proxy/fetch PDF qua dịch vụ ngoài. |
| Mã lỗi khác guide | Ưu tiên `error.code`; hỗ trợ `INVALID_FILE_SIZE/TYPE` ở 400 **hoặc 409**, 413 từ giới hạn upload, 503 `HTTP_ERROR`, cùng lỗi 401/403/404/5xx. Không coi mọi 409 là avatar conflict. |
| FileId không tồn tại | BE đang dùng Prisma `findUniqueOrThrow`; filter tổng chưa ánh xạ riêng lỗi Prisma này thành 404. Ghi nhận có thể gặp 500; FE có fallback 5xx, không mặc định tất cả 500 nghĩa là file không tồn tại. |
| Thiếu metadata file | Hiển thị “Tệp 1”, “Tệp 2”…; chỉ nhận diện `.png/.jpg/.jpeg/.pdf` từ pathname của URL BE trả, có fallback file không xác định. Không tự tạo tên gốc, MIME hay dung lượng. |
| Quyền Teacher sau thay người phụ trách | Giữ kiểm tra BE hiện tại, thông báo không còn quyền khi 403. Nếu nghiệp vụ muốn Teacher mới đọc bài của Teacher cũ, cần BE xác nhận riêng. |
| Port và storage public endpoint | Dùng `BACKEND_API_URL` của môi trường thực tế, không hardcode 3002. Signed URL phải truy cập được từ browser, đúng HTTP/HTTPS. Không thay hostname hay query string sau khi BE ký. |
| Timeout upload | BFF hiện chờ BE 25s, BE upload có thể chờ 30s. Chưa đổi timeout toàn hệ thống. Timeout được xem là kết quả chưa xác định: đọc lại hồ sơ/ảnh, không tự replay PUT. |

## Phase 1 — Avatar tài khoản Web và nền tảng signed URL

**Kết quả:** cả profile và header sử dụng avatar thật; BFF truyền file đúng, giữ nguyên cơ chế phiên.

### Task 1.1 — Contract, BFF và API avatar

**Files dự kiến:**

- Sửa `src/types/backend.ts`, `src/types/auth.ts`, `src/lib/api/server.ts`: thêm/truyền `hasAvatar`; mapper dùng `user.hasAvatar === true` khi gặp dữ liệu cũ.
- Sửa `src/mocks/data/auth.ts`: chỉ bổ sung `hasAvatar: false` cho dữ liệu giả hiện có và kết quả mock login để đáp ứng type mới; không tạo mock avatar thay API thật.
- Sửa `src/lib/api/backend-permissions.ts`, `src/app/api/backend/[...path]/route.ts`: whitelist và nhánh multipart riêng cho avatar.
- Sửa `src/features/auth/api.ts`, `src/lib/api/client.ts`: API avatar và thông báo lỗi storage.
- Tạo `src/types/storage.ts`, `src/lib/validators/storage.ts`, `src/lib/storage/signed-url.ts`.
- Test local: tạo `tests/storage-avatar.test.cjs`, dùng `tests/register-typescript.cjs` và `node:test` hiện có.

**Interfaces được chốt:**

- `SignedAccessUrl { url: string; expiresIn: number }` và `AvatarUrlResponse { url: string | null; expiresIn: number | null }`; cặp avatar rỗng phải là `null/null`.
- `AvatarAccess { url: string | null; expiresAt: number | null }`, `FileAccess { url: string; expiresAt: number }`: dữ liệu nội bộ trong cache.
- `toAvatarAccess(value: AvatarUrlResponse, receivedAt: number): AvatarAccess`; `toFileAccess(value: SignedAccessUrl, receivedAt: number): FileAccess`. `expiresAt = receivedAt + expiresIn * 1000`.
- `isAccessFresh(value: AvatarAccess | FileAccess | undefined, now: number, bufferMs: number): boolean`; sai khi thiếu URL, thiếu hạn hoặc `now >= expiresAt - bufferMs`.
- `avatarFileSchema`: đúng một File PNG/JPEG, extension và MIME khớp, dung lượng 1–5.242.880 byte; BE vẫn là nơi xác thực magic bytes.
- `accountApi.getAvatar(signal?: AbortSignal): Promise<AvatarUrlResponse>`; `uploadAvatar(file: File): Promise<AvatarUrlResponse>`; `deleteAvatar(): Promise<{ deleted: true }>`.

**Các bước và kiểm chứng:**

- [x] Viết test BFF thất bại trước: GET/PUT/DELETE avatar được phép cho bốn role Web thật; Parent bị chặn; không phiên nhận 401; mutation khác origin nhận 403.
- [x] Thêm test PUT giữ nguyên tên/bytes/MIME của `file`, không ép header JSON; refresh token rồi gửi lại vẫn là FormData đúng boundary. Reject file rỗng, lớn hơn 5 MiB, MIME/đuôi sai, nhiều `file`, field lạ; không gọi upstream PUT cho đầu vào sai.
- [x] Thêm contract/helper test: `hasAvatar` truyền qua login và `/auth/me`; thiếu trường cũ thành false; null/null hợp lệ; signed URL chỉ HTTP(S), TTL dương hữu hạn; URL/TTL sai trả lỗi dữ liệu, không render.
- [x] Thực hiện các interface trên; whitelist avatar cho đúng role Web, parse `request.formData()` **trước** nhánh `request.text()`. FormData upload chỉ có `file`; DELETE không gửi payload file.
- [x] Bổ sung lỗi tiếng Việt cho `INVALID_FILE_SIZE`, `INVALID_FILE_TYPE`, `AVATAR_CONFLICT` và fallback 413/503 theo ngữ cảnh storage, không làm đổi lỗi ở luồng khác.
- [x] Chạy `tests/storage-avatar.test.cjs` và `tests/academic-api.test.cjs`: đạt. `web-workflows.test.cjs` không khởi chạy do import module đã thiếu trong HEAD; dùng các kiểm tra quyền/API storage riêng và HTTP thật để bù phạm vi liên quan.

### Task 1.2 — Avatar UI, cache và đồng bộ phiên

**Files dự kiến:** tạo `src/features/auth/hooks/use-avatar.ts`, `src/features/auth/components/account-avatar.tsx`; sửa `src/features/auth/components/account-profile.tsx`, `src/components/shared/layout/header/header.tsx`. Chỉ sửa `auth-session-sync.tsx` nếu cần nối sự kiện làm mới avatar giữa các lần lấy hồ sơ, không thay kiến trúc phiên. Dùng lại UserMenu/Avatar primitive qua props sẵn có.

**Interfaces:** `useCurrentAvatar(user: AuthUser | null)` trả query `AvatarAccess` ở key `["auth-avatar", user.id]`; `useAvatarMutations(user: AuthUser)` trả hai mutation `upload(File)` và `remove(void)`; `AccountAvatar({ user }: { user: AuthUser })` chứa form chọn/lưu/xóa ảnh. Header và profile dùng chung query, không chép signed URL vào `AuthUser.avatarUrl`.

- [x] Bổ sung test cache/state: `hasAvatar=false` không GET ảnh; true mới GET; hạn 900s áp dụng buffer 30s; đổi user dùng key khác; response cũ sau mutation không ghi đè ảnh mới.
- [x] Xây cụm “Ảnh đại diện” trong card thông tin tài khoản: ảnh hiện tại/chữ cái, “Chọn ảnh”, preview cục bộ, “Lưu ảnh”, “Hủy”, “Xóa ảnh”. Helper text: “PNG hoặc JPG, tối đa 5 MiB”. Chọn ảnh chưa làm PUT; chỉ “Lưu ảnh” mới gửi.
- [x] Dùng RHF/Zod cho file đã chọn; lỗi nằm cạnh trường; khóa các thao tác xung đột lúc đang lưu/xóa. Revoke object URL khi đổi file, hủy hoặc unmount; giữ ảnh cũ nếu upload thất bại.
- [x] Khi PUT thành công: hủy query cũ đang chạy, ghi response mới vào cache avatar, cập nhật cờ true trong `auth-me`/hồ sơ phiên rồi refetch hồ sơ để đối chiếu. DELETE thành công chuyển null, cập nhật cờ false và bỏ preview cũ. Không invalidate dữ liệu chấm bài không liên quan.
- [x] Khi tab lấy lại focus, đối chiếu hồ sơ và refetch avatar nếu có ảnh, kể cả `hasAvatar` vẫn true sau lần thay ảnh ở nơi khác. Trước lần sử dụng URL đã hết hạn/cận hạn, cấp lại. Lỗi ảnh chỉ tự cấp lại tối đa một lần rồi fallback chữ cái kèm nút thử lại trên profile.
- [x] `AVATAR_CONFLICT`: giữ lựa chọn cục bộ, đọc lại ảnh đang có, báo “Ảnh đã được thay đổi ở nơi khác. Kiểm tra lại trước khi lưu.”; không tự upload đè. Timeout/5xx sau PUT: báo chưa xác định kết quả, đọc lại trước khi cho người dùng chủ động thử tiếp.
- [x] Kiểm tra browser: cập nhật/xóa ở profile phản ánh ngay header; reload và đổi tài khoản không lộ ảnh cũ; local/session storage không chứa signed URL. Mutation không tự retry; retry xác thực 401 ở BFF chỉ theo cơ chế hiện có.

**Gate Phase 1:** FR-01/FR-02 và NFR-01 đạt; upload đúng 5 MiB qua BFF thật hoạt động, 5 MiB + 1 byte bị chặn. Luồng đăng nhập, sửa tên và đổi mật khẩu vẫn dùng được.

## Phase 2 — Xem ảnh và tải tệp bài nộp của Teacher

**Kết quả:** GradingWorkspace dùng preview cho ảnh và ký download khi click; vẫn chấm điểm được khi storage lỗi.

### Task 2.1 — API tệp, quyền và vòng đời URL

**Files dự kiến:** sửa `src/lib/api/backend-permissions.ts`, `src/features/academic/api.ts`; tạo `src/features/grading/hooks/use-submission-file.ts`; dùng `src/types/storage.ts` và helper từ Phase 1. Test local: tạo `tests/storage-files.test.cjs`, bổ sung case vào `tests/web-workflows.test.cjs`.

**Interfaces:** `academicApi.previewFile(id: string, signal?: AbortSignal): Promise<SignedAccessUrl>` gọi `GET academic/files/:id/preview`; `academicApi.downloadFile(id: string, signal?: AbortSignal): Promise<SignedAccessUrl>` gọi `/download`. Thay caller `academicApi.file` trong GradingWorkspace. `useSubmissionFile(fileId: string, enabled: boolean)` trả query `FileAccess`, key `["web-api", user.id, "submission-file-preview", fileId]`.

- [x] Viết test route: Teacher được qua BFF preview/download; Manager/Staff/Designer/Parent không được qua; các POST file/submission vẫn không có whitelist Web. Test BE thật bổ sung Teacher khác lớp bị 403.
- [x] Viết test API/TTL: preview đọc 300s, buffer 15s; download mới mỗi yêu cầu tải; query/mutation có AbortSignal; không cache chung preview với download; không nhận URL javascript/data hoặc TTL sai.
- [x] Thêm whitelist GET preview đúng Teacher; thêm hai phương thức API và hook. Preview chỉ gọi khi vùng file được mở/đến vùng nhìn thấy; không ký sẵn tất cả download URL lúc mở bài.
- [x] Khi mở lại vùng preview hoặc tab trở lại foreground, kiểm tra hạn thực tế trước khi dùng URL; query lỗi không retry vô hạn. Hủy đọc preview khi đổi bài hoặc đóng vùng xem; bỏ qua kết quả của ngữ cảnh cũ.
- [x] Chạy `node --test tests/storage-files.test.cjs`: đạt quyền, vòng đời và cancellation; browser clock kiểm tra cấp lại URL. Lỗi khởi chạy sẵn có của `web-workflows.test.cjs` được ghi rõ trong báo cáo.

### Task 2.2 — Tách UI xem/tải trong màn chấm bài

**Files dự kiến:** tách `SubmissionFile` khỏi `src/features/grading/components/grading-workspace.tsx` thành `src/features/grading/components/submission-file.tsx`; dùng hook Task 2.1. Không sửa màn mock/legacy `grading-detail-view.tsx` hoặc tạo màn bài nộp mới.

**Interfaces:** `SubmissionFile({ id, index }: { id: string; index: number })`; nhận `fileId` hiện có. Chỉ URL từ endpoint mới đi vào component ảnh/link tải.

- [x] Thêm case kiểm chứng UI: ảnh xem được; PDF có fallback; file lạ/ảnh hỏng không render như ảnh vô hạn; lỗi từng file không khóa form điểm; đang có điểm chưa lưu vẫn giữ nguyên sau xem/tải.
- [x] Giữ block “Tệp bài làm” gần nội dung câu trả lời. Mỗi file có nhãn thứ tự, vùng xem và nút riêng “Tải tệp”; ảnh dùng preview 300s, lazy loading và kích thước giữ chỗ. Tiếp tục dùng cơ chế ảnh `unoptimized` hiện có cho URL ký, không đưa URL qua image optimizer/cache công khai.
- [x] Phân loại theo pathname URL đã kiểm tra: PNG/JPEG hiển thị ảnh, PDF hiển thị “Tệp PDF. Tải xuống để xem bài làm.”, loại khác dùng thông báo không xem trước được và nút tải. Không thêm iframe PDF khi BE còn trả attachment.
- [x] Nút tải gọi `downloadFile` ngay khi click, có trạng thái đang chuẩn bị và chống click lặp. Mở ngữ cảnh tải riêng từ thao tác người dùng rồi gắn URL mới; bỏ opener. Nếu popup bị chặn, cung cấp link tải rõ ràng sau khi chuẩn bị; hết hạn 60s phải cấp lại trước lần mở tiếp.
- [x] Ảnh lỗi: tự cấp lại preview tối đa một lần; sau đó hiện “Không tải được ảnh bài làm” và “Thử lại”/“Tải tệp”. Với 403 dừng retry tự động; với 404 báo file không còn; với 5xx/503 cho thử lại mà giữ nội dung chấm.
- [x] Đổi bài khi request tải/preview còn chạy không đưa tệp của bài trước vào UI bài sau; đóng ngữ cảnh tải trống khi việc chuẩn bị thất bại.
- [x] Kiểm tra bằng bàn phím, focus và tên nút rõ; không phụ thuộc hover. Bố cục dùng được ở 390/768/1440 px của **Web responsive**; ảnh không ép cuộn ngang. Motion ngắn theo CSS có sẵn, tắt khi reduced motion.

**Gate Phase 2:** FR-03/FR-04/FR-05 đạt với ảnh và PDF thật. Không mở thêm quyền Parent Web, không dùng download URL làm preview ảnh và không làm mất điểm chưa lưu.

## Phase 3 — Kiểm chứng tích hợp, hồi quy và tài liệu bàn giao

### Task 3.1 — Nghiệm thu và ghi bằng chứng

**Files dự kiến:** hoàn thiện hai file test local ở trên; tạo `tests/ui-roles/flow-storage.cjs` theo runner hiện có. Tạo `docs/STORAGE_WEB_INTEGRATION.md` ghi contract thực tế, cách cấu hình và kết quả; cập nhật ngắn `.claude/memory/progress.md`/`gotchas.md` sau khi triển khai xong. `tests/` và screenshots đang bị ignore: giữ local theo quy ước, ghi lệnh/kết quả vào tài liệu để người khác chạy lại.

- [x] Xác nhận môi trường kiểm thử: BE đã generate Prisma và áp dụng migration `20261027000000_add_user_avatar_storage_key`; MinIO healthy, bucket private, signed URL browser truy cập được. Đây là điều kiện chạy integration sau duyệt; chưa thực hiện trong lượt này.
- [x] Dùng DB/test account biệt lập và MinIO object test có tiền tố riêng. Có thể tạo fixture bài nộp bằng API Parent **từ harness kiểm thử**, không dùng FEM hoặc mở UI/endpoint Parent Web. Dọn đúng object fixture đã tạo, không xóa bucket hay dữ liệu phát triển.
- [x] Kiểm tra endpoint public: HTTP local/HTTPS triển khai tương ứng, browser tải được ảnh và file, unsigned object URL bị từ chối. Chỉ thêm cấu hình CORS MinIO thành phụ thuộc nếu thao tác thực tế cần fetch cross-origin; bản FE đề xuất dùng ảnh/link trực tiếp.
- [x] Chạy các ca nghiệm thu bên dưới với Manager, Staff, Designer, Teacher; ca quyền file dùng thêm Teacher không được phân công. Ghi riêng ca dùng mock và ca chạy BE/MinIO thật, không coi mock pass là integration pass.
- [x] Chạy kiểm tra tự động sau thay đổi: 22 test FE storage/avatar/academic/profile/password và 24 test BE đạt; TypeScript FE/BE đạt; lint file sửa sạch. Lint toàn FE có 14 warning cũ. Production build đạt với `npm run build -- --webpack`; Turbopack mặc định lỗi khởi tạo tiến trình CSS trên máy này. Bộ web-workflows cũ thiếu module nên không được báo pass.
- [x] Kiểm tra browser qua `tests/ui-roles/flow-storage.cjs` bằng môi trường local hiện có; lưu ảnh bằng chứng ở `docs/screenshots/storage-web-2026-10-27/`. Chỉ đánh dấu các ca thực sự chạy; thiếu môi trường ghi rõ chưa kiểm chứng.
- [x] Hoàn thiện tài liệu bàn giao: endpoint được mở trên Web, giới hạn file, TTL, port theo env, PDF download-only, mã lỗi thực tế và các điểm cần BE xác nhận.

**Gate Phase 3 / Definition of Done:** các Must đã có kiểm chứng; form điểm giữ nguyên khi xem/tải lỗi; có hồi quy academic/profile/password và kiểm tra URL không lưu bền. **Không có thay đổi FEM; BE chỉ sửa giới hạn avatar theo quyền người dùng đã cho.** Môi trường tích hợp dùng DB/MinIO riêng đã dọn sau test. Các giới hạn build/test cũ được ghi rõ, không coi là đã pass.

### Tiêu chí nghiệm thu Given / When / Then

| AC | Given / When / Then | Yêu cầu |
| --- | --- | --- |
| AC-01 | Tài khoản chưa có ảnh → mở profile/header → hiển thị chữ cái, không GET avatar khi cờ false. | FR-01 |
| AC-02 | Chọn PNG/JPEG hợp lệ ≤ 5 MiB → xem preview rồi Lưu → ảnh profile/header cùng đổi; reload còn ảnh; chọn nhưng Hủy không PUT. | FR-02 |
| AC-03 | File 0 byte, > 5 MiB, PDF/WebP hoặc MIME/đuôi sai → chọn/gửi → lỗi cạnh trường hoặc lỗi server phù hợp; ảnh cũ giữ nguyên. | FR-02, FR-05 |
| AC-04 | Có avatar → Xóa ảnh → profile/header về chữ cái; xóa lại vẫn thành công; URL cũ không còn được FE dùng. | FR-02 |
| AC-05 | Access token hết hạn → PUT avatar → BFF refresh một lần; BE nhận đúng file, cookie được cập nhật, browser không thấy bearer token. | NFR-01 |
| AC-06 | Có conflict hoặc PUT bị timeout → lỗi → không tự PUT lại; đọc trạng thái hiện tại và cho người dùng chủ động xử lý, không báo thành công giả. | FR-05 |
| AC-07 | Teacher có quyền và bài nộp có ảnh → mở file → dùng preview endpoint 300s; ở lâu/quay lại tab thì URL được cấp lại khi cần. | FR-03 |
| AC-08 | Bài có PDF hoặc loại không xác định → mở block tệp → có fallback đúng và tải được; không có ảnh vỡ/iframe hứa xem PDF inline. | FR-04 |
| AC-09 | Đã xem bài quá 60s, đang nhập điểm → click Tải → lấy download URL mới; file tải được mà điểm không mất; popup bị chặn vẫn có đường tải. | FR-04, NFR-02 |
| AC-10 | Teacher khác lớp, role Web khác hoặc Parent gọi Web file API → yêu cầu → bị chặn; không hiện ảnh/link mới. File không tồn tại/5xx có fallback không suy diễn sai nguyên nhân. | FR-05, NFR-01 |
| AC-11 | Ảnh lỗi hoặc MinIO ngừng phục vụ → xem/tải → retry hữu hạn, lỗi tiếng Việt; vẫn chấm/lưu điểm và dùng chức năng tài khoản khác được. | FR-05 |
| AC-12 | Logout/đổi user hoặc đổi bài lúc request chưa xong → nhận response cũ → không hiển thị dữ liệu ngữ cảnh cũ; signed URL không có trong local/session storage/log. | NFR-01 |
| AC-13 | Dùng bàn phím/reduced motion và viewport Web 390/768/1440 → thao tác → focus rõ, lỗi được đọc, nút truy cập được, không tràn ngang/nhảy layout. | NFR-02 |

## 4. Rủi ro, phụ thuộc và phương án đề xuất

**Đề xuất tổng thể:** triển khai FE Web theo khả năng BE đã có: avatar tài khoản, preview ảnh và tải tệp bài nộp. Giữ PDF ở luồng tải xuống; xử lý chênh lệch mã lỗi tại lớp tích hợp FE. Các bổ sung BE như PDF inline, metadata và quyền sau đổi giáo viên được tách thành cải tiến sau, không đặt thành điều kiện để bắt đầu làm FE.

### 4.1. Phương án xử lý từng rủi ro

| ID | Rủi ro / mức độ | Phương án đề xuất | Điều kiện đạt hoặc cách dừng | Phụ trách |
| --- | --- | --- | --- | --- |
| R-01 | PDF không inline như guide; đã xác nhận từ code/test BE — cao | Dùng preview cho PNG/JPEG; PDF hiện nút “Tải tệp” và hướng dẫn tải để xem. Chưa thêm PDF viewer hay sửa BE. | Đạt khi PDF tải được từ URL mới và không làm mất form điểm. Chỉ triển khai PDF inline trong yêu cầu tiếp theo có contract BE hỗ trợ. | FE |
| R-02 | Status/error code khác guide — cao | Map theo `error.code` kết hợp status: xử lý validation file ở 400/409, upload quá lớn ở 413, storage lỗi ở 503/`HTTP_ERROR`; 5xx còn lại dùng thông báo chưa hoàn tất. Ghi hành vi thực tế trong tài liệu tích hợp Web. | Test từng nhóm lỗi; không coi mọi 409 là xung đột avatar hoặc mọi 500 là file không tồn tại. Sai mã trong guide không chặn làm FE nếu UI xử lý đúng response thật. | FE; BE xác nhận tài liệu khi có thay đổi |
| R-03 | Migration/MinIO/public endpoint chưa sẵn sàng — cao, chưa kiểm chứng | Kiểm tra môi trường dùng thử trước khi chạy tích hợp: schema có cột avatar, MinIO healthy, signed URL tới được từ browser và bucket không cho đọc ẩn danh. | Có thể tiếp tục code và test giả lập khi thiếu môi trường; **chưa nghiệm thu Phase 3** đến khi upload/xem/tải thật đạt. Ghi rõ cấu hình cần người vận hành BE xử lý, không tự sửa BE trong phạm vi này. | Người vận hành BE chuẩn bị; FE kiểm chứng |
| R-04 | PUT timeout nhưng BE có thể đã ghi; avatar bị sửa đồng thời — vừa | Không tự gửi lại PUT. Khi conflict, đọc ảnh hiện tại và giữ lựa chọn cục bộ để người dùng quyết định lưu lại. Khi timeout, báo kết quả chưa xác định và đọc lại trước lần thử chủ động; không kết luận upload thất bại chỉ từ timeout. | Có test không phát sinh PUT lặp tự động và không báo thành công giả. Một lần GET chưa thấy ảnh mới không chứng minh PUT trước đã dừng. | FE |
| R-05 | Đổi Teacher làm mất quyền đọc file cũ theo điều kiện BE hiện tại — vừa | Giữ quyền BE đang có; nhận 403 thì dừng tự retry và báo không có quyền. Không cấp thêm quyền Manager/Staff để đọc thay. | Kiểm thử Teacher đúng quyền và Teacher không được phân công. Nếu cần bàn giao lịch sử bài làm cho Teacher mới, ghi yêu cầu riêng cho BE; không chặn tích hợp cho các trường hợp đang được phép. | FE; chủ nghiệp vụ và BE xử lý cải tiến quyền sau |
| R-06 | Thiếu tên/MIME/dung lượng ở response bài nộp — thấp | Dùng “Tệp 1”, “Tệp 2”…; nhận diện loại hỗ trợ từ pathname signed URL và có fallback. Không hiển thị dung lượng hoặc tên gốc giả. | Nghiệm thu được mà không cần API metadata mới. Đề nghị bổ sung metadata sau nếu giáo viên cần phân biệt nhiều tệp cùng bài. | FE |
| R-07 | Object lịch sử còn ở bucket/endpoint cũ — vừa, chưa kiểm chứng | Nếu môi trường có bài nộp cũ, kiểm tra tối thiểu một file cũ cùng một file mới. Giữ nguyên `storageKey`; không tự chuyển object hoặc đổi URL đã ký. | Nếu dữ liệu cũ không đọc được, ghi đúng nhóm dữ liệu bị ảnh hưởng và cần người vận hành BE chuyển/khôi phục object; chưa nghiệm thu tương thích lịch sử cho nhóm đó. Nếu không có dữ liệu cũ, ghi “chưa có mẫu để kiểm chứng”. | Người vận hành BE; FE xác nhận kết quả |

### 4.2. Phụ thuộc và thứ tự xử lý đề xuất

| Phụ thuộc | Mức bắt buộc | Thời điểm xử lý | Phương án nếu chưa có |
| --- | --- | --- | --- |
| Người dùng duyệt kế hoạch 3 phase | Trước khi sửa code | Trước Phase 1 | Chỉ cập nhật tài liệu; chưa bắt đầu triển khai. |
| BE đúng phiên bản có endpoint avatar/preview và migration avatar | Bắt buộc để tích hợp thật | Xác nhận trong Phase 1, kiểm tra lại trước Phase 3 | Tiếp tục FE bằng contract test; ghi thiếu môi trường, chưa xác nhận end-to-end. |
| MinIO hoạt động và `STORAGE_PUBLIC_ENDPOINT` truy cập được từ browser | Bắt buộc để nghiệm thu | Smoke test sớm khi có môi trường, trước Phase 3 | Người vận hành BE xử lý cấu hình; FE vẫn phải có fallback khi storage lỗi. |
| Tài khoản thử bốn role Web và hai Teacher có/không có quyền file; fixture ảnh/PDF | Bắt buộc để nghiệm thu quyền và tải thật | Chuẩn bị trước Phase 3 | Tạo trong môi trường thử biệt lập qua API/harness; không thao tác FEM hoặc dùng dữ liệu thật để thay đổi thử. |
| PDF inline, metadata file và quyền đọc bài sau đổi Teacher | Cải tiến sau, không chặn bản này | Ghi backlog trong tài liệu bàn giao | Dùng các fallback đã đề xuất; chỉ mở rộng khi có yêu cầu và contract BE tương ứng. |

### 4.3. Các quyết định đã được duyệt

1. **Phạm vi:** FE Web là chính, BE được sửa khi cần; FEM/mobile nằm ngoài mọi thay đổi.
2. **Ưu tiên thực hiện:** Phase 1 hoàn thiện avatar và BFF; Phase 2 hoàn thiện ảnh/tải tệp trong màn chấm bài; Phase 3 nghiệm thu tích hợp và hồi quy. Thứ tự này dùng chung nền tảng URL có hạn, tránh làm lại cách xử lý cache/lỗi.
3. **Avatar:** tài khoản tự đổi/xóa ảnh của mình; chọn ảnh rồi bấm lưu, có preview và hủy. Giữ giới hạn PNG/JPEG 5 MiB; chưa làm crop/nén để tránh thêm thư viện và khác contract BE.
4. **Bài nộp:** preview ảnh trực tiếp, PDF tải xuống; mỗi click tải lấy URL mới. Chấp nhận nhãn thứ tự tệp cho bản này vì BE chưa trả metadata cho Teacher.
5. **Giao diện và motion:** giữ hệ thống UI hiện tại; dùng component chung và chuyển trạng thái CSS ngắn, có reduced motion. Chưa thêm GSAP vì luồng này chưa cần animation phức tạp.
6. **Lỗi và tính nhất quán:** xử lý cả response thực tế lẫn mã trong guide; không tự upload lại sau conflict/timeout. Luôn giữ form điểm đang nhập khi thao tác tệp lỗi.
7. **Nghiệm thu:** chỉ đánh dấu hoàn thành khi chạy với BE/MinIO thật, kiểm tra quyền và không lưu signed URL bền. Việc thiếu môi trường chặn nghiệm thu tích hợp, không buộc dừng các đầu việc FE độc lập.
8. **Cách duyệt:** duyệt chung các đề xuất trên cùng kế hoạch 3 phase; sau đó triển khai tuần tự trong chat này. Chỉ cần xin quyết định mới nếu phát sinh thay đổi phạm vi, sửa BE hoặc bổ sung nghiệp vụ chưa có trong kế hoạch.

Người dùng đã duyệt triển khai lần lượt Phase 1 rồi Phase 2–3, đồng thời cho phép sửa BE khi cần. Không có yêu cầu commit/push hoặc triển khai lên môi trường dùng thật.

**Runtime đã kiểm chứng:** schema/migration, BFF/Nest/MySQL/MinIO và signed URL trong môi trường thử riêng; các dịch vụ thử đã dọn. Chưa áp dụng migration lên DB ứng dụng đang dùng hoặc kiểm chứng chuyển object lịch sử/HTTPS môi trường triển khai.

**Bàn giao hiện tại:** code của 3 phase và báo cáo nghiệm thu; chưa commit/push.

## 5. Kết quả thực hiện

- Phase 1: hoàn tất avatar cho bốn role Web; 5 MiB thực tế được chấp nhận, MAX+1 bị chặn; sửa FileList rỗng và giữ cookie sau role-preflight refresh.
- Phase 2: hoàn tất preview ảnh/PDF fallback, download ký mới từng click, popup fallback, TTL và hủy request; không mất điểm đang nhập khi lỗi.
- Phase 3: 22/22 test FE, 24/24 test BE, 12 nhóm browser; TypeScript FE/BE và build Webpack đạt. Source đã sửa không có lỗi/warning lint; toàn FE còn 14 warning cũ.
- Đã rà soát độc lập và sửa finding P2 có test RED→GREEN; đã xem ảnh QA ở 390/768/1440 px.
- Giới hạn đã xác định: Turbopack mặc định lỗi môi trường; bộ test web-workflows cũ thiếu module trong HEAD; chưa có object lịch sử từ storage cũ để kiểm chứng chuyển đổi.
- Báo cáo chi tiết: [STORAGE_WEB_INTEGRATION.md](D:/WDP/WDP301-FE-System/docs/STORAGE_WEB_INTEGRATION.md). Database thử và các dịch vụ tạm đã được dọn; không sửa FEM/mobile hoặc DB ứng dụng đang dùng.

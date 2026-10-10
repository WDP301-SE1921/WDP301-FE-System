# Gotchas

- **Web workflow API (2026-10-10)**: single absence cần participant/roster đã được Teacher chuẩn bị; Staff không được tự POST roster. Hủy makeup không xóa participant unique key của BE, nên cùng enrollment không đặt lại được cùng target session; lọc các target từng đặt và chọn buổi khác. Parent-only upload/submission không mở trên BFF Web.
- **Report/AI/email**: BFF phải giữ bytes và content-type/disposition khi tải PDF/XLSX; lỗi JSON có thể đến dưới dạng blob. AI proposal không tạo/công bố GradeReview; vẫn cần Teacher lưu, approve rồi publish. Lưu announcement chưa gửi email; hiển thị kết quả từng recipient từ lệnh send, không dùng success chung cho SMTP.
- **MySQL/Chromium test local**: chỉ migrate database biệt lập và drop sau test. Nest test phải chạy với cwd của BE vì PDF tìm `assets/fonts` từ cwd. Base UI Checkbox có input ẩn cùng label; chọn `getByRole("checkbox", { name })` khi kiểm thử tương tác.

- **Academic API (2026-10-09)**: scheduled-sessions list không có revision; phải GET detail trước đổi/hủy. Mutation session trả scalar, nên invalidate/refetch detail thay vì ghi response vào cache detail. Teacher không có lớp có thể nhận [] dù curriculum query dùng paginated=true.
- **CSV Academic**: diagnostics của preview dùng code/field, không có message. Commit phải bỏ diagnostics và giữ nguyên chuỗi preview. Preview file tối đa 5 MiB nhưng JSON BE giới hạn 1 MiB; FE kiểm tra byte UTF-8 trước commit. Luôn retry bằng body/key đã lưu, kể cả preview đã hết hạn sau request có kết quả chưa xác định.
- **Base UI Select trong Dialog**: Positioner fixed tạo stacking context, z-index chỉ trên Popup không đủ. `globals.css` đặt layer cho positioner của select-portal để danh sách hiện trên dialog; không ép force-click trong kiểm thử để bỏ qua lỗi tương tác.

- **npm project naming**: `create-next-app <Name>` fails if the name has capital letters (npm naming restriction). Scaffold into a lowercase temp folder, then move contents into the real (capitalized) repo folder.
- **PowerShell + git folders**: moving a freshly-scaffolded Next.js folder (which has its own `.git`) into a repo folder that already has `.git` fails on `Move-Item` for the `.git` directory specifically — everything else moves fine. Delete the leftover temp folder's `.git` remnants afterward and verify with `git status` in the destination.
- **SafeAreaView (mobile)**: must import from `react-native-safe-area-context`, not from `react-native` — the built-in one doesn't handle notches correctly.
- **FlatList (mobile)**: parent container needs `flex: 1` or scrolling silently breaks.

# Bàn giao BE-1, BE-2: số buổi/tuần và giáo trình hiệu lực của khóa

Ngày kiểm tra: **20/10/2026**, múi giờ nghiệp vụ Việt Nam (`Asia/Ho_Chi_Minh`, UTC+07:00).

Nguồn yêu cầu: [đề xuất 18/10, mục 9](UI_REDESIGN_HANDOFF_2026-10-18.md#9-việc-cần-be--mobile). Đây là **BE-1 / BE-2 của đề xuất 18/10**, không phải BE-01 / BE-02 của các handoff phân quyền/chuyển lớp trước đó.

Phạm vi kiểm tra: source BE nhánh `dev`, commit `5411117`; source FE nhánh `dev`, commit `c602207`. Chưa kiểm tra API đang triển khai hoặc dữ liệu DB. Tài liệu này không xác nhận trạng thái production. Các hợp đồng và mã lỗi mới bên dưới là **đề xuất triển khai**, chưa tồn tại trong API hiện tại. Đợt này chỉ viết tài liệu, chưa sửa code BE/FE.

## 0. Cập nhật triển khai (tối 20/10/2026)

**BE-1 và BE-2 đã code xong và đã push `dev` (đêm 20/10, theo yêu cầu chủ dự án).** BE: `83aec68` (code), `85269ac` (docs API), merge `0c396fb` trên `dev`; FE: `2d1d6b5` (code), `e6a04de` (docs), fast-forward `dev`. BE `dev` tự deploy lên Render và chạy `prisma migrate deploy` khi khởi động, nên migration bên dưới được áp lên DB của bản deploy ở lần chạy kế tiếp. Hợp đồng đã chốt đúng như mục 2–4 (giới hạn 1–14, các mã lỗi ở mục 4) và đã ghi vào `WDP301-BE-System/CURRICULUM_SCHEDULING_API.md`, mục "Số buổi/tuần của khóa và giáo trình hiệu lực".

| Phần | Đã làm |
| --- | --- |
| Schema/migration | `20261020000000_course_frequency_curriculum_lifecycle`: `programs.sessionsPerWeek` (nullable), `curriculum_units.archivedAt/archiveReason/supersededById`; bản lưu trữ cũ gán `MANUAL`; chỉ tự điền số buổi khi mọi lớp đang hoạt động cùng số khung giờ hợp lệ. Báo cáo chỉ đọc: `pnpm db:report-course-curriculum`. Seed khóa = 2 buổi/tuần. |
| BE-1 | DTO mới và cũ nhận `sessionsPerWeek` (bỏ trường được trong chuyển tiếp, `null` bị 400). Kiểm tra số khung giờ ở PUT/POST/PATCH/DELETE lịch tuần, mở đăng ký, kích hoạt lại, giáo viên xác nhận, xem trước/sinh lịch, tạo buổi cũ; lớp cũ tạo ở trạng thái đóng. Đổi số buổi bị chặn khi lệch lớp đang hoạt động. Khóa theo thứ tự khóa học → lớp; số buổi nằm trong snapshot xem trước. |
| BE-2 | Duyệt khóa khóa học rồi chặn giao ngày (kể cả bản tự lưu trữ vì sang kỳ). Worker chạy khi khởi động và mỗi phút để tự lưu trữ `SUPERSEDED` từ 00:00 giờ VN, chạy bù được, không audit trùng; duyệt muộn cũng đối soát ngay. Lưu trữ thủ công ghi `MANUAL`. Sao chép từ bản `ARCHIVED` từng duyệt. Phụ huynh và giáo viên vẫn xem bản tự lưu trữ; tạo buổi cũ chặn ngoài kỳ. |
| FE | Đủ các dòng ở mục 5: ô số buổi/tuần trong form khóa (bắt buộc khi tạo mới), form lịch tuần đếm “đã nhập / cần có” và chỉ lưu cả bộ, nút mở đăng ký/xác nhận lịch theo chuẩn, ô chỉ đọc ở form giáo trình, ước tính dashboard, nhãn hiệu lực theo ngày, chọn nguồn sao chép (gồm bản lưu trữ), sinh lịch không cho chọn tay khi có xung đột, thông báo tiếng Việt + danh sách lớp/giáo trình xung đột, tải lại khi focus/qua ngày. |

**Kết quả kiểm tra (20/10, tối):**

- BE: `tsc` 0 lỗi; ESLint + Prettier sạch trên các file đổi; unit 18/18 bộ, 149/149 ca (thêm 16 ca của `curriculum-lifecycle.spec.ts`, `program-frequency.spec.ts`). E2E trên MySQL Docker, DB tạm tự xóa: `curriculum-scheduling`, `registration-flow`, `academic` 56/56; `parent-mobile`, `notifications` đạt; `dashboard-seed` 6/6 khi tăng timeout (lỗi trước đó chỉ là quá 5 giây mặc định).
- `demo-seed` không chạy được trong phiên AI: lệnh `prisma migrate reset` của ca reseed bị Prisma chặn khi do AI gọi. Đây không phải lỗi code. Người trong nhóm cần tự chạy ca này.
- FE: `tsc` 0 lỗi, ESLint 0 lỗi trên file đổi.
- Chưa chạy: migration trên DB dev `edugrade_db` (dev BE cần `pnpm prisma migrate deploy` trước khi chạy), báo cáo dữ liệu thật, ca duyệt trùng kỳ qua hai tab trình duyệt (đã có e2e duyệt đồng thời ở BE).

Thứ tự triển khai: BE đã push trước FE. Nếu FE được deploy trước khi bản BE mới chạy xong, form khóa sẽ bị 400 với `sessionsPerWeek`. Sau khi deploy, Quản lý cần nhập số buổi/tuần cho các khóa migration không tự điền được (khóa có lớp lệch số khung giờ hoặc chưa có lịch); đến lúc đó, lưu lịch có dữ liệu, mở đăng ký và sinh lịch của khóa đó trả `PROGRAM_FREQUENCY_NOT_CONFIGURED`.

## 1. Kết luận đã kiểm tra

| Mục | Trạng thái trong source | Phần còn thiếu |
| --- | --- | --- |
| BE-1: khóa có số buổi/tuần, lịch lớp phải đủ số khung giờ | **Chưa triển khai** | Chưa có trường trên `Program`, DTO, API tạo/sửa; chưa đối chiếu số slot với chuẩn khóa khi lưu/mở lớp/xác nhận/sinh lịch. |
| BE-2: mỗi khóa tối đa một giáo trình đã duyệt hiệu lực tại một ngày; kỳ mới bắt đầu thì kỳ cũ tự lưu trữ | **Đã có một phần, chưa hoàn thành** | Đã kiểm tra kỳ sao chép nằm sau kỳ nguồn; chưa chặn giao ngày giữa mọi bản độc lập cùng khóa, chưa có tự lưu trữ khi sang kỳ. |
| FE khi BE hoàn thành hai mục này | **Cần sửa** | Bổ sung trường khóa, thay phần hiển thị tạm, kiểm tra/lưu lịch tuần, xử lý lỗi mới, cập nhật dữ liệu sau duyệt/lưu trữ và giữ luồng sao chép bản cũ. Chi tiết tại mục 5. |

### Bằng chứng BE

Các đường dẫn trong bảng này tính từ repo `WDP301-BE-System`; số dòng tại commit kiểm tra.

| Vị trí | Hành vi hiện tại |
| --- | --- |
| `prisma/schema.prisma:205` | Model `Program` không có số buổi/tuần. Trong code, **khóa học = Program**, không phải `Subject` hay `CurriculumTrack`. |
| `src/modules/registration-flow/dto/registration-flow.dto.ts:133`, `:156`; `registration-flow.service.ts:225`, `:1816` cùng thư mục module | DTO và service tạo/sửa khóa chưa nhận/lưu trường này. |
| `src/main.ts:25` | Validation bật whitelist và `forbidNonWhitelisted`; FE gửi trường mới trước khi BE hỗ trợ sẽ bị 400. |
| `src/modules/registration-flow/registration-flow.service.ts:878`, `:927`, `:954` | Thay/sửa/xóa lịch tuần kiểm tra giờ, trùng lịch, lớp mở không được mất slot cuối; chưa kiểm tra chuẩn số buổi khóa. |
| Cùng service `:416`, `:715`, `:980` | Mở lớp/xác nhận chỉ cần lịch không rỗng. Đã có khóa cấm sửa lịch sau xác nhận hoặc khi có enrollment/placement/buổi đã sinh; cần giữ các khóa này. |
| `prisma/schema.prisma:411`, `:444` | Giáo trình có `programId`, `fromDate`, `toDate`, trạng thái và version. Unique tuple `(programId, fromDate, toDate, version)` không chặn các khoảng ngày giao nhau. |
| `src/modules/curriculum-scheduling/curriculum-scheduling.service.ts:899` | Duyệt có transaction Serializable, khóa theo ID bản đang duyệt, yêu cầu giáo viên thẩm định; chưa truy vấn bản APPROVED khác cùng khóa để kiểm tra giao ngày. |
| Cùng service `:975`, `:2060` | **Đã có** `reviseUnit` / `assertFutureRevisionPeriod`: kỳ sao chép bắt đầu sau hôm nay Việt Nam và sau ngày kết thúc bản nguồn. Quy tắc này không bao phủ hai bản tạo độc lập. |
| Cùng service `:844` | Manager có thể lưu trữ thủ công qua DELETE bản APPROVED. Trong `src` chưa có luồng tự archive khi bản mới bắt đầu. |
| Cùng service `:1809`, `:1923` | Preview/generate kiểm trạng thái và khoảng ngày, sinh theo lịch tuần thật. Snapshot hiện chưa gồm chuẩn số buổi/tuần của khóa. |
| `src/modules/academic/catalog.service.ts:116` | Đường tạo buổi legacy chỉ kiểm giáo trình APPROVED, chưa đối chiếu ngày buổi với kỳ giáo trình. Cần rà cùng BE-2 để tránh đường đi vòng. |

## 2. BE-1 — hợp đồng và công việc cần làm

### 2.1. Dữ liệu khóa và API

Thêm `Program.sessionsPerWeek`, số nguyên dương. Đề xuất giới hạn **1–14** để khớp `ReplaceClassSchedulesDto` hiện giới hạn 14 slot (`registration-flow.dto.ts:312`). Đây là lựa chọn kỹ thuật đề xuất, chưa phải giới hạn đã được yêu cầu ngày 18/10. Nếu đổi giới hạn, BE/FE phải đổi cùng nhau.

Các URL dưới đây có prefix `/api/v1`:

| API hiện có | Thay đổi cần có | Quyền |
| --- | --- | --- |
| `POST /programs` | Nhận/lưu `sessionsPerWeek`; hợp đồng sau chuyển tiếp yêu cầu trường này khi tạo mới. | MANAGER |
| `PATCH /programs/:id` | Nhận trường tùy chọn; bỏ qua trường thì giữ giá trị cũ. Kiểm tra các lớp bị ảnh hưởng trước khi đổi. | MANAGER |
| `GET /programs`, `GET /programs/:id` | Trả `sessionsPerWeek`, kể cả với Thiết kế giáo trình. Giữ cấu trúc response hiện tại. | Các role đang có quyền đọc |
| Response lớp có `program`, response curriculum có `program` | Bổ sung trường vào projection đang select tường minh, gồm `unitInclude` và `listUnits`. | Giữ quyền hiện tại |
| `POST /academic/programs`, `GET /academic/programs` | Đồng bộ DTO/response legacy hoặc đưa write legacy qua cùng service; không để tạo khóa thiếu chuẩn bằng đường khác. | Giữ quyền hiện tại |

Ví dụ request sau khi triển khai:

```json
{
  "name": "Toán 6 cơ bản",
  "subjectId": "subject-math",
  "grade": 6,
  "sessionsPerWeek": 2
}
```

Giá trị thiếu/null/0/âm/thập phân/vượt giới hạn phải có validation rõ theo giai đoạn chuyển tiếp. Không tự mặc định tất cả khóa là 2 buổi/tuần.

### 2.2. Quy tắc lịch lớp

Một **slot hợp lệ** trong `ClassWeeklySchedule` là một buổi. Hai slot cùng thứ nhưng khác giờ, không giao nhau, tính là hai buổi; không đếm số ngày khác nhau.

- Lưu bộ lịch có dữ liệu phải đạt `schedules.length === program.sessionsPerWeek`, đồng thời giữ kiểm tra thứ/giờ/trùng slot/chồng giờ đang có.
- Giữ luồng tạo lớp chưa có lịch: lớp mới đóng đăng ký (`isOpen:false`) được có lịch rỗng. Đề xuất chỉ cho rỗng khi lớp đóng; không lưu bộ lịch thiếu một phần. Việc xóa toàn bộ vẫn phải qua khóa sửa lịch hiện hành.
- Mở đăng ký, kích hoạt lại lớp, giáo viên xác nhận, preview và generate đều phải kiểm tra đủ chuẩn. Lớp legacy lệch chuẩn không được đi tiếp chỉ vì lịch có ít nhất một slot.
- Rà `POST /academic/classes` legacy (`CatalogService.createClass`): không để tạo lớp mở đăng ký mặc định mà chưa có bộ lịch hợp lệ. Đưa qua cùng quy tắc tạo lớp đóng/chưa có lịch; kiểm tra đường tạo buổi legacy cũng không bỏ qua điều kiện lịch của lớp.
- `PUT /classes/:id/schedules` và POST alias hiện tại đều là **thay toàn bộ lịch**. Kiểm tra trước khi xóa/ghi để lỗi không làm mất lịch cũ.
- `PATCH` và `DELETE /classes/:id/schedules/:scheduleId` phải kiểm tra trạng thái bộ lịch sau thao tác. Muốn đổi số slot thì FE chỉnh một bộ cục bộ và gửi PUT; xóa lẻ không được tạo bộ lịch thiếu chuẩn.
- Giữ `SCHEDULE_CONFIRMED`, `CLASS_SCHEDULE_LOCKED` và các quy tắc enrollment/placement/session. Số buổi đúng không có nghĩa là được sửa lịch đã khóa.
- Khi đổi `sessionsPerWeek`, kiểm tra các lớp đang hoạt động: lớp có lịch khác chuẩn mới phải làm request thất bại, trả danh sách lớp để xử lý. Không tự thêm/xóa slot hoặc sửa buổi đã sinh. Lớp đóng, chưa cấu hình lịch có thể tiếp tục rỗng; dữ liệu lớp ngừng hoạt động giữ lịch sử và phải kiểm tra lại khi kích hoạt.
- Khóa/giao dịch giữa cập nhật khóa, thay lịch, kích hoạt/mở lớp và sinh lịch phải thống nhất để hai request đồng thời không tạo dữ liệu lệch chuẩn. Đưa `sessionsPerWeek` vào snapshot preview và kiểm tra lại khi generate. Retry generation đã thành công với cùng idempotency key vẫn trả kết quả cũ.

### 2.3. Migration và tương thích

1. Thêm cột nullable trong giai đoạn chuyển tiếp; xuất báo cáo khóa không có lịch, khóa có lịch rỗng, và khóa có các lớp khác số slot. Chỉ backfill tự động khi lịch hợp lệ của các lớp đang hoạt động thống nhất.
2. Với khóa chưa xác định được, giữ `null` và yêu cầu Quản lý nhập. Không chọn lớp đầu tiên hoặc số phổ biến rồi âm thầm sửa phần còn lại.
3. Cập nhật seed/fixture và cả DTO legacy. Triển khai BE nhận/trả trường trước, rồi FE mới gửi trường.
4. Hợp đồng tạo khóa bắt buộc trường mới chỉ bật sau khi client tạo khóa đã cập nhật; trong khoảng chuyển tiếp phải ghi rõ chính sách nhận request cũ. PATCH thông tin khác không được vô tình reset tần suất.
5. Trước khi mở/xác nhận/sinh lịch cho khóa chưa cấu hình, trả lỗi cụ thể. Chỉ siết NOT NULL sau khi backfill xong; không chạy reseed trên dữ liệu thật để xử lý migration.

`sessionsPerWeek` là chuẩn của khóa, còn số buổi thực trong một khoảng ngày phụ thuộc lịch học từng thứ. **Giữ `slotsForRange` và preview của BE làm kết quả chính xác**, nhất là kỳ có tuần đầu/cuối không trọn tuần.

## 3. BE-2 — một giáo trình hiệu lực tại mỗi ngày

### 3.1. Ngữ nghĩa ngày và duyệt

- Ràng buộc theo **`programId`**: tại một ngày, tối đa một giáo trình đã duyệt có hiệu lực. Không ràng buộc theo `trackId` vì nhiều khóa cùng môn/khối có thể chung track.
- Khoảng ngày đóng `[fromDate, toDate]`, tính cả hai đầu. Giao nhau khi `old.fromDate <= new.toDate && old.toDate >= new.fromDate`.
- Bản A kết thúc `31/10/2026`, B bắt đầu `01/11/2026`: hợp lệ. B bắt đầu `31/10/2026`: xung đột. Khoảng trống giữa hai kỳ được phép; không tự kéo dài kỳ cũ.
- Cho phép nhiều DRAFT/PENDING_REVIEW có ngày giao nhau. Có thể báo sớm khi validation/submit, nhưng **bắt buộc kiểm tra lại khi Manager approve**, kể cả bản tạo độc lập không có `basedOnId`.
- Cho phép nhiều bản APPROVED cùng khóa nếu các kỳ rời nhau, gồm bản hiện tại và bản tương lai. Không thêm unique `(programId,status)`.
- Bản tạo độc lập hiện có thể chọn kỳ quá khứ. Đề xuất chặn bản duyệt hồi tố giao với kỳ đã áp dụng và được tự lưu trữ, dùng metadata lịch sử ở mục 3.3 trong tập kiểm tra. Không để A vừa tự archive thì C được duyệt lại trùng kỳ A chỉ vì truy vấn chỉ nhìn APPROVED.
- Đề xuất giữ nguyên ngày đã công bố: có giao ngày thì trả 409, không tự cắt ngày kỳ cũ. Nếu cần thay thế giữa kỳ, phải thiết kế command riêng; không gộp ngầm vào approve.
- Giữ ownership, revision, luồng giáo viên thẩm định rồi Manager duyệt, và quy tắc kỳ tương lai khi sao chép đã có.

### 3.2. Chống duyệt đồng thời

Trong transaction duyệt, khóa bản ghi khóa học (`programs`) rồi khóa/đọc ứng viên, kiểm tra lại trạng thái/thẩm định và tìm các bản APPROVED giao ngày cùng khóa; với kỳ hồi tố, kiểm tra thêm lịch sử tự lưu trữ nêu trên. Dùng một thứ tự khóa thống nhất cho mọi đường publish/archive liên quan; sắp xếp khóa nhiều tài nguyên ổn định để tránh deadlock với generation.

Hai Manager duyệt hai bản giao ngày đồng thời: chỉ một request được thành công. Request còn lại trả domain conflict; không để lại lesson APPROVED, audit hay thông báo thành công của request thất bại. Có retry hữu hạn cho xung đột transaction; Serializable và unique tuple hiện tại tự chúng chưa thực hiện quy tắc này.

### 3.3. Tự lưu trữ khi sang kỳ

- Duyệt trước bản B có `fromDate` tương lai **không** lưu trữ A ngay lúc duyệt.
- Khi đến ngày bắt đầu B theo giờ Việt Nam, các bản APPROVED cũ cùng khóa đã kết thúc trước B được chuyển ARCHIVED. Nếu có khoảng trống, A đã hết hiệu lực theo ngày nhưng không được kéo dài đến B.
- Có worker/job tự chạy, chạy bù sau restart và chạy lặp an toàn; không phụ thuộc người dùng mở FE. Đường đọc/chọn giáo trình phải lọc ngày đúng ngay cả khi worker xử lý chậm. Test phải chứng minh chuyển kỳ không cần request từ client.
- Định nghĩa chạy bù cho trường hợp bỏ lỡ nhiều kỳ và bản độc lập được duyệt sau ngày bắt đầu: đối soát các kỳ đã được duyệt và đã đến ngày áp dụng, archive các bản tiền nhiệm phù hợp. Bản tương lai đã bị Manager archive thủ công trước ngày bắt đầu không được kích hoạt lưu trữ bản đang dùng. Hiệu lực theo ngày đổi đúng mốc 00:00 Việt Nam; trạng thái lưu trong DB do job cập nhật có thể trễ và phải được đối soát lại.
- Ghi audit lý do, bản kế tiếp và thời điểm; đề xuất thêm metadata `archivedAt`, `archiveReason` (`MANUAL` / `SUPERSEDED`), `supersededById` hoặc dữ liệu tương đương để phân biệt lưu trữ thủ công với chuyển kỳ. Đây là metadata đề xuất, chưa có trong schema.
- Giữ nguyên ID giáo trình/bài/buổi, ngày kỳ cũ, lịch sử điểm danh, học bù, bài nộp và điểm. Không tự đổi `lessonId` của buổi cũ sang bài của B.
- Luồng sao chép kỳ tiếp theo phải còn dùng được sau tự archive. Đề xuất cho chủ sở hữu sao chép nguồn APPROVED hoặc ARCHIVED từng được duyệt, giữ điều kiện kỳ tương lai và kiểm tra quyền; bản nguồn vẫn bất biến. Cần sửa cả `reviseUnit` và điều kiện nút FE tương ứng.

Ví dụ: A có kỳ `01/10–31/10`, B có kỳ `01/11–30/11`; B duyệt ngày 20/10. Ngày 20/10 A vẫn APPROVED, B là bản đã duyệt chờ ngày áp dụng. Từ 00:00 ngày 01/11 giờ Việt Nam, B hiệu lực; job tự chuyển A sang ARCHIVED, kể cả khi phải chạy bù. Các buổi đã sinh theo A vẫn trỏ đến bài của A.

### 3.4. Các đường phải rà cùng BE-2

| Đường hiện có | Yêu cầu |
| --- | --- |
| `POST /academic/curriculum-units/:id/approve` | Enforce giao ngày ở server trong transaction, không dựa vào danh sách mà designer đọc được. |
| `POST /academic/classes/:id/session-preview`, `.../session-generations` | Dùng cùng quy tắc; khoảng sinh nằm trọn trong kỳ được chọn. Kiểm tra lại khi ghi, đồng bộ với archive; replay idempotency đã thành công không bị mất vì bản nguồn đã archive. |
| `POST /academic/sessions` legacy | Khi bài thuộc giáo trình, kiểm tra ngày buổi theo giờ Việt Nam nằm trong kỳ và bản đó được phép sử dụng. Không áp ràng buộc kỳ curriculum cho bài standalone không có `unitId`. |
| Đọc buổi/lịch sử/generation | Cho đọc dữ liệu cũ theo quyền hiện có sau archive; không coi archive là xóa lịch sử. |
| Parent `studentCurriculum()` (`curriculum-scheduling.service.ts:135`) | Hiện chỉ lấy APPROVED giao với kỳ enrollment. Tự archive có thể làm mất outline kỳ cũ. Giữ phần từng áp dụng trong thời gian học theo quyền, phân biệt bản tự archive và bản bị gỡ thủ công; không mở tất cả ARCHIVED cho phụ huynh. |
| Teacher list/detail (`:207`, `:2017` cùng service) | Detail đã cho ARCHIVED, list hiện chỉ lấy APPROVED; rà thống nhất truy cập giáo trình lịch sử của lớp được phép xem. |

BE-3 (endpoint giáo trình hiệu lực theo ngày kèm các lớp) là yêu cầu riêng. **Không cần thêm endpoint BE-3 để hoàn thành invariant BE-2**; FE vẫn có thể lọc từ API hiện có. Endpoint mới nếu làm sau cần hợp đồng/kiểm tra quyền riêng.

Trước rollout, xuất báo cáo các bản APPROVED hiện có giao ngày theo khóa. Phải xử lý các xung đột bằng quyết định nghiệp vụ/migration được duyệt trước khi bật và đánh dấu ràng buộc đã hoàn thành; chỉ xuất báo cáo là chưa đủ. Không tự chọn bản version lớn nhất, sửa ngày hoặc xóa lịch sử để dọn dữ liệu.

## 4. Mã lỗi đề xuất cho FE

Giữ envelope `{ success:false, error:{ code,message,requestId,details? } }` và các mã hiện có. Danh sách dưới là mã mới đề xuất:

| HTTP / code | Khi nào | `details` hữu ích |
| --- | --- | --- |
| 400 `VALIDATION_ERROR` | Số buổi không đúng kiểu/phạm vi. | Lỗi field `sessionsPerWeek`. |
| 409 `PROGRAM_FREQUENCY_NOT_CONFIGURED` | Mở/xác nhận/sinh lịch khi khóa chưa có chuẩn trong giai đoạn chuyển tiếp. | `programId`. |
| 409 `CLASS_WEEKLY_SESSION_COUNT_MISMATCH` | Bộ lịch có số slot khác chuẩn. | `programId`, `classId`, `expected`, `actual`. |
| 409 `PROGRAM_FREQUENCY_CHANGE_CONFLICT` | Đổi chuẩn khóa làm lệch lịch lớp đang hoạt động. | `programId`, `conflictingClasses` gồm ID, tên, số slot. |
| 409 `CURRICULUM_EFFECTIVE_PERIOD_CONFLICT` | Duyệt bản giao ngày với bản APPROVED khác cùng khóa. | `programId`, `conflicts` gồm ID, tiêu đề, `fromDate`, `toDate`. |

Không trả nội dung bài, dữ liệu học sinh hay thông tin vượt quyền qua chi tiết lỗi. Với lỗi curriculum trả cho designer ở bước kiểm tra sớm, không để lộ bản của người khác; chỉ trả metadata được phép hoặc thông báo tổng quát. Các mã `PREVIEW_STALE`, `UNIT_NOT_APPROVED`, `REVISION_CONFLICT`, lỗi khóa lịch và quyền hiện có tiếp tục được xử lý.

## 5. FE cần sửa gì sau BE?

**Có thay đổi FE bắt buộc để sử dụng đầy đủ BE-1/BE-2.** Không cần viết lại giao diện. BE-2 vẫn phải bảo đảm dữ liệu khi FE cũ gọi API trực tiếp; FE mới giúp người dùng nhập đúng, thấy đúng trạng thái và xử lý lỗi.

Các đường dẫn dưới đây tính từ repo `WDP301-FE-System`.

| Vị trí hiện tại | Công việc FE |
| --- | --- |
| `src/types/backend.ts:102` (`RegistrationProgram`) và `src/types/curriculum.ts` nếu projection có `program` | Thêm `sessionsPerWeek`; hỗ trợ `null`/vắng trường trong chuyển tiếp. Không tự coi thiếu là 0 hoặc 2. |
| `src/lib/validators/academic-catalog.ts:7` | Thêm field Zod theo phạm vi BE đã thống nhất, đồng bộ kiểu input tạo/sửa. |
| `src/features/registration-flow/components/programs-view.tsx:773` (`ProgramForm`) | Thêm ô số buổi/tuần vào tạo/sửa khóa; prefill khi sửa; đưa vào payload sau khi BE nhận trường. Hiện payload tạo/sửa chỉ có các field cũ nên cần sửa thật. Khi đổi bị conflict, hiện lớp liên quan và giữ giá trị đang nhập. |
| `src/features/registration-flow/components/class-editor.tsx:984` (`ClassSchedulesForm`) | Hiện chuẩn khóa và số slot đã nhập; chặn lưu bộ lịch thiếu/thừa. Thêm/xóa slot trong bản nháp cục bộ rồi gửi **PUT cả bộ** khi đủ; xử lý các nút lưu/xóa từng slot để không tạo trạng thái thiếu buổi. Giữ chế độ khóa lịch hiện có. |
| `src/features/curriculum/components/unit-form.tsx:94`, `:255`; `curriculum-review-forms.tsx:381` cùng thư mục | Thay ô tạm “Chờ dữ liệu khóa học” bằng chuẩn đọc từ khóa. Đây là thông tin chỉ đọc ở form giáo trình; chỉ Quản lý sửa chuẩn ở form khóa. Giữ thông báo rõ khi khóa chưa cấu hình. |
| `src/features/curriculum/workspace-selectors.ts:137` (`estimateLessons`), `src/features/curriculum/readiness.ts:44` | Dùng chuẩn khóa để ước tính khi chưa có lớp; **giữ `sessionsInRange` để đếm chính xác từng lớp khi có lịch**. Cùng 2 buổi/tuần vẫn có thể khác số buổi trong kỳ lẻ tuần. Không thay mọi phép tính bằng `ceil(số ngày/7) × sessionsPerWeek`. |
| `src/features/dashboard/components/live-designer-dashboard.tsx` | Thay phép ước tính hiện truyền `[]` bằng dữ liệu chuẩn của khóa cho thẻ lập kế hoạch. Phân biệt số bài dự kiến và số buổi thực theo lịch. |
| `src/features/curriculum/components/unit-form.tsx:131` | Giữ cảnh báo giao ngày tính cả hai đầu; đây chỉ là phản hồi sớm vì danh sách phụ thuộc quyền. Xử lý lỗi server khi approve/submit; refetch khi xung đột. |
| `src/features/curriculum/components/unit-detail-view.tsx:190`, `:848`; `curriculum-review-forms.tsx` | Nút chuẩn bị kỳ mới và chọn nguồn sao chép phải dùng được với bản ARCHIVED được BE cho phép. Hộp duyệt giải thích bản tương lai chỉ bắt đầu áp dụng vào ngày đã chọn; bản cũ chuyển lưu trữ khi sang kỳ. |
| `src/features/curriculum/generation-plan.ts:23`; `components/program-session-generator.tsx:211` | Đã tự chọn khi đúng một bản APPROVED phủ trọn khoảng. Giữ logic đó; nếu không có bản phủ trọn vì khoảng cắt hai kỳ thì yêu cầu chia khoảng. Nếu hơn một bản do dữ liệu cũ/lỗi thì chặn và tải lại/báo xử lý; không chọn tùy ý để bỏ qua xung đột. |
| `src/features/curriculum/components/units-view.tsx`, `workspace-selectors.ts`, hook query của curriculum/program/lớp | Cập nhật trạng thái sau duyệt/archive và sau quay lại tab; refetch khi qua ngày áp dụng hoặc focus. Nhãn hiện có là “Đã duyệt”; giữ ý nghĩa đó. Nếu bổ sung “Đang áp dụng”/“Chờ ngày áp dụng”/“Hết hiệu lực” thì suy ra từ cả ngày và trạng thái. Sau thay chuẩn khóa phải làm mới dữ liệu lớp/readiness/preview liên quan. |
| `src/lib/api/client.ts` và nơi hiển thị lỗi form | Thêm thông báo tiếng Việt cho mã mới, số slot cần/có, danh sách lớp xung đột; lỗi conflict không được làm mất form hoặc tự đăng xuất. |

**Những phần hiện đã hỗ trợ, không cần đổi chỉ vì thêm field:** `src/app/api/backend/[...path]/route.ts` chuyển body JSON; `src/lib/api/backend-permissions.ts` đã cho đúng role gọi chương trình và lịch tuần. Chưa cần sửa whitelist BFF hoặc thêm proxy route nếu giữ endpoint hiện tại. Không thêm quyền tạo giáo trình cho Quản lý, không mở quyền đọc lớp tổng quát cho designer để lấy số buổi.

**Đính chính ghi chú cũ về designer:** `GET /classes` vẫn không dành cho designer, nhưng BE hiện đã trả `classes[].weeklySchedules` và giáo viên qua `GET /programs/:id` (`registration-flow.service.ts:318`). `unit-form.tsx:94` và `readiness.ts` đã dùng dữ liệu này. BE-1 cung cấp **chuẩn chính thức trên khóa**, không phải lần đầu designer có cách đọc lịch lớp.

## 6. Nghiệm thu BE và FE

### BE-1

- [ ] Tạo/sửa/đọc khóa trả đúng chuẩn, gồm DTO legacy và các projection lồng. Role sai bị 403; giá trị sai kiểu/phạm vi bị 400; chính sách thiếu field trong chuyển tiếp được ghi rõ.
- [ ] Khóa 2 buổi: PUT/POST alias với 2 slot hợp lệ thành công; 1 hoặc 3 slot bị chặn và DB giữ lịch cũ. Hai slot cùng ngày khác giờ được tính là 2; trùng/chồng giờ vẫn lỗi.
- [ ] PATCH/DELETE slot, mở đăng ký, kích hoạt lại, xác nhận và generate không bỏ qua chuẩn. Lớp mới đóng đăng ký vẫn tạo được với lịch rỗng.
- [ ] Không phá khóa lịch do xác nhận/enrollment/placement/session; đổi chuẩn không âm thầm sửa lớp/buổi cũ.
- [ ] Hai request đổi chuẩn khóa và lưu/sinh lịch đồng thời không tạo dữ liệu lệch. Preview cũ bị yêu cầu xem lại khi chuẩn thay đổi; replay idempotency đã thành công giữ kết quả cũ.
- [ ] Migration có báo cáo mâu thuẫn, không áp default tùy ý và không đổi lịch sử; seed/fixture cập nhật.

### BE-2

- [ ] Duyệt hai bản **tạo độc lập** cùng khóa giao ngày: bản thứ hai lỗi 409, toàn bộ transaction rollback. Chạm cùng ngày đầu/cuối là conflict; ngày kế tiếp được phép; khác khóa nhưng chung môn/khối không conflict.
- [ ] Hai request approve đồng thời chỉ một thành công; nhiều nháp/chờ duyệt giao ngày vẫn được phép. Không phát audit/notification thành công cho request thất bại.
- [ ] Giữ ownership, giáo viên thẩm định và giới hạn revision tương lai đã có. Copy từ nguồn lưu trữ theo hợp đồng mới vẫn tạo bản nháp tương lai, không sửa nguồn.
- [ ] Duyệt B tương lai không archive A ngay; kiểm tra hiệu lực trước/sau 00:00 Việt Nam ngày B bắt đầu, không cần mở FE. Worker restart bỏ lỡ nhiều kỳ vẫn chạy bù; chạy lại không tạo audit trùng hoặc archive nhầm bản tương lai. B bị archive thủ công trước ngày bắt đầu không kích hoạt chuyển kỳ.
- [ ] Khoảng trống giữa kỳ không có bản hiệu lực. Không duyệt hồi tố trùng kỳ tự archive đã áp dụng; bản độc lập duyệt muộn được đối soát. Xung đột dữ liệu cũ được báo cáo và xử lý trước bật ràng buộc.
- [ ] Preview/generate và tạo buổi legacy đều chặn bài ngoài kỳ; buổi/lịch sử cũ vẫn đọc được. Parent outline và Teacher list/detail không mất nội dung lịch sử hợp lệ sau tự archive.

### FE

- [ ] Quản lý tạo/sửa chuẩn khóa; designer chỉ đọc. API BE cũ hoặc khóa chưa cấu hình hiển thị “Chưa cấu hình”, không gửi field mới trước rollout BE.
- [ ] Form lịch hiện “đã nhập / cần có”, lưu cả bộ, hiển thị lỗi server và giữ input. Lớp bị khóa vẫn đúng quyền/hành vi cũ.
- [ ] Các thẻ giáo trình/dashboard dùng chuẩn khóa; kỳ lẻ tuần vẫn lấy số buổi chính xác từ lịch/preview, không tăng sai số bài cần.
- [ ] Duyệt trùng kỳ trong hai tab thấy lỗi rõ và tải lại dữ liệu. Duyệt trước kỳ mới không làm FE coi bản hiện tại đã bị thay ngay.
- [ ] Màn đang mở qua ngày chuyển kỳ cập nhật bản áp dụng/lưu trữ sau refetch; vẫn đọc buổi/bài cũ và sao chép nguồn được phép.
- [ ] Sinh lịch tự chọn đúng một bản phủ trọn; khoảng cắt hai kỳ bị yêu cầu chia khoảng; giữ preview/idempotency và cơ chế retry hiện có.

Kiểm tra hiện tại chỉ đọc source; các ô trên **chưa được nghiệm thu cho tính năng mới**. Các test đang có tại `tests/unit/curriculum-review.spec.ts`, `tests/unit/catalog-curriculum.spec.ts`, `tests/e2e/registration-flow.e2e-spec.ts`, `tests/e2e/curriculum-scheduling.e2e-spec.ts` là nền để bổ sung. Test đồng thời sinh lịch hiện có không thay cho test hai request approve giao ngày.

## 7. Thứ tự bàn giao và triển khai

1. BE thêm schema/migration/báo cáo dữ liệu và hợp đồng nhận/trả số buổi; giữ chuyển tiếp cho client cũ. Chốt tên field, giới hạn và mã lỗi trong OpenAPI.
2. FE thêm form khóa và lưu lịch nguyên bộ; xác nhận đã chạy với BE nhận field mới trước khi bật bắt buộc chuẩn cho mọi thao tác.
3. BE hoàn thiện validator tất cả đường ghi, khóa đồng thời và xử lý giáo trình giao ngày/tự archive, kèm lịch sử và copy nguồn archive.
4. FE cập nhật lỗi, trạng thái theo ngày, cache và nguồn sao chép; hai bên chạy các ca ở mục 6 trên DB kiểm thử riêng.
5. Chỉ đánh dấu BE-1/BE-2 hoàn thành khi có commit BE, hợp đồng API, kết quả test và phần FE tương ứng. BE-3 và các mục còn lại trong đề xuất 18/10 tiếp tục theo backlog riêng.

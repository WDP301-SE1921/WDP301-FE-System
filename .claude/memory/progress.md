# Progress

- **2026-10-06** — Đối chiếu DTO chương trình/lớp/lịch tuần và curriculum scheduling; tạo `docs/CLASS_CURRICULUM_INPUT_TEMPLATE.md` để người dùng điền môn/nội dung theo khối 6–9, các lớp/giáo viên/học phí/lịch và học phần/bài/kiểm tra tháng. Mẫu dùng dữ liệu CHƯA ĐIỀN, chưa tạo dữ liệu nghiệp vụ. Prettier check MD đạt.

- **2026-10-06** — Nối bill thật theo `PAYMENT_BILL_API.md`: GET registrations/:id/bill qua BFF STAFF, schema giữ snapshot/Decimal; wizard và tra cứu có popup confirm-payment receiptNumber/Idempotency-Key, UNPAID/PAID/CANCELLED, in riêng bill/biên lai. Deploy migration snapshot có sẵn và restart BE, không sửa nghiệp vụ BE. 42 FE logic/BFF + 1 HTTP production + 33 BE MySQL đạt, FE/BE build đạt. Desktop thật lượt `muwp5543` đạt 3 sessions/1 payment/1 ACTIVE enrollment, giá bill giữ nguyên khi đổi học phí, replay/reload và PARENT bill/list/session reads; 12 ảnh ở `docs/BILL_PAYMENT_API_INTEGRATION.md`. API vẫn chưa lưu paymentMethod/receivedAt/bankTransactionReference/confirmedBy; UI metadata/thu chi ở preview riêng.

- **2026-10-06** — Theo yêu cầu chạy BE test: bổ sung root packages trong pnpm workspace, khai báo express trực tiếp, cài frozen lockfile và deploy migration giáo trình có sẵn; BE cổng 3000, DB ready. 33 e2e registration MySQL đạt. Desktop BE thật đạt tạo lịch → Gmail → con/khối → lớp/kỳ → thu học phí/receipt/reload; replay không tạo thêm dữ liệu. 10 ảnh và IDs tại `docs/DESKTOP_ENROLLMENT_TEST.md`. Bỏ khung stepper; sửa Proxy/restore giữ phiên khi 429, tắt sidebar prefetch. Bill/popup CASH/BANK_TRANSFER/thời gian/mã ngân hàng và thu chi riêng chuẩn bị ở FE, preview `/dev/billing`; chưa gắn API metadata mới. Contract BE ở `docs/BILL_PAYMENT_API_CONTRACT.md`, 5 ảnh desktop preview, 35 FE logic/BFF + 1 HTTP đạt, build đạt, lint 0 lỗi/4 warning cũ.

- **2026-10-06** — Wizard tra Gmail mở ngay danh sách con; lấy khối từ hồ sơ và bỏ chọn môn thủ công. Sửa nhãn ô chọn curriculum. Luồng desktop production với API fixture đạt từ tạo lịch tuần/giáo trình đến biên lai sau thu tiền và reload; 10 ảnh 1440×1000 ở `docs/screenshots/desktop-enrollment-2026-10-06`, báo cáo `docs/DESKTOP_ENROLLMENT_TEST.md`. Chưa test BE/DB thật; chờ bạn đồng ý áp dụng migration đã có và khôi phục dependency BE.

- **2026-10-06** — Nối API học phần/bài học/kiểm tra tháng, duyệt/revision, xem trước/sinh lịch; thêm danh sách lớp/buổi học cho STAFF và kiểm tra ghi danh theo kỳ. Chỉ sửa FE; migration BE còn thiếu và runtime thiếu express được ghi trong `docs/CURRICULUM_API_BE_NOTES.md`. Chi tiết và xác minh ở `docs/CURRICULUM_API_INTEGRATION.md`.

- **2026-09** — Repo scaffolded (`WDP301-FE-System`), Next.js App Router + TypeScript + Tailwind + Shadcn (Maia preset).
- **2026-09** — Role-based folder structure set up: `(public)/(auth)/(manager)/(teacher)/(parent)` route groups, `features/`, `lib/`, `hooks/`.
- **2026-09** — Design system defined (rounded corners everywhere, color tokens) — `.claude/rules/ui.md` / `docs/DESIGN.md`.
- **2026-09** — `.claude/` agentic setup added: agents (blueprint, frontend, reviewer), commands (feature, fix, forget, review, verify), rules, skills, project memory.
- **Next** — implement first feature end-to-end (e.g. student registration) via `/feature` to validate the whole pipeline.

- **2026-10-06** — Gỡ phần minh họa không thuộc luồng đăng ký thật ở web: trang `/dev/billing` và `BillCard`/`PaymentConfirmationDialog`/`CashFlowView`/`ExpenseDialog`, `features/enrollments` (wizard mock cũ), `PaymentsView`/`receipt-dialog` mock, `mocks/data/enrollments`, `validators/{billing,enrollment}`, 2 test billing. Giữ `features/payments/selectors` (dashboard còn dùng). Luồng thật không đổi. Bản sao lưu trước khi xóa ở scratchpad phiên làm việc.

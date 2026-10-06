# Bill, xác nhận thu học phí và thu chi

Ngày 06/10/2026. **Bill và xác nhận thu tiền theo contract BE hiện tại đã được nối** vào wizard nhân viên và `/staff/payments`. Phần metadata CASH/BANK_TRANSFER/thời gian thu/mã ngân hàng và thu chi bên dưới vẫn là đề xuất, chưa có API tương ứng và chưa sửa nghiệp vụ BE.

## API thực tế đã nối

Đối chiếu `WDP301-BE-System/PAYMENT_BILL_API.md` và source BE:

- `GET /registrations/:id/bill`: mã bill là registrationId; dùng đúng `parent.displayName`, `student.fullName`, `class.schedules`, `term`, `pricing.monthlyFee/total` là chuỗi Decimal. Giá lấy từ snapshot đã lập, không tính lại từ học phí lớp hiện tại. Trạng thái UNPAID/PAID/CANCELLED.
- `POST /registrations/:id/confirm-payment`: STAFF, Idempotency-Key, body **chỉ** `{receiptNumber?: string}`. Popup thật có kiểm tra đã nhận đủ tiền và số biên lai tùy chọn; nút **Đã thanh toán** xác nhận ghi danh/biên lai. Không gửi hoặc giả lưu metadata chưa có trong DTO.
- Bill đã thu trả `payment: {receiptNumber, paidAmount, confirmedAt}`. `confirmedAt` là giờ xác nhận từ BE. Bill đã hủy không cho thu; khi tên/môn/khối/lịch tuần lớp đổi, xử lý lỗi `BILL_CLASS_CHANGED` để hủy và lập lại.
- `GET /me/bills` dành phụ huynh mobile; FE web giữ quyền STAFF ở BFF, không mở parent web.

Chi tiết chuẩn bị runtime, phần BE còn thiếu và kiểm thử tại [BILL_PAYMENT_API_INTEGRATION.md](BILL_PAYMENT_API_INTEGRATION.md). Phần JSON bill ở mục đề xuất bên dưới mô tả giao diện tài chính tương lai, không phải payload đã triển khai.

## Đặc tả giao diện đề xuất (chưa có code)

Bản xem trước `/dev/billing` cùng các component minh họa (`BillCard`, `PaymentConfirmationDialog`, `CashFlowView`, `ExpenseDialog`) đã được gỡ khỏi FE web vì không thuộc luồng thật. Phần dưới giữ làm đặc tả để dựng lại khi BE hỗ trợ lưu phương thức/thời gian thu/mã ngân hàng.

- Bill hiển thị mã bill, phụ huynh, Gmail, học sinh và khối từ hồ sơ, lớp, kỳ học, gói học, số tiền phải thu và trạng thái **Chưa thanh toán**.
- Nút **Xác nhận thanh toán** mở popup. Nhân viên chọn **Tiền mặt** hoặc **Chuyển khoản**, nhập thời gian thu, nhập mã giao dịch ngân hàng nếu có khi chuyển khoản. QR nằm ngoài hệ thống; FE không hiển thị, tạo hoặc lưu QR.
- Nhân viên kiểm tra đủ tiền. Chuyển khoản phải đối chiếu giao dịch đã vào tài khoản, số tiền và nội dung là mã bill; tiền mặt phải nhận và đếm đủ. Sau khi đánh dấu đã kiểm tra, nút **Đã thanh toán** mới bật.
- Thời gian nhập/hiển thị theo Việt Nam (UTC+7), gửi API bằng ISO UTC. Người xác nhận và thời gian xác nhận do BE lấy từ phiên đăng nhập và đồng hồ máy chủ.
- `PaymentConfirmationDialog` nhận callback `onConfirm(operation)`. Giữ cả payload và khóa idempotency trong sessionStorage, phân theo nhân viên/bill, trước khi gửi. Khi timeout/5xx/401/429 hoặc xung đột idempotency, thử lại cùng khóa và payload; không tự chuyển sang Đã thanh toán khi API lỗi. Cần đọc lại trạng thái bill khi khôi phục phiên hoặc dữ liệu không đọc được.
- `BillCard` có phần biên lai/phương thức/thời gian/nhân viên/mã ngân hàng. `CashFlowView` lọc phương thức, nhân viên và ngày theo URL, tách khoản thu và khoản chi. `ExpenseDialog` nhận callback tạo khoản chi riêng.
- Không thêm dữ liệu mẫu vào menu nghiệp vụ; khi dựng lại phải đi qua API thật.

## API đề xuất để BE chốt

Tên endpoint là đề xuất, cần đối chiếu DTO BE khi API được cung cấp.

### Lập và đọc bill

Có thể mở rộng registration draft hiện có thành bill hoặc có tài nguyên bill riêng. API cần trả đầy đủ thông tin để FE không ghép từ dữ liệu có thể đã thay đổi:

```json
{
  "id": "bill-id",
  "code": "BILL-2026-0001",
  "status": "UNPAID",
  "parent": {
    "name": "Nguyễn Văn Minh",
    "email": "phuhuynh@gmail.com",
    "phone": "0901234567"
  },
  "student": { "name": "Nguyễn Minh An", "grade": 8 },
  "class": { "name": "Toán 8A", "subject": "Toán" },
  "term": {
    "startDate": "2027-01-04",
    "endDate": "2027-04-04",
    "packageMonths": 3
  },
  "amount": 2400000
}
```

`endDate` là cận cuối không bao gồm, tương thích kỳ học hiện có. Mã bill do BE tạo, dùng làm nội dung chuyển khoản, không dùng mã biên lai thay thế. Số tiền lấy từ bill do BE tính; nhân viên không nhập lại số tiền ở popup xác nhận.

### Xác nhận thanh toán

Đề xuất `POST /bills/:id/confirm-payment` hoặc mở rộng `POST /registrations/:id/confirm-payment`. Quyền STAFF, header `Idempotency-Key`, body:

```json
{
  "paymentMethod": "BANK_TRANSFER",
  "receivedAt": "2026-10-06T03:15:00.000Z",
  "bankTransactionReference": "FT26279ABC123"
}
```

- `paymentMethod`: `CASH` hoặc `BANK_TRANSFER`, bắt buộc. Tiền mặt không gửi mã ngân hàng; chuyển khoản có thể bỏ trống nếu không có mã.
- `receivedAt`: thời gian đã nhận tiền. BE cần kiểm tra hợp lệ và quy tắc sửa/lùi ngày thu; không tin giờ trình duyệt làm thời gian xác nhận.
- Không nhận `confirmedBy`, `confirmedAt` hoặc `amount` từ client. BE xác định nhân viên, giờ xác nhận và đúng số tiền bill.
- Trong **một transaction**: kiểm tra bill chưa thanh toán, kiểm tra điều kiện ghi danh/sĩ số/trùng lịch, ghi khoản thu và metadata, chuyển bill sang `PAID`, kích hoạt Enrollment và tạo số biên lai duy nhất. Không cho phép bill PAID nhưng thiếu ghi danh/biên lai.
- Retry cùng khóa/body trả cùng kết quả; không tạo khoản thu, ghi danh hoặc biên lai thứ hai. Khác body với cùng khóa trả lỗi xung đột. Bill đã thanh toán phải trả trạng thái hiện có hoặc lỗi rõ ràng kèm hướng đọc lại.
- Trả bill PAID và `payment`: `id`, `receiptNumber`, `amount`, `paymentMethod`, `receivedAt`, `confirmedAt`, `confirmedBy: {id,name}`, `bankTransactionReference?`. API GET bill/biên lai phải trả lại metadata sau reload.
- Không gửi Gmail thật trong bài test; việc gửi biên lai/email là phần BE chốt riêng.

**API hiện tại chỉ nhận `receiptNumber`, chưa có paymentMethod/receivedAt/bankTransactionReference trong DTO hoặc Payment model. Không gửi các trường mới qua API cũ rồi giả định đã lưu.** Bill thật đã được nối bằng RegistrationBillPanel và OfflinePaymentDialog; popup có metadata mới chưa được dựng, sẽ làm khi BE hỗ trợ lưu các trường này.

### Đối soát khoản thu

Đề xuất `GET /finance/income?paymentMethod=&staffId=&fromDate=&toDate=&page=&limit=` cho MANAGER. Chỉ đọc khoản thu đã xác nhận, với bill/biên lai, học sinh, số tiền, phương thức, thời gian thu và xác nhận, nhân viên, mã ngân hàng.

- Ngày lọc theo Việt Nam, cận ngày cuối inclusive ở UI; BE chuyển sang khoảng UTC tương ứng. Phải thống nhất lọc theo `receivedAt`, không thay bằng ngày lập bill.
- Trả `items`, pagination và tổng tiền/số lượng theo toàn bộ bộ lọc; không cộng trang đầu làm tổng toàn trung tâm. Khi dựng bảng thu chi, dùng summary do BE trả thay vì tự cộng trên dữ liệu của trang hiện tại.
- Khoản thu cũ chưa có phương thức cần trạng thái chưa xác định; không tự suy ra là tiền mặt/chuyển khoản. BE chốt migration và cách hiển thị dữ liệu cũ trước khi nối.

### Khoản chi riêng

Đề xuất `GET /finance/expenses` và `POST /finance/expenses` cho MANAGER, không ghi chi dưới dạng Payment học phí âm. POST có Idempotency-Key, body `title`, `category`, `amount` (số nguyên VND > 0), `paymentMethod`, `spentAt` (ISO UTC), `reference?`. BE ghi người tạo/thời gian tạo từ phiên/máy chủ và mã khoản chi.

Khi nối API, giữ khóa/body cho khoản chi qua reload và đọc lại trạng thái trước retry. Chốt quyền, chứng từ, chỉnh sửa/hủy khoản chi và audit riêng, không xóa lịch sử thu.

## Điểm cần nối sau khi BE có API

1. Tạo adapter/mapper trong `src/features/billing/`; parse request/response theo DTO đã chốt.
2. Thêm allowlist và kiểm tra role trong BFF, dùng cookie HttpOnly hiện có; không đưa token vào component.
3. Gắn bill thật vào wizard/tra cứu bill của nhân viên, thay callback minh họa bằng mutation với đúng Idempotency-Key. Chỉ cập nhật trạng thái thành công từ response BE và invalidation dữ liệu bill/receipt/enrollment.
4. Gắn bảng thu chi vào màn quản lý, dùng API filters/pagination/summary; thay toàn bộ dữ liệu mẫu.
5. Test DB thật cả tiền mặt/chuyển khoản, reload metadata, nhấn đúp/retry, thiếu tiền/đối chiếu, quyền truy cập, transaction rollback và đối soát ngày Việt Nam.

Không cần endpoint, ảnh QR hoặc cấu hình ngân hàng trong FE cho luồng đã chốt.

## Kiểm tra FE

Bản xem trước `/dev/billing`, bài `tests/billing-desktop.test.cjs`, `tests/billing-flow.test.cjs` và bộ ảnh `screenshots/desktop-bill-preview-2026-10-06/` thuộc phần minh họa đã gỡ, không còn là bằng chứng cho luồng thật. Kết quả kiểm thử luồng thật (bill, xác nhận thanh toán, biên lai) nằm ở [BILL_PAYMENT_API_INTEGRATION.md](BILL_PAYMENT_API_INTEGRATION.md).

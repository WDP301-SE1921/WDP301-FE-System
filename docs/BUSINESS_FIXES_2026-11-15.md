# Thay đổi nghiệp vụ 15/11/2026 — đã thêm gì, test thế nào

Đã lên `dev` ở cả hai repo ngày 15/11 (BE `608a2ef..c771261`, FE `54ddfed..ad3d400`). Các commit:
- **BE** `WDP301-BE-System`: `371f379` (migration), `a333b9a` (tiền), `febceab` (gia hạn, điểm danh), `c771261` (thêm ghi danh vào `GET payments`).
- **FE** `WDP301-FE-System`: `3e1df52` (tiền), `ad3d400` (gia hạn, điểm danh).

Migration mới: `prisma/migrations/20261115100000_tet_refund_extension_method`. Chỉ thêm cột cho phép null và bảng mới, không đụng dữ liệu cũ. Chạy `npx prisma migrate deploy`.

Mọi API cũ giữ nguyên request và response; chỉ có thêm field mới. App Mobile không bị sửa (việc Mobile cần làm ở mục 7).

---

## 1. Giảm 50% tháng có Tết âm lịch (tự tính)

**Quy tắc:** gói học chia thành từng tháng tính từ ngày bắt đầu. Tháng nào chứa **mùng 1 Tết** thì giảm 50% học phí của tháng đó (làm tròn xuống đồng). Chỉ áp dụng cho phiếu lập sau khi deploy; phiếu cũ giữ nguyên.

| Phần | Đã thêm |
|---|---|
| BE | `src/modules/registration-flow/tuition-pricing.ts`: bảng `LUNAR_NEW_YEAR` (2025–2035), `priceTuition`. Phiếu lưu thêm `listAmount`, `tetDiscountAmount`, `tetPeriodStart`, `tetPeriodEnd`. Bill và biên lai trả thêm `pricing.listTotal`, `pricing.tetDiscount` (hoặc `listTotal`, `tetDiscount` ở cấp ngoài cùng của biên lai). `pricing.total` vẫn là số phải thu |
| FE | Bước "Lớp & kỳ học" hiện "Đã giảm X (50% tháng có Tết …)". Phiếu và biên lai có thêm dòng "Học phí theo số tháng" và "Giảm 50% tháng có Tết". Bảng ngày Tết ở FE (`features/registration-flow/tet.ts`) chỉ dùng để xem trước và phải giống bảng của BE |

**Test:** đăng ký một lớp, chọn ngày bắt đầu khoảng 15/01/2027, gói 3 tháng. Tháng 15/01–14/02 chứa 06/02/2027 nên giảm nửa tháng. Ví dụ đã chạy trên máy: học phí 750.000đ × 3 = 2.250.000đ, giảm 375.000đ, phải thu 1.875.000đ.

**Lưu ý:** trước năm 2035 phải thêm ngày Tết các năm sau vào **cả hai** bảng (BE và FE).

## 2. Tiền mặt / chuyển khoản và đối soát cuối ca

| Phần | Đã thêm |
|---|---|
| BE | Cột `payments.method` (`CASH` / `BANK_TRANSFER`, null với phiếu cũ). `confirm-payment` nhận thêm `method` (không bắt buộc). `GET payments` lọc được `method` và `confirmedBy=me`. API mới `GET payments/shift-summary?date=&staffId=` trả tiền thu và hoàn theo hình thức, kèm `cashInDrawer` |
| FE | Hộp "Xác nhận thanh toán" bắt buộc chọn Tiền mặt hoặc Chuyển khoản. Màn "Đăng ký & biên lai" của Nhân viên có thẻ **Ca hôm nay của tôi** (tiền mặt, chuyển khoản, tiền phải có trong két), cột **Hình thức**, bộ lọc hình thức, nút "Do tôi thu". Biên lai hiện hình thức |

**Test:** xác nhận một phiếu bằng chuyển khoản, rồi xem thẻ "Ca hôm nay của tôi": số chuyển khoản tăng, phiếu cũ hiện "Chưa ghi".

## 3. Hoàn tiền khi nghỉ (Quản lý duyệt)

**Quy tắc:** hoàn các tháng **chưa bắt đầu**; tháng đang học không hoàn; tháng Tết tính nửa giá. Hệ thống tính số đề xuất, Nhân viên ghi số tiền thật đã trả và hình thức, Quản lý duyệt. Chỉ khoản đã duyệt mới trừ vào doanh thu. Hoàn tiền không tự kết thúc ghi danh.

| Phần | Đã thêm |
|---|---|
| BE | Bảng `payment_refunds`. Các API: `GET enrollments/:id/refund-quote` (đề xuất), `POST payments/:id/refunds` (Nhân viên), `GET refunds?status=` và `POST refunds/:id/decision` (Quản lý). Duyệt thì gửi email cho phụ huynh. `GET payments` thêm `refundedAmount`, `netAmount` cho từng phiếu và cho tổng |
| FE | Nút **Hoàn tiền** trên từng phiếu thu. Sau khi "Nghỉ môn / nghỉ hẳn" có nút "Ghi nhận hoàn tiền". Hộp hoàn tiền chia 2 phần: các tháng kèm đề xuất bên trái, form bên phải. **Màn mới cho Quản lý** `/manager/payments` "Thu tiền & hoàn tiền" (menu Học phí) gồm 3 tab Chờ duyệt / Đã xử lý / Phiếu thu, có badge số chờ duyệt. Dashboard Quản lý đổi thẻ doanh thu thành **Thực thu** và thêm việc "khoản hoàn chờ duyệt" |

**Test:** Nhân viên bấm "Hoàn tiền" trên một phiếu, gửi duyệt. Quản lý vào "Thu tiền & hoàn tiền", bấm Duyệt. Biên lai hiện "Đã hoàn …" và thực thu giảm.

## 4. Gia hạn bù (bảo lưu, buổi trung tâm hủy, gia hạn tay)

**Quy tắc:** kéo dài hạn học miễn phí; phiếu thu không đổi. Vẫn cho gia hạn khi lớp đã đủ chỗ.

| Cách | BE | FE |
|---|---|---|
| Gia hạn tay | `POST academic/enrollments/:id/extensions` `{ days: 1–90, reason }`, `GET …/extensions` | Panel "Xử lý" của học sinh có tab mới **Gia hạn bù**: số ngày, lý do, xem trước hạn cũ → hạn mới, lịch sử gia hạn |
| Bảo lưu khi nghỉ dài hạn | Nghỉ dài hạn từ **14 ngày** kèm `extendTerm: true`: cộng đúng số ngày nghỉ. "Kết thúc nghỉ sớm" giảm phần cộng (dưới 14 ngày thì bỏ hẳn). Hủy đơn nghỉ thì bỏ phần cộng | Ô "Bảo lưu" trong form Nghỉ dài hạn và lúc duyệt đơn nghỉ của phụ huynh; phần xem trước hiện hạn mới |
| Trung tâm hủy buổi | `sessions/:id/cancel` và `bulk-cancel` nhận `extendTerm: true`: mỗi học sinh của buổi được kéo hạn tới buổi học kế tiếp (trừ em đang nghỉ dài hạn) | Ô "Gia hạn bù 1 buổi cho học sinh của buổi này" trong hộp hủy **một** buổi, mặc định bật. Hủy nhiều buổi (ngày nghỉ lễ, Tết) không có ô này, vì nghỉ lễ đã tính trong học phí |

Thông báo mới: `ENROLLMENT_EXTENDED`.

## 5. Sửa điểm danh trong ngày

**Quy tắc:** buổi đã chốt điểm danh được sửa đến **24:00 cùng ngày học** (giờ Việt Nam), sau đó khóa. Áp dụng cho cả Giáo viên (lớp của mình) và Quản lý. Chỉ đổi qua lại Có mặt ↔ Vắng. Dòng "Có phép" (từ đơn nghỉ) và dòng đã xếp học bù giữ ràng buộc như cũ.

| Phần | Đã thêm |
|---|---|
| BE | `PATCH academic/sessions/:id/participants/:participantId/attendance` `{ status, reason }`. Có ghi lịch sử, gửi email phụ huynh, đồng bộ trạng thái học bù. Thông báo mới `ATTENDANCE_CORRECTED` |
| FE | Màn điểm danh của Giáo viên, khi buổi đã chốt và còn trong ngày: nút **Sửa điểm danh**, chọn lại từng em, lý do (select + "Khác…"), "Lưu sửa đổi (n)" |

## 6. Những chỗ cố định trong code (đổi chính sách thì sửa ở đây)

| Giá trị | Chỗ |
|---|---|
| Giảm 50% tháng Tết | BE `TET_DISCOUNT_PERCENT` (`tuition-pricing.ts`) |
| Bảo lưu từ 14 ngày | BE `MIN_PAUSE_DAYS_FOR_EXTENSION` (`academic/enrollment-extension.ts`), FE cùng tên trong `live-staff-workflows.tsx` |
| Gia hạn tối đa 90 ngày/lần | BE `MAX_EXTENSION_DAYS`, DTO `ExtendEnrollmentDto` |
| Khóa sửa điểm danh lúc 24:00 ngày học | BE `correctionDeadline` (`enrollment-workflows.service.ts`), FE cùng tên (`live-attendance-view.tsx`) |

## 7. Việc cho team Mobile (app phụ huynh)

Các field mới đều không bắt buộc, nên app hiện tại vẫn chạy bình thường.

1. **Hóa đơn / biên lai:** nếu `pricing.tetDiscount` khác null thì hiện thêm dòng "Học phí theo số tháng" (`pricing.listTotal`) và "Giảm 50% tháng có Tết (từ – đến)". `pricing.total` vẫn là số phải thu.
2. **Hoàn tiền:** `payment.refunds[]` trong bill / biên lai. Khoản `APPROVED` thì hiện "Đã hoàn X (Tiền mặt / Chuyển khoản)"; khoản `PENDING` không hiện cho phụ huynh.
3. **Hình thức thanh toán:** `payment.method` (`CASH` / `BANK_TRANSFER` / null).
4. **Hạn học** tự đổi theo `endDate` của ghi danh. Nếu có màn chi tiết môn thì có thể hiện lịch sử từ `GET academic/enrollments/:id/extensions`.
5. **Thông báo:** thêm nhãn cho `ENROLLMENT_EXTENDED` ("Gia hạn học") và `ATTENDANCE_CORRECTED` ("Sửa điểm danh") trong `NotificationType`.

## 8. Đã kiểm tra

- **BE:**
  - Test mới: `tuition-pricing.spec.ts`, `payment-refunds.spec.ts`, `enrollment-extension.spec.ts` (34 test) đều qua.
  - Toàn bộ `tests/unit` có 1 lỗi có từ trước, không liên quan: `avatar-upload-boundary.spec.ts` trả 413. Lỗi này vẫn còn khi bỏ thay đổi hôm nay.
  - `tsc` và `eslint` sạch.
- **FE:** `tsc`, `eslint src` (0 lỗi, 0 cảnh báo) và `next build --webpack` đều qua.
- **Chạy thật** (BE cổng 3002, FE 3001, DB Docker local):
  - Đã thử: hoàn tiền đủ luồng Nhân viên → Quản lý duyệt; giá Tết trên phiếu và biên lai; xác nhận bằng chuyển khoản và thẻ đối soát ca; tab Gia hạn bù; ô bảo lưu; ô gia hạn trong hộp hủy buổi.
  - Chưa bấm hủy buổi thật và chưa thử sửa điểm danh trên giao diện, vì DB không có buổi nào đã chốt trong hôm nay. Hai phần này mới chỉ được kiểm bằng unit test BE.
- **Dữ liệu test để lại trong DB local:**
  - Phiếu `DEMO-KHANH-UPCOMING` có một khoản hoàn 2.400.000đ đã duyệt.
  - Học sinh Lê Bảo Chi có thêm đăng ký Hóa học 8A (18/01/2027, đã thu bằng chuyển khoản) và 7 ngày gia hạn.

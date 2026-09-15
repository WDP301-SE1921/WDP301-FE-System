---
name: edugrade-constants
description: Quy ước tổ chức và sử dụng thư mục src/constants trong dự án EduGrade (Next.js web cho role Quản lý và Giáo viên). Dùng skill này mỗi khi tạo/sửa constants, thêm message thông báo (toast, alert, lỗi, validation, confirm, empty state), thêm route, endpoint API, query key, permission, status + badge, business rule, hoặc khi thấy chuỗi text/số "magic" viết cứng trong component. Luôn dùng khi người dùng nhắc tới constants, messages, thông báo lỗi, label trạng thái, hằng số, hoặc khi viết feature mới cần hiển thị text cho người dùng.
---

# EduGrade — Constants

Mọi text hiển thị, route, key, trạng thái và giới hạn nghiệp vụ phải lấy từ `src/constants`. Không viết cứng chuỗi hoặc số trong component, hook, service.

## 1. Cấu trúc thư mục

```
src/constants/
├── index.ts                  # re-export tất cả
├── app.ts                    # tên app, locale, currency, timezone
├── routes.ts                 # ROUTES.MANAGER.*, ROUTES.TEACHER.*
├── api-endpoints.ts          # API_ENDPOINTS.*
├── query-keys.ts             # QUERY_KEYS.*
├── menu.ts                   # sidebar theo role
├── status.ts                 # enum trạng thái + label + variant badge
├── business-rules.ts         # BUSINESS_RULES, WEEKDAYS
├── validation.ts             # REGEX, FIELD_LIMITS
├── format.ts                 # DATE_FORMAT
├── pagination.ts             # PAGINATION
├── ui.ts                     # TOAST_DURATION, ANIMATION, DEBOUNCE
├── storage-keys.ts           # STORAGE_KEYS
└── messages/
    ├── index.ts
    ├── common.ts             # COMMON_MSG, ACTION_LABEL
    ├── error.ts              # ERROR_MSG, API_ERROR_CODE_MSG
    ├── validation.ts         # VALIDATION_MSG
    ├── confirm.ts            # CONFIRM_MSG
    ├── empty.ts              # EMPTY_MSG
    └── events/
        ├── enrollment.ts     # ENROLLMENT_MSG
        ├── payment.ts        # PAYMENT_MSG
        ├── class.ts          # CLASS_MSG
        ├── attendance.ts     # ATTENDANCE_MSG
        ├── absence.ts        # ABSENCE_MSG (nghỉ, học bù, đổi buổi, đổi lịch)
        ├── teacher.ts        # TEACHER_MSG
        ├── grading.ts        # GRADING_MSG (AI chấm bài)
        ├── report.ts         # REPORT_MSG
        ├── email.ts          # EMAIL_MSG
        └── auth.ts           # AUTH_MSG
```

## 2. Quyết định đặt ở đâu

| Cần thêm | File |
|---|---|
| Text nút bấm dùng chung (Lưu, Hủy, In...) | messages/common.ts → ACTION_LABEL |
| Toast thành công của 1 nghiệp vụ | messages/events/<domain>.ts |
| Lỗi chung HTTP / mạng | messages/error.ts → ERROR_MSG |
| Lỗi theo error code backend | messages/error.ts → API_ERROR_CODE_MSG |
| Lỗi field form | messages/validation.ts |
| Nội dung confirm dialog | messages/confirm.ts |
| Empty state | messages/empty.ts |
| Label + màu trạng thái | status.ts |
| Giới hạn nghiệp vụ (1–12 tháng, 7 ngày) | business-rules.ts |
| Regex, độ dài field | validation.ts |
| Đường dẫn trang | routes.ts |
| URL API | api-endpoints.ts |

Nếu domain mới chưa có file trong `events/`, tạo file mới và export trong `messages/index.ts`. Không nhét message của domain A vào file domain B.

## 3. Quy tắc viết

**Đặt tên**
- Object export: `UPPER_SNAKE_CASE` + hậu tố theo loại: `_MSG`, `_STATUS`, `ROUTES`, `QUERY_KEYS`.
- Key bên trong: `UPPER_SNAKE_CASE`, mô tả sự kiện: `CREATE_SUCCESS`, `CONFIRM_SUCCESS_EMAIL_FAILED`.
- Key status: dùng đúng giá trị backend (`present`, `made_up`, `pending_link`).

**Luôn `as const`** cho object tĩnh để có literal type.

**Message có tham số** dùng function, không nối chuỗi trong component:
```ts
CREATE_SUCCESS: (count: number) => `Tạo lớp thành công, đã sinh ${count} buổi học`,
```

**Route động** dùng function:
```ts
STUDENT_DETAIL: (id: string) => `/manager/students/${id}`,
```

**Message validation dùng lại giá trị** từ `business-rules.ts` / `validation.ts`, không viết lại số:
```ts
MONTHS_RANGE: `Số tháng từ ${BUSINESS_RULES.ENROLLMENT_MONTHS_MIN} đến ${BUSINESS_RULES.ENROLLMENT_MONTHS_MAX}`,
```

**Status** luôn gồm `label` + `variant`, dùng helper `define` để giữ type:
```ts
export type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";
const define = <T extends string>(map: Record<T, { label: string; variant: BadgeVariant }>) => map;

export const ATTENDANCE_STATUS = define({
  present: { label: "Có mặt", variant: "success" },
  absent: { label: "Vắng", variant: "danger" },
  made_up: { label: "Đã học bù", variant: "info" },
  excused: { label: "Nghỉ có phép", variant: "neutral" },
});
```

**Văn phong message**
- Tiếng Việt có dấu, câu ngắn, không dấu chấm cuối với toast/label.
- Thành công: "<Hành động> thành công".
- Lỗi: nói rõ nguyên nhân + cách xử lý nếu có ("Email phụ huynh đã tồn tại. Chuyển sang \"Thêm con cho phụ huynh đã có\"").
- Confirm thao tác không hoàn tác phải nêu hậu quả trong DESC.
- Kết quả AI luôn nhắc là "đề xuất", không dùng từ gợi ý đã chính thức.

## 4. Không đặt trong constants

- Dữ liệu từ DB: học phí chương trình, danh sách môn/khối/phòng/bài học thật → lấy qua API.
- Secret, API key, base URL theo môi trường → `.env` + `process.env`.
- Logic, hàm xử lý phức tạp → `lib/` hoặc `utils/`.
- Type/interface domain → `types/`.

`BUSINESS_RULES` chỉ để validate và hiển thị ở FE. Backend vẫn là nơi kiểm tra chính.

## 5. Cách dùng trong code

Import từ barrel:
```ts
import { PAYMENT_MSG, ERROR_MSG, ROUTES, ATTENDANCE_STATUS } from "@/constants";
```

Toast:
```ts
toast.success(PAYMENT_MSG.CONFIRM_SUCCESS);
```

Badge:
```tsx
const s = ATTENDANCE_STATUS[record.status];
<Badge variant={s.variant}>{s.label}</Badge>
```

Map lỗi API:
```ts
const msg = API_ERROR_CODE_MSG[err.code] ?? ERROR_MSG.DEFAULT;
```

Trường hợp thành công một phần (Payment tạo xong nhưng email lỗi) dùng toast warning + nút gửi lại:
```ts
toast.warning(PAYMENT_MSG.CONFIRM_SUCCESS_EMAIL_FAILED, {
  action: { label: ACTION_LABEL.RESEND, onClick: resendEmail },
});
```

## 6. Checklist khi thêm constant

1. Kiểm tra đã có key tương tự chưa, tránh trùng.
2. Đặt đúng file theo bảng mục 2.
3. Có `as const` hoặc dùng `define`.
4. Message có biến → function.
5. Số giới hạn → tham chiếu `BUSINESS_RULES` / `FIELD_LIMITS`.
6. File mới → export ở `index.ts` tương ứng.
7. Tìm và thay chuỗi viết cứng cũ trong component nếu có.

## 7. Anti-pattern

```tsx
// Sai
toast.success("Điểm danh thành công");
if (months > 12) setError("Tối đa 12 tháng");
router.push(`/manager/classes/${id}`);
<Badge color="red">Vắng</Badge>

// Đúng
toast.success(ATTENDANCE_MSG.SAVE_SUCCESS);
if (months > BUSINESS_RULES.ENROLLMENT_MONTHS_MAX) setError(VALIDATION_MSG.MONTHS_RANGE);
router.push(ROUTES.MANAGER.CLASS_DETAIL(id));
<Badge variant={ATTENDANCE_STATUS.absent.variant}>{ATTENDANCE_STATUS.absent.label}</Badge>
```
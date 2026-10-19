const FIELD_TEXT: Record<string, string> = {
  source: "Nguồn dữ liệu",
  version: "Phiên bản",
  referenceDate: "Ngày tham chiếu",
  teacherId: "Mã giáo viên",
  reviewerTeacherId: "Mã giáo viên duyệt chuyên môn",
  effectiveAt: "Thời điểm có hiệu lực",
  affectedSessions: "Số buổi học bị ảnh hưởng",
  confirmed: "Đã xác nhận lịch",
  approved: "Đã duyệt chuyên môn",
  reason: "Lý do",
  note: "Ghi chú",
  paymentId: "Mã thanh toán",
  enrollmentId: "Mã ghi danh",
  enrollmentIds: "Các mã ghi danh",
  name: "Tên",
  displayName: "Họ và tên",
  fullName: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại",
  address: "Địa chỉ",
  subject: "Môn học",
  grade: "Khối",
  role: "Vai trò",
  status: "Trạng thái",
  classId: "Mã lớp",
  unitId: "Mã giáo trình",
  sessionId: "Mã buổi học",
  count: "Số buổi học",
  startsAt: "Bắt đầu",
  endsAt: "Kết thúc",
  fromDate: "Từ ngày",
  toDate: "Đến ngày",
  pendingLeavesCancelled: "Số đơn nghỉ chờ duyệt đã hủy",
  makeupsCancelled: "Số buổi học bù đã hủy",
  futureSessionsCancelled: "Số buổi học sắp tới đã hủy",
};

/** Trường mã tài khoản: có tên trong danh sách đã tải thì hiện tên, kèm nhãn không còn chữ "Mã". */
const PERSON_FIELD_TEXT: Record<string, string> = {
  teacherId: "Giáo viên",
  reviewerTeacherId: "Giáo viên duyệt chuyên môn",
  substituteTeacherId: "Giáo viên dạy thay",
  previousTeacherId: "Giáo viên trước",
  actorUserId: "Người thực hiện",
};

const VALUE_TEXT: Record<string, string> = {
  CLASS_CURRICULUM_INPUT_TEMPLATE: "Mẫu dữ liệu lớp học và giáo trình",
  MANAGER: "Quản lý trung tâm",
  STAFF: "Nhân viên",
  TEACHER: "Giáo viên",
  PARENT: "Phụ huynh",
  CURRICULUM_DESIGNER: "Thiết kế giáo trình",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  DISABLED: "Đã khóa",
  INVITED: "Đã gửi lời mời",
  ACCEPTED: "Đã chấp nhận",
  PENDING: "Chờ duyệt",
  PENDING_REVIEW: "Chờ duyệt giáo trình",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  REVOKED: "Đã thu hồi",
  ENDED: "Đã kết thúc",
  DRAFT: "Bản nháp",
  ARCHIVED: "Đã lưu trữ",
  PUBLISHED: "Đã công bố",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
  SCHEDULED: "Đã lên lịch",
};

const SNAPSHOT_LIMIT_MESSAGE =
  "Chi tiết thay đổi quá lớn để hiển thị. Liên hệ quản trị để tra cứu.";
const MAX_SNAPSHOT_LENGTH = 100_000;
const MAX_SNAPSHOT_DEPTH = 12;
const MAX_SNAPSHOT_NODES = 1_000;

/** Older audit records may contain an encoded object instead of a JSON object. */
function readSnapshot(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (
    !(
      (text.startsWith("{") && text.endsWith("}")) ||
      (text.startsWith("[") && text.endsWith("]"))
    )
  )
    return value;
  if (text.length > MAX_SNAPSHOT_LENGTH) return SNAPSHOT_LIMIT_MESSAGE;
  try {
    const parsed: unknown = JSON.parse(text);
    const pending = [{ value: parsed, depth: 0 }];
    let nodes = 0;
    while (pending.length) {
      const current = pending.pop()!;
      if (++nodes > MAX_SNAPSHOT_NODES || current.depth > MAX_SNAPSHOT_DEPTH)
        return SNAPSHOT_LIMIT_MESSAGE;
      if (current.value !== null && typeof current.value === "object")
        for (const child of Object.values(current.value))
          pending.push({ value: child, depth: current.depth + 1 });
    }
    return parsed;
  } catch {
    return value;
  }
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "Chưa có thông tin";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number")
    return new Intl.NumberFormat("vi-VN").format(value);
  if (typeof value !== "string") return "Chưa có thông tin";
  if (Object.hasOwn(VALUE_TEXT, value)) return VALUE_TEXT[value];

  // Date-only values and timestamps always use the center's UTC+7 timezone.
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        ...(value.includes("T") ? { timeStyle: "short" as const } : {}),
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
    }
  }
  return value;
}

/** Render structured audit snapshots as readable fields, including nested data. */
function AuditValue({
  value,
  names,
}: {
  value: unknown;
  names?: Record<string, string>;
}) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p>Không có mục nào</p>;
    return (
      <ol className="list-inside list-decimal space-y-2">
        {value.map((item, index) => (
          <li key={index}>
            <AuditValue value={item} names={names} />
          </li>
        ))}
      </ol>
    );
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return <p>Không có thông tin chi tiết</p>;
    return (
      <dl className="space-y-2">
        {entries.map(([field, item]) => {
          const person =
            typeof item === "string" && Object.hasOwn(PERSON_FIELD_TEXT, field)
              ? (names?.[item] ?? null)
              : null;
          return (
            <div key={field} className="grid gap-1 sm:grid-cols-2">
              <dt className="text-muted-foreground">
                {person
                  ? PERSON_FIELD_TEXT[field]
                  : Object.hasOwn(FIELD_TEXT, field)
                    ? FIELD_TEXT[field]
                    : field
                        .replace(/([a-z])([A-Z])/g, "$1 $2")
                        .replace(/_/g, " ")}
              </dt>
              <dd className="min-w-0 wrap-anywhere whitespace-pre-wrap">
                {person ?? <AuditValue value={item} names={names} />}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }
  return <span>{displayValue(value)}</span>;
}

export function AuditChangeDetails({
  before,
  after,
  names,
}: {
  before: unknown;
  after: unknown;
  /** Mã tài khoản → tên, để hiện tên thay vì mã giáo viên. */
  names?: Record<string, string>;
}) {
  if (before == null && after == null) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        { label: "Trước", value: before },
        { label: "Sau", value: after },
      ].map(({ label, value }) => (
        <div key={label} className="min-w-0 space-y-2">
          <p className="font-medium">{label}</p>
          <AuditValue value={readSnapshot(value)} names={names} />
        </div>
      ))}
    </div>
  );
}

const FIELD_TEXT: Record<string, string> = {
  source: "Nguồn dữ liệu",
  version: "Phiên bản",
  referenceDate: "Ngày tham chiếu",
  teacherId: "Mã giáo viên",
  reviewerTeacherId: "Mã giáo viên duyệt chuyên môn",
  effectiveAt: "Thời điểm có hiệu lực",
  affectedSessions: "Số buổi học bị ảnh hưởng",
  confirmed: "Đã xác nhận lịch",
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
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  REVOKED: "Đã thu hồi",
  ENDED: "Đã kết thúc",
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã công bố",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
  SCHEDULED: "Đã lên lịch",
};

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
function AuditValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p>Không có mục nào</p>;
    return (
      <ol className="list-inside list-decimal space-y-2">
        {value.map((item, index) => (
          <li key={index}>
            <AuditValue value={item} />
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
        {entries.map(([field, item]) => (
          <div key={field} className="grid gap-1 sm:grid-cols-2">
            <dt className="text-muted-foreground">
              {Object.hasOwn(FIELD_TEXT, field)
                ? FIELD_TEXT[field]
                : field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")}
            </dt>
            <dd className="min-w-0 wrap-anywhere whitespace-pre-wrap">
              <AuditValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{displayValue(value)}</span>;
}

export function AuditChangeDetails({
  before,
  after,
}: {
  before: unknown;
  after: unknown;
}) {
  if (before == null && after == null) return null;
  return (
    <details className="rounded-xl border border-border p-3">
      <summary className="cursor-pointer">Chi tiết thay đổi</summary>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {[
          { label: "Trước", value: before },
          { label: "Sau", value: after },
        ].map(({ label, value }) => (
          <div key={label} className="min-w-0 space-y-2">
            <p className="font-medium">{label}</p>
            <AuditValue value={value} />
          </div>
        ))}
      </div>
    </details>
  );
}

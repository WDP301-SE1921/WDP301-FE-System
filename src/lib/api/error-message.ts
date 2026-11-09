const DEFAULT_MESSAGE = "Không thể hoàn tất thao tác. Vui lòng thử lại.";
const INVALID_INPUT = "Vui lòng kiểm tra lại thông tin đã nhập.";
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Mật khẩu",
  currentPassword: "Mật khẩu hiện tại",
  newPassword: "Mật khẩu mới",
  confirmPassword: "Xác nhận mật khẩu",
  displayName: "Họ tên",
  fullName: "Họ tên",
  name: "Tên",
  title: "Tiêu đề",
  phone: "Số điện thoại",
  reason: "Lý do",
  note: "Ghi chú",
  content: "Nội dung",
  fromDate: "Ngày bắt đầu",
  toDate: "Ngày kết thúc",
  startDate: "Ngày bắt đầu",
  endDate: "Ngày kết thúc",
  effectiveAt: "Thời điểm hiệu lực",
  effectiveDate: "Ngày hiệu lực",
  startsAt: "Giờ bắt đầu",
  endsAt: "Giờ kết thúc",
  dueAt: "Hạn nộp",
  studentProfileId: "Học sinh",
  enrollmentId: "Ghi danh",
  enrollmentIds: "Học sinh nhận bài",
  classId: "Lớp học",
  teacherId: "Giáo viên",
  reviewerTeacherId: "Giáo viên thẩm định",
  programId: "Khóa học",
  sessionsPerWeek: "Số buổi/tuần",
  roomId: "Phòng học",
  sessionId: "Buổi học",
  subjectId: "Môn học",
  capacity: "Sức chứa",
  grade: "Khối",
  monthlyFee: "Học phí",
  packageMonths: "Số tháng học",
  questions: "Câu hỏi",
  scores: "Điểm từng câu",
  prompt: "Nội dung câu hỏi",
  choices: "Lựa chọn",
  correctAnswer: "Đáp án",
  rubric: "Tiêu chí chấm",
  score: "Điểm",
  maxScore: "Điểm tối đa",
  maxAttempts: "Số lần nộp",
  instructions: "Hướng dẫn",
  feedback: "Nhận xét",
  status: "Trạng thái",
  kind: "Loại nội dung",
  testType: "Loại bài kiểm tra",
  confirmed: "Xác nhận",
  receiptNumber: "Số biên lai",
  hasReceivedPayment: "Xác nhận nhận tiền",
};
const TECHNICAL =
  /(?:\[object Object\]|[{}\[\]]|https?:\/\/|<[^>]*>|\b(?:Prisma\w*|ZodError|TypeError|SyntaxError|ReferenceError|SELECT .+ FROM|INSERT INTO|DELETE FROM)\b|(?:Bearer|authorization|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:= ]|\n\s*at\s)/i;
const ISSUE_CODES = new Set([
  "invalid_type",
  "invalid_format",
  "invalid_string",
  "invalid_value",
  "invalid_enum_value",
  "too_small",
  "too_big",
  "custom",
  "unrecognized_keys",
  "invalid_union",
  "invalid_key",
  "invalid_element",
  "not_multiple_of",
]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readable(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 1500 &&
    /[ĂăĐđƠơƯư\u1EA0-\u1EF9]|(?:không|vui lòng)/iu.test(value) &&
    !TECHNICAL.test(value)
  );
}

function fieldLabel(path: unknown): string {
  if (!Array.isArray(path)) return "";
  const parts: string[] = [];
  for (const part of path.slice(0, 6)) {
    if (typeof part === "string" && Object.hasOwn(FIELD_LABELS, part))
      parts.push(FIELD_LABELS[part]);
    else if (
      typeof part === "number" &&
      Number.isSafeInteger(part) &&
      part >= 0 &&
      part < 10000 &&
      parts.length
    )
      parts[parts.length - 1] += ` ${part + 1}`;
  }
  return parts.join(" · ");
}

function issueMessage(issue: Record<string, unknown>): string {
  if (typeof issue.message === "string" && readable(issue.message))
    return issue.message.trim();
  if (issue.code === "invalid_format" || issue.code === "invalid_string") {
    if (issue.format === "email" || issue.validation === "email")
      return "Email không hợp lệ.";
    if (issue.format === "datetime" || issue.format === "date")
      return "Chọn ngày giờ hợp lệ.";
    return "Thông tin không đúng định dạng.";
  }
  if (issue.code === "too_small" || issue.code === "too_big") {
    const limit = issue.code === "too_small" ? issue.minimum : issue.maximum;
    if (typeof limit === "number" && Number.isFinite(limit)) {
      const bound = issue.code === "too_small" ? "ít nhất" : "tối đa";
      const unit =
        issue.origin === "string" || issue.type === "string"
          ? " ký tự"
          : issue.origin === "array" || issue.type === "array"
            ? " mục"
            : "";
      return `Cần ${bound} ${limit}${unit}.`;
    }
  }
  if (issue.code === "invalid_value" || issue.code === "invalid_enum_value")
    return "Vui lòng chọn một giá trị hợp lệ.";
  if (issue.code === "invalid_type")
    return "Vui lòng nhập hoặc chọn thông tin hợp lệ.";
  return INVALID_INPUT;
}

function validationMessage(value: unknown): string | undefined {
  if (!Array.isArray(value) || !value.length || value.length > 200)
    return undefined;
  if (
    !value.every(
      (issue) =>
        record(issue) &&
        typeof issue.code === "string" &&
        ISSUE_CODES.has(issue.code),
    )
  )
    return undefined;
  return [
    ...new Set(
      value.slice(0, 4).map((issue: Record<string, unknown>) => {
        const message = issueMessage(issue),
          label = fieldLabel(issue.path);
        return label &&
          !message
            .toLocaleLowerCase("vi")
            .startsWith(label.toLocaleLowerCase("vi"))
          ? `${label}: ${message}`
          : message;
      }),
    ),
  ].join(" ");
}

function messageFrom(value: unknown, fallback: string, depth: number): string {
  if (depth > 4) return fallback;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text.length > 64000) return fallback;
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return messageFrom(JSON.parse(text) as unknown, fallback, depth + 1);
      } catch {
        return fallback;
      }
    }
    if (readable(text)) return text;
    if (
      /^(?:Network Error|Failed to fetch|fetch failed|timeout of \d+ms exceeded)$/i.test(
        text,
      )
    )
      return "Không kết nối được máy chủ. Vui lòng thử lại.";
    if (/^Invalid email/i.test(text)) return "Email không hợp lệ.";
    const limit = text.match(
      /^Too (big|small): expected (string|array) to have [<>]=?(\d+) (?:characters|items)/i,
    );
    if (limit)
      return `Cần ${limit[1].toLowerCase() === "big" ? "tối đa" : "ít nhất"} ${limit[3]} ${limit[2].toLowerCase() === "string" ? "ký tự" : "mục"}.`;
    const numberLimit = text.match(
      /^Too (big|small): expected number to be [<>]=?(-?\d+(?:\.\d+)?)/i,
    );
    if (numberLimit)
      return `Cần ${numberLimit[1].toLowerCase() === "big" ? "tối đa" : "ít nhất"} ${numberLimit[2]}.`;
    return fallback;
  }
  const issues = validationMessage(value);
  if (issues) return issues;
  if (!record(value)) return fallback;
  // Only extract error metadata. Success payloads and arbitrary data stay out of the UI.
  if (Object.hasOwn(value, "success") && value.success === true)
    return fallback;
  const validation =
    (Object.hasOwn(value, "issues")
      ? validationMessage(value.issues)
      : undefined) ??
    (Object.hasOwn(value, "errors")
      ? validationMessage(value.errors)
      : undefined);
  if (validation) return validation;
  if (Object.hasOwn(value, "error") && value.error !== undefined)
    return messageFrom(value.error, fallback, depth + 1);
  if (Object.hasOwn(value, "message") && value.message !== undefined) {
    const details = Object.hasOwn(value, "details")
      ? validationMessage(value.details)
      : undefined;
    return details ?? messageFrom(value.message, fallback, depth + 1);
  }
  return fallback;
}

/** Turn validation/API/provider failures into readable text without exposing raw payloads. */
export function userFacingMessage(
  value: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  return messageFrom(value, fallback, 0);
}

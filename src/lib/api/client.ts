import axios from "axios";
import { emitSessionExpired } from "@/lib/auth-events";
import type { ApiEnvelope } from "@/types/backend";

const ERROR_TEXT: Record<string, string> = {
  SUBJECT_NOT_FOUND: "Không tìm thấy môn học.",
  SUBJECT_IN_USE: "Môn đã có giáo trình. Không thể đổi tên môn.",
  SUBJECT_INACTIVE: "Môn học đã ngừng sử dụng.",
  PROGRAM_INACTIVE: "Khóa học đã ngừng sử dụng.",
  PROGRAM_IN_USE: "Khóa đã có dữ liệu. Không thể đổi môn hoặc khối.",
  CLASS_IN_USE:
    "Lớp đã có dữ liệu. Xử lý các ghi danh và buổi học trước khi ngừng sử dụng.",
  CLASS_INACTIVE: "Lớp đã ngừng hoạt động.",
  REVISION_CONFLICT:
    "Dữ liệu đã được người khác sửa. Tải lại để xem phiên bản mới rồi thực hiện lại.",
  PREVIEW_STALE:
    "Lịch xem trước đã hết hạn hoặc cấu hình đã thay đổi. Xem trước lại trước khi sinh lịch.",
  IMPORT_PREVIEW_STALE:
    "Bản xem trước CSV đã hết hạn hoặc nháp đã thay đổi. Chọn file và xem trước lại.",
  UNIT_NOT_PENDING: "Học phần phải được gửi duyệt trước khi quản lý xem xét.",
  EMPTY_CURRICULUM: "Thêm ít nhất một bài học trước khi gửi duyệt.",
  UNIT_IN_USE:
    "Học phần có dữ liệu liên quan nên chưa thể xóa hoặc thay toàn bộ bài.",
  LESSON_IN_USE: "Bài học có dữ liệu liên quan nên chưa thể xóa.",
  CSV_INVALID:
    "File CSV không hợp lệ. Kiểm tra header, số cột và định dạng UTF-8.",
  SESSION_NOT_FOUND: "Không tìm thấy buổi học.",
  SESSION_LOCKED: "Chỉ đổi hoặc hủy buổi đã lên lịch ở tương lai.",
  INVALID_SESSION_TIME: "Giờ mới phải ở tương lai và kết thúc sau giờ bắt đầu.",
  MONTH_CHANGE_NOT_SUPPORTED:
    "Chọn ngày trong cùng tháng với buổi học ban đầu.",
  SESSION_ORDER_CONFLICT:
    "Giờ mới làm thay đổi thứ tự bài. Chọn giờ giữa buổi trước và buổi kế tiếp.",
  PARTICIPANT_OUTSIDE_TERM:
    "Giờ mới nằm ngoài kỳ học hoặc thời gian học tại lớp của học viên.",
  SESSION_HAS_DEPENDENCIES:
    "Xử lý điểm danh và đơn nghỉ liên quan trước khi đổi hoặc hủy buổi.",
  MAKEUP_BOOKING_EXISTS:
    "Xử lý các lịch học bù liên quan trước khi đổi hoặc hủy buổi.",
  BILL_NOT_FOUND: "Không tìm thấy bill. Kiểm tra lại mã đăng ký.",
  BILL_CLASS_CHANGED:
    "Thông tin hoặc lịch lớp đã thay đổi sau khi lập bill. Hủy bản nháp này và lập bill mới trước khi thu tiền.",
  UNIT_NOT_FOUND: "Không tìm thấy học phần. Vui lòng tải lại danh sách.",
  PROGRAM_NOT_FOUND: "Không tìm thấy chương trình đào tạo.",
  UNIT_LOCKED:
    "Chỉ sửa bản nháp của bạn. Học phần đã duyệt cần tạo phiên bản nháp mới.",
  UNIT_NOT_APPROVED: "Học phần chưa được quản lý duyệt.",
  LESSON_NOT_FOUND: "Không tìm thấy bài học trong học phần.",
  LESSON_NOT_APPROVED: "Nội dung bài học chưa được duyệt.",
  INSUFFICIENT_LESSONS: "Chưa đủ bài học cho lịch lớp trong khoảng học phần.",
  LESSON_SEQUENCE_GAP: "Thứ tự bài học phải liên tục từ 1.",
  MISSING_MONTHLY_TEST: "Cần soạn kiểm tra cho mỗi tháng có lịch học.",
  NO_SCHEDULED_CLASS:
    "Chưa có lớp cùng môn và khối với lịch tuần để duyệt học phần.",
  CURRICULUM_MISMATCH: "Học phần phải thuộc đúng khóa học của lớp.",
  RANGE_OUTSIDE_UNIT: "Khoảng sinh lịch phải nằm trong khoảng học phần.",
  NO_SESSIONS: "Không có buổi học theo lịch tuần trong khoảng ngày đã chọn.",
  SCHEDULE_CONFLICT:
    "Lịch lớp hoặc giáo viên bị trùng. Kiểm tra các xung đột ở lịch xem trước.",
  INVALID_DATE_RANGE: "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
  DATE_RANGE_TOO_LONG: "Khoảng ngày tối đa 366 ngày.",
  TEST_OUTSIDE_UNIT: "Tháng kiểm tra phải nằm trong khoảng học phần.",
  IDEMPOTENCY_CONFLICT:
    "Khóa thao tác đã dùng với nội dung khác. Đọc lại thao tác đã lưu.",
  IDEMPOTENCY_KEY_REQUIRED: "Thiếu khóa xác nhận thao tác. Vui lòng thử lại.",
  IDEMPOTENCY_KEY_CONFLICT:
    "Khóa thao tác đã dùng với yêu cầu khác. Kiểm tra lại bản nháp hoặc biên lai.",
  AUTH_INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  AUTH_UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  AUTH_INVALID_REFRESH_TOKEN:
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  AUTH_PASSWORD_TOO_LONG: "Mật khẩu tối đa 72 byte UTF-8.",
  AUTH_EMAIL_EXISTS:
    "Email đã được đăng ký. Đăng nhập trên ứng dụng bằng tài khoản hiện có.",
  PARENT_NOT_FOUND:
    "Không tìm thấy phụ huynh. Kiểm tra email hoặc hướng dẫn phụ huynh đăng ký trên ứng dụng.",
  PARENT_EMAIL_UNVERIFIED:
    "Phụ huynh cần xác minh email trên ứng dụng trước khi đăng ký học.",
  PARENT_DISABLED: "Tài khoản phụ huynh đã bị khóa.",
  STUDENT_INACTIVE: "Hồ sơ con không còn hoạt động.",
  FORBIDDEN: "Tài khoản không có quyền thực hiện thao tác này.",
  CLASS_NOT_FOUND: "Lớp không còn tồn tại. Vui lòng tải lại danh sách.",
  CLASS_CLOSED: "Lớp đã đóng đăng ký. Chọn lớp khác.",
  CLASS_NEEDS_SCHEDULE: "Lớp cần có lịch tuần trước khi mở đăng ký.",
  CLASS_GRADE_MISMATCH: "Lớp không cùng khối với hồ sơ con.",
  CLASS_FULL: "Lớp đã đủ sĩ số trong kỳ học. Chọn lớp hoặc kỳ khác.",
  INVALID_START_DATE: "Ngày bắt đầu phải từ hôm nay và đúng thứ học của lớp.",
  DUPLICATE_CLASS_REGISTRATION:
    "Con đã đăng ký lớp này trong kỳ học trùng nhau.",
  STUDENT_SCHEDULE_CONFLICT:
    "Lịch lớp trùng với lớp khác của con trong kỳ học.",
  CLASS_SCHEDULE_LOCKED:
    "Lớp đã có ghi danh, học viên chuyển vào hoặc buổi học đã sinh. Không thể sửa lịch tuần.",
  CLASS_TEACHER_LOCKED:
    "Lớp đã có buổi học tương lai. Không thể đổi giáo viên.",
  CLASS_SCHEDULE_CONFLICT: "Các khung giờ trong lịch tuần bị trùng nhau.",
  INVALID_SCHEDULE_TIME: "Giờ bắt đầu phải trước giờ kết thúc.",
  INVALID_TEACHER: "Giáo viên phải có tài khoản đang hoạt động.",
  REGISTRATION_NOT_FOUND: "Không tìm thấy đăng ký. Kiểm tra lại mã đăng ký.",
  REGISTRATION_NOT_DRAFT:
    "Đăng ký không còn là bản nháp. Vui lòng tải lại trạng thái.",
  RECEIPT_NOT_FOUND: "Đăng ký chưa có biên lai hoặc mã không tồn tại.",
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ. Kiểm tra lại các trường đã nhập.",
  INTERNAL_ERROR:
    "Máy chủ gặp lỗi. Vui lòng thử lại và cung cấp mã yêu cầu nếu cần hỗ trợ.",
};
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId?: string,
    public details?: unknown,
  ) {
    super(
      status === 429
        ? "Thao tác quá nhiều lần. Vui lòng thử lại sau."
        : (ERROR_TEXT[code] ?? message),
    );
  }
}
const client = axios.create({
  baseURL: "/api/backend",
  timeout: 60_000,
});
export async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    idempotencyKey?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  try {
    const response = await client.request<ApiEnvelope<T>>({
      url: path,
      method: options.method ?? "GET",
      data: options.body,
      signal: options.signal,
      headers: {
        "Content-Type":
          options.body instanceof FormData ? undefined : "application/json",
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
      },
    });
    if (!response.data.success || response.data.data === undefined)
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Máy chủ trả về dữ liệu không hợp lệ.",
        502,
      );
    return response.data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError<ApiEnvelope<never>>(error)) {
      const body = error.response?.data?.error;
      const failure = new ApiError(
        body?.code ?? "NETWORK_ERROR",
        body?.message ?? "Không kết nối được máy chủ. Vui lòng thử lại.",
        error.response?.status ?? 0,
        body?.requestId,
        body?.details,
      );
      if (
        failure.status === 401 &&
        !["auth/login", "auth/register"].includes(path)
      )
        emitSessionExpired();
      throw failure;
    }
    throw error;
  }
}
export function apiErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export const ABSENCE_MSG = {
  // Chung — PROMPT 10 / 10B / 10C (xếp học bù, đổi buổi)
  MAKEUP_TITLE: "Báo nghỉ & xếp học bù",
  MAKEUP_DESC: "Chọn buổi học sinh nghỉ và xếp buổi học bù phù hợp cùng chương trình",
  SWAP_TITLE: "Đổi 1 buổi",
  SWAP_DESC: "Đổi một buổi học cụ thể sang lớp khác cùng chương trình",
  SWAP_INFO_ALERT_TITLE: "Chỉ đổi đúng 1 buổi",
  SWAP_INFO_ALERT_DESC:
    "Chỉ đổi buổi được chọn. Lịch cố định của học sinh không thay đổi.",

  STEP_ORIGINAL_TITLE: "1. Chọn buổi nghỉ",
  STEP_MAKEUP_TITLE: "2. Chọn buổi học bù",

  FIELD_STUDENT: "Học sinh",
  FIELD_ENROLLMENT: "Môn / Lớp đang học",
  FIELD_ENROLLMENT_PLACEHOLDER: "Chọn môn đang học",
  SESSION_LIST_TITLE: "Buổi học gần đây / sắp tới",
  SESSION_LIST_EMPTY: "Học sinh chưa có buổi học nào trong khoảng thời gian này",
  MARK_ABSENT_LABEL: "Đánh dấu Vắng cho buổi này",
  NOTE_LABEL: "Ghi chú lý do",
  NOTE_PLACEHOLDER: "Vd: Học sinh bị ốm, xin nghỉ buổi học chính khóa",

  CONDITION_SAME_PROGRAM: "Cùng chương trình",
  CONDITION_SAME_LESSON: (lessonTitle: string) => `Cùng ${lessonTitle}`,
  CONDITION_NOT_HAPPENED: "Chưa diễn ra",
  CONDITION_HAS_SEAT: "Còn chỗ",

  CANDIDATE_COL_DATETIME: "Ngày giờ",
  CANDIDATE_COL_CLASS: "Lớp",
  CANDIDATE_COL_TEACHER: "Giáo viên",
  CANDIDATE_COL_ROOM: "Phòng",
  CANDIDATE_COL_SEATS: "Chỗ trống",
  CANDIDATE_COL_SELECT: "",
  CANDIDATE_SEATS: (count: number) => `Còn ${count} chỗ`,

  EMPTY_CANDIDATE_TITLE: "Không có buổi phù hợp để học bù",
  EMPTY_CANDIDATE_DESC: "Không có buổi cùng bài học, chưa diễn ra và còn chỗ",
  EMPTY_CANDIDATE_ACTION: "Chỉ đánh dấu Vắng",
  MARK_ABSENT_ONLY_SUCCESS: "Đã đánh dấu Vắng cho buổi học",

  SELECT_STUDENT_FIRST: "Chọn học sinh để xem buổi học",
  SELECT_SESSION_FIRST: "Chọn buổi nghỉ trước khi xếp học bù",

  SUBMIT_MAKEUP: "Xác nhận xếp học bù",
  SUBMIT_SWAP: "Xác nhận đổi buổi",
  FOOTER_NOTE: "Phụ huynh sẽ nhận email thông báo",
  ASSIGN_MAKEUP_SUCCESS: (name: string) => `Đã xếp học bù cho ${name}`,
  ASSIGN_SWAP_SUCCESS: (name: string) => `Đã đổi buổi học cho ${name}`,

  PENDING_TABLE_TITLE: "Lịch học bù đang chờ",
  PENDING_TABLE_TITLE_SWAP: "Lịch đổi buổi đang chờ",
  COL_PENDING_STUDENT: "Học sinh",
  COL_PENDING_ORIGINAL: "Buổi gốc",
  COL_PENDING_MAKEUP: "Buổi học bù",
  COL_PENDING_ASSIGNER: "Người xếp",
  COL_PENDING_STATUS: "Trạng thái",
  PENDING_EMPTY: "Chưa có lịch học bù nào đang chờ",

  ROW_ACTION_CHANGE_SESSION: "Đổi ca",
  ROW_ACTION_CANCEL: "Hủy",
  CANCEL_CONFIRM_TITLE: "Hủy lịch học bù?",
  CANCEL_CONFIRM_DESC:
    "Buổi học bù đã xếp sẽ bị hủy. Học sinh vẫn giữ trạng thái Vắng ở buổi gốc nếu đã đánh dấu.",
  CANCEL_SUCCESS: "Đã hủy lịch học bù",

  CHANGE_SESSION_TITLE: "Đổi ca học bù",
  CHANGE_SESSION_DESC: "Chọn buổi học bù khác còn phù hợp cho học sinh",
  CHANGE_SESSION_SUCCESS: "Đã đổi ca học bù",
  CHANGE_SESSION_EMPTY: "Không còn buổi nào khác phù hợp để đổi ca",

  // PROMPT 10D — Đổi lịch cố định (chuyển lớp)
  CHANGE_CLASS_TITLE: "Đổi lịch cố định",
  CHANGE_CLASS_DESC:
    "Chuyển học sinh sang lớp khác cùng chương trình khi lịch cố định không còn phù hợp",
  PICK_STUDENT_TITLE: "Chọn học sinh & môn học",
  CURRENT_CLASS_TITLE: "Lớp hiện tại",
  CANDIDATE_CLASS_TITLE: "Lớp có thể chuyển",
  PROGRESS_LABEL: (done: number, total: number) => `Bài ${done}/${total}`,
  PROGRESS_MISMATCH: (lesson: number, gap: number) =>
    `Lớp mới đang ở Bài ${lesson}, chênh ${Math.abs(gap)} bài so với lớp hiện tại`,
  FIELD_EFFECTIVE_DATE: "Ngày áp dụng",
  FIELD_REASON: "Lý do",
  FIELD_REASON_PLACEHOLDER: "Nêu lý do đổi lịch cố định cho học sinh",
  SUBMIT_CHANGE_CLASS: "Xác nhận chuyển lớp",
  CHANGE_CLASS_CONFIRM_TITLE: "Đổi lịch cố định",
  CHANGE_CLASS_CONFIRM_DESC: (
    date: string,
    studentName: string,
    className: string,
    schedule: string
  ) => `Từ ${date}, ${studentName} sẽ học ${className} (${schedule})`,
  CHANGE_CLASS_SUCCESS: (studentName: string, className: string) =>
    `Đã chuyển ${studentName} sang ${className}`,
  NO_CANDIDATE_TITLE: "Không có lớp nào để chuyển",
  NO_CANDIDATE_DESC: "Hiện chưa có lớp khác cùng chương trình còn chỗ trống",
  SELECT_ENROLLMENT_FIRST: "Chọn học sinh và môn học để xem lớp có thể chuyển",

  // PROMPT 10E — Nghỉ dài hạn
  LONG_LEAVE_TITLE: "Nghỉ dài hạn",
  LONG_LEAVE_DESC: "Theo dõi và tạo mới các đợt nghỉ dài hạn có phép của học sinh",
  CREATE_LONG_LEAVE: "Tạo nghỉ dài hạn",
  TAB_ACTIVE: "Đang nghỉ",
  TAB_UPCOMING: "Sắp tới",
  TAB_ENDED: "Đã kết thúc",
  COL_LL_STUDENT: "Học sinh",
  COL_LL_SUBJECT_SCOPE: "Môn áp dụng",
  COL_LL_FROM: "Từ ngày",
  COL_LL_TO: "Đến ngày",
  COL_LL_EXCUSED_COUNT: "Số buổi nghỉ có phép",
  COL_LL_REASON: "Lý do",
  COL_LL_STATUS: "Trạng thái",
  ALL_SUBJECTS: "Tất cả môn",
  EXCUSED_COUNT: (count: number) => `${count} buổi`,

  LL_MODAL_TITLE: "Tạo nghỉ dài hạn",
  LL_MODAL_DESC:
    "Các buổi học trong khoảng thời gian này sẽ tự động chuyển thành Nghỉ có phép",
  LL_SCOPE_ALL: "Tất cả môn",
  LL_SCOPE_SELECTED: "Chọn môn",
  LL_FIELD_FROM: "Từ ngày",
  LL_FIELD_TO: "Đến ngày",
  LL_PREVIEW_TITLE: (count: number) => `${count} buổi sẽ chuyển thành Nghỉ có phép`,
  LL_PREVIEW_EMPTY: "Chưa có buổi học nào trong khoảng thời gian đã chọn",
  LL_SUBMIT: "Xác nhận",
  LL_CREATE_SUCCESS: (name: string) => `Đã tạo nghỉ dài hạn cho ${name}`,
  LL_SELECT_STUDENT_FIRST: "Chọn học sinh trước khi chọn môn",
  LL_EMPTY: "Chưa có đợt nghỉ dài hạn nào",
  ROW_ACTION_END_EARLY: "Kết thúc sớm",
  END_EARLY_CONFIRM_TITLE: "Kết thúc sớm đợt nghỉ?",
  END_EARLY_CONFIRM_DESC:
    "Đợt nghỉ dài hạn sẽ kết thúc ngay hôm nay, các buổi học sau đó không còn tự động chuyển Nghỉ có phép.",
  END_EARLY_SUCCESS: "Đã kết thúc sớm đợt nghỉ dài hạn",

  // PROMPT 10F — Nghỉ môn / Nghỉ hẳn / Cho học lại
  WITHDRAW_TITLE: "Nghỉ môn / Nghỉ hẳn",
  WITHDRAW_DESC: "Kết thúc một môn học hoặc toàn bộ chương trình học của học sinh",
  TAB_SUBJECT: "Nghỉ 1 môn",
  TAB_FULL: "Nghỉ hẳn",
  TAB_REENROLL: "Cho học lại",

  SUBJECT_FIELD_ENROLLMENTS: "Chọn môn cần kết thúc",
  NO_ACTIVE_ENROLLMENT_TITLE: "Học sinh không có môn nào đang học",
  NO_ACTIVE_ENROLLMENT_DESC: "Không thể lập yêu cầu nghỉ môn/nghỉ hẳn cho học sinh này",

  FULL_ENDING_TITLE: "Các môn sẽ kết thúc",
  FULL_INFO_ALERT_TITLE: "Không ảnh hưởng tài khoản phụ huynh",
  FULL_INFO_ALERT_DESC:
    "Tài khoản phụ huynh và hồ sơ các con khác không bị ảnh hưởng",

  FIELD_END_DATE: "Ngày kết thúc",
  FIELD_WITHDRAW_REASON_PLACEHOLDER: "Nêu lý do học sinh nghỉ học",

  SUBMIT_WITHDRAW_SUBJECT: "Xác nhận nghỉ môn",
  SUBMIT_WITHDRAW_FULL: "Cho nghỉ hẳn",

  CONFIRM_WITHDRAW_SUBJECT_TITLE: "Xác nhận nghỉ môn?",
  CONFIRM_WITHDRAW_SUBJECT_DESC:
    "Các môn đã chọn sẽ kết thúc kể từ ngày hiệu lực. Học sinh vẫn có thể đăng ký lại sau này.",

  CONFIRM_WITHDRAW_FULL_TITLE: "Cho nghỉ hẳn",
  CONFIRM_WITHDRAW_FULL_DESC:
    "Toàn bộ môn học của học sinh sẽ kết thúc kể từ ngày hiệu lực. Hành động này không thể hoàn tác.",
  CONFIRM_TYPE_NAME_HINT: (name: string) => `Gõ tên "${name}" để xác nhận`,

  WITHDRAW_SUBJECT_SUCCESS: (name: string) => `Đã kết thúc môn học đã chọn của ${name}`,
  WITHDRAW_FULL_SUCCESS: (name: string) => `Đã cho ${name} nghỉ hẳn`,

  REENROLL_COL_STUDENT: "Học sinh",
  REENROLL_COL_SUBJECTS: "Môn đã học",
  REENROLL_COL_DATE: "Ngày nghỉ",
  REENROLL_COL_REASON: "Lý do",
  REENROLL_ACTION: "Đăng ký lại",
  REENROLL_EMPTY: "Chưa có học sinh nào nghỉ hẳn",
  REENROLL_HINT: (name: string) =>
    `Chọn "Thêm môn cho học sinh cũ" và tìm ${name} để đăng ký lại`,
} as const

export const PAYMENT_MSG = {
  TITLE: "Lịch sử thanh toán",
  DESC: "Theo dõi dòng tiền thu học phí, kiểm soát biên lai và người xác nhận giao dịch",
  CREATE: "Lập biên lai thu tiền",
  SEARCH_PLACEHOLDER: "Tìm mã giao dịch, tên học sinh, SĐT...",

  // KPI
  KPI_TODAY: "Giao dịch thu",
  KPI_TODAY_SUB: "Hôm nay",
  KPI_TODAY_COUNT: (count: number) => `${count} giao dịch thành công`,
  KPI_MONTH: "Doanh số thực thu",
  KPI_MONTH_SUB: "Tháng này",
  KPI_MONTH_COUNT: (count: number) => `${count} giao dịch`,
  KPI_MONTHS_SOLD: "Khối lượng tích lũy",
  KPI_MONTHS_SOLD_SUB: "Số tháng đã bán",
  KPI_MONTHS_SOLD_UNIT: (months: number) => `${months} tháng`,
  KPI_MONTHS_SOLD_NOTE: (average: number) =>
    `Trung bình ${average} tháng / lượt đăng ký`,

  // Bộ lọc
  FILTER_ALL_SUBJECTS: "Tất cả môn học",
  FILTER_ALL_CONFIRMERS: "Tất cả người thu",
  FILTER_ALL_METHODS: "Tất cả hình thức",
  FILTER_RANGE_LABEL: "Khoảng ngày",
  ACTIVE_FILTER_TIME: "Thời gian",
  ACTIVE_FILTER_STATUS: "Trạng thái",

  // Cột bảng
  COL_CODE: "Mã GD",
  COL_STUDENT: "Học sinh",
  COL_PARENT: "Phụ huynh",
  COL_SUBJECT: "Môn / Lớp",
  COL_MONTHS: "Số tháng",
  COL_AMOUNT: "Số tiền",
  COL_METHOD: "Hình thức",
  COL_CONFIRMED_BY: "Người xác nhận",
  COL_CONFIRMED_AT: "Thời gian",
  MONTHS_UNIT: (months: number) => `${months} tháng`,

  // Biên lai
  RECEIPT_MODAL_TITLE: "Xem chi tiết biên lai thu tiền",
  RECEIPT_ACTION: "Biên lai",
  RECEIPT_PAID: "Đã thanh toán (PAID)",
  RECEIPT_CLOSE: "Đóng",
  RECEIPT_DOWNLOAD: "Tải PDF",
  RECEIPT_PRINT: "In biên lai",
  RECEIPT_LINE_TUITION: (className: string) => `Học phí môn ${className}`,
  RECEIPT_LINE_TUITION_NOTE: (period: string) => `Giai đoạn: ${period}`,
  RECEIPT_LINE_MATERIAL: "Tài liệu & Bộ đề thi định kỳ học kỳ 1",
  RECEIPT_LINE_MATERIAL_NOTE: "Chính sách ưu đãi nhập học kỳ mới",
  RECEIPT_MATERIAL_QUANTITY: "1 bộ",
  RECEIPT_PAYER_ROLE: "Ký điện tử qua app PH",
  RECEIPT_CONFIRMER_ROLE: "Quản lý trung tâm",
  RECEIPT_DOWNLOAD_SUCCESS: "Đã tải biên lai",

  // Thông tin trung tâm trên biên lai
  CENTER_NAME: "TRUNG TÂM BỒI DƯỠNG TT EDUGRADE",
  CENTER_ADDRESS: "Tầng 4, Tòa nhà Trí Thức, Cầu Giấy, Hà Nội",
  CENTER_CONTACT: "Hotline: 1900 8899 · contact@edugrade.vn",

  // Ghi chú cuối trang
  NOTE_TITLE: "Quy định xác nhận học phí & Biên lai điện tử",
  NOTE_DESC:
    "Mỗi biên lai được phát hành đồng bộ ngay lập tức đến tài khoản phụ huynh qua Zalo OA và Email thông báo. Với các giao dịch thu bằng tiền mặt, người xác nhận chịu trách nhiệm đối soát cuối ngày với bộ phận kế toán trung tâm.",

  EXPORT_SUCCESS: "Đã xuất lịch sử thanh toán",
} as const

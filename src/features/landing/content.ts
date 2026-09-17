import { SUBJECT_MAP } from "@/constants/subjects"

/**
 * Nội dung marketing của landing page công khai. Tách riêng khỏi `src/constants/`
 * vì đây là copy của đúng một trang, không phải message nghiệp vụ dùng lại.
 */
export const LANDING_NAV = [
  { label: "Chương trình học", href: "#subjects" },
  { label: "Vì sao chọn EduGrade", href: "#benefits" },
  { label: "Liên hệ", href: "#contact" },
] as const

export const LANDING_CONTENT = {
  BRAND_NAME: "EduGrade",
  BRAND_TAGLINE: "Hệ thống quản lý trung tâm",

  HERO_EYEBROW: "Trung tâm dạy thêm khối 6 – 9",
  HERO_TITLE_LEAD: "Đồng hành cùng con trên",
  HERO_TITLE_HIGHLIGHT: "từng buổi học",
  HERO_DESC:
    "EduGrade giúp trung tâm quản lý lớp học, điểm danh và chấm bài minh bạch. Phụ huynh nắm được lịch học, kết quả và nhận xét của con mọi lúc — không cần hỏi lại ai.",
  HERO_PRIMARY_CTA: "Đăng nhập hệ thống",
  HERO_SECONDARY_CTA: "Tìm hiểu thêm",
  HERO_NOTE: "Dành cho Quản lý và Giáo viên của trung tâm",

  STATS: [
    { value: "4", label: "Môn học chính" },
    { value: "6 – 9", label: "Khối lớp giảng dạy" },
    { value: "100%", label: "Buổi học có điểm danh" },
  ],

  SUBJECTS_TITLE: "Chương trình giảng dạy",
  SUBJECTS_DESC:
    "Bốn môn khoa học tự nhiên trọng tâm, bám sát chương trình phổ thông từ lớp 6 đến lớp 9.",
  SUBJECTS: [
    {
      code: SUBJECT_MAP.MATH.code,
      desc: "Nền tảng đại số và hình học, luyện tư duy giải toán theo từng khối lớp.",
    },
    {
      code: SUBJECT_MAP.PHYS.code,
      desc: "Gắn lý thuyết với thí nghiệm và hiện tượng đời sống để con dễ hình dung.",
    },
    {
      code: SUBJECT_MAP.CHEM.code,
      desc: "Phương trình, tính toán hóa học và kỹ năng làm bài tập định lượng.",
    },
    {
      code: SUBJECT_MAP.BIOL.code,
      desc: "Hệ thống kiến thức sinh học theo sơ đồ tư duy, dễ nhớ và dễ ôn tập.",
    },
  ],

  BENEFITS_TITLE: "Vì sao phụ huynh tin tưởng EduGrade",
  BENEFITS_DESC:
    "Mọi hoạt động học tập của con đều được ghi nhận rõ ràng và gửi tới phụ huynh.",
  BENEFITS: [
    {
      iconName: "attendance",
      title: "Điểm danh từng buổi",
      desc: "Con vắng buổi nào, đã học bù hay chưa — phụ huynh biết ngay trong ngày, không chờ tới cuối kỳ.",
    },
    {
      iconName: "grading",
      title: "Chấm bài có giáo viên duyệt",
      desc: "Hệ thống hỗ trợ chấm và đề xuất nhận xét, nhưng chỉ giáo viên mới được duyệt và công bố kết quả.",
    },
    {
      iconName: "report",
      title: "Báo cáo tiến bộ rõ ràng",
      desc: "Theo dõi điểm số và nhận xét theo từng môn, thấy được con đang tiến bộ hay cần hỗ trợ thêm ở đâu.",
    },
  ],

  CTA_TITLE: "Bắt đầu quản lý trung tâm hiệu quả hơn",
  CTA_DESC:
    "Đăng nhập bằng tài khoản Quản lý hoặc Giáo viên đã được trung tâm cấp để vào hệ thống.",
  CTA_ACTION: "Đăng nhập ngay",

  CONTACT_TITLE: "Liên hệ trung tâm",
  CONTACT_ITEMS: [
    { iconName: "phone", label: "Hotline", value: "0913 345 678" },
    { iconName: "mail", label: "Email", value: "lienhe@edugrade.vn" },
    {
      iconName: "address",
      label: "Địa chỉ",
      value: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    },
  ],

  FOOTER_COPYRIGHT: (year: number) => `© ${year} EduGrade. Bảo lưu mọi quyền.`,
} as const

import { ROLES } from "@/constants/roles"
import type { StaffAccount } from "@/types/system"

/**
 * Tài khoản nhân sự trung tâm giả lập cho giai đoạn MOCK-ONLY — nguồn DUY NHẤT cho "người
 * thực hiện" của mọi thao tác (thu tiền, xếp học bù, đổi giáo viên, nhật ký thay đổi…).
 * Id khớp `MOCK_ACCOUNTS` trong `mocks/data/auth.ts` (tài khoản đăng nhập được).
 * Xóa file này trong cùng PR nối endpoint nhân sự thật.
 */
export const MOCK_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: "adm-001",
    name: "Trần Quốc Việt",
    email: "admin@edugrade.vn",
    phone: "0903 100 200",
    role: ROLES.ADMIN,
    status: "active",
    joinedAt: "2017-01-05",
  },
  {
    id: "mgr-001",
    name: "Nguyễn Thị Lan",
    email: "lan.nguyen@edugrade.vn",
    phone: "0913 345 678",
    role: ROLES.CENTER_MANAGER,
    status: "active",
    joinedAt: "2018-08-01",
  },
  {
    id: "cur-001",
    name: "Hoàng Văn Tuấn",
    email: "tuan.hoang@edugrade.vn",
    phone: "0977 224 668",
    role: ROLES.CURRICULUM_DESIGNER,
    status: "active",
    joinedAt: "2021-07-01",
  },
  {
    id: "stf-001",
    name: "Vũ Minh Khoa",
    email: "khoa.vu@edugrade.vn",
    phone: "0966 331 889",
    role: ROLES.STAFF,
    status: "active",
    joinedAt: "2022-11-10",
  },
  {
    id: "stf-004",
    name: "Trần Văn Đức",
    email: "duc.tran@edugrade.vn",
    phone: "0912 887 554",
    role: ROLES.STAFF,
    status: "active",
    joinedAt: "2023-03-20",
  },
  {
    id: "stf-002",
    name: "Phạm Thị Hoa",
    email: "hoa.pham@edugrade.vn",
    phone: "0904 556 112",
    role: ROLES.STAFF,
    status: "disabled",
    joinedAt: "2019-03-15",
  },
  {
    id: "stf-003",
    name: "Đặng Thu Hằng",
    email: "hang.dang@edugrade.vn",
    phone: "0938 771 204",
    role: ROLES.STAFF,
    status: "pending",
    joinedAt: "2026-09-15",
  },
]

export function findStaffAccount(id: string): StaffAccount | undefined {
  return MOCK_STAFF_ACCOUNTS.find((item) => item.id === id)
}

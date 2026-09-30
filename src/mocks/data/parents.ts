import { ERROR_MSG } from "@/constants/messages/error"
import { MockError } from "@/mocks/utils/mock-query"
import type { ParentAccount, ParentAccountStatus } from "@/types/student"

/**
 * Phụ huynh giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint phụ huynh thật.
 */
export const MOCK_PARENTS: ParentAccount[] = [
  {
    id: "par-001",
    email: "phuhuynh.khang@gmail.com",
    phone: "0912 345 678",
    status: "activated",
    createdAt: "2025-08-12",
    activatedAt: "2026-08-01T10:24:00",
  },
  {
    id: "par-002",
    email: "thuhuong.le@outlook.com",
    phone: "0988 766 432",
    status: "activated",
    createdAt: "2025-09-05",
    activatedAt: "2025-09-06T08:10:00",
  },
  {
    id: "par-003",
    email: "vanminh.tran@gmail.com",
    phone: "0903 112 233",
    status: "activated",
    createdAt: "2025-07-22",
    activatedAt: "2025-07-23T19:40:00",
  },
  {
    id: "par-004",
    email: "hoanghai.do@fpt.vn",
    phone: "0934 556 677",
    status: "activated",
    createdAt: "2026-09-10",
    activatedAt: "2026-09-10T09:30:00",
  },
  {
    id: "par-005",
    email: "thanhhang.nguyen@yahoo.com",
    phone: "0918 223 344",
    status: "activated",
    createdAt: "2025-11-28",
    activatedAt: "2025-11-29T07:55:00",
  },
  {
    id: "par-006",
    email: "bichngoc.pham@gmail.com",
    phone: "0966 334 455",
    status: "activated",
    createdAt: "2026-09-15",
    activatedAt: "2026-09-15T14:05:00",
  },
  {
    id: "par-007",
    email: "nam.kh.parent@gmail.com",
    phone: "0912 345 678",
    status: "activated",
    createdAt: "2025-10-02",
    activatedAt: "2025-10-02T12:30:00",
  },
  {
    id: "par-008",
    email: "maianh.mom@outlook.com",
    phone: "0988 766 432",
    status: "activated",
    createdAt: "2025-06-18",
    activatedAt: "2025-06-19T09:15:00",
  },
  {
    id: "par-009",
    email: "lebaolong.dad@fpt.vn",
    phone: "0903 112 233",
    status: "activated",
    createdAt: "2025-05-30",
    activatedAt: "2025-05-31T14:00:00",
  },
  {
    id: "par-010",
    email: "linhkhanh.pham@gmail.com",
    phone: "0977 889 900",
    status: "activated",
    createdAt: "2025-04-11",
    activatedAt: "2025-04-12T16:20:00",
  },
  {
    id: "par-011",
    email: "quan.dophuynh@gmail.com",
    phone: "0934 556 677",
    status: "activated",
    createdAt: "2026-01-20",
    activatedAt: "2026-01-21T11:05:00",
  },
  {
    id: "par-012",
    email: "thaomy.hoang@vnn.vn",
    phone: "0945 678 901",
    status: "activated",
    createdAt: "2026-02-14",
    activatedAt: "2026-02-15T08:45:00",
  },
  {
    id: "par-013",
    email: "datvq.parents@yahoo.com",
    phone: "0918 223 344",
    status: "activated",
    createdAt: "2026-03-08",
    activatedAt: "2026-03-09T10:00:00",
  },
  {
    id: "par-014",
    email: "giahan.bui@gmail.com",
    phone: "0966 334 455",
    status: "activated",
    createdAt: "2026-09-12",
    activatedAt: "2026-09-12T18:20:00",
  },
  // Đã đăng ký trên app nhưng CHƯA tạo hồ sơ con — dựng nhánh empty-state ở bước 2 của wizard.
  {
    id: "par-015",
    email: "phuhuynh.moi@gmail.com",
    phone: "0905 111 222",
    status: "activated",
    createdAt: "2026-09-20",
    activatedAt: "2026-09-20T20:10:00",
  },
  // Tài khoản đã bị trung tâm khóa — wizard không cho đăng ký học.
  {
    id: "par-016",
    email: "taikhoan.bikhoa@gmail.com",
    phone: "0906 333 444",
    status: "disabled",
    createdAt: "2026-05-11",
    activatedAt: "2026-05-11T08:00:00",
  },
]

export function findParent(parentAccountId: string): ParentAccount | undefined {
  return MOCK_PARENTS.find((item) => item.id === parentAccountId)
}

export interface UpdateParentContactInput {
  id: string
  phone: string
}

/** Sửa thông tin liên hệ — email là định danh đăng nhập nên web không đổi được. */
export function mockUpdateParentContact(input: UpdateParentContactInput): ParentAccount {
  const parent = findParent(input.id)
  if (!parent) throw new MockError(ERROR_MSG.NOT_FOUND)

  parent.phone = input.phone.trim()

  return parent
}

export interface SetParentStatusInput {
  id: string
  status: ParentAccountStatus
}

/** Khóa / mở khóa tài khoản phụ huynh (`disabled` chặn đăng ký học mới). */
export function mockSetParentStatus(input: SetParentStatusInput): ParentAccount {
  const parent = findParent(input.id)
  if (!parent) throw new MockError(ERROR_MSG.NOT_FOUND)

  parent.status = input.status

  return parent
}

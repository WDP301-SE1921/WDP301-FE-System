import type { ParentAccount } from "@/types/student"

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
    status: "pending_link",
    createdAt: "2026-09-10",
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
    status: "pending_link",
    createdAt: "2026-09-15",
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
    status: "pending_link",
    createdAt: "2026-09-12",
  },
]

export function findParent(parentAccountId: string): ParentAccount | undefined {
  return MOCK_PARENTS.find((item) => item.id === parentAccountId)
}

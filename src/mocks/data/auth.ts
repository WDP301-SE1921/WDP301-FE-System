import { ROLES } from "@/constants/roles"
import { ROLE_HOME_ROUTE } from "@/constants/role-access"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { MockError } from "@/mocks/utils/mock-query"
import type { AuthUser, LoginResult } from "@/types/auth"
import type {
  ForgotPasswordInput,
  LoginInput,
} from "@/lib/validators/auth"

/**
 * Tài khoản giả lập cho giai đoạn MOCK-ONLY. Không phải dữ liệu thật, chỉ tồn tại
 * để chạy luồng UI ở local — xóa file này trong cùng PR nối endpoint đăng nhập thật.
 */
interface MockAccount extends AuthUser {
  password: string
  isDisabled?: boolean
}

/**
 * Tài khoản nhân sự dùng làm "người thực hiện" khi phiên đăng nhập không đọc được hồ sơ
 * (vd. đã xóa storage nhưng còn cookie). Chỉ dùng trong giai đoạn mock.
 */
export const MOCK_DEFAULT_ACTOR_ID = "stf-001"

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: "adm-001",
    email: "admin@edugrade.vn",
    password: "edugrade123",
    name: "Trần Quốc Việt",
    role: ROLES.ADMIN,
    hasAvatar: false,
  },
  {
    id: "mgr-001",
    email: "lan.nguyen@edugrade.vn",
    password: "edugrade123",
    name: "Nguyễn Thị Lan",
    role: ROLES.CENTER_MANAGER,
    hasAvatar: false,
  },
  {
    id: "cur-001",
    email: "tuan.hoang@edugrade.vn",
    password: "edugrade123",
    name: "Hoàng Văn Tuấn",
    role: ROLES.CURRICULUM_DESIGNER,
    hasAvatar: false,
  },
  {
    id: "stf-001",
    email: "khoa.vu@edugrade.vn",
    password: "edugrade123",
    name: "Vũ Minh Khoa",
    role: ROLES.STAFF,
    hasAvatar: false,
  },
  {
    id: "tch-001",
    email: "minh.tran@edugrade.vn",
    password: "edugrade123",
    name: "Trần Văn Minh",
    role: ROLES.TEACHER,
    hasAvatar: false,
  },
  {
    id: "stf-002",
    email: "hoa.pham@edugrade.vn",
    password: "edugrade123",
    name: "Phạm Thị Hoa",
    role: ROLES.STAFF,
    hasAvatar: false,
    isDisabled: true,
  },
]

export function mockLogin({ email, password }: LoginInput): LoginResult {
  const account = MOCK_ACCOUNTS.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase()
  )

  if (!account || account.password !== password) {
    throw new MockError(AUTH_MSG.INVALID_CREDENTIALS)
  }

  if (account.isDisabled) {
    throw new MockError(AUTH_MSG.ACCOUNT_DISABLED)
  }

  return {
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      hasAvatar: account.hasAvatar,
      avatarUrl: account.avatarUrl,
    },
    redirectTo: ROLE_HOME_ROUTE[account.role],
  }
}

export function mockRequestPasswordReset({ email }: ForgotPasswordInput) {
  const normalizedEmail = email.trim().toLowerCase()
  const account = MOCK_ACCOUNTS.find(
    (item) => item.email.toLowerCase() === normalizedEmail
  )

  if (!account) {
    throw new MockError(AUTH_MSG.FORGOT_EMAIL_NOT_FOUND)
  }

  return { email: account.email }
}

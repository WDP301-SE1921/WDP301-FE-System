import { ROLES } from "@/constants/roles"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { ROLE_HOME_ROUTE } from "@/constants/role-access"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { MockError } from "@/mocks/utils/mock-query"
import type { AuthUser, Invitation, LoginResult } from "@/types/auth"
import type {
  ActivateAccountInput,
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
  },
  {
    id: "mgr-001",
    email: "lan.nguyen@edugrade.vn",
    password: "edugrade123",
    name: "Nguyễn Thị Lan",
    role: ROLES.CENTER_MANAGER,
  },
  {
    id: "cur-001",
    email: "tuan.hoang@edugrade.vn",
    password: "edugrade123",
    name: "Hoàng Văn Tuấn",
    role: ROLES.CURRICULUM_DESIGNER,
  },
  {
    id: "stf-001",
    email: "khoa.vu@edugrade.vn",
    password: "edugrade123",
    name: "Vũ Minh Khoa",
    role: ROLES.STAFF,
  },
  {
    id: "tch-001",
    email: "minh.tran@edugrade.vn",
    password: "edugrade123",
    name: "Trần Văn Minh",
    role: ROLES.TEACHER,
  },
  {
    id: "stf-002",
    email: "hoa.pham@edugrade.vn",
    password: "edugrade123",
    name: "Phạm Thị Hoa",
    role: ROLES.STAFF,
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
      avatarUrl: account.avatarUrl,
    },
    redirectTo: ROLE_HOME_ROUTE[account.role],
  }
}

/**
 * Lời mời giả lập. `token` ở đây chỉ là chuỗi mock để chạy luồng UI — link kích hoạt
 * thật là credential dùng một lần, không được log hay hiển thị ra màn hình.
 */
export const MOCK_INVITATIONS: Invitation[] = [
  {
    id: "inv-001",
    email: "nguyenthilan@edugrade.vn",
    role: ROLES.CENTER_MANAGER,
    suggestedName: "Nguyễn Thị Lan",
    expiresAt: addDays(BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS).toISOString(),
  },
  {
    id: "inv-002",
    email: "tranvanminh@edugrade.vn",
    role: ROLES.TEACHER,
    suggestedName: "Trần Văn Minh",
    expiresAt: addDays(-1).toISOString(),
  },
  {
    id: "inv-003",
    email: "phamthihoa@edugrade.vn",
    role: ROLES.STAFF,
    expiresAt: addDays(BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS).toISOString(),
    usedAt: addDays(-2).toISOString(),
  },
  {
    id: "inv-004",
    email: "nhanvien.moi@edugrade.vn",
    role: ROLES.STAFF,
    suggestedName: "Đỗ Thu Trang",
    expiresAt: addDays(BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS).toISOString(),
  },
  {
    id: "inv-005",
    email: "giaotrinh.moi@edugrade.vn",
    role: ROLES.CURRICULUM_DESIGNER,
    suggestedName: "Bùi Anh Dũng",
    expiresAt: addDays(BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS).toISOString(),
  },
]

/** Bảng tra token → lời mời, thay cho việc giải mã token thật ở backend. */
const MOCK_INVITATION_TOKEN: Record<string, string> = {
  "demo-manager": "inv-001",
  "demo-expired": "inv-002",
  "demo-used": "inv-003",
  "demo-staff": "inv-004",
  "demo-curriculum": "inv-005",
}

function addDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export function mockGetInvitation(token: string): Invitation {
  const invitationId = MOCK_INVITATION_TOKEN[token]
  const invitation = MOCK_INVITATIONS.find((item) => item.id === invitationId)

  if (!invitation || invitation.usedAt) {
    throw new MockError(AUTH_MSG.ACTIVATE_INVALID_TOKEN_DESC)
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    throw new MockError(AUTH_MSG.ACTIVATE_EXPIRED_DESC)
  }

  return invitation
}

export function mockActivateAccount({ token, fullName }: ActivateAccountInput) {
  const invitation = mockGetInvitation(token)

  invitation.usedAt = new Date().toISOString()
  MOCK_ACCOUNTS.push({
    id: `acc-${invitation.id}`,
    email: invitation.email,
    password: "",
    name: fullName,
    role: invitation.role,
  })

  return { email: invitation.email }
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

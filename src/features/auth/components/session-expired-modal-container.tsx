"use client"

import {
  SessionExpiredModal,
} from "@/components/shared/feedback/session-expired-modal"
import { ERROR_MSG } from "@/constants/messages/error"
import { MockError } from "@/mocks/utils/mock-query"
import { useLogin } from "@/features/auth/hooks/use-login"

/**
 * Nối `SessionExpiredModal` (component thuần trong `shared/`) với mutation đăng
 * nhập thật — đặt ở `features/auth` vì `shared/` không được import từ `features/`
 * (`.claude/rules/implement-ui.md`). Mount ở layout theo role, không phải trong
 * `AppShell` (cũng là `shared/`).
 */
function SessionExpiredModalContainer() {
  const login = useLogin()

  const errorMessage = login.error
    ? login.error instanceof MockError
      ? login.error.message
      : ERROR_MSG.DEFAULT
    : null

  function handleReauth(email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      login.mutate(
        { email, password, rememberMe: false },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      )
    })
  }

  return (
    <SessionExpiredModal
      onReauth={handleReauth}
      isSubmitting={login.isPending}
      errorMessage={errorMessage}
    />
  )
}

export { SessionExpiredModalContainer }

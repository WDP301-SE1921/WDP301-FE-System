"use client";

import { SessionExpiredModal } from "@/components/shared/feedback/session-expired-modal";
import { apiErrorMessage } from "@/lib/api/client";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath } from "@/constants/role-access";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useLogin } from "@/features/auth/hooks/use-login";

/**
 * Nối `SessionExpiredModal` (component thuần trong `shared/`) với mutation đăng
 * nhập thật — đặt ở `features/auth` vì `shared/` không được import từ `features/`
 * (`.claude/rules/implement-ui.md`). Mount ở layout theo role, không phải trong
 * `AppShell` (cũng là `shared/`).
 */
function SessionExpiredModalContainer() {
  const login = useLogin();
  const router = useRouter();
  const pathname = usePathname();

  const errorMessage = login.error ? apiErrorMessage(login.error) : null;

  function handleReauth(email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      login.mutate(
        {
          email,
          password,
          rememberMe:
            window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE) !== null,
        },
        {
          onSuccess: (result) => {
            if (!canAccessPath(result.user.role, pathname))
              router.replace(result.redirectTo);
            router.refresh();
            resolve();
          },
          onError: (error) => reject(error),
        },
      );
    });
  }

  return (
    <SessionExpiredModal
      onReauth={handleReauth}
      isSubmitting={login.isPending}
      errorMessage={errorMessage}
    />
  );
}

export { SessionExpiredModalContainer };

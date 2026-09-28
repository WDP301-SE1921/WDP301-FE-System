"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { STORAGE_KEYS } from "@/constants/storage-keys"
import { onSessionExpired } from "@/lib/auth-events"
import { loginSchema } from "@/lib/validators/auth"
import type { AuthUser } from "@/types/auth"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, LockKeyIcon } from "@hugeicons/core-free-icons"

/** Re-auth chỉ cần nhập lại mật khẩu — tái dùng đúng rule mật khẩu của loginSchema. */
const reAuthSchema = z.object({
  password: loginSchema.shape.password,
})
type ReAuthInput = z.infer<typeof reAuthSchema>

/** Đọc email đã đăng nhập trước đó (lưu bởi `persistSession` trong `use-login.ts`) để hiển thị read-only. */
function readPersistedEmail(): string {
  if (typeof window === "undefined") return ""

  const raw =
    window.sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE) ??
    window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE)

  if (!raw) return ""

  try {
    return (JSON.parse(raw) as AuthUser).email ?? ""
  } catch {
    return ""
  }
}

export interface SessionExpiredModalProps {
  /**
   * Đăng nhập lại bằng email đã lưu + mật khẩu vừa nhập. Resolve khi thành công,
   * reject khi sai — component chỉ đóng modal khi promise resolve, lỗi hiển thị
   * qua `errorMessage` (đến từ state mutation của nơi gọi).
   */
  onReauth: (email: string, password: string) => Promise<void>
  isSubmitting?: boolean
  errorMessage?: string | null
}

/**
 * Component thuần hiển thị — không tự gọi mutation đăng nhập (rule
 * `shared/` không được import từ `features/`). Nơi mount truyền `onReauth`
 * (xem `features/auth/components/session-expired-modal-container.tsx`).
 */
function SessionExpiredModal({
  onReauth,
  isSubmitting = false,
  errorMessage = null,
}: SessionExpiredModalProps) {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ReAuthInput>({
    resolver: zodResolver(reAuthSchema),
    defaultValues: { password: "" },
  })

  React.useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setEmail(readPersistedEmail())
      resetForm({ password: "" })
      setOpen(true)
    })
    return () => {
      unsubscribe()
    }
  }, [resetForm])

  async function onSubmit(values: ReAuthInput) {
    try {
      await onReauth(email, values.password)
      setOpen(false)
    } catch {
      // Lỗi hiển thị qua `errorMessage` — state mutation ở nơi gọi tự cập nhật.
    }
  }

  return (
    // Không truyền onOpenChange: overlay không được phép đóng bằng backdrop/Esc,
    // chỉ đóng khi đăng nhập lại thành công (setOpen(false) trong onSuccess).
    <Dialog open={open}>
      <DialogContent size="sm" showCloseButton={false}>
        <DialogHeader className="items-center text-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <HugeiconsIcon icon={LockKeyIcon} className="size-6" />
          </div>
          <DialogTitle>{AUTH_MSG.SESSION_EXPIRED_TITLE}</DialogTitle>
          <DialogDescription>{AUTH_MSG.SESSION_EXPIRED_DESC}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errorMessage && (
            <Alert variant="destructive">
              <HugeiconsIcon icon={AlertCircleIcon} />
              <AlertTitle>{errorMessage}</AlertTitle>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="session-expired-email">{AUTH_MSG.EMAIL_LABEL}</Label>
            <Input id="session-expired-email" value={email} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-expired-password" required>
              {AUTH_MSG.PASSWORD_LABEL}
            </Label>
            <Input
              id="session-expired-password"
              type="password"
              autoComplete="current-password"
              placeholder={AUTH_MSG.PASSWORD_PLACEHOLDER}
              error={Boolean(errors.password)}
              prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
              aria-describedby={errors.password ? "session-expired-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="session-expired-password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button type="submit" className="w-full rounded-full" isLoading={isSubmitting}>
              Đăng nhập lại
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { SessionExpiredModal }

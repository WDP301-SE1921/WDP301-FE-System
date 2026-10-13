"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  LockKeyIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import { loginSchema, type LoginInput } from "@/lib/validators/auth"
import { ApiError, apiErrorMessage } from "@/lib/api/client"
import { useLogin } from "@/features/auth/hooks/use-login"

const FIELD_ID = {
  EMAIL: "login-email",
  PASSWORD: "login-password",
  REMEMBER_ME: "login-remember-me",
} as const

function LoginForm() {
  const router = useRouter()
  const login = useLogin()
  const isSubmitting = React.useRef(false)
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  const submitError = login.error ? apiErrorMessage(login.error) : null

  async function onSubmit(values: LoginInput) {
    // A second click/Enter can arrive before the disabled button re-renders.
    if (isSubmitting.current) return
    isSubmitting.current = true
    try {
      const result = await login.mutateAsync(values)
      toast.success(AUTH_MSG.LOGIN_SUCCESS)
      router.replace(result.redirectTo)
    } catch {
      /* Shown from login.error. */
    } finally {
      isSubmitting.current = false
    }
  }

  return (
    <div className="space-y-6">
      <Card className="gap-5">
        <CardHeader>
          <CardTitle className="text-2xl">{AUTH_MSG.LOGIN_TITLE}</CardTitle>
          <CardDescription>{AUTH_MSG.LOGIN_DESC}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {submitError && (
            <Alert variant="destructive">
              <HugeiconsIcon icon={AlertCircleIcon} />
              <AlertTitle>{submitError}</AlertTitle>
              <AlertDescription>
                {login.error instanceof ApiError && login.error.requestId && (
                  <p>Mã yêu cầu: {login.error.requestId}</p>
                )}
                <p>{AUTH_MSG.SUPPORT_CONTACT}</p>
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor={FIELD_ID.EMAIL} required>
                {AUTH_MSG.EMAIL_LABEL}
              </Label>
              <Input
                id={FIELD_ID.EMAIL}
                type="email"
                autoComplete="email"
                placeholder={AUTH_MSG.EMAIL_PLACEHOLDER}
                error={Boolean(errors.email)}
                prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
                aria-describedby={errors.email ? `${FIELD_ID.EMAIL}-error` : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id={`${FIELD_ID.EMAIL}-error`} className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_ID.PASSWORD} required>
                {AUTH_MSG.PASSWORD_LABEL}
              </Label>
              <Input
                id={FIELD_ID.PASSWORD}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder={AUTH_MSG.PASSWORD_PLACEHOLDER}
                error={Boolean(errors.password)}
                prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={
                      isPasswordVisible
                        ? AUTH_MSG.HIDE_PASSWORD
                        : AUTH_MSG.SHOW_PASSWORD
                    }
                    className="inline-flex cursor-pointer items-center rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <HugeiconsIcon
                      icon={isPasswordVisible ? ViewOffSlashIcon : ViewIcon}
                    />
                  </button>
                }
                aria-describedby={
                  errors.password ? `${FIELD_ID.PASSWORD}-error` : undefined
                }
                {...register("password")}
              />
              {errors.password && (
                <p
                  id={`${FIELD_ID.PASSWORD}-error`}
                  className="text-xs text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field }) => (
                    <Checkbox
                      id={FIELD_ID.REMEMBER_ME}
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <Label
                  htmlFor={FIELD_ID.REMEMBER_ME}
                  className="cursor-pointer font-normal text-muted-foreground"
                >
                  {AUTH_MSG.REMEMBER_ME}
                </Label>
              </div>

              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {AUTH_MSG.FORGOT_PASSWORD}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={login.isPending}
              rightIcon={<HugeiconsIcon icon={ArrowRight01Icon} />}
            >
              {AUTH_MSG.LOGIN_ACTION}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-1 text-center text-xs text-muted-foreground">
        <p><Link href={ROUTES.AUTH.REGISTER} className="font-medium text-primary hover:underline">Đăng ký tài khoản phụ huynh</Link> · Quản lý hồ sơ con trên ứng dụng.</p>
        <p>{AUTH_MSG.SUPPORT_HINT}</p>
        <p className="font-medium text-foreground">{AUTH_MSG.SUPPORT_CONTACT}</p>
      </div>
    </div>
  )
}

export { LoginForm }

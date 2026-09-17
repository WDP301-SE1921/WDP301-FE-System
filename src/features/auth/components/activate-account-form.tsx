"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  LockKeyIcon,
  Mail01Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROLE_LABEL } from "@/constants/roles"
import { ROUTES } from "@/constants/routes"
import {
  activateAccountSchema,
  type ActivateAccountInput,
} from "@/lib/validators/auth"
import { MockError } from "@/mocks/utils/mock-query"
import { useActivateAccount } from "@/features/auth/hooks/use-activate-account"
import { useInvitation } from "@/features/auth/hooks/use-invitation"
import type { Invitation } from "@/types/auth"

const FIELD_ID = {
  EMAIL: "activate-email",
  FULL_NAME: "activate-full-name",
  PASSWORD: "activate-password",
  CONFIRM_PASSWORD: "activate-confirm-password",
  TERMS: "activate-terms",
} as const

export interface ActivateAccountFormProps {
  /** Token lấy từ query string. Không bao giờ hiển thị giá trị này ra UI. */
  token: string
}

function ActivateAccountForm({ token }: ActivateAccountFormProps) {
  const invitation = useInvitation(token)

  if (token && invitation.isPending) {
    return <ActivateAccountSkeleton />
  }

  if (!token || invitation.isError || !invitation.data) {
    const isExpired =
      invitation.error instanceof MockError &&
      invitation.error.message === AUTH_MSG.ACTIVATE_EXPIRED_DESC

    return (
      <Card className="gap-4">
        <ErrorState
          className="my-0"
          title={
            isExpired
              ? AUTH_MSG.ACTIVATE_EXPIRED_TITLE
              : AUTH_MSG.ACTIVATE_INVALID_TOKEN_TITLE
          }
          message={
            isExpired
              ? AUTH_MSG.ACTIVATE_EXPIRED_DESC
              : AUTH_MSG.ACTIVATE_INVALID_TOKEN_DESC
          }
        />
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={ROUTES.AUTH.LOGIN} />}
        >
          {AUTH_MSG.BACK_TO_LOGIN}
        </Button>
      </Card>
    )
  }

  return <ActivateAccountFields token={token} invitation={invitation.data} />
}

function ActivateAccountSkeleton() {
  return (
    <Card className="gap-5">
      <CardHeader className="gap-3">
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

function ActivateAccountFields({
  token,
  invitation,
}: {
  token: string
  invitation: Invitation
}) {
  const router = useRouter()
  const activateAccount = useActivateAccount()
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ActivateAccountInput>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: {
      token,
      fullName: invitation.suggestedName ?? "",
      password: "",
      confirmPassword: "",
      hasAcceptedTerms: false,
    },
  })

  const roleLabel = ROLE_LABEL[invitation.role]

  const submitError = activateAccount.error
    ? activateAccount.error instanceof MockError
      ? activateAccount.error.message
      : ERROR_MSG.DEFAULT
    : null

  function onSubmit(values: ActivateAccountInput) {
    activateAccount.mutate(values, {
      onSuccess: () => {
        toast.success(AUTH_MSG.ACTIVATE_SUCCESS)
        router.replace(ROUTES.AUTH.LOGIN)
      },
    })
  }

  return (
    <Card className="gap-5">
      <CardHeader className="gap-3">
        <Badge variant="info" className="rounded-full">
          {AUTH_MSG.ACTIVATE_BADGE}
        </Badge>
        <CardTitle className="text-2xl">{AUTH_MSG.ACTIVATE_TITLE}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          {AUTH_MSG.ACTIVATE_INVITED_PREFIX}
          <Badge variant="secondary" className="rounded-full">
            {roleLabel}
          </Badge>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {submitError && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertTitle>{submitError}</AlertTitle>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={FIELD_ID.EMAIL}>
                {AUTH_MSG.ACTIVATE_EMAIL_LABEL}
              </Label>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={LockKeyIcon} className="size-3.5" />
                {AUTH_MSG.ACTIVATE_EMAIL_LOCKED}
              </span>
            </div>
            <Input
              id={FIELD_ID.EMAIL}
              type="email"
              value={invitation.email}
              disabled
              readOnly
              prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={FIELD_ID.FULL_NAME} required>
              {AUTH_MSG.ACTIVATE_FULL_NAME_LABEL}
            </Label>
            <Input
              id={FIELD_ID.FULL_NAME}
              autoComplete="name"
              placeholder={AUTH_MSG.ACTIVATE_FULL_NAME_PLACEHOLDER}
              error={Boolean(errors.fullName)}
              prefixIcon={<HugeiconsIcon icon={UserIcon} />}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={FIELD_ID.PASSWORD} required>
              {AUTH_MSG.ACTIVATE_NEW_PASSWORD_LABEL}
            </Label>
            <Input
              id={FIELD_ID.PASSWORD}
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder={AUTH_MSG.ACTIVATE_NEW_PASSWORD_PLACEHOLDER}
              error={Boolean(errors.password)}
              prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
              suffixIcon={
                <PasswordToggle
                  isVisible={isPasswordVisible}
                  onToggle={() => setIsPasswordVisible((visible) => !visible)}
                />
              }
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {AUTH_MSG.ACTIVATE_PASSWORD_HINT}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={FIELD_ID.CONFIRM_PASSWORD} required>
              {AUTH_MSG.ACTIVATE_CONFIRM_PASSWORD_LABEL}
            </Label>
            <Input
              id={FIELD_ID.CONFIRM_PASSWORD}
              type={isConfirmVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder={AUTH_MSG.ACTIVATE_CONFIRM_PASSWORD_PLACEHOLDER}
              error={Boolean(errors.confirmPassword)}
              prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
              suffixIcon={
                <PasswordToggle
                  isVisible={isConfirmVisible}
                  onToggle={() => setIsConfirmVisible((visible) => !visible)}
                />
              }
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Controller
                control={control}
                name="hasAcceptedTerms"
                render={({ field }) => (
                  <Checkbox
                    id={FIELD_ID.TERMS}
                    className="mt-0.5"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Label
                htmlFor={FIELD_ID.TERMS}
                className="cursor-pointer text-xs leading-relaxed font-normal text-muted-foreground"
              >
                {AUTH_MSG.ACTIVATE_TERMS_PREFIX}{" "}
                <span className="font-medium text-primary">
                  {AUTH_MSG.ACTIVATE_TERMS_PRIVACY}
                </span>{" "}
                {AUTH_MSG.ACTIVATE_TERMS_CONJUNCTION}{" "}
                <span className="font-medium text-primary">
                  {AUTH_MSG.ACTIVATE_TERMS_POLICY}
                </span>{" "}
                {AUTH_MSG.ACTIVATE_TERMS_SUFFIX}
              </Label>
            </div>
            {errors.hasAcceptedTerms && (
              <p className="text-xs text-destructive">
                {errors.hasAcceptedTerms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={activateAccount.isPending}
            rightIcon={<HugeiconsIcon icon={CheckmarkCircle02Icon} />}
          >
            {AUTH_MSG.ACTIVATE_SUBMIT}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {AUTH_MSG.ACTIVATE_ALREADY_DONE}{" "}
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {AUTH_MSG.ACTIVATE_GO_TO_LOGIN}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

function PasswordToggle({
  isVisible,
  onToggle,
}: {
  isVisible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isVisible ? AUTH_MSG.HIDE_PASSWORD : AUTH_MSG.SHOW_PASSWORD}
      className="inline-flex cursor-pointer items-center rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <HugeiconsIcon icon={isVisible ? ViewOffSlashIcon : ViewIcon} />
    </button>
  )
}

export { ActivateAccountForm }

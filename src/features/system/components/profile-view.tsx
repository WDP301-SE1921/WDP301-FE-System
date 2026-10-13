"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CameraAdd01Icon,
  LockKeyIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ERROR_MSG } from "@/constants/messages/error"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { FIELD_LIMITS } from "@/constants/validation"
import {
  useChangePassword,
  useCurrentStaff,
  useUpdateProfile,
} from "@/features/system/hooks/use-profile"
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormInput,
  type UpdateProfileFormInput,
} from "@/lib/validators/system"
import { MockError } from "@/mocks/utils/mock-query"
import type { StaffAccount } from "@/types/system"

function ProfileView() {
  const currentManager = useCurrentStaff()
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("info"))

  return (
    <PageContainer>
      <PageHeader title={SYSTEM_MSG.PROFILE_TITLE} />

      <AsyncBoundary
        isLoading={currentManager.isPending}
        isError={currentManager.isError}
        error={currentManager.error}
        data={currentManager.data}
        onRetry={() => currentManager.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {currentManager.data && (
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(String(value))}
            orientation="vertical"
            className="items-start gap-8"
          >
            <TabsList className="w-56 shrink-0">
              <TabsTrigger value="info">{SYSTEM_MSG.TAB_INFO}</TabsTrigger>
              <TabsTrigger value="password">{SYSTEM_MSG.TAB_PASSWORD}</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <ProfileInfoTab manager={currentManager.data} />
            </TabsContent>
            <TabsContent value="password">
              <ProfilePasswordTab email={currentManager.data.email} />
            </TabsContent>
          </Tabs>
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function ProfileInfoTab({ manager }: { manager: StaffAccount }) {
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: manager.name, phone: manager.phone ?? "" },
  })

  const onSubmit = (values: UpdateProfileFormInput) => {
    updateProfile.mutate(
      { id: manager.id, ...values },
      {
        onSuccess: () => toast.success(SYSTEM_MSG.UPDATE_PROFILE_SUCCESS),
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  const initials = manager.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="max-w-xl gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled
          leftIcon={<HugeiconsIcon icon={CameraAdd01Icon} />}
        >
          {SYSTEM_MSG.CHANGE_PHOTO}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="profile-name" required>
            {SYSTEM_MSG.FIELD_NAME}
          </Label>
          <Input id="profile-name" error={Boolean(errors.name)} {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{SYSTEM_MSG.FIELD_EMAIL}</Label>
          <Input id="profile-email" defaultValue={manager.email} disabled readOnly />
          <p className="text-xs text-muted-foreground">
            {SYSTEM_MSG.EMAIL_DISABLED_HINT}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone" required>
            {SYSTEM_MSG.FIELD_PHONE}
          </Label>
          <Input
            id="profile-phone"
            type="tel"
            error={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <Button type="submit" className="rounded-full" isLoading={updateProfile.isPending}>
          {SYSTEM_MSG.SAVE_PROFILE}
        </Button>
      </form>
    </Card>
  )
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: "danger" | "warning" | "success"
} {
  let score = 0
  if (password.length >= FIELD_LIMITS.PASSWORD_MIN) score += 34
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 33
  if (/\d/.test(password)) score += 33
  score = Math.min(100, score)

  if (score < 50) {
    return { score, label: SYSTEM_MSG.PASSWORD_STRENGTH_WEAK, color: "danger" }
  }
  if (score < 80) {
    return { score, label: SYSTEM_MSG.PASSWORD_STRENGTH_MEDIUM, color: "warning" }
  }
  return { score, label: SYSTEM_MSG.PASSWORD_STRENGTH_STRONG, color: "success" }
}

function ProfilePasswordTab({ email }: { email: string }) {
  const changePassword = useChangePassword()
  const [visibility, setVisibility] = React.useState({
    current: false,
    next: false,
    confirm: false,
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = (values: ChangePasswordFormInput) => {
    changePassword.mutate(
      {
        email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success(SYSTEM_MSG.CHANGE_PASSWORD_SUCCESS)
          reset()
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Card className="max-w-xl gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password-current" required>
            {SYSTEM_MSG.FIELD_CURRENT_PASSWORD}
          </Label>
          <Input
            id="password-current"
            type={visibility.current ? "text" : "password"}
            error={Boolean(errors.currentPassword)}
            prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
            suffixIcon={
              <button
                type="button"
                onClick={() =>
                  setVisibility((prev) => ({ ...prev, current: !prev.current }))
                }
                aria-label={
                  visibility.current ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                <HugeiconsIcon icon={visibility.current ? ViewOffSlashIcon : ViewIcon} />
              </button>
            }
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-new" required>
            {SYSTEM_MSG.FIELD_NEW_PASSWORD}
          </Label>
          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => {
              const strength = getPasswordStrength(field.value)

              return (
                <div className="space-y-2">
                  <Input
                    id="password-new"
                    type={visibility.next ? "text" : "password"}
                    error={Boolean(errors.newPassword)}
                    prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
                    suffixIcon={
                      <button
                        type="button"
                        onClick={() =>
                          setVisibility((prev) => ({ ...prev, next: !prev.next }))
                        }
                        aria-label={visibility.next ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        <HugeiconsIcon
                          icon={visibility.next ? ViewOffSlashIcon : ViewIcon}
                        />
                      </button>
                    }
                    {...field}
                  />
                  {field.value && (
                    <ProgressStat
                      value={strength.score}
                      color={strength.color}
                      description={strength.label}
                    />
                  )}
                </div>
              )
            }}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-confirm" required>
            {SYSTEM_MSG.FIELD_CONFIRM_PASSWORD}
          </Label>
          <Input
            id="password-confirm"
            type={visibility.confirm ? "text" : "password"}
            error={Boolean(errors.confirmPassword)}
            prefixIcon={<HugeiconsIcon icon={LockKeyIcon} />}
            suffixIcon={
              <button
                type="button"
                onClick={() =>
                  setVisibility((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                aria-label={visibility.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <HugeiconsIcon icon={visibility.confirm ? ViewOffSlashIcon : ViewIcon} />
              </button>
            }
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="rounded-full"
          isLoading={changePassword.isPending}
        >
          {SYSTEM_MSG.CHANGE_PASSWORD_SUBMIT}
        </Button>
      </form>
    </Card>
  )
}

export { ProfileView }

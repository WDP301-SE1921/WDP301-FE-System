"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  Mail01Icon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AUTH_MSG } from "@/constants/messages/events/auth"
import { ROUTES } from "@/constants/routes"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validators/auth"
import { apiErrorMessage } from "@/lib/api/client"
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password"

const EMAIL_FIELD_ID = "forgot-password-email"

function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const submitError = forgotPassword.error ? apiErrorMessage(forgotPassword.error) : null

  const sentToEmail = forgotPassword.data?.email ?? null

  return (
    <Card className="gap-5">
      <CardHeader className="gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={Mail01Icon} className="size-5" />
        </span>
        <CardTitle className="text-2xl">{AUTH_MSG.FORGOT_TITLE}</CardTitle>
        <CardDescription>{AUTH_MSG.FORGOT_DESC}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {sentToEmail && (
          <Alert variant="success">
            <HugeiconsIcon icon={Mail01Icon} />
            <AlertTitle>{AUTH_MSG.FORGOT_SENT_TITLE(sentToEmail)}</AlertTitle>
            <AlertDescription>{AUTH_MSG.FORGOT_SENT_DESC}</AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircleIcon} />
            <AlertTitle>{submitError}</AlertTitle>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit((values) => forgotPassword.mutate(values))}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor={EMAIL_FIELD_ID} required>
              {AUTH_MSG.FORGOT_EMAIL_LABEL}
            </Label>
            <Input
              id={EMAIL_FIELD_ID}
              type="email"
              autoComplete="email"
              placeholder={AUTH_MSG.EMAIL_PLACEHOLDER}
              error={Boolean(errors.email)}
              prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
              aria-describedby={`${EMAIL_FIELD_ID}-hint`}
              {...register("email")}
            />
            <p
              id={`${EMAIL_FIELD_ID}-hint`}
              className={
                errors.email ? "text-xs text-destructive" : "text-xs text-muted-foreground"
              }
            >
              {errors.email?.message ?? AUTH_MSG.FORGOT_EMAIL_HINT}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={forgotPassword.isPending}
          >
            {sentToEmail ? AUTH_MSG.FORGOT_RESUBMIT : AUTH_MSG.FORGOT_SUBMIT}
          </Button>
        </form>

        <Link
          href={ROUTES.AUTH.LOGIN}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          {AUTH_MSG.BACK_TO_LOGIN}
        </Link>
      </CardContent>
    </Card>
  )
}

export { ForgotPasswordForm }

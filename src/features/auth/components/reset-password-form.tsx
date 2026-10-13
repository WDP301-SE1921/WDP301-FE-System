"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  ShieldKeyIcon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MSG } from "@/constants/messages/events/auth";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage } from "@/lib/api/client";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { accountApi } from "@/features/auth/api";
import type { z } from "zod";

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const FIELDS = [
  {
    name: "token",
    label: "Mã đặt lại trong email",
    type: "text",
    autoComplete: "one-time-code",
  },
  {
    name: "newPassword",
    label: "Mật khẩu mới",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Nhập lại mật khẩu mới",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

function ResetPasswordForm() {
  const [token] = useQueryState("token", parseAsString.withDefault(""));
  const reset = useMutation({
    mutationFn: ({ token: code, newPassword }: ResetPasswordInput) =>
      accountApi.resetPassword({ token: code, newPassword }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  return (
    <Card className="gap-5">
      <CardHeader className="gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={ShieldKeyIcon} className="size-5" />
        </span>
        <CardTitle className="text-2xl">{AUTH_MSG.RESET_TITLE}</CardTitle>
        <CardDescription>{AUTH_MSG.RESET_DESC}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {reset.isSuccess ? (
          <Alert variant="success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} />
            <AlertTitle>{AUTH_MSG.RESET_SUCCESS}</AlertTitle>
            <AlertDescription>{AUTH_MSG.RESET_SUCCESS_DESC}</AlertDescription>
          </Alert>
        ) : (
          <form
            onSubmit={handleSubmit((values) => reset.mutate(values))}
            className="space-y-5"
            noValidate
          >
            {reset.error && (
              <Alert variant="destructive">
                <HugeiconsIcon icon={AlertCircleIcon} />
                <AlertTitle>{apiErrorMessage(reset.error)}</AlertTitle>
              </Alert>
            )}
            {FIELDS.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`reset-${field.name}`} required>
                  {field.label}
                </Label>
                <Input
                  id={`reset-${field.name}`}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  error={Boolean(errors[field.name])}
                  aria-describedby={
                    errors[field.name] ? `reset-${field.name}-error` : undefined
                  }
                  {...register(field.name)}
                />
                {errors[field.name] && (
                  <p
                    id={`reset-${field.name}-error`}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={reset.isPending}
            >
              {AUTH_MSG.RESET_TITLE}
            </Button>
          </form>
        )}
        <Link
          href={ROUTES.AUTH.LOGIN}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          {AUTH_MSG.BACK_TO_LOGIN}
        </Link>
      </CardContent>
    </Card>
  );
}

export { ResetPasswordForm };

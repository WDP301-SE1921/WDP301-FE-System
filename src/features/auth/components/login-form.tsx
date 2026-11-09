"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  LockKeyIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { AUTH_MSG } from "@/constants/messages/events/auth";
import { ROUTES } from "@/constants/routes";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { apiErrorMessage } from "@/lib/api/client";
import { useLogin } from "@/features/auth/hooks/use-login";

const FIELD_ID = {
  EMAIL: "login-email",
  PASSWORD: "login-password",
  REMEMBER_ME: "login-remember-me",
} as const;

function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const isSubmitting = React.useRef(false);
  const submitErrorRef = React.useRef<HTMLDivElement>(null);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const submitError = login.error ? apiErrorMessage(login.error) : null;

  React.useEffect(() => {
    if (submitError) submitErrorRef.current?.focus();
  }, [submitError]);

  async function onSubmit(values: LoginInput) {
    // A second click/Enter can arrive before the disabled button re-renders.
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      const result = await login.mutateAsync(values);
      toast.success(AUTH_MSG.LOGIN_SUCCESS);
      router.replace(result.redirectTo);
    } catch {
      /* Shown from login.error. */
    } finally {
      isSubmitting.current = false;
    }
  }

  return (
    <div data-slot="login-form" className="space-y-6">
      <Card className="gap-6 p-5 sm:p-8">
        <CardHeader className="gap-2">
          <h1
            id="login-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {AUTH_MSG.LOGIN_TITLE}
          </h1>
          <CardDescription id="login-description" className="leading-relaxed">
            {AUTH_MSG.LOGIN_DESC}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {submitError && (
            <div
              ref={submitErrorRef}
              tabIndex={-1}
              className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <Alert variant="destructive">
                <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
                <AlertTitle>{submitError}</AlertTitle>
                <AlertDescription>
                  <p>{AUTH_MSG.SUPPORT_CONTACT}</p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            aria-labelledby="login-heading"
            aria-describedby="login-description"
            aria-busy={login.isPending}
            className="space-y-5 [&_[data-slot=input-container]]:h-12 [&_[data-slot=input]]:text-base"
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
                inputMode="email"
                spellCheck={false}
                placeholder={AUTH_MSG.EMAIL_PLACEHOLDER}
                error={Boolean(errors.email)}
                prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
                aria-describedby={
                  errors.email ? `${FIELD_ID.EMAIL}-error` : undefined
                }
                {...register("email")}
              />
              {errors.email && (
                <p
                  id={`${FIELD_ID.EMAIL}-error`}
                  role="alert"
                  className="text-sm leading-relaxed text-destructive"
                >
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
                    aria-pressed={isPasswordVisible}
                    aria-controls={FIELD_ID.PASSWORD}
                    className="-mr-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <HugeiconsIcon
                      icon={isPasswordVisible ? ViewOffSlashIcon : ViewIcon}
                      aria-hidden="true"
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
                  role="alert"
                  className="text-sm leading-relaxed text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-h-11 items-center gap-2">
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field }) => (
                    <Checkbox
                      id={FIELD_ID.REMEMBER_ME}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <Label
                  htmlFor={FIELD_ID.REMEMBER_ME}
                  className="inline-flex min-h-11 cursor-pointer items-center font-normal text-muted-foreground"
                >
                  {AUTH_MSG.REMEMBER_ME}
                </Label>
              </div>

              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="inline-flex min-h-11 items-center rounded-xl text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {AUTH_MSG.FORGOT_PASSWORD}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="group/login h-12 w-full"
              isLoading={login.isPending}
              rightIcon={
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  aria-hidden="true"
                  className="transition-transform duration-150 motion-safe:group-hover/login:translate-x-0.5 motion-reduce:transition-none"
                />
              }
            >
              {login.isPending ? AUTH_MSG.LOGIN_PENDING : AUTH_MSG.LOGIN_ACTION}
            </Button>
          </form>
          <span className="sr-only" role="status">
            {login.isPending ? AUTH_MSG.LOGIN_PENDING : ""}
          </span>
        </CardContent>
      </Card>

      <div className="space-y-2 px-1 text-center text-sm leading-relaxed text-muted-foreground">
        <p>
          <Link
            href={ROUTES.AUTH.REGISTER}
            className="font-medium text-primary hover:underline"
          >
            Đăng ký tài khoản phụ huynh
          </Link>{" "}
          · Quản lý hồ sơ con trên ứng dụng.
        </p>
        <p>{AUTH_MSG.SUPPORT_HINT}</p>
        <p className="font-medium text-foreground">
          {AUTH_MSG.SUPPORT_CONTACT}
        </p>
      </div>
    </div>
  );
}

export { LoginForm };

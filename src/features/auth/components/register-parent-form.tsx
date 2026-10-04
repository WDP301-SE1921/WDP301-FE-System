"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AUTH_MSG } from "@/constants/messages/events/auth";
import {
  registerParentSchema,
  type RegisterParentInput,
} from "@/lib/validators/auth";
import { useRegisterParent } from "../hooks/use-register-parent";
import {
  ApiFeedback,
  FieldError,
} from "@/features/registration-flow/components/api-feedback";

export function RegisterParentForm() {
  const busy = useRef(false);
  const registration = useRegisterParent();
  const form = useForm<RegisterParentInput>({
    resolver: zodResolver(registerParentSchema),
    defaultValues: { email: "", password: "" },
  });
  async function submit(values: RegisterParentInput) {
    if (busy.current) return;
    busy.current = true;
    try {
      await registration.mutateAsync(values);
      form.reset({ email: values.email, password: "" });
    } catch {
      /* Show the server error in the form. */
    } finally {
      busy.current = false;
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {registration.isSuccess
            ? AUTH_MSG.REGISTER_SUCCESS
            : AUTH_MSG.REGISTER_TITLE}
        </CardTitle>
        <CardDescription>{AUTH_MSG.REGISTER_DESC}</CardDescription>
      </CardHeader>
      <CardContent>
        {registration.isSuccess ? (
          <div role="status" className="space-y-3">
            <p className="font-medium break-all">{registration.data.email}</p>
            <p className="text-sm text-muted-foreground">
              {AUTH_MSG.REGISTER_NEXT}
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => void form.handleSubmit(submit)(event)}
          >
            <div className="space-y-2">
              <Label htmlFor="register-parent-email">Email</Label>
              <Input
                id="register-parent-email"
                type="email"
                autoComplete="email"
                disabled={registration.isPending}
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-parent-password">Mật khẩu</Label>
              <Input
                id="register-parent-password"
                type="password"
                autoComplete="new-password"
                disabled={registration.isPending}
                {...form.register("password")}
              />
              <p className="text-xs text-muted-foreground">
                Tối thiểu 8 ký tự, tối đa 72 byte UTF-8.
              </p>
              <FieldError message={form.formState.errors.password?.message} />
            </div>
            <ApiFeedback error={registration.error} />
            <Button
              type="submit"
              className="w-full"
              isLoading={registration.isPending}
            >
              {AUTH_MSG.REGISTER_SUBMIT}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

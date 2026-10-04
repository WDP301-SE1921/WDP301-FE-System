"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { registrationApi } from "../api";
import { parentEmailSchema } from "../schemas";
import { displayDate } from "../calendar";
import { ApiFeedback, FieldError } from "./api-feedback";

export function RegistrationParentLookupView({
  students = false,
}: {
  students?: boolean;
}) {
  const user = useCurrentUser();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(parentEmailSchema),
    defaultValues: { email: "" },
  });
  const lookup = useMutation({
    mutationFn: (email: string) => registrationApi.lookup(email),
    retry: false,
  });
  const parent = lookup.data;
  const eligible = parent?.status === "ACTIVE" && !!parent.emailVerifiedAt;
  return (
    <PageContainer>
      <PageHeader
        title={students ? "Tra cứu hồ sơ con" : "Tra cứu phụ huynh"}
        description="Nhập email chính xác để xem tài khoản phụ huynh và các hồ sơ con đang hoạt động."
      />
      <Card>
        <CardHeader>
          <CardTitle>Email phụ huynh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-3"
            noValidate
            onSubmit={form.handleSubmit((input) => {
              lookup.reset();
              lookup.mutate(input.email);
            })}
          >
            <Label htmlFor="lookup-parent-email">Email đã đăng ký</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="lookup-parent-email"
                type="email"
                placeholder="phuhuynh@example.com"
                {...form.register("email")}
              />
              <Button type="submit" isLoading={lookup.isPending}>
                Tra cứu
              </Button>
            </div>
            <FieldError message={form.formState.errors.email?.message} />
          </form>
          <ApiFeedback error={lookup.error} />
        </CardContent>
      </Card>
      {parent && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between gap-3">
              <CardTitle>{parent.displayName || parent.email}</CardTitle>
              <Badge variant={eligible ? "success" : "warning"}>
                {parent.status !== "ACTIVE"
                  ? "Đã khóa"
                  : parent.emailVerifiedAt
                    ? "Đã xác minh"
                    : "Chưa xác minh email"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              {parent.email} ·{" "}
              {parent.parentProfile?.phone || "Chưa có số điện thoại"}
            </p>
            {!eligible && (
              <p role="alert" className="text-sm text-destructive">
                {parent.status !== "ACTIVE"
                  ? "Tài khoản đã khóa, không thể đăng ký học."
                  : "Phụ huynh cần xác minh email trên ứng dụng."}
              </p>
            )}
            {parent.parentProfile?.students.map((child) => (
              <div
                key={child.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-medium">
                    {child.fullName} · Khối {child.grade}
                  </p>
                  {child.dateOfBirth && (
                    <p className="text-xs text-muted-foreground">
                      Sinh {displayDate(child.dateOfBirth)}
                    </p>
                  )}
                </div>
                {eligible && user?.role === "staff" && (
                  <Link
                    className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                    href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                      email: parent.email,
                      studentId: child.id,
                    })}
                  >
                    Đăng ký học
                  </Link>
                )}
              </div>
            ))}
            {!parent.parentProfile?.students.length && (
              <p className="text-sm text-muted-foreground">
                Chưa có hồ sơ con đang hoạt động. Phụ huynh cần tạo hồ sơ con
                trên ứng dụng.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

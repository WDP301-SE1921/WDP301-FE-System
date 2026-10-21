"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiForm } from "@/components/shared/forms/api-form";
import { UserCell } from "@/components/shared/display/user-cell";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { ROLE_LABEL } from "@/constants/roles";
import { apiRequest } from "@/lib/api/client";
import { updateStoredUser } from "@/lib/auth/session";
import { changePasswordSchema, profileSchema } from "@/lib/validators/auth";
import { accountApi } from "@/features/auth/api";
import { ApiFeedback } from "@/features/registration-flow/components/api-feedback";
import type { AuthUser } from "@/types/auth";

/** Tài khoản đang đăng nhập (mọi vai trò): thông tin bên trái, đổi mật khẩu bên phải. */
export function AccountProfile() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiRequest<AuthUser>("auth/me"),
    retry: false,
  });
  return (
    <PageContainer>
      <PageHeader
        title="Tài khoản của tôi"
        description="Thông tin tài khoản đang đăng nhập tại trung tâm."
      />
      <ApiFeedback error={query.error} retry={() => void query.refetch()} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>
              Email và vai trò do quản lý trung tâm quản lý.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {query.isPending ? (
              <SkeletonDetailHeader />
            ) : (
              query.data && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <UserCell
                      name={query.data.name}
                      sub={query.data.email}
                      avatarUrl={query.data.avatarUrl}
                    />
                    <Badge
                      variant={
                        query.data.status === "DISABLED" ? "secondary" : "success"
                      }
                    >
                      {query.data.status === "DISABLED"
                        ? "Đã khóa"
                        : "Hoạt động"}
                    </Badge>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      ["Email", query.data.email],
                      ["Vai trò", ROLE_LABEL[query.data.role]],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1 break-words font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Separator />
                  <ApiForm
                    schema={profileSchema}
                    defaults={{ displayName: query.data.name }}
                    fields={[{ name: "displayName", label: "Họ tên hiển thị" }]}
                    submitLabel="Lưu họ tên"
                    successMessage="Đã cập nhật họ tên."
                    onSubmit={(value) => accountApi.updateProfile(value)}
                    onSuccess={(user) => {
                      updateStoredUser(user as AuthUser);
                      void client.invalidateQueries({ queryKey: ["auth-me"] });
                    }}
                  />
                </>
              )
            )}
          </CardContent>
        </Card>
        {query.data && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Đổi xong, các phiên đăng nhập ở thiết bị khác sẽ bị đăng xuất.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiForm
                schema={changePasswordSchema}
                defaults={{
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                }}
                fields={[
                  {
                    name: "currentPassword",
                    label: "Mật khẩu hiện tại",
                    type: "password",
                  },
                  {
                    name: "newPassword",
                    label: "Mật khẩu mới",
                    type: "password",
                    description: "8–72 ký tự.",
                  },
                  {
                    name: "confirmPassword",
                    label: "Nhập lại mật khẩu mới",
                    type: "password",
                  },
                ]}
                submitLabel="Đổi mật khẩu"
                successMessage="Đã đổi mật khẩu. Các phiên đăng nhập ở thiết bị khác đã bị đăng xuất."
                onSubmit={({ currentPassword, newPassword }) =>
                  accountApi.changePassword({ currentPassword, newPassword })
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

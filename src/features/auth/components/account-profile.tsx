"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiForm } from "@/components/shared/forms/api-form";
import { ROLE_LABEL } from "@/constants/roles";
import { apiRequest } from "@/lib/api/client";
import { updateStoredUser } from "@/lib/auth/session";
import { changePasswordSchema, profileSchema } from "@/lib/validators/auth";
import { accountApi } from "@/features/auth/api";
import { ApiFeedback } from "@/features/registration-flow/components/api-feedback";
import type { AuthUser } from "@/types/auth";

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
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <p>Đang tải tài khoản…</p>
          ) : (
            query.data && (
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                {[
                  ["Họ tên", query.data.name],
                  ["Email", query.data.email],
                  ["Vai trò", ROLE_LABEL[query.data.role]],
                  [
                    "Trạng thái",
                    query.data.status === "ACTIVE" ? "Hoạt động" : "Đã khóa",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )
          )}
          <p className="mt-5 text-sm text-muted-foreground">
            Email và vai trò do quản lý trung tâm quản lý.
          </p>
        </CardContent>
      </Card>
      {query.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Đổi họ tên</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
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
        </div>
      )}
    </PageContainer>
  );
}

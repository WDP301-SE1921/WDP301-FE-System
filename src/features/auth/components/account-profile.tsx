"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ROLE_LABEL } from "@/constants/roles";
import { apiRequest } from "@/lib/api/client";
import { ApiFeedback } from "@/features/registration-flow/components/api-feedback";
import type { AuthUser } from "@/types/auth";

export function AccountProfile() {
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
            Để cập nhật tài khoản hoặc mật khẩu, liên hệ quản lý trung tâm.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

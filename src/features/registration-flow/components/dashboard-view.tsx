"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/hooks/use-current-role";
import { registrationApi } from "../api";
import { ApiFeedback } from "./api-feedback";

export function RegistrationDashboardView({ manager }: { manager: boolean }) {
  const user = useCurrentUser();
  const query = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const actions = [
    [
      "Đăng ký học",
      "Tra cứu phụ huynh, chọn con và xác nhận học phí tại quầy.",
      ROUTES.STAFF.ENROLLMENT_NEW,
    ],
    [
      "Tra cứu phụ huynh",
      "Kiểm tra xác minh email và hồ sơ con.",
      ROUTES.MANAGER.PARENTS,
    ],
    [
      "Đăng ký và biên lai",
      "Tiếp tục bản nháp hoặc xem biên lai theo mã đăng ký.",
      ROUTES.STAFF.PAYMENTS,
    ],
    ...(manager
      ? [
          [
            "Chuẩn bị lớp học",
            "Cấu hình học phí, lịch tuần và gán giáo viên.",
            ROUTES.MANAGER.CLASSES,
          ],
          [
            "Chương trình",
            "Tạo chương trình theo khối và môn học.",
            ROUTES.MANAGER.CATALOG,
          ],
        ]
      : []),
  ];
  return (
    <PageContainer>
      <PageHeader
        title={`Xin chào${user ? `, ${user.name}` : ""}`}
        description="Đăng ký học và thu học phí tại trung tâm."
      />
      <ApiFeedback error={query.error} retry={() => void query.refetch()} />
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Tổng số lớp", query.data?.length],
          [
            "Lớp mở đăng ký có lịch",
            query.data?.filter(
              (item) => item.isOpen && item.weeklySchedules.length,
            ).length,
          ],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-primary">
                {query.isPending ? "…" : (value ?? "—")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.filter(([, , href]) => !manager || !href.startsWith("/staff/")).map(([title, description, href]) => (
          <Link
            key={href}
            href={href}
            className="space-y-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            <span className="inline-block text-sm font-medium text-primary">
              Mở chức năng →
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

"use client";
import Link from "next/link";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { parentUpdateSchema } from "@/lib/validators/web-workflows";
import { directoryApi } from "../api";
import { ACCOUNT_STATUS_OPTIONS } from "./accounts-view";
export function LiveParentDetailView({ id }: { id: string }) {
  const parent = useLiveQuery(["parent", id], (signal) =>
    directoryApi.parent(id, signal),
  );
  return (
    <PageContainer>
      <PageHeader title="Thông tin phụ huynh" />
      <AsyncBoundary
        isLoading={parent.isPending}
        isError={parent.isError}
        error={parent.error}
        onRetry={() => void parent.refetch()}
        data={parent.data}
      >
        {parent.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  {parent.data.displayName || parent.data.email}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="break-all">{parent.data.email}</p>
                <p>
                  {parent.data.emailVerifiedAt
                    ? "Email đã xác minh"
                    : "Email chưa xác minh"}
                </p>
                <ApiForm
                  key={`${parent.data.id}-${parent.data.status}-${parent.data.displayName}-${parent.data.parentProfile?.phone}`}
                  schema={parentUpdateSchema}
                  defaults={{
                    displayName: parent.data.displayName ?? "",
                    status: parent.data.status,
                    phone: parent.data.parentProfile?.phone ?? "",
                  }}
                  fields={[
                    { name: "displayName", label: "Họ tên" },
                    { name: "phone", label: "Số điện thoại liên hệ" },
                    {
                      name: "status",
                      label: "Trạng thái",
                      type: "select",
                      options: ACCOUNT_STATUS_OPTIONS,
                    },
                  ]}
                  onSubmit={(value) => directoryApi.updateParent(id, value)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hồ sơ con</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parent.data.parentProfile?.students.map((child) => (
                  <div
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <p>
                      {child.fullName} · Khối {child.grade}
                    </p>
                    <Button
                      variant="outline"
                      render={<Link href={`/manager/students/${child.id}`} />}
                    >
                      Xem ghi danh
                    </Button>
                  </div>
                ))}
                {!parent.data.parentProfile?.students.length && (
                  <p>Chưa có hồ sơ con.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}

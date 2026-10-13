"use client";
import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import {
  announcementSchema,
  confirmationSchema,
  reminderSchema,
} from "@/lib/validators/web-workflows";
import { displayMoment } from "@/features/academic/components/live-fields";
export function LiveAnnouncementsView() {
  const data = useLiveQuery(["announcement-workspace"], async (signal) => {
    const [announcements, classes] = await Promise.all([
      academicApi.announcements(signal),
      registrationApi.classes(),
    ]);
    return { announcements, classes };
  });
  const [deliveries, setDeliveries] = useState<
    { email: string; queued: boolean }[] | null
  >(null);
  return (
    <PageContainer>
      <PageHeader
        title="Thông báo và nhắc học phí"
        description="Xếp email đến phụ huynh vào hàng đợi và theo dõi trạng thái trong lịch sử email."
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Tạo thông báo cho lớp</CardTitle>
              </CardHeader>
              <CardContent>
                <ApiForm
                  schema={announcementSchema}
                  fields={[
                    {
                      name: "classId",
                      label: "Lớp nhận thông báo",
                      type: "select",
                      options: data.data.classes.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })),
                    },
                    { name: "title", label: "Tiêu đề" },
                    {
                      name: "content",
                      label: "Nội dung email",
                      type: "textarea",
                    },
                  ]}
                  submitLabel="Lưu thông báo"
                  onSubmit={(value) => academicApi.createAnnouncement(value)}
                />
              </CardContent>
            </Card>
            {data.data.announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    {data.data!.classes.find(
                      (item) => item.id === announcement.classId,
                    )?.name ?? "Lớp học"}{" "}
                    · {displayMoment(announcement.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                  <ApiForm
                    schema={confirmationSchema}
                    defaults={{ confirmed: false }}
                    fields={[
                      {
                        name: "confirmed",
                        label: "Xác nhận gửi email đến phụ huynh của lớp",
                        type: "checkbox",
                      },
                    ]}
                    successMessage={false}
                    submitLabel="Gửi email"
                    onSubmit={async () => {
                      const result = await academicApi.sendAnnouncement(
                        announcement.id,
                      );
                      setDeliveries(result.results);
                      return result;
                    }}
                  />
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader>
                <CardTitle>Nhắc học phí sắp hết hạn</CardTitle>
              </CardHeader>
              <CardContent>
                <ApiForm
                  schema={reminderSchema}
                  fields={[
                    {
                      name: "through",
                      label: "Nhắc các kỳ học kết thúc đến ngày",
                      type: "date",
                      description: "Chọn trong 31 ngày tới.",
                    },
                  ]}
                  successMessage={false}
                  submitLabel="Gửi email nhắc học phí"
                  onSubmit={async (value) => {
                    const result = await academicApi.reminders(value);
                    setDeliveries(result.results);
                    return result;
                  }}
                />
              </CardContent>
            </Card>
          </>
        )}
      </AsyncBoundary>
      {deliveries && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả xếp hàng email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p role="status">
              Đã xếp hàng: {deliveries.filter((item) => item.queued).length}
            </p>
            {deliveries.map((item, index) => (
              <p key={`${item.email}-${index}`} className="break-all">
                {item.email} · {item.queued ? "Đã xếp hàng" : "Chưa xếp hàng"}
              </p>
            ))}
            {!deliveries.length && (
              <p>Không có phụ huynh đủ điều kiện nhận email.</p>
            )}
            <p className="text-sm text-muted-foreground">
              Hệ thống sẽ gửi email và tự thử lại khi lỗi. Trạng thái đã gửi
              hoặc thất bại được cập nhật trong lịch sử email.
            </p>
            <Link
              className="text-sm underline"
              href={ROUTES.MANAGER.EMAIL_LOGS}
            >
              Xem lịch sử email
            </Link>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

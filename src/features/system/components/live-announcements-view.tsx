"use client";
import { useState } from "react";
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
    { email: string; sent: boolean }[] | null
  >(null);
  return (
    <PageContainer>
      <PageHeader
        title="Thông báo và nhắc học phí"
        description="Gửi email đến phụ huynh của lớp đang học và xem kết quả gửi."
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
            <CardTitle>Kết quả lần gửi vừa thực hiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p role="status">
              Đã gửi: {deliveries.filter((item) => item.sent).length} · Thất
              bại: {deliveries.filter((item) => !item.sent).length}
            </p>
            {deliveries.map((item) => (
              <p key={item.email} className="break-all">
                {item.email} · {item.sent ? "Đã gửi" : "Gửi thất bại"}
              </p>
            ))}
            {!deliveries.length && (
              <p>Không có phụ huynh đủ điều kiện nhận email.</p>
            )}
            <p className="text-sm text-muted-foreground">
              Kết quả được hiển thị cho lần gửi này. Các email lỗi chưa được tự
              động gửi lại.
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

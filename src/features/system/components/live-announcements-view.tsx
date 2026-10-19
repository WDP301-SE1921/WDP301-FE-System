"use client";
import { useState } from "react";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import {
  announcementSchema,
  confirmationSchema,
  reminderSchema,
} from "@/lib/validators/web-workflows";
import { displayMoment } from "@/features/academic/components/live-fields";
import type { AnnouncementRecord } from "@/types/academic-workflows";

export interface EmailQueueResult {
  email: string;
  queued: boolean;
}

const COMPOSE_TABS = {
  announcement: "Thông báo lớp",
  reminder: "Nhắc học phí",
} as const;
type ComposeTab = keyof typeof COMPOSE_TABS;
const COMPOSE_KEYS = Object.keys(COMPOSE_TABS) as ComposeTab[];
const ANNOUNCEMENTS_PAGE_SIZE = 10;

function useAnnouncementWorkspace() {
  return useLiveQuery(["announcement-workspace"], async (signal) => {
    const [announcements, classes] = await Promise.all([
      academicApi.announcements(signal),
      registrationApi.classes(),
    ]);
    return { announcements, classes };
  });
}

/** Cột trái của màn Thông báo: soạn thông báo lớp hoặc gửi nhắc học phí (`?compose=`). */
export function AnnouncementComposer({
  onQueued,
}: {
  onQueued: (results: EmailQueueResult[]) => void;
}) {
  const data = useAnnouncementWorkspace();
  const [compose, setCompose] = useQueryState(
    "compose",
    parseAsStringLiteral(COMPOSE_KEYS).withDefault("announcement"),
  );
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Soạn thông báo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={compose}
          onValueChange={(value) => {
            const next = COMPOSE_KEYS.find((key) => key === value);
            if (next) void setCompose(next);
          }}
        >
          <TabsList aria-label="Loại thông báo">
            {COMPOSE_KEYS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {COMPOSE_TABS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {compose === "reminder" ? (
          <ApiForm
            key="reminder"
            schema={reminderSchema}
            fields={[
              {
                name: "through",
                label: "Nhắc các kỳ học kết thúc đến ngày",
                type: "date",
                description:
                  "Chọn trong 31 ngày tới. Email nhắc gia hạn gửi đến phụ huynh có kỳ học sắp hết.",
              },
            ]}
            successMessage={false}
            submitLabel="Gửi email nhắc học phí"
            onSubmit={async (value) => {
              const result = await academicApi.reminders(value);
              onQueued(result.results);
              return result;
            }}
          />
        ) : (
          <AsyncBoundary
            isLoading={data.isPending}
            isError={data.isError}
            error={data.error}
            onRetry={() => void data.refetch()}
          >
            {data.data && (
              <ApiForm
                key="announcement"
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
                    description:
                      "Lưu xong, bấm Gửi email ở bảng Thông báo đã lưu để xếp email cho phụ huynh của lớp.",
                  },
                ]}
                submitLabel="Lưu thông báo"
                onSubmit={(value) => academicApi.createAnnouncement(value)}
              />
            )}
          </AsyncBoundary>
        )}
      </CardContent>
    </Card>
  );
}

/** Thông báo lớp đã lưu; gửi email qua hộp thoại xác nhận như trước. */
export function AnnouncementsTable({
  onQueued,
}: {
  onQueued: (results: EmailQueueResult[]) => void;
}) {
  const data = useAnnouncementWorkspace();
  const [page] = useQueryState(
    "announcementsPage",
    parseAsInteger.withDefault(1),
  );
  const [sending, setSending] = useState<AnnouncementRecord | null>(null);
  const classNames = new Map(
    (data.data?.classes ?? []).map((item) => [item.id, item.name]),
  );
  const announcements = [...(data.data?.announcements ?? [])].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const start = (Math.max(1, page) - 1) * ANNOUNCEMENTS_PAGE_SIZE;
  const columns: DataTableColumn<AnnouncementRecord>[] = [
    {
      id: "title",
      header: "Tiêu đề",
      cell: ({ row: { original: announcement } }) => (
        <div className="max-w-80 min-w-56 space-y-1 whitespace-normal">
          <p className="font-medium">{announcement.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {announcement.content}
          </p>
        </div>
      ),
    },
    {
      id: "class",
      header: "Lớp",
      cell: ({ row }) => classNames.get(row.original.classId) ?? "Lớp học",
    },
    {
      id: "createdAt",
      header: "Tạo lúc",
      cell: ({ row }) => displayMoment(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: { original: announcement } }) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Gửi email thông báo ${announcement.title}`}
          onClick={() => setSending(announcement)}
        >
          Gửi email
        </Button>
      ),
    },
  ];
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Thông báo đã lưu</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <DataTable
          columns={columns}
          data={announcements.slice(start, start + ANNOUNCEMENTS_PAGE_SIZE)}
          isLoading={data.isPending}
          isError={data.isError}
          error={data.error}
          onRetry={() => void data.refetch()}
          emptyTitle="Chưa có thông báo lớp"
          emptyDescription="Soạn thông báo ở cột bên trái."
        />
        <TablePagination
          totalItems={announcements.length}
          pageParamKey="announcementsPage"
          fixedPageSize={ANNOUNCEMENTS_PAGE_SIZE}
        />
      </CardContent>
      <Dialog
        open={!!sending}
        onOpenChange={(open) => {
          if (!open) setSending(null);
        }}
      >
        <DialogContent>
          {sending && (
            <>
              <DialogHeader>
                <DialogTitle>Gửi email thông báo</DialogTitle>
                <DialogDescription>
                  {sending.title} ·{" "}
                  {classNames.get(sending.classId) ?? "Lớp học"}
                </DialogDescription>
              </DialogHeader>
              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border p-3 text-sm">
                {sending.content}
              </p>
              <ApiForm
                key={sending.id}
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
                  const result = await academicApi.sendAnnouncement(sending.id);
                  onQueued(result.results);
                  return result;
                }}
                onSuccess={() => setSending(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Kết quả xếp hàng email của lần gửi gần nhất. */
export function EmailQueueResults({
  results,
}: {
  results: EmailQueueResult[];
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Kết quả xếp hàng email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p role="status">
          Đã xếp hàng: {results.filter((item) => item.queued).length}/
          {results.length}
        </p>
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {results.map((item, index) => (
            <li key={`${item.email}-${index}`} className="break-all">
              {item.email} · {item.queued ? "Đã xếp hàng" : "Chưa xếp hàng"}
            </li>
          ))}
        </ul>
        {!results.length && <p>Không có phụ huynh đủ điều kiện nhận email.</p>}
        <p className="text-muted-foreground">
          Hệ thống sẽ gửi email và tự thử lại khi lỗi. Trạng thái đã gửi hoặc
          thất bại cập nhật trong bảng Lịch sử email.
        </p>
      </CardContent>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { ApiForm } from "@/components/shared/forms/api-form";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import {
  confirmationSchema,
  invitationSchema,
  reviewInvitationSchema,
} from "@/lib/validators/web-workflows";
import type { AccountInvitation } from "@/types/academic-workflows";
import { directoryApi, type InvitationKind } from "../api";

const PAGE_SIZE = 20;
const STATUS: Record<
  AccountInvitation["status"],
  { label: string; variant: "outline" | "warning" | "success" | "secondary" }
> = {
  INVITED: { label: "Chờ người nhận hoàn tất", variant: "outline" },
  ACCEPTED: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt", variant: "success" },
  REJECTED: { label: "Đã từ chối", variant: "secondary" },
  REVOKED: { label: "Đã thu hồi", variant: "secondary" },
};

/**
 * Moi → nhan link qua email → hoan tat thong tin → quan ly duyet.
 */
export function InvitationsPanel({ kind }: { kind: InvitationKind }) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [created, setCreated] = useState<AccountInvitation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useCurrentTime();
  const query = useLiveQuery(["invitations", kind, page], (signal) =>
    directoryApi.invitations(
      kind,
      { page: Math.max(1, page), limit: PAGE_SIZE },
      signal,
    ),
  );
  const label = kind === "teacher" ? "giáo viên" : "quản lý trung tâm";
  const selected = query.data?.items.find(
    (invitation) => invitation.id === selectedId,
  );
  const columns: DataTableColumn<AccountInvitation>[] = [
    {
      id: "recipient",
      header: "Người nhận",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.email}</p>
          {row.original.acceptedUser?.displayName && (
            <p className="text-xs text-muted-foreground">
              {row.original.acceptedUser.displayName}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <InvitationStatus invitation={row.original} now={now} />
      ),
    },
    {
      id: "created",
      header: "Ngày mời",
      cell: ({ row }) => displayMoment(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant={row.original.status === "ACCEPTED" ? "default" : "outline"}
          aria-label={`Mở lời mời ${row.original.email}`}
          onClick={() => setSelectedId(row.original.id)}
        >
          {row.original.status === "ACCEPTED"
            ? "Duyệt tài khoản"
            : "Xem lời mời"}
        </Button>
      ),
    },
  ];
  return (
    <>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Mời {label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiForm
              schema={invitationSchema}
              defaults={{ email: "" }}
              fields={[
                {
                  name: "email",
                  label: "Email người được mời",
                  type: "email",
                  description:
                    "Người nhận tự đặt họ tên và mật khẩu, sau đó chờ quản lý duyệt.",
                },
              ]}
              submitLabel="Tạo lời mời"
              successMessage="Đã tạo lời mời và xếp email vào hàng đợi."
              onSubmit={(value) => directoryApi.invite(kind, value)}
              onSuccess={(result) => setCreated(result as AccountInvitation)}
            />
            {created?.acceptanceToken && (
              <InvitationLink invitation={created} />
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Danh sách lời mời</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            <DataTable
              columns={columns}
              data={query.data?.items ?? []}
              isLoading={query.isPending}
              isError={query.isError}
              error={query.error}
              onRetry={() => void query.refetch()}
              emptyTitle="Chưa có lời mời"
              emptyDescription={`Mời ${label} bằng email ở biểu mẫu bên cạnh.`}
            />
            <TablePagination
              totalItems={query.data?.total ?? 0}
              fixedPageSize={PAGE_SIZE}
            />
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          size="xl"
          showCloseButton={false}
          className="max-h-[85dvh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Chi tiết lời mời</DialogTitle>
            <DialogDescription>
              Xem người nhận, trạng thái và các thao tác phù hợp với lời mời.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <InvitationDetails
              key={selected.id}
              invitation={selected}
              now={now}
              onResent={() =>
                setCreated((previous) =>
                  previous?.id === selected.id ? null : previous,
                )
              }
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedId(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InvitationLink({ invitation }: { invitation: AccountInvitation }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origin}${ROUTES.AUTH.ACCEPT_INVITATION}?token=${encodeURIComponent(invitation.acceptanceToken ?? "")}`;
  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <p className="break-all font-medium">Link mời cho {invitation.email}</p>
      <p className="text-sm text-muted-foreground">
        Link chỉ hiển thị một lần và hết hạn lúc{" "}
        {displayMoment(invitation.expiresAt)}. Email mời đã được xếp hàng gửi;
        có thể dùng link này để gửi qua kênh liên lạc của trung tâm.
      </p>
      <div className="flex min-w-0 flex-col gap-2">
        <Input readOnly value={link} aria-label="Link mời" />
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void navigator.clipboard
              .writeText(link)
              .then(() => toast.success("Đã sao chép link mời."))
              .catch(() =>
                toast.error(
                  "Không sao chép được. Hãy chọn và sao chép thủ công.",
                ),
              )
          }
        >
          Sao chép
        </Button>
      </div>
    </div>
  );
}

function InvitationStatus({
  invitation,
  now,
}: {
  invitation: AccountInvitation;
  now: number;
}) {
  const expired =
    invitation.status === "INVITED" && Date.parse(invitation.expiresAt) <= now;
  const status = STATUS[invitation.status];
  return (
    <Badge variant={expired ? "secondary" : status.variant}>
      {expired ? "Hết hạn" : status.label}
    </Badge>
  );
}

function InvitationDetails({
  invitation,
  now,
  onResent,
}: {
  invitation: AccountInvitation;
  now: number;
  onResent: () => void;
}) {
  const expired =
    invitation.status === "INVITED" && Date.parse(invitation.expiresAt) <= now;
  return (
    <div className="space-y-4 text-sm">
      <p className="break-all text-base font-semibold">{invitation.email}</p>
      <InvitationStatus invitation={invitation} now={now} />
      <p>Tạo lúc {displayMoment(invitation.createdAt)}</p>
      {invitation.acceptedAt && (
        <p>Người nhận hoàn tất lúc {displayMoment(invitation.acceptedAt)}</p>
      )}
      {invitation.acceptedUser && (
        <p>
          Người nhận:{" "}
          {invitation.acceptedUser.displayName ?? invitation.acceptedUser.email}
        </p>
      )}
      {invitation.reviewNote && <p>Ghi chú: {invitation.reviewNote}</p>}
      {expired && (
        <p className="text-muted-foreground">
          Lời mời đã hết hạn. Gửi lại để tạo link mới có hiệu lực 48 giờ.
        </p>
      )}
      {invitation.status === "ACCEPTED" && (
        <div className="grid gap-4 md:grid-cols-2">
          {(["APPROVE", "REJECT"] as const).map((decision) => (
            <ApiForm
              key={decision}
              schema={reviewInvitationSchema}
              defaults={{ decision, note: "" }}
              fields={[
                {
                  name: "note",
                  label:
                    decision === "APPROVE" ? "Ghi chú duyệt" : "Lý do từ chối",
                  type: "textarea",
                },
              ]}
              submitLabel={
                decision === "APPROVE" ? "Duyệt tài khoản" : "Từ chối"
              }
              onSubmit={(value) =>
                directoryApi.reviewInvitation(invitation.id, {
                  decision,
                  ...(String(value.note ?? "").trim()
                    ? { note: value.note }
                    : {}),
                })
              }
            />
          ))}
        </div>
      )}
      {invitation.status === "INVITED" && (
        <ApiForm
          schema={confirmationSchema}
          defaults={{ confirmed: false }}
          fields={[
            {
              name: "confirmed",
              label: "Xác nhận gửi lại; link cũ sẽ hết hiệu lực",
              type: "checkbox",
            },
          ]}
          submitLabel="Gửi lại lời mời"
          successMessage="Đã xếp email mời mới vào hàng đợi. Link cũ đã hết hiệu lực."
          onSubmit={() => directoryApi.resendInvitation(invitation.id)}
          onSuccess={onResent}
        />
      )}
      {invitation.status === "INVITED" && (
        <ApiForm
          schema={confirmationSchema}
          defaults={{ confirmed: false }}
          fields={[
            {
              name: "confirmed",
              label: "Xác nhận thu hồi lời mời này",
              type: "checkbox",
            },
          ]}
          submitLabel="Thu hồi lời mời"
          onSubmit={() => directoryApi.revokeInvitation(invitation.id)}
        />
      )}
    </div>
  );
}

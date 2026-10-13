"use client";
import { useState } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";
import { parseAsInteger, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
 * Invite → the person accepts with the link → a manager approves. BE does not email the
 * invitation yet, so the one-time link is shown to the inviter right after creation.
 */
export function InvitationsPanel({ kind }: { kind: InvitationKind }) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [created, setCreated] = useState<AccountInvitation | null>(null);
  const now = useCurrentTime();
  const query = useLiveQuery(["invitations", kind, page], (signal) =>
    directoryApi.invitations(
      kind,
      { page: Math.max(1, page), limit: PAGE_SIZE },
      signal,
    ),
  );
  const label = kind === "teacher" ? "giáo viên" : "quản lý trung tâm";
  return (
    <>
      <Card>
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
            successMessage={false}
            onSubmit={(value) => directoryApi.invite(kind, value)}
            onSuccess={(result) => setCreated(result as AccountInvitation)}
          />
          {created?.acceptanceToken && <InvitationLink invitation={created} />}
        </CardContent>
      </Card>
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={query.data?.items}
        emptyProps={{ title: "Chưa có lời mời" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.items.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              now={now}
            />
          ))}
        </div>
      </AsyncBoundary>
      <TablePagination
        totalItems={query.data?.total ?? 0}
        fixedPageSize={PAGE_SIZE}
      />
    </>
  );
}

function InvitationLink({ invitation }: { invitation: AccountInvitation }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origin}${ROUTES.AUTH.ACCEPT_INVITATION}?token=${encodeURIComponent(invitation.acceptanceToken ?? "")}`;
  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <p className="font-medium">Link mời cho {invitation.email}</p>
      <p className="text-sm text-muted-foreground">
        Link chỉ hiển thị một lần và hết hạn lúc{" "}
        {displayMoment(invitation.expiresAt)}. Gửi cho người được mời qua kênh
        liên lạc của trung tâm.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
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

function InvitationCard({
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
    <Card>
      <CardHeader>
        <CardTitle className="break-all">{invitation.email}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Badge variant={expired ? "secondary" : status.variant}>
          {expired ? "Hết hạn" : status.label}
        </Badge>
        <p>Tạo lúc {displayMoment(invitation.createdAt)}</p>
        {invitation.acceptedAt && (
          <p>Người nhận hoàn tất lúc {displayMoment(invitation.acceptedAt)}</p>
        )}
        {invitation.reviewNote && <p>Ghi chú: {invitation.reviewNote}</p>}
        {expired && (
          <p className="text-muted-foreground">
            Lời mời đã hết hạn. Tạo lời mời mới cho email này nếu cần.
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
                      decision === "APPROVE"
                        ? "Ghi chú duyệt"
                        : "Lý do từ chối",
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
        {invitation.status === "INVITED" && !expired && (
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
      </CardContent>
    </Card>
  );
}

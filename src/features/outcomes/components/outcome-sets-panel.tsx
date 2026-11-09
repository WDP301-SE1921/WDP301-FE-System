"use client";
import { useState } from "react";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { WebRole } from "@/constants/roles";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { useCurrentUser } from "@/hooks/use-current-role";
import {
  learningOutcomeSchema,
  outcomeChangeRequestSchema,
  outcomeSetCreateSchema,
  outcomeSetUpdateSchema,
  sourceReviewSchema,
} from "@/lib/validators/outcomes";
import { confirmationSchema } from "@/lib/validators/web-workflows";
import type { LearningOutcome, OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "../api";
import {
  OUTCOME_SET_STATUS_TEXT,
  outcomeSetActions,
  technicalApprovalBlockers,
} from "../rules";

type OutcomeDialog =
  | { kind: "create" }
  | { kind: "copy"; set: OutcomeSet }
  | { kind: "edit-set"; set: OutcomeSet }
  | { kind: "delete-set"; set: OutcomeSet }
  | { kind: "outcome"; set: OutcomeSet; outcome?: LearningOutcome }
  | { kind: "delete-outcome"; set: OutcomeSet; outcome: LearningOutcome }
  | { kind: "verify"; set: OutcomeSet; outcome: LearningOutcome }
  | { kind: "technical-approve" | "approve" | "request-changes"; set: OutcomeSet };

const ROLE_HINT: Partial<Record<WebRole, string>> = {
  curriculum_designer:
    "Soạn mục tiêu cho khóa học, ghi rõ nguồn căn cứ rồi gắn mục tiêu cho bài học ở trang giáo trình. Giáo viên của khóa xác minh và duyệt nội dung, sau đó Quản lý duyệt áp dụng.",
  teacher:
    "Đối chiếu từng mục tiêu với đúng mục/trang của nguồn rồi xác minh. Duyệt nội dung khi bạn đã tự xác minh mọi mục tiêu và mỗi mục tiêu có bài học.",
  center_manager:
    "Duyệt áp dụng bộ mục tiêu sau khi giáo viên đã duyệt nội dung. Từ khi khóa có bộ được duyệt áp dụng, bài tập mới phải gắn mục tiêu trước khi giao.",
};
const SET_BADGE: Record<OutcomeSet["status"], "neutral" | "warning" | "success"> = {
  DRAFT: "neutral",
  TECHNICALLY_APPROVED: "warning",
  APPROVED: "success",
};

/** Các bộ CLO của một khóa học và thao tác theo vai trò; BE vẫn kiểm tra lại mọi quyền. */
export function OutcomeSetsPanel({ programId }: { programId: string }) {
  const user = useCurrentUser();
  const sets = useLiveQuery(["outcome-sets", programId, "all"], (signal) =>
    outcomeApi.sets(programId, signal),
  );
  const [dialog, setDialog] = useState<OutcomeDialog | null>(null);
  if (!user) return null;
  return (
    <div className="min-w-0 space-y-4">
      {ROLE_HINT[user.role] && (
        <p className="text-sm text-muted-foreground">{ROLE_HINT[user.role]}</p>
      )}
      {user.role === "curriculum_designer" && (
        <div className="flex justify-end">
          <Button onClick={() => setDialog({ kind: "create" })}>
            Tạo bộ mục tiêu
          </Button>
        </div>
      )}
      <AsyncBoundary
        isLoading={sets.isPending}
        isError={sets.isError}
        error={sets.error}
        onRetry={() => void sets.refetch()}
        data={sets.data}
        emptyProps={{
          title: "Khóa học chưa có bộ mục tiêu",
          description:
            user.role === "curriculum_designer"
              ? "Tạo bộ mục tiêu đầu tiên cho khóa học này."
              : "Thiết kế giáo trình chưa soạn mục tiêu cho khóa học này.",
        }}
      >
        <div className="space-y-4">
          {sets.data?.map((set) => (
            <OutcomeSetCard
              key={set.id}
              set={set}
              user={user}
              onAction={setDialog}
            />
          ))}
        </div>
      </AsyncBoundary>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {dialog && (
            <OutcomeDialogBody
              key={[
                dialog.kind,
                "set" in dialog ? dialog.set.id : "",
                "outcome" in dialog ? dialog.outcome?.id : "",
              ].join(":")}
              dialog={dialog}
              programId={programId}
              sets={sets.data ?? []}
              onDone={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutcomeSetCard({
  set,
  user,
  onAction,
}: {
  set: OutcomeSet;
  user: { id: string; role: WebRole };
  onAction: (dialog: OutcomeDialog) => void;
}) {
  const actions = outcomeSetActions(set, user);
  const blockers = actions.canTechnicallyApprove
    ? technicalApprovalBlockers(set, user.id)
    : [];
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>
          {set.level} · bản {set.version}
        </CardTitle>
        <Badge variant={SET_BADGE[set.status]}>
          {OUTCOME_SET_STATUS_TEXT[set.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {set.status === "DRAFT" && set.reviewNote && (
          <Alert variant="warning">
            <AlertTitle>Quản lý yêu cầu sửa</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {set.reviewNote}
            </AlertDescription>
          </Alert>
        )}
        {set.outcomes.length ? (
          <ul className="space-y-3">
            {set.outcomes.map((outcome) => (
              <li
                key={outcome.id}
                className="space-y-2 rounded-2xl border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">
                    {outcome.code} · {outcome.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={
                        outcome.sourceStatus === "VERIFIED" ? "success" : "neutral"
                      }
                    >
                      {outcome.sourceStatus === "VERIFIED"
                        ? "Nguồn đã xác minh"
                        : "Nguồn chưa xác minh"}
                    </Badge>
                    <Badge variant="outline">
                      {outcome.required ? "Bắt buộc" : "Tự chọn"}
                    </Badge>
                    <Badge variant="outline">
                      {outcome.lessonLinks.length} bài học
                    </Badge>
                  </div>
                </div>
                <p className="text-sm">{outcome.statement}</p>
                <p className="text-xs text-muted-foreground">
                  Nguồn:{" "}
                  <a
                    href={outcome.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {outcome.sourceTitle}
                  </a>{" "}
                  · {outcome.sourceLocator}
                </p>
                {outcome.sourceNote && (
                  <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {outcome.sourceNote}
                  </p>
                )}
                {(actions.canEditOutcomes || actions.canVerify) && (
                  <div className="flex flex-wrap gap-2">
                    {actions.canEditOutcomes && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction({ kind: "outcome", set, outcome })}
                        >
                          Sửa mục tiêu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            onAction({ kind: "delete-outcome", set, outcome })
                          }
                        >
                          Xóa mục tiêu
                        </Button>
                      </>
                    )}
                    {actions.canVerify && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction({ kind: "verify", set, outcome })}
                      >
                        {outcome.sourceStatus === "VERIFIED" &&
                        outcome.verifiedById === user.id
                          ? "Xác minh lại nguồn"
                          : "Xác minh nguồn"}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Bộ chưa có mục tiêu nào.</p>
        )}
        {actions.canEditOutcomes && (
          <p className="text-xs text-muted-foreground">
            Gắn bài học cho mục tiêu ở trang giáo trình của khóa: nút “Gắn mục
            tiêu” ở từng bài.
          </p>
        )}
        {blockers.length > 0 && (
          <div className="space-y-1 rounded-xl bg-muted p-4 text-sm">
            <p className="font-medium">Chưa duyệt nội dung được:</p>
            <ul className="list-disc space-y-1 pl-5">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {actions.canEditOutcomes && (
            <>
              <Button
                variant="outline"
                onClick={() => onAction({ kind: "outcome", set })}
              >
                Thêm mục tiêu
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction({ kind: "edit-set", set })}
              >
                Sửa cấp độ
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onAction({ kind: "delete-set", set })}
              >
                Xóa bộ mục tiêu
              </Button>
            </>
          )}
          {actions.canTechnicallyApprove && (
            <Button
              disabled={blockers.length > 0}
              onClick={() => onAction({ kind: "technical-approve", set })}
            >
              Duyệt nội dung
            </Button>
          )}
          {actions.canApprove && (
            <Button onClick={() => onAction({ kind: "approve", set })}>
              Duyệt áp dụng
            </Button>
          )}
          {actions.canRequestChanges && (
            <Button
              variant="outline"
              onClick={() => onAction({ kind: "request-changes", set })}
            >
              Trả về nháp
            </Button>
          )}
          {actions.canCopy && (
            <Button
              variant="outline"
              onClick={() => onAction({ kind: "copy", set })}
            >
              Tạo bản mới từ bộ này
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomeDialogBody({
  dialog,
  programId,
  sets,
  onDone,
}: {
  dialog: OutcomeDialog;
  programId: string;
  sets: OutcomeSet[];
  onDone: () => void;
}) {
  const done = (message: string) => () => {
    toast.success(message);
    onDone();
  };
  if (dialog.kind === "edit-set") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sửa cấp độ bộ mục tiêu</DialogTitle>
          <DialogDescription>
            Đổi tên cấp độ hiển thị của bộ mục tiêu (bản {dialog.set.version}).
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={outcomeSetUpdateSchema}
          defaults={{
            level: dialog.set.level,
          }}
          fields={[
            {
              name: "level",
              label: "Cấp độ",
              description: "Nhãn do trung tâm đặt, ví dụ “Lớp 8 - nâng cao”.",
            },
          ]}
          submitLabel="Lưu thay đổi"
          successMessage={false}
          onSubmit={(value) => outcomeApi.updateSet(dialog.set.id, value)}
          onSuccess={done("Đã cập nhật cấp độ bộ mục tiêu.")}
        />
      </>
    );
  }
  if (dialog.kind === "delete-set") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Xóa bộ mục tiêu</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bộ mục tiêu “{dialog.set.level}” (bản {dialog.set.version}) không? Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={confirmationSchema}
          defaults={{ confirmed: false }}
          fields={[
            {
              name: "confirmed",
              label: "Tôi xác nhận muốn xóa bộ mục tiêu nháp này",
              type: "checkbox",
            },
          ]}
          submitLabel="Xóa bộ mục tiêu"
          successMessage={false}
          onSubmit={() => outcomeApi.deleteSet(dialog.set.id)}
          onSuccess={done("Đã xóa bộ mục tiêu.")}
        />
      </>
    );
  }
  if (dialog.kind === "delete-outcome") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Xóa mục tiêu {dialog.outcome.code}</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa mục tiêu “{dialog.outcome.code} · {dialog.outcome.title}” khỏi bộ không?
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={confirmationSchema}
          defaults={{ confirmed: false }}
          fields={[
            {
              name: "confirmed",
              label: `Tôi xác nhận muốn xóa ${dialog.outcome.code}`,
              type: "checkbox",
            },
          ]}
          submitLabel="Xóa mục tiêu"
          successMessage={false}
          onSubmit={() =>
            outcomeApi.deleteOutcome(dialog.set.id, dialog.outcome.id)
          }
          onSuccess={done(`Đã xóa ${dialog.outcome.code}.`)}
        />
      </>
    );
  }
  if (dialog.kind === "create" || dialog.kind === "copy") {
    const source = dialog.kind === "copy" ? dialog.set : undefined;
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {source ? "Tạo bản mới của bộ mục tiêu" : "Tạo bộ mục tiêu"}
          </DialogTitle>
          <DialogDescription>
            Bộ chép từ bản cũ giữ mục tiêu và liên kết bài học, nhưng nguồn trở
            về chưa xác minh để giáo viên duyệt lại.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={outcomeSetCreateSchema}
          defaults={{
            programId,
            level: source?.level ?? "",
            copyFromId: source?.id ?? "none",
          }}
          fields={[
            {
              name: "level",
              label: "Cấp độ",
              description: "Nhãn do trung tâm đặt, ví dụ “Lớp 8 - cơ bản”.",
            },
            {
              name: "copyFromId",
              label: "Chép mục tiêu từ",
              type: "select",
              options: [
                { value: "none", label: "Không chép — bộ mới trống" },
                ...sets.map((set) => ({
                  value: set.id,
                  label: `${set.level} · bản ${set.version} (${OUTCOME_SET_STATUS_TEXT[set.status]})`,
                })),
              ],
            },
          ]}
          submitLabel="Tạo bộ mục tiêu"
          successMessage={false}
          onSubmit={(value) =>
            outcomeApi.createSet({
              ...value,
              copyFromId: value.copyFromId === "none" ? "" : value.copyFromId,
            })
          }
          onSuccess={done("Đã tạo bộ mục tiêu nháp.")}
        />
      </>
    );
  }
  if (dialog.kind === "outcome") {
    const { outcome } = dialog;
    return (
      <>
        <DialogHeader>
          <DialogTitle>{outcome ? `Sửa ${outcome.code}` : "Thêm mục tiêu"}</DialogTitle>
          <DialogDescription>
            Viết mục tiêu đo được: sau khóa học, học sinh làm được gì, trong
            điều kiện nào. Lưu xong, nguồn của mục tiêu trở về chưa xác minh.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={learningOutcomeSchema}
          defaults={{
            code: outcome?.code ?? "",
            title: outcome?.title ?? "",
            statement: outcome?.statement ?? "",
            sourceTitle: outcome?.sourceTitle ?? "",
            sourceUrl: outcome?.sourceUrl ?? "",
            sourceLocator: outcome?.sourceLocator ?? "",
            sourceNote: outcome?.sourceNote ?? "",
            required: outcome?.required ?? true,
          }}
          fields={[
            { name: "code", label: "Mã mục tiêu" },
            { name: "title", label: "Tên ngắn" },
            { name: "statement", label: "Phát biểu mục tiêu", type: "textarea" },
            { name: "sourceTitle", label: "Tên nguồn căn cứ" },
            { name: "sourceUrl", label: "Đường dẫn nguồn" },
            {
              name: "sourceLocator",
              label: "Vị trí trong nguồn",
              description: "Mục và trang cụ thể, ví dụ “Lớp 8 > Phương trình, trang in 65”.",
            },
            { name: "sourceNote", label: "Ghi chú đối chiếu", type: "textarea" },
            { name: "required", label: "Mục tiêu bắt buộc của khóa", type: "checkbox" },
          ]}
          submitLabel={outcome ? "Lưu mục tiêu" : "Thêm mục tiêu"}
          successMessage={false}
          onSubmit={(value) =>
            outcomeApi.saveOutcome(dialog.set.id, value, outcome?.id)
          }
          onSuccess={done(outcome ? "Đã lưu mục tiêu." : "Đã thêm mục tiêu.")}
        />
      </>
    );
  }
  if (dialog.kind === "verify") {
    const { outcome } = dialog;
    return (
      <>
        <DialogHeader>
          <DialogTitle>Xác minh nguồn {outcome.code}</DialogTitle>
          <DialogDescription>{outcome.statement}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          Mở{" "}
          <a
            href={outcome.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {outcome.sourceTitle}
          </a>
          , tìm đúng yêu cầu cần đạt rồi ghi lại vị trí và cách mục tiêu cụ thể hóa
          yêu cầu đó.
        </p>
        <ApiForm
          schema={sourceReviewSchema}
          defaults={{
            sourceLocator: outcome.sourceLocator,
            sourceNote: outcome.sourceNote ?? "",
          }}
          fields={[
            { name: "sourceLocator", label: "Mục/trang trong nguồn" },
            { name: "sourceNote", label: "Giải thích đối chiếu", type: "textarea" },
          ]}
          submitLabel="Xác minh nguồn"
          successMessage={false}
          onSubmit={(value) => outcomeApi.verifySource(outcome.id, value)}
          onSuccess={done(`Đã xác minh nguồn ${outcome.code}.`)}
        />
      </>
    );
  }
  if (dialog.kind === "request-changes")
    return (
      <>
        <DialogHeader>
          <DialogTitle>Trả bộ mục tiêu về nháp</DialogTitle>
          <DialogDescription>
            Thiết kế giáo trình sẽ thấy lý do và sửa lại; giáo viên phải duyệt
            nội dung lần nữa.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={outcomeChangeRequestSchema}
          defaults={{ reason: "" }}
          fields={[{ name: "reason", label: "Cần sửa gì", type: "textarea" }]}
          submitLabel="Trả về nháp"
          successMessage={false}
          onSubmit={(value) => outcomeApi.requestChanges(dialog.set.id, value)}
          onSuccess={done("Đã trả bộ mục tiêu về nháp.")}
        />
      </>
    );
  const isApprove = dialog.kind === "approve";
  return (
    <>
      <DialogHeader>
        <DialogTitle>{isApprove ? "Duyệt áp dụng bộ mục tiêu" : "Duyệt nội dung bộ mục tiêu"}</DialogTitle>
        <DialogDescription>
          {isApprove
            ? "Sau khi duyệt áp dụng, bài tập mới của khóa phải gắn mục tiêu của bộ này trước khi giao cho học sinh."
            : "Bạn xác nhận mọi mục tiêu đúng kiến thức, đúng nguồn và có bài học tương ứng."}
        </DialogDescription>
      </DialogHeader>
      <ApiForm
        schema={confirmationSchema}
        defaults={{ confirmed: false }}
        fields={[
          {
            name: "confirmed",
            label: `Xác nhận ${dialog.set.level} · bản ${dialog.set.version}`,
            type: "checkbox",
          },
        ]}
        submitLabel={isApprove ? "Duyệt áp dụng" : "Duyệt nội dung"}
        successMessage={false}
        onSubmit={() =>
          isApprove
            ? outcomeApi.approve(dialog.set.id)
            : outcomeApi.technicalApprove(dialog.set.id)
        }
        onSuccess={done(
          isApprove ? "Đã duyệt áp dụng bộ mục tiêu." : "Đã duyệt nội dung bộ mục tiêu.",
        )}
      />
    </>
  );
}

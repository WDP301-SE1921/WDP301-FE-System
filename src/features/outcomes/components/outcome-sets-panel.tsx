"use client";
import { useState } from "react";
import { z } from "zod";
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
import { registrationApi } from "@/features/registration-flow/api";
import { useCurrentUser } from "@/hooks/use-current-role";
import {
  outcomeFormSchema,
  outcomeChangeRequestSchema,
  outcomeSetCreateSchema,
  sourceReviewSchema,
} from "@/lib/validators/outcomes";
import type { LearningOutcome, OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "../api";
import { nextOutcomeCode } from "../outcome-code";
import { PasteOutcomesForm } from "./paste-outcomes-form";
import {
  OUTCOME_SET_STATUS_TEXT,
  outcomeSetActions,
  technicalApprovalBlockers,
} from "../rules";

type OutcomeDialog =
  | { kind: "create" }
  | { kind: "copy"; set: OutcomeSet }
  | { kind: "paste"; set: OutcomeSet }
  | { kind: "delete-set"; set: OutcomeSet }
  | { kind: "outcome"; set: OutcomeSet; outcome?: LearningOutcome }
  | { kind: "delete-outcome"; set: OutcomeSet; outcome: LearningOutcome }
  | { kind: "verify"; set: OutcomeSet; outcome: LearningOutcome }
  | { kind: "technical-approve" | "request-changes"; set: OutcomeSet };

/** Hộp chỉ cần xác nhận: không có ô nhập, bấm nút là mở hộp hỏi lại. */
const confirmOnlySchema = z.object({});

const ROLE_HINT: Partial<Record<WebRole, string>> = {
  curriculum_designer:
    "Soạn mục tiêu cho khóa học (có thể trước khi có giáo trình), gắn mục tiêu cho bài học rồi gửi duyệt cùng giáo trình. Giáo viên của khóa duyệt bộ mục tiêu; bộ dùng được ngay sau khi duyệt.",
  teacher:
    "Duyệt bộ mục tiêu khi mỗi mục tiêu đã có bài học. Xác minh nguồn là không bắt buộc. Sau khi bạn duyệt, bộ dùng được ngay khi soạn và giao bài.",
  center_manager:
    "Theo dõi các bộ mục tiêu giáo viên đã duyệt. Cần sửa thì gửi yêu cầu điều chỉnh: bộ đang dùng giữ nguyên, Thiết kế giáo trình tạo bản mới để giáo viên duyệt lại.",
};
const SET_BADGE: Record<
  OutcomeSet["status"],
  "neutral" | "warning" | "success"
> = {
  DRAFT: "neutral",
  APPROVED: "success",
};

/** Các bộ CLO của một khóa học và thao tác theo vai trò; BE vẫn kiểm tra lại mọi quyền. */
export function OutcomeSetsPanel({
  programId,
  programName,
  onOpenMatrix,
}: {
  programId: string;
  /** Tên khóa, điền sẵn làm "Cấp độ" khi tạo bộ mới. */
  programName?: string;
  /** Mở màn gắn bài hàng loạt cho một bộ nháp (chỉ Thiết kế GT). */
  onOpenMatrix?: (setId: string) => void;
}) {
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
              onOpenMatrix={onOpenMatrix}
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
              programName={programName}
              sets={sets.data ?? []}
              onDone={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Dòng nguồn căn cứ; ba trường nguồn có thể trống (mục tiêu bản nhẹ) nên chỉ in phần có. */
function OutcomeSource({ outcome }: { outcome: LearningOutcome }) {
  const { sourceTitle, sourceUrl, sourceLocator } = outcome;
  if (!sourceTitle && !sourceUrl && !sourceLocator) return null;
  const label = sourceTitle || sourceUrl;
  return (
    <p className="text-xs text-muted-foreground">
      Nguồn:{" "}
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {label}
        </a>
      ) : (
        label
      )}
      {sourceLocator && (label ? ` · ${sourceLocator}` : sourceLocator)}
    </p>
  );
}

function OutcomeSetCard({
  set,
  user,
  onAction,
  onOpenMatrix,
}: {
  set: OutcomeSet;
  user: { id: string; role: WebRole };
  onAction: (dialog: OutcomeDialog) => void;
  onOpenMatrix?: (setId: string) => void;
}) {
  const actions = outcomeSetActions(set, user);
  const blockers = actions.canTechnicallyApprove
    ? technicalApprovalBlockers(set)
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
        {set.reviewNote && (
          <Alert variant="warning">
            <AlertTitle>Yêu cầu điều chỉnh</AlertTitle>
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
                        outcome.sourceStatus === "VERIFIED"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {outcome.sourceStatus === "VERIFIED"
                        ? "Nguồn đã xác minh"
                        : "Nguồn chưa xác minh"}
                    </Badge>
                    <Badge variant="outline">
                      {outcome.required ? "Bắt buộc" : "Mở rộng"}
                    </Badge>
                    <Badge variant="outline">
                      {outcome.lessonLinks.length} bài học
                    </Badge>
                  </div>
                </div>
                <p className="text-sm">{outcome.statement}</p>
                <OutcomeSource outcome={outcome} />
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
                          onClick={() =>
                            onAction({ kind: "outcome", set, outcome })
                          }
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
                        onClick={() =>
                          onAction({ kind: "verify", set, outcome })
                        }
                      >
                        {outcome.sourceStatus === "VERIFIED" &&
                        outcome.verifiedById === user.id
                          ? "Xác minh lại nguồn"
                          : "Xác minh nguồn (không bắt buộc)"}
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
            Bấm “Gắn bài” để gắn mục tiêu cho nhiều bài cùng lúc. Gắn riêng từng
            bài thì dùng nút “Gắn mục tiêu” ở trang giáo trình.
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
              {onOpenMatrix && (
                <Button onClick={() => onOpenMatrix(set.id)}>Gắn bài</Button>
              )}
              <Button
                variant="outline"
                onClick={() => onAction({ kind: "outcome", set })}
              >
                Thêm mục tiêu
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction({ kind: "paste", set })}
              >
                Dán nhiều mục tiêu
              </Button>
            </>
          )}
          {actions.canTechnicallyApprove && (
            <Button
              disabled={blockers.length > 0}
              onClick={() => onAction({ kind: "technical-approve", set })}
            >
              Duyệt bộ mục tiêu
            </Button>
          )}
          {actions.canRequestChanges && (
            <Button
              variant="outline"
              onClick={() => onAction({ kind: "request-changes", set })}
            >
              Yêu cầu điều chỉnh
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
          {actions.canEditOutcomes && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 sm:ml-auto"
              onClick={() => onAction({ kind: "delete-set", set })}
            >
              Xóa bộ mục tiêu
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
  programName,
  sets,
  onDone,
}: {
  dialog: OutcomeDialog;
  programId: string;
  programName?: string;
  sets: OutcomeSet[];
  onDone: () => void;
}) {
  // Mã môn và khối chỉ cần khi thêm mục tiêu vào bộ còn trống (dựng mã đầu tiên).
  const needsProgram =
    dialog.kind === "outcome" &&
    !dialog.outcome &&
    dialog.set.outcomes.length === 0;
  const program = useLiveQuery(
    ["program-code", programId],
    (signal) => registrationApi.program(programId, signal),
    needsProgram,
  );
  const done = (message: string) => () => {
    toast.success(message);
    onDone();
  };
  if (dialog.kind === "paste") {
    return (
      <PasteOutcomesForm
        set={dialog.set}
        programId={programId}
        onClose={onDone}
      />
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
          schema={confirmOnlySchema}
          fields={[]}
          confirm={{
            title: `Xóa bộ mục tiêu ${dialog.set.level}?`,
            description: () =>
              `Bộ “${dialog.set.level}” (bản ${dialog.set.version}) và các mục tiêu trong bộ sẽ bị xóa. Không khôi phục được.`,
            confirmText: "Xóa bộ mục tiêu",
            danger: true,
          }}
          submitLabel="Xóa bộ mục tiêu"
          submitVariant="destructive"
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
          schema={confirmOnlySchema}
          fields={[]}
          confirm={{
            title: `Xóa mục tiêu ${dialog.outcome.code}?`,
            description: () =>
              `Mục tiêu “${dialog.outcome.code} · ${dialog.outcome.title}” sẽ bị xóa khỏi bộ, kể cả liên kết với các bài học. Không khôi phục được.`,
            confirmText: "Xóa mục tiêu",
            danger: true,
          }}
          submitLabel="Xóa mục tiêu"
          submitVariant="destructive"
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
            level: source?.level ?? programName ?? "",
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
    // Mã gợi ý chỉ cho mục tiêu mới; tải xong mã môn thì chỉ điền vào ô mã nếu người dùng chưa sửa (không dựng lại hộp).
    const suggestedCode = outcome
      ? ""
      : nextOutcomeCode(
          dialog.set.outcomes.map((item) => item.code),
          {
            subjectCode: program.data?.subjectRecord?.code,
            grade: program.data?.grade,
          },
        );
    return (
      <>
        <DialogHeader>
          <DialogTitle>{outcome ? `Sửa ${outcome.code}` : "Thêm mục tiêu"}</DialogTitle>
          <DialogDescription>
            Viết ngắn gọn, phụ huynh đọc là hiểu: sau khóa học, học sinh làm được gì.
            Sửa nguồn căn cứ thì nguồn trở về chưa xác minh.
          </DialogDescription>
        </DialogHeader>
        <OutcomeForm
          setId={dialog.set.id}
          outcome={outcome}
          suggestedCode={suggestedCode}
          onDone={done(outcome ? "Đã lưu mục tiêu." : "Đã thêm mục tiêu.")}
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
          {outcome.sourceUrl ? (
            <>
              Mở{" "}
              <a
                href={outcome.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {outcome.sourceTitle || outcome.sourceUrl}
              </a>
              , tìm
            </>
          ) : (
            "Mục tiêu này chưa ghi nguồn. Tìm"
          )}{" "}
          đúng yêu cầu cần đạt rồi ghi lại vị trí và cách mục tiêu cụ thể hóa yêu
          cầu đó.
        </p>
        <ApiForm
          schema={sourceReviewSchema}
          defaults={{
            sourceLocator: outcome.sourceLocator ?? "",
            sourceNote: outcome.sourceNote ?? "",
          }}
          fields={[
            { name: "sourceLocator", label: "Mục/trang trong nguồn", description: "Ví dụ “Trang 45”." },
            { name: "sourceNote", label: "Giải thích đối chiếu", type: "textarea" },
          ]}
          submitLabel="Xác minh nguồn"
          successMessage={false}
          onSubmit={(value) => outcomeApi.verifySource(outcome.id, { ...value, expectedRevision: outcome.revision })}
          onSuccess={done(`Đã xác minh nguồn ${outcome.code}.`)}
        />
      </>
    );
  }
  if (dialog.kind === "request-changes")
    return (
      <>
        <DialogHeader>
          <DialogTitle>Yêu cầu điều chỉnh bộ mục tiêu</DialogTitle>
          <DialogDescription>
            Bộ đã duyệt vẫn được dùng như cũ. Thiết kế giáo trình sẽ thấy lý do,
            tạo bản mới của bộ và gửi giáo viên duyệt lại.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={outcomeChangeRequestSchema}
          defaults={{ reason: "" }}
          fields={[{ name: "reason", label: "Cần sửa gì", type: "textarea" }]}
          submitLabel="Gửi yêu cầu điều chỉnh"
          successMessage={false}
          onSubmit={(value) => outcomeApi.requestChanges(dialog.set.id, value)}
          onSuccess={done(
            "Đã gửi yêu cầu điều chỉnh. Bộ mục tiêu hiện tại vẫn được giữ nguyên.",
          )}
        />
      </>
    );
  return (
    <>
      <DialogHeader>
        <DialogTitle>Duyệt bộ mục tiêu</DialogTitle>
        <DialogDescription>
          Bạn xác nhận các mục tiêu đúng kiến thức và mỗi mục tiêu đã có bài học
          tương ứng. Sau khi bạn duyệt, bộ dùng được ngay khi soạn và giao bài,
          không cần Quản lý duyệt thêm.
        </DialogDescription>
      </DialogHeader>
      <ApiForm
        schema={confirmOnlySchema}
        fields={[]}
        confirm={{
          title: `Duyệt ${dialog.set.level} · bản ${dialog.set.version}?`,
          description: () =>
            "Bộ mục tiêu dùng được ngay khi soạn và giao bài. Cần sửa sau này thì tạo bản mới của bộ.",
          confirmText: "Duyệt bộ mục tiêu",
        }}
        submitLabel="Duyệt bộ mục tiêu"
        successMessage={false}
        onSubmit={() => outcomeApi.technicalApprove(dialog.set.id)}
        onSuccess={done(
          "Đã duyệt bộ mục tiêu. Bộ dùng được ngay khi soạn và giao bài.",
        )}
      />
    </>
  );
}

const KIND_OPTIONS = [
  { value: "required", label: "Bắt buộc", description: "Mọi học sinh của khóa cần đạt." },
  { value: "optional", label: "Mở rộng", description: "Dành cho học sinh học thêm." },
];

function OutcomeForm({
  setId,
  outcome,
  suggestedCode,
  onDone,
}: {
  setId: string;
  outcome?: LearningOutcome;
  suggestedCode: string;
  onDone: () => void;
}) {
  const hasSource = !!(
    outcome?.sourceTitle ||
    outcome?.sourceUrl ||
    outcome?.sourceLocator ||
    outcome?.sourceNote
  );
  const [showSource, setShowSource] = useState(hasSource);
  const sourceFields = [
    { name: "sourceTitle", label: "Tên nguồn (không bắt buộc)" },
    { name: "sourceUrl", label: "Đường dẫn nguồn (không bắt buộc)" },
    {
      name: "sourceLocator",
      label: "Vị trí trong nguồn (không bắt buộc)",
      description: "Ví dụ “Trang 45”.",
    },
    { name: "sourceNote", label: "Ghi chú đối chiếu (không bắt buộc)", type: "textarea" as const },
  ];
  return (
    <div className="space-y-3 pt-1 [&_label[for]]:mb-1.5">
      <ApiForm
        schema={outcomeFormSchema}
        liveDefaults={outcome ? undefined : { code: suggestedCode }}
        defaults={{
          code: outcome?.code ?? suggestedCode,
          title: outcome?.title ?? "",
          // Mô tả trùng tên thì để trống: BE luôn có statement (lấy bằng tên).
          statement:
            outcome && outcome.statement !== outcome.title ? outcome.statement : "",
          kind: (outcome?.required ?? true) ? "required" : "optional",
          sourceTitle: outcome?.sourceTitle ?? "",
          sourceUrl: outcome?.sourceUrl ?? "",
          sourceLocator: outcome?.sourceLocator ?? "",
          sourceNote: outcome?.sourceNote ?? "",
        }}
        fields={[
          {
            name: "title",
            label: "Mục tiêu (phụ huynh sẽ đọc)",
            description: "Ví dụ “Giải được phương trình bậc nhất một ẩn”.",
          },
          {
            name: "statement",
            label: "Mô tả chi tiết (không bắt buộc)",
            type: "textarea",
          },
          { name: "kind", label: "Loại mục tiêu", type: "choices", options: KIND_OPTIONS },
          {
            name: "code",
            label: "Mã mục tiêu",
            description: outcome ? undefined : "Mã gợi ý theo thứ tự trong bộ. Bạn sửa lại được.",
          },
          ...(showSource ? sourceFields : []),
        ]}
        preview={(values) => (
          <div className="space-y-2">
            <p className="rounded-xl bg-muted p-3 text-sm">
              Phụ huynh sẽ thấy:{" "}
              <span className="font-medium">
                {String(values.title ?? "").trim() || "(chưa nhập mục tiêu)"}
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSource((value) => !value)}
            >
              {showSource ? "Ẩn nguồn căn cứ" : "Thêm nguồn căn cứ (không bắt buộc)"}
            </Button>
          </div>
        )}
        submitLabel={outcome ? "Lưu mục tiêu" : "Thêm mục tiêu"}
        successMessage={false}
        onSubmit={(value) => {
          const { kind, ...rest } = value as Record<string, unknown> & { kind: string };
          return outcomeApi.saveOutcome(
            setId,
            {
              ...rest,
              required: kind !== "optional",
              ...(outcome ? { expectedRevision: outcome.revision } : {}),
            },
            outcome?.id,
          );
        }}
        onSuccess={onDone}
      />
    </div>
  );
}

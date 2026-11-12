"use client";
import { actsAsManager } from "@/constants/roles";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
  sessionActionFormSchema as actionFormSchema,
  type SessionActionFormInput,
} from "@/lib/validators/curriculum";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SheetCloseButton } from "@/components/shared/actions/sheet-close-button";
import { DateTimeInput } from "@/components/shared/pickers/date-time-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { userFacingMessage } from "@/lib/api/error-message";
import { useCurrentUser } from "@/hooks/use-current-role";
import { SubstituteForm } from "@/features/teachers/components/substitute-form";
import type { ScheduledSessionDetail } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { sessionRange } from "../session-format";
import { SessionCancelForm } from "./session-cancel-form";
import { useCenterClosures } from "../hooks/use-center-closures";
import { isClosedDay } from "../center-closures";
import {
  sessionActionSchema,
  vietnamLocalInput,
  utcFromVietnamLocal,
  type SessionAction,
} from "../session-contract";
import {
  readAcademicAttempt,
  saveAcademicAttempt,
  clearAcademicAttempt,
  uncertainAcademicFailure,
  type AcademicAttempt,
} from "../operation-storage";

const SESSION_TABS = {
  content: "Nội dung",
  reschedule: "Đổi giờ",
  cancel: "Hủy buổi",
  substitute: "Dạy thay",
} as const;
type SessionTab = keyof typeof SESSION_TABS;
const SESSION_TAB_KEYS = Object.keys(SESSION_TABS) as SessionTab[];

/**
 * Sheet buổi học (`?session=`). Quản lý có thêm 3 tab thao tác (`?sessionTab=`); vai trò khác
 * chỉ xem Nội dung.
 */
export function SessionDetailSheet({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const isManager = actsAsManager(user?.role);
  const [tab, setTab] = useQueryState(
    "sessionTab",
    parseAsStringLiteral(SESSION_TAB_KEYS).withDefault("content"),
  );
  const activeTab: SessionTab = isManager ? tab : "content";
  const detail = useQuery({
    queryKey: ["academic-session", id],
    queryFn: ({ signal }) => curriculumApi.session(id, signal),
    enabled: !!id,
    retry: false,
  });
  const close = () => {
    void setTab(null);
    onClose();
  };
  return (
    <Sheet
      open={!!id}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
      >
        <SheetCloseButton label="Đóng chi tiết buổi học" />
        <SheetHeader className="pr-10">
          <SheetTitle>
            {detail.data?.lesson?.title ?? "Chi tiết buổi học"}
          </SheetTitle>
          <SheetDescription>
            {detail.data
              ? `${detail.data.class.name} · ${sessionRange(detail.data.startsAt, detail.data.endsAt)}`
              : "Thông tin buổi học và nội dung giảng dạy"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pt-4">
          <AsyncBoundary
            isLoading={detail.isPending}
            isError={detail.isError}
            error={detail.error}
            onRetry={() => void detail.refetch()}
          >
            {detail.data && (
              <>
                {isManager && (
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                      const next = SESSION_TAB_KEYS.find(
                        (key) => key === value,
                      );
                      if (next) void setTab(next === "content" ? null : next);
                    }}
                  >
                    <TabsList aria-label="Phần của buổi học">
                      {SESSION_TAB_KEYS.map((key) => (
                        <TabsTrigger key={key} value={key}>
                          {SESSION_TABS[key]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
                {activeTab === "content" && (
                  <SessionContent session={detail.data} />
                )}
                {isManager &&
                  user &&
                  (activeTab === "reschedule" || activeTab === "cancel") && (
                    <SessionActions
                      key={`${id}:${activeTab}`}
                      action={activeTab}
                      session={detail.data}
                      userId={user.id}
                      onDone={() => void setTab(null)}
                      onSwitchToReschedule={() => void setTab("reschedule")}
                    />
                  )}
                {isManager && activeTab === "substitute" && (
                  <SubstitutePanel
                    session={detail.data}
                    onDone={() => void setTab(null)}
                  />
                )}
              </>
            )}
          </AsyncBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SessionContent({ session }: { session: ScheduledSessionDetail }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Thời gian</dt>
          <dd className="font-medium tabular-nums">
            {sessionRange(session.startsAt, session.endsAt)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Trạng thái</dt>
          <dd>
            <StatusBadge
              category="session"
              status={session.status.toLowerCase()}
            />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Giáo viên</dt>
          <dd className="font-medium">
            {session.teacher?.displayName ?? "Chưa có tên giáo viên"}
          </dd>
        </div>
        {session.cancelReason && (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Lý do hủy</dt>
            <dd>{session.cancelReason}</dd>
          </div>
        )}
      </dl>
      <div className="space-y-2">
        <p className="text-sm font-medium">Nội dung bài học</p>
        <p className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm">
          {session.lesson?.content ?? "Chưa có nội dung bài học."}
        </p>
      </div>
    </div>
  );
}

function NotAllowed({ children }: { children: string }) {
  return (
    <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function SubstitutePanel({
  session,
  onDone,
}: {
  session: ScheduledSessionDetail;
  onDone: () => void;
}) {
  const now = useCurrentTime();
  if (session.status !== "SCHEDULED" || Date.parse(session.startsAt) <= now)
    return (
      <NotAllowed>
        Chỉ xếp dạy thay cho buổi đã lên lịch và chưa bắt đầu.
      </NotAllowed>
    );
  return <SubstituteForm sessionId={session.id} onDone={onDone} />;
}

function SessionActions({
  action,
  session,
  userId,
  onDone,
  onSwitchToReschedule,
}: {
  action: "reschedule" | "cancel";
  session: ScheduledSessionDetail;
  userId: string;
  onDone: () => void;
  onSwitchToReschedule: () => void;
}) {
  const now = useCurrentTime();
  const client = useQueryClient(),
    target = "session:" + session.id;
  const [restored] = useState(() => {
    try {
      return {
        attempt: readAcademicAttempt(userId, target, sessionActionSchema),
        error: null,
      };
    } catch (error) {
      return { attempt: null, error };
    }
  });
  const [attempt, setAttempt] = useState<AcademicAttempt<SessionAction> | null>(
    restored.attempt,
  );
  const allowed =
    session.status === "SCHEDULED" && Date.parse(session.startsAt) > now;
  const commit = useMutation({
    mutationFn: async (input: SessionAction) => {
      const operation =
        attempt ??
        saveAcademicAttempt(userId, target, sessionActionSchema, input);
      setAttempt(operation);
      return operation.body.action === "cancel"
        ? curriculumApi.cancelSession(
            session.id,
            operation.body.body,
            operation.key,
          )
        : curriculumApi.reschedule(
            session.id,
            operation.body.body,
            operation.key,
          );
    },
    retry: false,
    onSuccess: (_, input) => {
      clearAcademicAttempt(userId, target);
      setAttempt(null);
      for (const key of [
        ["academic-session", session.id],
        ["academic-calendar"],
        ["curriculum", "sessions"],
        ["academic-generations"],
        ["academic-generation"],
        ["registration-class"],
        ["curriculum", "cancel-preview"],
      ])
        void client.invalidateQueries({ queryKey: key });
      toast.success(
        input.action === "cancel" ? "Đã hủy buổi học." : "Đã đổi giờ buổi học.",
      );
      onDone();
    },
    onError: (error) => {
      if (!uncertainAcademicFailure(error)) {
        clearAcademicAttempt(userId, target);
        setAttempt(null);
      }
    },
  });
  if (attempt)
    return (
      <div className="space-y-3">
        <ApiFeedback error={restored.error ?? commit.error} />
        <p role="status" className="rounded-xl bg-muted p-3 text-sm">
          Có thao tác{" "}
          {attempt.body.action === "cancel"
            ? attempt.body.body.shiftLessons
              ? "hủy buổi và dời bài"
              : "hủy buổi"
            : "đổi giờ"}{" "}
          cần xác nhận lại. Thử lại dùng nguyên dữ liệu đã gửi (cùng cách xử lý
          bài).
        </p>
        <Button
          disabled={commit.isPending || !!restored.error}
          isLoading={commit.isPending}
          onClick={() => commit.mutate(attempt.body)}
        >
          Thử lại {attempt.body.action === "cancel" ? "hủy buổi" : "đổi giờ"}
        </Button>
      </div>
    );
  return (
    <div className="space-y-3">
      <ApiFeedback error={restored.error ?? commit.error} />
      {!allowed ? (
        <NotAllowed>
          {action === "cancel"
            ? "Chỉ hủy buổi đã lên lịch và chưa bắt đầu."
            : "Chỉ đổi giờ buổi đã lên lịch và chưa bắt đầu."}
        </NotAllowed>
      ) : action === "cancel" ? (
        !restored.error && (
          <SessionCancelForm
            key={"cancel:" + session.revision}
            session={session}
            pending={commit.isPending}
            onCommit={(input) => commit.mutate(input)}
            onSwitchToReschedule={onSwitchToReschedule}
            onClose={onDone}
          />
        )
      ) : (
        !restored.error && (
          <SessionActionForm
            key={action + ":" + session.revision}
            action={action}
            session={session}
            pending={commit.isPending}
            onCommit={(input) => commit.mutate(input)}
            onClose={onDone}
          />
        )
      )}
    </div>
  );
}
function SessionActionForm({
  action,
  session,
  pending,
  onCommit,
  onClose,
}: {
  action: "reschedule";
  session: ScheduledSessionDetail;
  pending: boolean;
  onCommit: (input: SessionAction) => void;
  onClose: () => void;
}) {
  const form = useForm<SessionActionFormInput>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      reason: "",
      startsAt: vietnamLocalInput(session.startsAt),
      endsAt: vietnamLocalInput(session.endsAt),
    },
  });
  const preview = useMutation({
    mutationFn: curriculumApi.reschedulePreview.bind(null, session.id),
    retry: false,
  });
  function input(value: SessionActionFormInput): SessionAction {
    return sessionActionSchema.parse(
      {
        action,
        body: {
          reason: value.reason,
          expectedRevision: session.revision,
          startsAt: utcFromVietnamLocal(value.startsAt),
          endsAt: utcFromVietnamLocal(value.endsAt),
        },
      },
    );
  }
  function previewMatches(value: SessionActionFormInput) {
    try {
      const parsed = input(value);
      return (
        parsed.action === "reschedule" &&
        !!preview.data &&
        JSON.stringify(parsed.body) === JSON.stringify(preview.variables)
      );
    } catch {
      return false;
    }
  }
  const values = useWatch({ control: form.control }) as SessionActionFormInput;
  const newDay = values.startsAt?.slice(0, 10) ?? "";
  const { closures } = useCenterClosures(newDay, newDay, action === "reschedule");
  const inClosure =
    action === "reschedule" && !!newDay && isClosedDay(newDay, closures);
  const busy = pending || preview.isPending;
  return (
    <form
      className="space-y-3 rounded-xl border border-border p-4"
      onSubmit={form.handleSubmit((value) => {
        try {
          const parsed = input(value);
          if (parsed.action === "reschedule" && !previewMatches(value)) return;
          onCommit(parsed);
        } catch (error) {
          form.setError("startsAt", {
            message: userFacingMessage(error, "Ngày giờ chưa hợp lệ."),
          });
        }
      })}
    >
      <p className="font-medium">Xem trước giờ học mới</p>
      {action === "reschedule" && (
        <>
          <Label htmlFor="move-start">Bắt đầu (giờ Việt Nam)</Label>
          <Controller
            control={form.control}
            name="startsAt"
            render={({ field, fieldState }) => (
              <DateTimeInput
                id="move-start"
                value={field.value ?? ""}
                disabled={busy}
                invalid={fieldState.invalid}
                onChange={(value) => {
                  field.onChange(value);
                  preview.reset();
                }}
              />
            )}
          />
          <FieldError message={form.formState.errors.startsAt?.message} />
          <Label htmlFor="move-end">Kết thúc (giờ Việt Nam)</Label>
          <Controller
            control={form.control}
            name="endsAt"
            render={({ field, fieldState }) => (
              <DateTimeInput
                id="move-end"
                value={field.value ?? ""}
                disabled={busy}
                invalid={fieldState.invalid}
                onChange={(value) => {
                  field.onChange(value);
                  preview.reset();
                }}
              />
            )}
          />
          <FieldError message={form.formState.errors.endsAt?.message} />
          <p className="text-sm text-muted-foreground">
            Chọn ngày trong cùng tháng và giữ thứ tự các buổi học.
          </p>
        </>
      )}
      <Label htmlFor="session-reason">
        Lý do đổi giờ
      </Label>
      <Textarea
        id="session-reason"
        disabled={busy}
        {...form.register("reason", { onChange: () => preview.reset() })}
      />
      <FieldError message={form.formState.errors.reason?.message} />
      <ApiFeedback error={preview.error} />
      {inClosure && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          Ngày mới nằm trong ngày nghỉ của trung tâm. Vẫn đổi được, nhưng nên chọn
          ngày khác.
        </p>
      )}
      {previewMatches(values) && (
        <p role="status">Giờ mới hợp lệ. Có thể xác nhận đổi giờ.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {action === "reschedule" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            isLoading={preview.isPending}
            onClick={form.handleSubmit((value) => {
              try {
                const parsed = input(value);
                if (parsed.action === "reschedule") preview.mutate(parsed.body);
              } catch (error) {
                form.setError("startsAt", {
                  message: userFacingMessage(error, "Ngày giờ chưa hợp lệ."),
                });
              }
            })}
          >
            Xem trước đổi giờ
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          disabled={
            busy || (action === "reschedule" && !previewMatches(values))
          }
          isLoading={pending}
        >
          Xác nhận đổi giờ
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </form>
  );
}

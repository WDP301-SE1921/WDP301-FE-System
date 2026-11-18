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
import { tetBreaks } from "@/lib/lunar-new-year";
import { isClosedDay } from "../session-slots";
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
  substitute: "Dạy thay",
} as const;
type SessionTab = keyof typeof SESSION_TABS;
const SESSION_TAB_KEYS = Object.keys(SESSION_TABS) as SessionTab[];

/**
 * Sheet buổi học (`?session=`). Quản lý có thêm 2 tab thao tác (`?sessionTab=`); vai trò khác
 * chỉ xem Nội dung. Không còn hủy buổi (19/11/2026): buổi không dạy được thì đổi giờ hoặc dạy
 * thay; `?sessionTab=` lạ (vd. link cũ `cancel`) mở tab Nội dung.
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
                {isManager && user && activeTab === "reschedule" && (
                  <SessionActions
                    key={`${id}:${activeTab}`}
                    session={detail.data}
                    userId={user.id}
                    onDone={() => void setTab(null)}
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
  session,
  userId,
  onDone,
}: {
  session: ScheduledSessionDetail;
  userId: string;
  onDone: () => void;
}) {
  const now = useCurrentTime();
  const client = useQueryClient(),
    target = "session:" + session.id;
  // A saved attempt that no longer parses (e.g. an unfinished cancel from before 19/11/2026)
  // is dropped, so the reschedule form stays usable.
  const [attempt, setAttempt] = useState<AcademicAttempt<SessionAction> | null>(
    () => {
      try {
        return readAcademicAttempt(userId, target, sessionActionSchema);
      } catch {
        clearAcademicAttempt(userId, target);
        return null;
      }
    },
  );
  const allowed =
    session.status === "SCHEDULED" && Date.parse(session.startsAt) > now;
  const commit = useMutation({
    mutationFn: async (input: SessionAction) => {
      const operation =
        attempt ??
        saveAcademicAttempt(userId, target, sessionActionSchema, input);
      setAttempt(operation);
      return curriculumApi.reschedule(
        session.id,
        operation.body.body,
        operation.key,
      );
    },
    retry: false,
    onSuccess: () => {
      clearAcademicAttempt(userId, target);
      setAttempt(null);
      for (const key of [
        ["academic-session", session.id],
        ["academic-calendar"],
        ["curriculum", "sessions"],
        ["academic-generations"],
        ["academic-generation"],
        ["registration-class"],
      ])
        void client.invalidateQueries({ queryKey: key });
      toast.success("Đã đổi giờ buổi học.");
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
        <ApiFeedback error={commit.error} />
        <p role="status" className="rounded-xl bg-muted p-3 text-sm">
          Có thao tác đổi giờ cần xác nhận lại. Thử lại dùng nguyên dữ liệu đã
          gửi.
        </p>
        <Button
          disabled={commit.isPending}
          isLoading={commit.isPending}
          onClick={() => commit.mutate(attempt.body)}
        >
          Thử lại đổi giờ
        </Button>
      </div>
    );
  return (
    <div className="space-y-3">
      <ApiFeedback error={commit.error} />
      {!allowed ? (
        <NotAllowed>Chỉ đổi giờ buổi đã lên lịch và chưa bắt đầu.</NotAllowed>
      ) : (
        <SessionActionForm
          key={"reschedule:" + session.revision}
          session={session}
          pending={commit.isPending}
          onCommit={(input) => commit.mutate(input)}
          onClose={onDone}
        />
      )}
    </div>
  );
}
function SessionActionForm({
  session,
  pending,
  onCommit,
  onClose,
}: {
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
        action: "reschedule",
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
        !!preview.data &&
        JSON.stringify(parsed.body) === JSON.stringify(preview.variables)
      );
    } catch {
      return false;
    }
  }
  const values = useWatch({ control: form.control }) as SessionActionFormInput;
  const newDay = values.startsAt?.slice(0, 10) ?? "";
  const inTetBreak = !!newDay && isClosedDay(newDay, tetBreaks(newDay, newDay));
  const busy = pending || preview.isPending;
  return (
    <form
      className="space-y-3 rounded-xl border border-border p-4"
      onSubmit={form.handleSubmit((value) => {
        try {
          const parsed = input(value);
          if (!previewMatches(value)) return;
          onCommit(parsed);
        } catch (error) {
          form.setError("startsAt", {
            message: userFacingMessage(error, "Ngày giờ chưa hợp lệ."),
          });
        }
      })}
    >
      <p className="font-medium">Xem trước giờ học mới</p>
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
      {inTetBreak && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          Ngày mới nằm trong kỳ nghỉ Tết. Vẫn đổi được, nhưng nên chọn ngày
          khác.
        </p>
      )}
      {previewMatches(values) && (
        <p role="status">Giờ mới hợp lệ. Có thể xác nhận đổi giờ.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          isLoading={preview.isPending}
          onClick={form.handleSubmit((value) => {
            try {
              preview.mutate(input(value).body);
            } catch (error) {
              form.setError("startsAt", {
                message: userFacingMessage(error, "Ngày giờ chưa hợp lệ."),
              });
            }
          })}
        >
          Xem trước đổi giờ
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={busy || !previewMatches(values)}
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

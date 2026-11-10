"use client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { SheetCloseButton } from "@/components/shared/actions/sheet-close-button";
import { AffectedSessions } from "@/components/shared/display/affected-sessions";
import { ApiFeedback, FieldError } from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { ReasonSelect } from "@/components/shared/forms/reason-select";
import { REASON_PRESETS } from "@/constants/reason-presets";
import { useVietnamDate } from "@/hooks/use-vietnam-date";
import {
  centerClosureFormSchema,
  type CenterClosureFormInput,
} from "@/lib/validators/curriculum";
import type { CenterClosure, CenterClosureResult } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { BulkCancelDialog } from "./bulk-cancel-dialog";

const display = (day: string) => day.slice(0, 10).split("-").reverse().join("/");
const rangeLabel = (row: { fromDate: string; toDate: string }) =>
  row.fromDate === row.toDate
    ? display(row.fromDate)
    : `${display(row.fromDate)} – ${display(row.toDate)}`;

/**
 * Ngày nghỉ trung tâm (B5). Ai cũng xem được; chỉ Quản lý thêm, sửa, xóa. Thêm ngày nghỉ không
 * tự hủy buổi đã có: hệ thống chỉ liệt kê các buổi nằm trong ngày nghỉ để Quản lý hủy và dời bài.
 */
export function CenterClosuresSheet({
  open,
  onOpenChange,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}) {
  const client = useQueryClient();
  const today = useVietnamDate();
  const [editing, setEditing] = useState<CenterClosure | "new" | null>(null);
  const [result, setResult] = useState<CenterClosureResult | null>(null);
  const [bulk, setBulk] = useState<Pick<CenterClosure, "fromDate" | "toDate" | "reason"> | null>(null);
  const [removing, setRemoving] = useState<CenterClosure | null>(null);
  const list = useQuery({
    queryKey: ["curriculum", "closures", "list", today],
    queryFn: ({ signal }) => curriculumApi.centerClosures({ fromDate: today }, signal),
    enabled: open,
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (row: CenterClosure) => curriculumApi.deleteClosure(row.id),
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["curriculum", "closures"] });
      toast.success("Đã xóa ngày nghỉ. Các buổi đã hủy trước đó không tự khôi phục.");
      setRemoving(null);
    },
  });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl" showCloseButton={false}>
        <SheetCloseButton label="Đóng ngày nghỉ trung tâm" />
        <SheetHeader className="pr-10">
          <SheetTitle>Ngày nghỉ trung tâm</SheetTitle>
          <SheetDescription>
            {canEdit
              ? "Ngày cả trung tâm nghỉ (lễ, Tết). Thêm ngày nghỉ không tự hủy buổi đã có; hệ thống chỉ cho bạn xem các buổi bị ảnh hưởng để hủy và dời bài."
              : "Danh sách ngày trung tâm nghỉ. Chỉ Quản lý thêm hoặc sửa."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pt-4 pb-6">
          {result && (
            <ClosureResultPanel
              result={result}
              canEdit={canEdit}
              onCancelSessions={() => setBulk(result)}
              onDismiss={() => setResult(null)}
            />
          )}
          {canEdit && !editing && (
            <Button type="button" onClick={() => setEditing("new")}>
              Thêm ngày nghỉ
            </Button>
          )}
          {canEdit && editing && (
            <ClosureForm
              key={editing === "new" ? "new" : editing.id}
              closure={editing === "new" ? null : editing}
              onCancel={() => setEditing(null)}
              onSaved={(saved) => {
                setEditing(null);
                setResult(saved);
                void client.invalidateQueries({ queryKey: ["curriculum", "closures"] });
              }}
            />
          )}
          <AsyncBoundary
            isLoading={list.isPending}
            isError={list.isError}
            error={list.error}
            onRetry={() => void list.refetch()}
          >
            {list.data?.length ? (
              <ul className="space-y-2">
                {list.data.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium tabular-nums">{rangeLabel(row)}</p>
                      <p className="text-muted-foreground">{row.reason}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBulk(row)}
                        >
                          Xem buổi bị ảnh hưởng / Hủy và dời bài
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResult(null);
                            setEditing(row);
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRemoving(row)}
                        >
                          Xóa
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Chưa có ngày nghỉ nào sắp tới.
              </p>
            )}
          </AsyncBoundary>
        </div>
      </SheetContent>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(next) => !next && setRemoving(null)}
        title="Xóa ngày nghỉ này?"
        description={
          removing
            ? `Ngày nghỉ ${rangeLabel(removing)} (${removing.reason}) sẽ bị xóa. Các buổi đã hủy trước đó không tự khôi phục.`
            : ""
        }
        confirmText="Xóa ngày nghỉ"
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={() => (removing ? remove.mutateAsync(removing).then(() => undefined) : undefined)}
      />
      {bulk && (
        <BulkCancelDialog
          range={{ fromDate: bulk.fromDate, toDate: bulk.toDate }}
          reason={bulk.reason}
          onClose={() => {
            setBulk(null);
            setResult(null);
          }}
        />
      )}
    </Sheet>
  );
}

function ClosureResultPanel({
  result,
  canEdit,
  onCancelSessions,
  onDismiss,
}: {
  result: CenterClosureResult;
  canEdit: boolean;
  onCancelSessions: () => void;
  onDismiss: () => void;
}) {
  const hidden = result.affectedTotal - result.affectedSessions.length;
  return (
    <section className="space-y-3 rounded-xl border border-border p-4" aria-live="polite">
      <p className="font-medium">
        Đã lưu ngày nghỉ {rangeLabel(result)}. Thêm ngày nghỉ không tự hủy buổi đã có.
      </p>
      {result.affectedTotal ? (
        <>
          <p className="text-sm">
            Có {result.affectedTotal} buổi đang nằm trong ngày nghỉ.
          </p>
          <AffectedSessions
            isLoading={false}
            isError={false}
            onRetry={() => undefined}
            first={{
              sessions: result.affectedSessions.map((row) => ({
                id: row.id,
                startsAt: row.startsAt,
                endsAt: row.endsAt,
                lesson: { title: `${row.className} · ${row.lesson?.title ?? "Buổi học"}` },
              })),
              tag: "Trong ngày nghỉ",
              tone: "warning",
              limit: 8,
            }}
            splitLabel=""
          />
          {hidden > 0 && (
            <p className="text-sm text-muted-foreground">
              Danh sách chỉ hiện {result.affectedSessions.length} buổi đầu; nút bên
              dưới hủy đủ cả {result.affectedTotal} buổi.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Không có buổi nào bị ảnh hưởng.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {canEdit && result.affectedTotal > 0 && (
          <Button type="button" variant="danger" onClick={onCancelSessions}>
            Hủy và dời bài
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onDismiss}>
          Để sau
        </Button>
      </div>
    </section>
  );
}

function ClosureForm({
  closure,
  onCancel,
  onSaved,
}: {
  closure: CenterClosure | null;
  onCancel: () => void;
  onSaved: (result: CenterClosureResult) => void;
}) {
  const form = useForm<CenterClosureFormInput>({
    resolver: zodResolver(centerClosureFormSchema),
    defaultValues: {
      fromDate: closure?.fromDate.slice(0, 10) ?? "",
      toDate: closure?.toDate.slice(0, 10) ?? "",
      reason: closure?.reason ?? "",
    },
  });
  const save = useMutation({
    mutationFn: (value: CenterClosureFormInput) =>
      closure
        ? curriculumApi.updateClosure(closure.id, {
            ...value,
            expectedRevision: closure.revision,
          })
        : curriculumApi.createClosure(value),
    retry: false,
    onSuccess: onSaved,
  });
  const errors = form.formState.errors;
  return (
    <form
      className="space-y-3 rounded-xl border border-border p-4"
      noValidate
      onSubmit={form.handleSubmit((value) => save.mutate(value))}
    >
      <p className="font-medium">{closure ? "Sửa ngày nghỉ" : "Thêm ngày nghỉ"}</p>
      <ApiFeedback error={save.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="closure-from">Từ ngày</Label>
          <Input id="closure-from" type="date" disabled={save.isPending} {...form.register("fromDate")} />
          <FieldError message={errors.fromDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closure-to">Đến ngày (gồm cả ngày này)</Label>
          <Input id="closure-to" type="date" disabled={save.isPending} {...form.register("toDate")} />
          <FieldError message={errors.toDate?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="closure-reason">Lý do</Label>
        <Controller
          name="reason"
          control={form.control}
          render={({ field }) => (
            <ReasonSelect
              id="closure-reason"
              value={field.value}
              onChange={field.onChange}
              presets={REASON_PRESETS.closure}
              disabled={save.isPending}
              invalid={!!errors.reason}
            />
          )}
        />
        <FieldError message={errors.reason?.message} />
      </div>
      <p className="text-sm text-muted-foreground">
        Tối đa 92 ngày một lần, không trùng ngày nghỉ khác. Hệ thống không gửi thông
        báo khi lưu ngày nghỉ.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={save.isPending}>
          Lưu
        </Button>
        <Button type="button" variant="ghost" disabled={save.isPending} onClick={onCancel}>
          Bỏ qua
        </Button>
      </div>
    </form>
  );
}

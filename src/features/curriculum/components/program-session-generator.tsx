"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { registrationApi } from "@/features/registration-flow/api";
import { useCurrentUser } from "@/hooks/use-current-role";
import { useCurrentTime } from "@/hooks/use-current-time";
import { ROUTES } from "@/constants/routes";
import { calendarDateLabel } from "@/lib/calendar-date";
import {
  scheduleRangeSchema,
  type ScheduleRangeInput,
} from "@/lib/validators/curriculum";
import type { RegistrationClass } from "@/types/backend";
import type { CurriculumUnit } from "@/types/curriculum";
import { curriculumApi } from "../api";
import {
  clearGenerationAttempt,
  getGenerationAttempt,
  readGenerationAttempt,
} from "../generation-storage";
import { sessionRange } from "../session-format";
import { SessionDetailSheet } from "./session-detail-sheet";
import {
  applicableUnits,
  generationReady,
  generateSelectedClasses,
  sameGenerationInput as sameInput,
  type ClassGenerationResult as ClassResult,
} from "../generation-plan";
export function ProgramSessionGenerator({
  initialClassId,
}: {
  initialClassId?: string;
}) {
  const [
    { programId: queryProgram, classId: legacyClass, classIds, session },
    setSelection,
  ] = useQueryStates({
    programId: parseAsString.withDefault(""),
    classId: parseAsString.withDefault(""),
    classIds: parseAsArrayOf(parseAsString),
    session: parseAsString.withDefault(""),
  });
  const context = useQuery({
    queryKey: ["curriculum", "generation-context"],
    queryFn: async () => {
      const [programs, classes] = await Promise.all([
        registrationApi.programs(),
        registrationApi.classes(),
      ]);
      return { programs, classes };
    },
    retry: false,
  });
  const legacyId = initialClassId ?? legacyClass;
  const programId =
    queryProgram ||
    context.data?.classes.find((item) => item.id === legacyId)?.programId ||
    "";
  const units = useQuery({
    queryKey: ["curriculum", "generation-units", programId],
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    enabled: !!programId,
    retry: false,
  });
  const user = useCurrentUser();
  const selector = (
    <div className="space-y-2">
      <Label htmlFor="generation-program">Khóa học</Label>
      <Select
        value={programId || null}
        items={(context.data?.programs ?? []).map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onValueChange={(value) =>
          void setSelection({
            programId: String(value ?? ""),
            classId: null,
            classIds: null,
          })
        }
      >
        <SelectTrigger id="generation-program">
          <SelectValue placeholder="Chọn khóa học" />
        </SelectTrigger>
        <SelectContent>
          {context.data?.programs.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name} · {item.subject} · Khối {item.grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Sinh lịch theo khóa"
        description="Xem trước và sinh lịch lần lượt cho các lớp của khóa. Mỗi lớp có kết quả riêng."
        actions={
          <Button
            variant="outline"
            render={<Link href={ROUTES.MANAGER.SCHEDULE} />}
          >
            Lịch học
          </Button>
        }
      />
      <AsyncBoundary
        isLoading={context.isPending}
        isError={context.isError}
        error={context.error}
        onRetry={() => void context.refetch()}
      >
        {!programId ? (
          <Card>
            <CardContent className="space-y-4">
              {selector}
              <EmptyState
                title="Chọn khóa để sinh lịch"
                description="Giáo trình đã duyệt và các lớp của khóa sẽ hiện ở đây."
              />
            </CardContent>
          </Card>
        ) : (
          <AsyncBoundary
            isLoading={units.isPending}
            isError={units.isError}
            error={units.error}
            onRetry={() => void units.refetch()}
          >
            {units.data && user && (
              <GenerationWorkspace
                key={`${user.id}:${programId}`}
                userId={user.id}
                units={units.data}
                sessionsPerWeek={context.data?.programs.find((item) => item.id === programId)?.sessionsPerWeek}
                classes={(context.data?.classes ?? []).filter(
                  (item) =>
                    item.programId === programId && item.isActive !== false,
                )}
                selectedIds={classIds ?? (legacyId ? [legacyId] : [])}
                onSelection={(ids) =>
                  void setSelection({ programId, classId: null, classIds: ids })
                }
                selector={selector}
              />
            )}
          </AsyncBoundary>
        )}
      </AsyncBoundary>
      {session && (
        <SessionDetailSheet
          id={session}
          onClose={() => void setSelection({ session: null })}
        />
      )}
    </PageContainer>
  );
}
function GenerationWorkspace({
  userId,
  units,
  classes,
  selectedIds,
  onSelection,
  selector,
  sessionsPerWeek,
}: {
  userId: string;
  units: CurriculumUnit[];
  classes: RegistrationClass[];
  selectedIds: string[];
  onSelection: (ids: string[]) => void;
  selector: React.ReactNode;
  sessionsPerWeek?: number | null;
}) {
  const approved = units.filter((unit) => unit.status === "APPROVED");
  const first = approved[0];
  const form = useForm<ScheduleRangeInput>({
    resolver: zodResolver(scheduleRangeSchema),
    defaultValues: {
      curriculumUnitId: "",
      fromDate: first?.fromDate.slice(0, 10) ?? "",
      toDate: first?.toDate.slice(0, 10) ?? "",
    },
  });
  const values = useWatch({ control: form.control }) as ScheduleRangeInput;
  const covering = applicableUnits(units, values.fromDate, values.toDate);
  const unitId = covering.length === 1 ? covering[0].id : "";
  const input = { ...values, curriculumUnitId: unitId };
  const selected = classes.filter((item) => selectedIds.includes(item.id));
  const [results, setResults] = useState<Record<string, ClassResult>>(() => {
    const restored: Record<string, ClassResult> = {};
    if (typeof sessionStorage === "undefined") return restored;
    for (const classroom of classes) {
      try {
        const attempt = readGenerationAttempt(userId, classroom.id);
        if (attempt) restored[classroom.id] = { input: attempt.body, attempt };
      } catch { /* Storage problems are shown when preview is requested. */ }
    }
    return restored;
  });
  const [busy, setBusy] = useState<"preview" | "generate" | null>(null);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const client = useQueryClient();
  const now = useCurrentTime();
  const counts = new Set(classes.map((item) => item.weeklySchedules.length));
  const contextVersion = JSON.stringify([sessionsPerWeek, units.map((unit) => [unit.id, unit.revision, unit.status, unit.fromDate, unit.toDate]), classes.map((item) => [item.id, item.weeklySchedules])]);
  const selectionValid = covering.length === 1 && sessionsPerWeek != null && selected.every((item) => item.weeklySchedules.length === sessionsPerWeek);
  const ready = (result: ClassResult | undefined) =>
    generationReady(result, input, now) && (!!result?.attempt || (selectionValid && result?.contextVersion === contextVersion));
  async function previewAll(value: ScheduleRangeInput) {
    if (lock.current || !selected.length || !selectionValid) return;
    lock.current = true;
    setBusy("preview");
    setNotice("");
    try {
      for (const classroom of selected) {
        if (
          results[classroom.id]?.generated !== undefined &&
          sameInput(results[classroom.id].input, value)
        )
          continue;
        let row: ClassResult = { input: value, contextVersion };
        try {
          const attempt = readGenerationAttempt(userId, classroom.id);
          row = attempt
            ? { input: attempt.body, attempt }
            : {
                input: value,
                contextVersion,
                preview: await curriculumApi.preview(classroom.id, value),
              };
        } catch (error) {
          row.error = error;
        }
        setResults((previous) => ({ ...previous, [classroom.id]: row }));
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function generateAll() {
    if (lock.current) return;
    lock.current = true;
    setBusy("generate");
    setNotice("");
    try {
      const { succeeded, failed } = await generateSelectedClasses(
        selected.filter((item) => ready(results[item.id])).map((item) => item.id),
        results,
        input,
        {
          getAttempt: (id, body) => getGenerationAttempt(userId, id, body),
          clearAttempt: (id) => clearGenerationAttempt(userId, id),
          generate: curriculumApi.generate,
          onResult: (id, result) =>
            setResults((previous) => ({ ...previous, [id]: result })),
          now: Date.now,
        },
      );
      setNotice(
        `${succeeded} lớp đã sinh lịch${failed ? ` · ${failed} lớp cần kiểm tra và thử lại` : ""}.`,
      );
      await Promise.all(
        [
          "curriculum",
          "academic-calendar",
          "academic-generations",
          "registration-class",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Thiết lập lịch</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              form.setValue("curriculumUnitId", unitId);
              void form.handleSubmit(previewAll)(event);
            }}
          >
            <fieldset disabled={!!busy} className="space-y-4">
              {selector}
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fromDate", "Từ ngày"],
                    ["toDate", "Đến ngày"],
                  ] as const
                ).map(([name, label]) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={`generate-${name}`}>{label}</Label>
                    <Input
                      id={`generate-${name}`}
                      type="date"
                      {...form.register(name, {
                        onChange: () => form.setValue("curriculumUnitId", ""),
                      })}
                    />
                    <FieldError
                      message={form.formState.errors[name]?.message}
                    />
                  </div>
                ))}
              </div>
              {covering.length === 1 ? (
                <div className="space-y-1 rounded-xl bg-primary/5 p-3 text-sm">
                  <p className="font-medium">{covering[0].title}</p>
                  <p className="text-muted-foreground">
                    Tự chọn giáo trình đã duyệt, hiệu lực phủ khoảng ngày.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="generation-unit">Giáo trình áp dụng</Label>
                  <p className="text-xs text-muted-foreground">
                    {covering.length > 1
                      ? "Có nhiều giáo trình cùng hiệu lực. Tải lại dữ liệu và báo Quản lý xử lý xung đột trước khi sinh lịch."
                      : "Không có giáo trình đã duyệt phủ trọn khoảng ngày. Nếu khoảng đi qua hai kỳ, chia thành từng khoảng thuộc một giáo trình."}
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => void client.invalidateQueries({ queryKey: ["curriculum"] })}>Tải lại giáo trình</Button>
                </div>
              )}
              <FieldError
                message={form.formState.errors.curriculumUnitId?.message}
              />
              {!approved.length && (
                <p className="text-sm text-muted-foreground">
                  Khóa chưa có giáo trình đã duyệt.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {sessionsPerWeek == null ? "Khóa chưa cấu hình số buổi/tuần. Quản lý cần cập nhật khóa trước khi sinh lịch." : `Chuẩn khóa: ${sessionsPerWeek} buổi/tuần. Lớp lệch chuẩn cần sửa lịch trước khi sinh.`}
              </p>
              <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-medium">
                  Lớp của khóa
                </legend>
                {classes.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="flex items-start gap-3 rounded-xl border p-3"
                  >
                    <Checkbox
                      id={`generate-class-${classroom.id}`}
                      checked={selectedIds.includes(classroom.id)}
                      onCheckedChange={(checked) =>
                        onSelection(
                          checked
                            ? [...selectedIds, classroom.id]
                            : selectedIds.filter((id) => id !== classroom.id),
                        )
                      }
                    />
                    <Label
                      htmlFor={`generate-class-${classroom.id}`}
                      className="block min-w-0 space-y-1"
                    >
                      <span className="block">{classroom.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {classroom.weeklySchedules.length} buổi/tuần
                        {sessionsPerWeek != null && classroom.weeklySchedules.length !== sessionsPerWeek && ` · Chưa đủ chuẩn ${sessionsPerWeek} buổi`}
                      </span>
                    </Label>
                  </div>
                ))}
                {!classes.length && (
                  <p className="text-sm text-muted-foreground">
                    Khóa chưa có lớp đang hoạt động.
                  </p>
                )}
              </fieldset>
              {counts.size > 1 && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  Các lớp có số buổi/tuần khác nhau. Kiểm tra số bài dự kiến của
                  từng lớp trước khi sinh lịch.
                </p>
              )}
              <Button
                type="submit"
                disabled={!selected.length || !selectionValid}
                isLoading={busy === "preview"}
              >
                Xem trước {selected.length} lớp
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
      <section className="min-w-0 space-y-4" aria-label="Xem trước theo lớp">
        {!selected.length && (
          <Card>
            <CardContent>
              <EmptyState title="Chọn các lớp cần sinh lịch" />
            </CardContent>
          </Card>
        )}
        {selected.map((classroom) => {
          const row = results[classroom.id];
          const matching = row && sameInput(row.input, input);
          const preview = matching ? row.preview : undefined;
          const slots = preview?.slots ?? [];
          const visible =
            slots.length > 4
              ? [...slots.slice(0, 3), slots[slots.length - 1]]
              : slots;
          const conflicts = slots.filter((slot) => slot.conflicts.length);
          return (
            <Card key={classroom.id} className="min-w-0">
              <CardHeader>
                <CardTitle>{classroom.name}</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 space-y-3">
                {row?.generated !== undefined ? (
                  <p role="status" className="text-sm text-primary">
                    Đã sinh {row.generated} buổi ·{" "}
                    {calendarDateLabel(row.input.fromDate)} –{" "}
                    {calendarDateLabel(row.input.toDate)}
                  </p>
                ) : row?.attempt ? (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    Lịch chưa xác nhận:{" "}
                    {calendarDateLabel(row.attempt.body.fromDate)} –{" "}
                    {calendarDateLabel(row.attempt.body.toDate)}. Thử lại giữ
                    nguyên dữ liệu của thao tác này.
                  </p>
                ) : !matching || !preview ? (
                  <p className="text-sm text-muted-foreground">
                    Xem trước để kiểm tra lịch và tiếp tục thao tác chưa hoàn
                    tất.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{slots.length} buổi</Badge>
                      <Badge variant={conflicts.length ? "danger" : "success"}>
                        {conflicts.length} buổi có xung đột
                      </Badge>
                    </div>
                    {Date.parse(preview.expiresAt) <= now && (
                      <p className="text-sm text-destructive">
                        Bản xem trước đã hết hạn. Hãy xem trước lại.
                      </p>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Bài học</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((slot) => (
                          <TableRow key={slot.startsAt}>
                            <TableCell className="text-xs">
                              {sessionRange(slot.startsAt, slot.endsAt)}
                            </TableCell>
                            <TableCell className="max-w-72 whitespace-normal">
                              {slot.lessonTitle}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {slots.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        Hiện 3 buổi đầu và buổi cuối, còn {slots.length - 4}{" "}
                        buổi ở giữa.
                      </p>
                    )}
                    {conflicts.map((slot) => (
                      <p
                        key={slot.startsAt}
                        className="text-sm text-destructive"
                      >
                        Trùng lịch tại{" "}
                        {sessionRange(slot.startsAt, slot.endsAt)}. Xử lý xung
                        đột rồi xem trước lại.
                      </p>
                    ))}
                  </>
                )}
                <ApiFeedback error={row?.error} />
              </CardContent>
            </Card>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Lớp đã sinh thành công được giữ nguyên khi thử lại lớp lỗi.
          </p>
          <Button
            disabled={
              !!busy || !selected.some((item) => ready(results[item.id]))
            }
            isLoading={busy === "generate"}
            onClick={() => void generateAll()}
          >
            Sinh lịch cho{" "}
            {selected.filter((item) => ready(results[item.id])).length} lớp
          </Button>
        </div>
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}

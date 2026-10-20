"use client";

import { useQuery } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import {
  curriculumUnitSchema,
  type CurriculumUnitInput,
} from "@/lib/validators/curriculum";
import { registrationApi } from "@/features/registration-flow/api";
import type { CurriculumUnit } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { useCurriculumMutation } from "../hooks/use-curriculum";
import { useCurriculumUnits } from "../hooks/use-curriculum";
import { canCopyCurriculum, estimateLessons } from "../workspace-selectors";
import { sessionsInRange } from "../readiness";
import { useVietnamDate } from "@/hooks/use-vietnam-date";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  useCurriculumFormState,
  type CurriculumFormState,
} from "../hooks/use-curriculum-form";

export function UnitForm({
  unit,
  programId,
  onSaved,
  onStateChange,
}: {
  unit?: CurriculumUnit;
  programId?: string;
  onSaved: (id: string, source?: "csv") => void;
  onStateChange?: (state: CurriculumFormState) => void;
}) {
  const role = useCurrentRole();
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const form = useForm<CurriculumUnitInput>({
    resolver: zodResolver(curriculumUnitSchema),
    defaultValues: {
      programId: unit?.programId ?? programId ?? "",
      title: unit?.title ?? "",
      fromDate: unit?.fromDate.slice(0, 10) ?? "",
      toDate: unit?.toDate.slice(0, 10) ?? "",
    },
  });
  const [source, setSource] = useQueryState(
    "lessonSource",
    parseAsStringLiteral(["copy", "csv", "empty"]).withDefault("empty"),
  );
  const [copySource, setCopySource] = useQueryState("copySource", parseAsString.withDefault(""));
  const selectedProgram = useWatch({
    control: form.control,
    name: "programId",
  });
  const fromDate = useWatch({ control: form.control, name: "fromDate" });
  const toDate = useWatch({ control: form.control, name: "toDate" });
  const sources = useCurriculumUnits(selectedProgram || undefined);
  const canReadClasses =
    role === "center_manager" || role === "teacher" || role === "staff";
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    enabled: canReadClasses,
    retry: false,
  });
  const today = useVietnamDate();
  const copyCandidates = (sources.data ?? [])
    .filter((item) => item.programId === selectedProgram && canCopyCurriculum(item))
    .sort((a, b) => b.fromDate.localeCompare(a.fromDate) || b.version - a.version);
  const sourceUnit = copyCandidates.find((item) => item.id === copySource)
    ?? copyCandidates.find((item) => item.status === "APPROVED" && item.fromDate.slice(0, 10) <= today && item.toDate.slice(0, 10) >= today)
    ?? copyCandidates.find((item) => item.toDate.slice(0, 10) < today)
    ?? copyCandidates[0];
  // Chi tiết khóa có lớp + lịch tuần + giáo viên (BE 19/10), đọc được cả với Thiết kế giáo trình.
  const programDetail = useQuery({
    queryKey: ["curriculum", "program-readiness", selectedProgram],
    queryFn: ({ signal }) => registrationApi.program(selectedProgram, signal),
    enabled: !!selectedProgram,
    retry: false,
  });
  const detailClasses = (programDetail.data?.classes ?? []).filter(
    (item) => item.isActive,
  );
  const detailHasSchedules =
    !!programDetail.data?.classes &&
    detailClasses.every((item) => item.weeklySchedules !== undefined);
  const programClasses = detailHasSchedules
    ? detailClasses.map((item) => ({
        isActive: item.isActive,
        weeklySchedules: item.weeklySchedules ?? [],
      }))
    : (canReadClasses ? (classes.data ?? []) : []).filter(
        (item) => item.programId === selectedProgram,
      );
  const frequency = programDetail.data?.sessionsPerWeek;
  const estimate = estimateLessons(fromDate, toDate, programClasses, frequency);
  const exactNeeds =
    estimate && detailHasSchedules
      ? detailClasses
          .filter((item) => item.weeklySchedules?.length)
          .map((item) =>
            sessionsInRange(item.weeklySchedules ?? [], fromDate, toDate),
          )
      : [];
  const readinessNote = !programDetail.data
    ? ""
    : !detailClasses.length
      ? `Khóa ${programDetail.data.name} chưa có lớp. Vẫn soạn bản nháp được, nhưng chỉ gửi thẩm định khi khóa có lớp đã phân công giáo viên — báo Quản lý tạo lớp cho khóa này.`
      : detailClasses.every((item) => item.teacherId === null)
        ? `Các lớp của khóa ${programDetail.data.name} chưa có giáo viên phụ trách. Vẫn soạn bản nháp được, nhưng chỉ gửi thẩm định khi có giáo viên.`
        : "";
  const overlapping = (sources.data ?? []).filter(
    (item) =>
      item.id !== unit?.id &&
      // Auto-archived periods stay authoritative for their dates (BE-2).
      (item.status === "APPROVED" || item.archiveReason === "SUPERSEDED") &&
      item.programId === selectedProgram &&
      fromDate &&
      toDate &&
      item.fromDate.slice(0, 10) <= toDate &&
      item.toDate.slice(0, 10) >= fromDate,
  );
  const save = useCurriculumMutation(async (input: CurriculumUnitInput) => {
    const result = unit
      ? await curriculumApi.update(unit.id, input, unit.revision)
      : source === "copy" && sourceUnit
        ? await curriculumApi.revise(sourceUnit.id, {
            title: input.title,
            fromDate: input.fromDate,
            toDate: input.toDate,
          })
        : await curriculumApi.create(input);
    onSaved(result.id, !unit && source === "csv" ? "csv" : undefined);
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => {
        if (!unit && source === "copy" && (!sourceUnit || input.fromDate <= today || input.fromDate <= sourceUnit.toDate.slice(0, 10))) {
          form.setError("fromDate", {message: "Chọn kỳ bắt đầu sau kỳ nguồn và sau hôm nay."});
          return;
        }
        save.mutate(input);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="unit-program">Khóa học</Label>
        <Controller
          control={form.control}
          name="programId"
          render={({ field }) => (
            <Select
              value={field.value || null}
              items={programs.data?.map((program) => ({
                value: program.id,
                label: `${program.name} · ${program.subject} · Khối ${program.grade}`,
              }))}
              onValueChange={(value) => field.onChange(value ?? "")}
              disabled={!!unit || programs.isPending || save.isPending}
            >
              <SelectTrigger id="unit-program">
                <SelectValue placeholder="Chọn khóa học" />
              </SelectTrigger>
              <SelectContent>
                {programs.data?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} · {program.subject} · Khối {program.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={form.formState.errors.programId?.message} />
        <ApiFeedback
          error={programs.error}
          retry={() => void programs.refetch()}
        />
        {readinessNote && (
          <p
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/60 dark:text-amber-200"
          >
            {readinessNote}
          </p>
        )}
      </div>
      {!unit && (
        <div className="space-y-2">
          <Label>Bài học lấy từ</Label>
          <Select
            value={source}
            items={{
              copy: "Sao chép giáo trình đã duyệt",
              csv: "Nhập từ CSV",
              empty: "Soạn từ đầu",
            }}
            onValueChange={(value) => void setSource(value as typeof source)}
            disabled={save.isPending}
          >
            <SelectTrigger aria-label="Nguồn bài học">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="copy" disabled={!sourceUnit}>
                Sao chép giáo trình đã duyệt
              </SelectItem>
              <SelectItem value="csv">Nhập từ CSV</SelectItem>
              <SelectItem value="empty">Soạn từ đầu</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {source === "copy"
              ? sourceUnit
                ? `Sao chép từ ${sourceUnit.title} · ${sourceUnit._count?.lessons ?? "chưa rõ số"} bài. Bản nguồn được giữ nguyên.`
                : "Khóa học chưa có nguồn đã duyệt được phép sao chép."
              : source === "csv"
                ? "Tạo bản trống, sau đó mở bước xem trước CSV."
                : "Tạo bản trống và thêm từng bài học."}
          </p>
          {source === "copy" && !!copyCandidates.length && (
            <div className="space-y-2">
              <Label htmlFor="unit-copy-source">Giáo trình nguồn</Label>
              <Select value={sourceUnit?.id ?? null}
                items={copyCandidates.map((item) => ({ value: item.id, label: `${item.title} · v${item.version}${item.status === "ARCHIVED" ? " · Đã lưu trữ" : ""}` }))}
                onValueChange={(value) => void setCopySource(typeof value === "string" ? value : "")}>
                <SelectTrigger id="unit-copy-source"><SelectValue /></SelectTrigger>
                <SelectContent>{copyCandidates.map((item) => <SelectItem key={item.id} value={item.id}>{item.title} · v{item.version}{item.status === "ARCHIVED" ? " · Đã lưu trữ" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <ApiFeedback
            error={sources.error}
            retry={() => void sources.refetch()}
          />
        </div>
      )}
      <section
        className="space-y-2 rounded-xl bg-muted p-4 text-sm"
        aria-label="Kiểm tra số bài cần"
      >
        <p className="font-medium">Kiểm tra trước khi {unit ? "lưu" : "tạo"}</p>
        <div className="space-y-1">
          <Label htmlFor="unit-weekly-count">Số buổi/tuần</Label>
          <Input
            id="unit-weekly-count"
            readOnly
            value={frequency ?? ""}
            placeholder="Chưa cấu hình"
          />
          <p className="text-xs text-muted-foreground">
            {frequency == null ? "Quản lý cần cấu hình số buổi/tuần tại khóa học." : "Chuẩn của khóa học; Quản lý thay đổi tại thông tin khóa."}
          </p>
        </div>
        {estimate ? (
          <>
            <p>
              {estimate.weeks} tuần học (làm tròn lên theo khoảng hiệu lực).
            </p>
            {exactNeeds.length ? (
              <p>
                Cần{" "}
                <b>
                  {Math.min(...exactNeeds) === Math.max(...exactNeeds)
                    ? Math.max(...exactNeeds)
                    : `${Math.min(...exactNeeds)}–${Math.max(...exactNeeds)}`}{" "}
                  bài
                </b>{" "}
                (mỗi buổi một bài) theo lịch tuần của {exactNeeds.length} lớp
                đang hoạt động · {estimate.minWeekly === estimate.maxWeekly
                  ? estimate.minWeekly
                  : `${estimate.minWeekly}–${estimate.maxWeekly}`}{" "}
                buổi/tuần.
              </p>
            ) : estimate.min !== null ? (
              <p>
                Ước tính{" "}
                {estimate.min === estimate.max
                  ? estimate.min
                  : `${estimate.min}–${estimate.max}`}{" "}
                bài ·{" "}
                {estimate.minWeekly === estimate.maxWeekly
                  ? estimate.minWeekly
                  : `${estimate.minWeekly}–${estimate.maxWeekly}`}{" "}
                buổi/tuần {estimate.source === "course" ? "theo chuẩn khóa, số tuần làm tròn." : "theo lịch các lớp đang hoạt động."}
              </p>
            ) : (
              <p>Chưa có lịch tuần của lớp để ước tính số bài cần.</p>
            )}
            {estimate.min !== estimate.max && (
              <p>
                Các lớp có số buổi/tuần khác nhau. Kiểm tra từng lớp khi sinh
                lịch.
              </p>
            )}
          </>
        ) : (
          <p>Chọn khoảng ngày hợp lệ để ước tính số bài cần.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Ước tính tham khảo; lịch nghỉ và ngày học thực tế được kiểm tra khi
          sinh lịch.
        </p>
        {!!overlapping.length && (
          <p className="text-amber-700 dark:text-amber-300">
            Khoảng ngày chồng với bản đã duyệt:{" "}
            {overlapping.map((item) => item.title).join(", ")}.
          </p>
        )}
        {source === "copy" &&
          sourceUnit &&
          estimate?.min !== null &&
          estimate?.min !== undefined &&
          sourceUnit._count?.lessons !== undefined && (
            <p>
              Bản nguồn có {sourceUnit._count.lessons} bài. Sau khi sao chép,
              kiểm tra và điều chỉnh số bài theo lịch lớp.
            </p>
          )}
        {canReadClasses && <ApiFeedback
          error={classes.error}
          retry={() => void classes.refetch()}
        />}
      </section>
      <div className="space-y-2">
        <Label htmlFor="unit-title">Tên giáo trình / học kỳ</Label>
        <Input
          id="unit-title"
          placeholder="Ví dụ: Toán 8 – Học kỳ II năm học 2026–2027"
          disabled={save.isPending}
          aria-invalid={!!form.formState.errors.title}
          aria-describedby="unit-title-error"
          {...form.register("title")}
        />
        <div id="unit-title-error">
          <FieldError message={form.formState.errors.title?.message} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unit-from">Từ ngày</Label>
          <Input
            id="unit-from"
            type="date"
            disabled={save.isPending}
            aria-invalid={!!form.formState.errors.fromDate}
            aria-describedby="unit-from-error"
            {...form.register("fromDate")}
          />
          <div id="unit-from-error">
            <FieldError message={form.formState.errors.fromDate?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit-to">Đến ngày</Label>
          <Input
            id="unit-to"
            type="date"
            disabled={save.isPending}
            aria-invalid={!!form.formState.errors.toDate}
            aria-describedby="unit-to-error"
            {...form.register("toDate")}
          />
          <div id="unit-to-error">
            <FieldError message={form.formState.errors.toDate?.message} />
          </div>
        </div>
      </div>
      <ApiFeedback error={save.error} />
      <Button
        type="submit"
        isLoading={save.isPending}
        disabled={
          save.isPending ||
          (!unit && source === "copy" && (!sourceUnit || sources.isPending || sources.isError))
        }
      >
        {unit ? "Lưu giáo trình" : "Tạo giáo trình nháp"}
      </Button>
    </form>
  );
}

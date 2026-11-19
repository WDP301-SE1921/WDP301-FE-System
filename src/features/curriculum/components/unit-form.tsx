"use client";

import { useEffect, useState } from "react";
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
import { canCopyCurriculum, suggestUnitTitle } from "../workspace-selectors";
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
    },
  });
  // Tên điền sẵn theo khóa (hoặc bản nguồn) cho tới khi người dùng tự sửa.
  const [titleEdited, setTitleEdited] = useState(!!unit);
  const [source, setSource] = useQueryState(
    "lessonSource",
    parseAsStringLiteral(["copy", "csv", "empty"]).withDefault("empty"),
  );
  const [copySource, setCopySource] = useQueryState("copySource", parseAsString.withDefault(""));
  const selectedProgram = useWatch({
    control: form.control,
    name: "programId",
  });
  const sources = useCurriculumUnits(selectedProgram || undefined);
  const copyCandidates = (sources.data ?? [])
    .filter((item) => item.programId === selectedProgram && canCopyCurriculum(item))
    .sort((a, b) => b.version - a.version);
  // Mặc định sao chép bản đang áp dụng, không có thì bản mới nhất.
  const sourceUnit = copyCandidates.find((item) => item.id === copySource)
    ?? copyCandidates.find((item) => item.status === "APPROVED")
    ?? copyCandidates[0];
  const program = programs.data?.find((item) => item.id === selectedProgram);
  const suggestedTitle = suggestUnitTitle(
    program?.name,
    source === "copy" ? sourceUnit?.title : undefined,
  );
  useEffect(() => {
    if (titleEdited || !suggestedTitle) return;
    form.setValue("title", suggestedTitle, {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [titleEdited, suggestedTitle, form]);
  // Chi tiết khóa có lớp + lịch tuần + giáo viên (BE 19/10), đọc được cả với Thiết kế giáo trình.
  const programDetail = useQuery({
    queryKey: ["curriculum", "program-readiness", selectedProgram],
    queryFn: ({ signal }) => registrationApi.program(selectedProgram, signal),
    enabled: !!selectedProgram,
    retry: false,
  });
  const frequency = programDetail.data?.sessionsPerWeek;
  const save = useCurriculumMutation(async (input: CurriculumUnitInput) => {
    const result = unit
      ? await curriculumApi.update(unit.id, input, unit.revision)
      : source === "copy" && sourceUnit
        ? await curriculumApi.revise(sourceUnit.id, { title: input.title })
        : await curriculumApi.create(input);
    onSaved(result.id, !unit && source === "csv" ? "csv" : undefined);
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <form
      // Ô nhập không kéo quá ~670px khi form nằm ở khung rộng (xếp trên bảng, bước khóa học).
      className="max-w-2xl space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
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
                items={copyCandidates.map((item) => ({ value: item.id, label: `${item.title} · bản ${item.version}${item.status === "ARCHIVED" ? " · Đã lưu trữ" : ""}` }))}
                onValueChange={(value) => void setCopySource(typeof value === "string" ? value : "")}>
                <SelectTrigger id="unit-copy-source"><SelectValue /></SelectTrigger>
                <SelectContent>{copyCandidates.map((item) => <SelectItem key={item.id} value={item.id}>{item.title} · bản {item.version}{item.status === "ARCHIVED" ? " · Đã lưu trữ" : ""}</SelectItem>)}</SelectContent>
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
        aria-label="Kiểm tra trước khi lưu"
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
        {source === "copy" &&
          sourceUnit &&
          sourceUnit._count?.lessons !== undefined && (
            <p>
              Bản nguồn có {sourceUnit._count.lessons} bài. Sau khi sao chép,
              kiểm tra và điều chỉnh nội dung các bài.
            </p>
          )}
      </section>
      <div className="space-y-2">
        <Label htmlFor="unit-title">Tên giáo trình</Label>
        <Input
          id="unit-title"
          placeholder="Ví dụ: Giáo trình Toán 8"
          disabled={save.isPending}
          aria-invalid={!!form.formState.errors.title}
          aria-describedby="unit-title-error"
          {...form.register("title", {
            onChange: () => setTitleEdited(true),
          })}
        />
        <div id="unit-title-error">
          <FieldError message={form.formState.errors.title?.message} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Không cần nhập ngày. Khi Quản lý duyệt, giáo trình này dùng cho mọi lớp tạo lịch sau đó;
        lớp đang học bản cũ học tiếp tới hết bài. Ngày bắt đầu học nhập ở bước tạo lịch của lớp.
      </p>
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

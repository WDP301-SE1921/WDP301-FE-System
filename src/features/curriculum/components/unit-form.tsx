"use client";

import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
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
  onSaved: (id: string) => void;
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
      fromDate: unit?.fromDate.slice(0, 10) ?? "",
      toDate: unit?.toDate.slice(0, 10) ?? "",
    },
  });
  const save = useCurriculumMutation(async (input: CurriculumUnitInput) => {
    const result = unit
      ? await curriculumApi.update(unit.id, input, unit.revision)
      : await curriculumApi.create(input);
    onSaved(result.id);
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <div className="space-y-2">
        <Label htmlFor="unit-program">Chương trình</Label>
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
        disabled={save.isPending}
      >
        {unit ? "Lưu học phần" : "Tạo học phần nháp"}
      </Button>
    </form>
  );
}

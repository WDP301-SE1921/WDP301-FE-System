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

export function UnitForm({
  unit,
  programId,
  onSaved,
}: {
  unit?: CurriculumUnit;
  programId?: string;
  onSaved: (id: string) => void;
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
      ? await curriculumApi.update(unit.id, input)
      : await curriculumApi.create(input);
    onSaved(result.id);
    return result;
  });
  return (
    <form
      className="space-y-4"
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
                <SelectValue placeholder="Chọn môn và khối" />
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
        <Label htmlFor="unit-title">Tên học phần</Label>
        <Input id="unit-title" {...form.register("title")} />
        <FieldError message={form.formState.errors.title?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unit-from">Từ ngày</Label>
          <Input id="unit-from" type="date" {...form.register("fromDate")} />
          <FieldError message={form.formState.errors.fromDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit-to">Đến ngày</Label>
          <Input id="unit-to" type="date" {...form.register("toDate")} />
          <FieldError message={form.formState.errors.toDate?.message} />
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

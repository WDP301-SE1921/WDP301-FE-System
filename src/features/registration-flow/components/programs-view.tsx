"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { toast } from "@/components/ui/toast";
import { apiRequest } from "@/lib/api/client";
import { registrationApi } from "../api";
import { programSchema, type ProgramInput } from "../schemas";
import { ApiFeedback, FieldError, SELECT_CLASS } from "./api-feedback";
import type { RegistrationProgram } from "@/types/backend";

export function RegistrationProgramsView() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const form = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: { name: "", subject: "", grade: 6 },
  });
  const create = useMutation({
    mutationFn: (input: ProgramInput) =>
      apiRequest<RegistrationProgram>("programs", {
        method: "POST",
        body: input,
      }),
    retry: false,
    onSuccess: () => {
      form.reset();
      void queryClient.invalidateQueries({
        queryKey: ["registration-programs"],
      });
      toast.success("Đã tạo chương trình.");
    },
  });
  return (
    <PageContainer>
      <PageHeader
        title="Chương trình theo khối và môn"
        description="Tạo chương trình trước khi mở lớp và cấu hình lịch tuần."
      />
      <Card>
        <CardHeader>
          <CardTitle>Tạo chương trình</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((input) => create.mutate(input))}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="program-name">Tên chương trình</Label>
                <Input id="program-name" {...form.register("name")} />
                <FieldError message={form.formState.errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-subject">Môn học</Label>
                <Input
                  id="program-subject"
                  placeholder="Toán"
                  {...form.register("subject")}
                />
                <FieldError message={form.formState.errors.subject?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-grade">Khối</Label>
                <select
                  id="program-grade"
                  className={SELECT_CLASS}
                  {...form.register("grade", { valueAsNumber: true })}
                >
                  {[6, 7, 8, 9].map((grade) => (
                    <option key={grade} value={grade}>
                      Khối {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ApiFeedback error={create.error} />
            <Button type="submit" isLoading={create.isPending}>
              Tạo chương trình
            </Button>
          </form>
        </CardContent>
      </Card>
      <ApiFeedback error={query.error} retry={() => void query.refetch()} />
      {query.isPending && (
        <p className="text-sm text-muted-foreground">Đang tải chương trình…</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.data?.map((program) => (
          <Card key={program.id}>
            <CardHeader>
              <CardTitle>{program.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {program.subject} · Khối {program.grade}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {query.isSuccess && !query.data.length && (
        <p className="rounded-2xl border border-border p-6 text-center text-muted-foreground">
          Chưa có chương trình. Tạo chương trình đầu tiên ở trên.
        </p>
      )}
    </PageContainer>
  );
}

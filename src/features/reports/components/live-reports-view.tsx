"use client";
import { useMutation } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { z } from "zod";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, currentEnrollmentClass } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import { dateSchema } from "@/lib/validators/web-workflows";
import {
  LiveSelect,
  displayMoment,
} from "@/features/academic/components/live-fields";
import { downloadReport } from "@/lib/api/client";
const ALL_STUDENTS = "all";
const reportFormSchema = z
  .object({
    studentId: z.string().optional(),
    fromDate: dateSchema,
    toDate: dateSchema,
    includeAi: z.boolean(),
  })
  .refine(
    (value) =>
      value.fromDate <= value.toDate &&
      Date.parse(value.toDate) - Date.parse(value.fromDate) < 366 * 86400000,
    {
      path: ["toDate"],
      message: "Khoảng báo cáo phải hợp lệ và tối đa 366 ngày.",
    },
  );
export function LiveReportsView() {
  const [classId, setClassId] = useQueryState(
    "classId",
    parseAsString.withDefault(""),
  );
  const context = useLiveQuery(["report-context"], async (signal) => {
    const [classes, enrollments] = await Promise.all([
      registrationApi.classes(),
      academicApi.enrollments(signal),
    ]);
    return { classes, enrollments };
  });
  const reports = useLiveQuery(["reports"], (signal) =>
    academicApi.reports(signal),
  );
  const students = new Map<string, string>();
  for (const enrollment of context.data?.enrollments ?? []) {
    if (
      enrollment.studentProfile &&
      (enrollment.classId === classId ||
        currentEnrollmentClass(enrollment) === classId ||
        enrollment.placements.some(
          (placement) => placement.classId === classId,
        ))
    )
      students.set(
        enrollment.studentProfile.id,
        enrollment.studentProfile.fullName,
      );
  }
  const selectedClass = context.data?.classes.find(
    (item) => item.id === classId,
  );
  return (
    <PageContainer>
      <PageHeader
        title="Báo cáo học tập"
        description="Tổng hợp điểm đã công bố, chuyên cần và tiến độ; tải Excel/PDF dành cho giáo viên."
      />
      <Card>
        <CardHeader>
          <CardTitle>Tạo báo cáo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncBoundary
            isLoading={context.isPending}
            isError={context.isError}
            error={context.error}
            onRetry={() => void context.refetch()}
            data={context.data?.classes}
            emptyProps={{ title: "Chưa có lớp được phân công" }}
          >
            <LiveSelect
              label="Lớp"
              value={classId}
              options={(context.data?.classes ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => void setClassId(value)}
            />
            {selectedClass && (
              <ApiForm
                key={classId}
                schema={reportFormSchema}
                defaults={{ studentId: ALL_STUDENTS, includeAi: false }}
                fields={[
                  {
                    name: "studentId",
                    label: "Học sinh",
                    type: "select",
                    options: [
                      { value: ALL_STUDENTS, label: "Toàn lớp" },
                      ...Array.from(students, ([value, label]) => ({
                        value,
                        label,
                      })),
                    ],
                  },
                  { name: "fromDate", label: "Từ ngày", type: "date" },
                  { name: "toDate", label: "Đến ngày", type: "date" },
                  {
                    name: "includeAi",
                    label: "Yêu cầu AI viết nhận xét từ số liệu",
                    type: "checkbox",
                  },
                ]}
                submitLabel="Tạo báo cáo"
                onSubmit={(value) =>
                  academicApi.createReport({
                    classId,
                    studentId:
                      value.studentId === ALL_STUDENTS
                        ? undefined
                        : value.studentId || undefined,
                    from: new Date(
                      `${value.fromDate}T00:00:00+07:00`,
                    ).toISOString(),
                    to: new Date(
                      `${value.toDate}T23:59:59+07:00`,
                    ).toISOString(),
                    includeAi: value.includeAi,
                  })
                }
              />
            )}
          </AsyncBoundary>
        </CardContent>
      </Card>
      <AsyncBoundary
        isLoading={reports.isPending}
        isError={reports.isError}
        error={reports.error}
        onRetry={() => void reports.refetch()}
        data={reports.data}
        emptyProps={{ title: "Chưa có báo cáo" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {reports.data?.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {context.data?.classes.find(
                    (item) => item.id === report.classId,
                  )?.name ?? "Báo cáo lớp học"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Tạo {displayMoment(report.createdAt)}</p>
                <ReportDownloads id={report.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
function ReportDownloads({ id }: { id: string }) {
  const action = useMutation({
    mutationFn: (format: "xlsx" | "pdf") => downloadReport(id, format),
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={action.isPending}
          onClick={() => action.mutate("xlsx")}
        >
          Tải Excel
        </Button>
        <Button
          variant="outline"
          disabled={action.isPending}
          onClick={() => action.mutate("pdf")}
        >
          Tải PDF
        </Button>
      </div>
      <ApiFeedback error={action.error} />
    </div>
  );
}

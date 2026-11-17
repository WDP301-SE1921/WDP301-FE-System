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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, currentEnrollmentClass } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import { dateSchema } from "@/lib/validators/web-workflows";
import { LabeledSelect as LiveSelect } from "@/components/shared/pickers/labeled-select";
import { displayMoment } from "@/features/academic/components/live-fields";
import { downloadReport } from "@/lib/api/client";
import { ReportDetailSheet } from "./report-detail-sheet";
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
  const [openReport, setOpenReport] = useQueryState("report", parseAsString);
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
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <Card className="min-w-0 lg:sticky lg:top-20">
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
                  onSuccess={(result) => {
                    // Mở ngay báo cáo vừa tạo để giáo viên đọc, không phải tải file.
                    const id = (result as { id?: unknown } | null)?.id;
                    void reports.refetch();
                    if (typeof id === "string") void setOpenReport(id);
                  }}
                />
              )}
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Báo cáo đã tạo</CardTitle>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={reports.isPending}
              isError={reports.isError}
              error={reports.error}
              onRetry={() => void reports.refetch()}
              data={reports.data}
              emptyProps={{ title: "Chưa có báo cáo" }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Phạm vi</TableHead>
                    <TableHead>Khoảng ngày</TableHead>
                    <TableHead>Tạo lúc</TableHead>
                    <TableHead>Xem và tải</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.data?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="max-w-64 whitespace-normal font-medium">
                        {context.data?.classes.find(
                          (item) => item.id === report.classId,
                        )?.name ?? "Báo cáo lớp học"}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {report.scope === "STUDENT"
                          ? (report.studentName ?? "Một học sinh")
                          : report.scope === "CLASS"
                            ? "Toàn lớp"
                            : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {report.from && report.to
                          ? `${reportDay(report.from)} – ${reportDay(report.to)}`
                          : "—"}
                      </TableCell>
                      <TableCell>{displayMoment(report.createdAt)}</TableCell>
                      <TableCell>
                        <ReportDownloads
                          id={report.id}
                          onView={() => void setOpenReport(report.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
      <ReportDetailSheet
        reportId={openReport || null}
        onClose={() => void setOpenReport(null)}
        dayText={reportDay}
      />
    </PageContainer>
  );
}
/** Ngày `YYYY-MM-DD` hoặc mốc ISO (đầu/cuối ngày giờ Việt Nam) → dd/mm/yyyy. */
function reportDay(value: string) {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10);
  return day.split("-").reverse().join("/");
}
function ReportDownloads({ id, onView }: { id: string; onView: () => void }) {
  const action = useMutation({
    mutationFn: (format: "xlsx" | "pdf") => downloadReport(id, format),
  });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button onClick={onView}>Xem</Button>
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

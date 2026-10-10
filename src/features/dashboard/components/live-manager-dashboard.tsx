"use client";
import { parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { directoryApi } from "@/features/directory/api";
import { money, todayInVietnam } from "@/features/registration-flow/calendar";
export function LiveManagerDashboard() {
  const today = todayInVietnam();
  const [{ fromDate, toDate }, setRange] = useQueryStates({
    fromDate: parseAsString.withDefault(`${today.slice(0, 8)}01`),
    toDate: parseAsString.withDefault(today),
  });
  const data = useLiveQuery(["manager-dashboard", fromDate, toDate], (signal) =>
    directoryApi.dashboard({ fromDate, toDate }, signal),
  );
  const values = data.data
    ? [
        ["Doanh thu học phí đã nhận", money(data.data.tuition.confirmedAmount)],
        ["Khoản thu trong kỳ", data.data.tuition.paymentCount],
        ["Học sinh đang học", data.data.counts.studyingStudents],
        ["Hồ sơ học sinh hoạt động", data.data.counts.activeStudents],
        ["Giáo viên hoạt động", data.data.counts.activeTeachers],
        ["Nhân viên hoạt động", data.data.counts.activeStaff],
        ["Phụ huynh hoạt động", data.data.counts.activeParents],
        ["Đăng ký nháp", data.data.registrations.draft],
        ["Đăng ký hoàn tất", data.data.registrations.completed],
      ]
    : [];
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard trung tâm"
        description="Doanh thu tính từ học phí đã xác nhận trong khoảng ngày được chọn."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dashboard-from">Từ ngày</Label>
          <Input
            id="dashboard-from"
            type="date"
            value={fromDate}
            onChange={(event) =>
              void setRange({ fromDate: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dashboard-to">Đến ngày</Label>
          <Input
            id="dashboard-to"
            type="date"
            value={toDate}
            onChange={(event) => void setRange({ toDate: event.target.value })}
          />
        </div>
      </div>
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {values.map(([label, value]) => (
            <Card key={String(label)}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}

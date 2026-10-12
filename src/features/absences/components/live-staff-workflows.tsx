"use client";
import { z } from "zod";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  academicApi,
  availableMakeupCandidates,
  currentEnrollmentClass,
} from "@/features/academic/api";
import { directoryApi } from "@/features/directory/api";
import { registrationApi } from "@/features/registration-flow/api";
import {
  dateOnly,
  displayDate,
  money,
} from "@/features/registration-flow/calendar";
import {
  confirmationSchema,
  dateSchema,
  localDateTimeSchema,
  reasonSchema,
  requiredId,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import {
  LiveSelect,
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import type { EnrollmentRecord } from "@/types/academic-workflows";

const pauseFormSchema = z
  .object({
    fromDate: dateSchema,
    toDate: dateSchema,
    reason: reasonSchema.shape.reason,
  })
  .refine((value) => value.fromDate <= value.toDate, {
    path: ["toDate"],
    message: "Ngày cuối phải từ ngày đầu trở đi.",
  });
const transferFormSchema = z.object({
  targetClassId: requiredId,
  effectiveAt: localDateTimeSchema,
  reason: reasonSchema.shape.reason,
});
const TITLES = {
  makeup: "Nghỉ học và học bù",
  swap: "Đổi một buổi học",
  change: "Đổi lớp và lịch cố định",
  leave: "Nghỉ dài hạn",
  withdraw: "Nghỉ môn / Nghỉ hẳn",
};
export function LiveStaffWorkflows({ mode }: { mode: keyof typeof TITLES }) {
  const [{ studentId, enrollmentId }, setSelection] = useQueryStates({
    studentId: parseAsString.withDefault(""),
    enrollmentId: parseAsString.withDefault(""),
  });
  const students = useLiveQuery(["workflow-students"], (signal) =>
    directoryApi.students(signal),
  );
  const enrollments = useLiveQuery(
    ["student-enrollments", studentId],
    (signal) => directoryApi.studentEnrollments(studentId, signal),
    !!studentId,
  );
  const student = students.data?.find((item) => item.id === studentId);
  const enrollment = enrollments.data?.find((item) => item.id === enrollmentId);
  return (
    <PageContainer>
      <PageHeader
        title={TITLES[mode]}
        description="Chọn hồ sơ con và ghi danh cần xử lý. Các thay đổi được lưu tại trung tâm."
      />
      <AsyncBoundary
        isLoading={students.isPending}
        isError={students.isError}
        error={students.error}
        onRetry={() => void students.refetch()}
        data={students.data}
        emptyProps={{ title: "Chưa có hồ sơ học sinh" }}
      >
        <LiveSelect
          label="Học sinh"
          value={studentId}
          options={(students.data ?? []).map((item) => ({
            value: item.id,
            label: `${item.fullName} · Khối ${item.grade} · ${item.parentProfile.user.email}`,
          }))}
          onChange={(value) =>
            void setSelection({ studentId: value, enrollmentId: "" })
          }
        />
      </AsyncBoundary>
      {!!studentId && (
        <AsyncBoundary
          isLoading={enrollments.isPending}
          isError={enrollments.isError}
          error={enrollments.error}
          onRetry={() => void enrollments.refetch()}
          data={enrollments.data}
          emptyProps={{ title: "Học sinh chưa có ghi danh" }}
        >
          <LiveSelect
            label="Ghi danh"
            value={enrollmentId}
            options={(enrollments.data ?? []).map((item) => ({
              value: item.id,
              label: `${item.class.name} · ${STATUS_TEXT[item.status] ?? item.status} · ${item.startDate ? displayDate(item.startDate) : ""}–${item.endDate ? displayDate(item.endDate) : ""}`,
            }))}
            onChange={(value) => void setSelection({ enrollmentId: value })}
          />
        </AsyncBoundary>
      )}
      {enrollment?.status === "ACTIVE" &&
        (mode === "makeup" || mode === "swap") && (
          <SingleAbsence key={enrollment.id} enrollment={enrollment} />
        )}
      {studentId && (mode === "makeup" || mode === "swap") && (
        <MakeupPanel
          key={`makeup-${studentId}`}
          studentId={studentId}
          enrollments={enrollments.data ?? []}
        />
      )}
      {enrollment?.status === "ACTIVE" && mode === "leave" && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo kỳ nghỉ</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={pauseFormSchema}
              fields={[
                { name: "fromDate", label: "Ngày bắt đầu", type: "date" },
                { name: "toDate", label: "Ngày kết thúc", type: "date" },
                { name: "reason", label: "Lý do", type: "textarea" },
              ]}
              submitLabel="Xác nhận nghỉ dài hạn"
              onSubmit={(value) =>
                academicApi.createLeave({
                  ...value,
                  enrollmentId,
                  kind: "PERIOD_PAUSE",
                })
              }
            />
          </CardContent>
        </Card>
      )}
      {enrollment?.status === "ACTIVE" && mode === "change" && (
        <TransferPanel key={enrollment.id} enrollment={enrollment} />
      )}
      {enrollment?.status === "ACTIVE" && mode === "withdraw" && (
        <Card>
          <CardHeader>
            <CardTitle>Kết thúc môn học</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={confirmationSchema}
              defaults={{ confirmed: false }}
              fields={[
                {
                  name: "confirmed",
                  label: `Tôi xác nhận kết thúc ghi danh tại ${enrollment.class.name} ngay bây giờ.`,
                  type: "checkbox",
                },
              ]}
              submitLabel="Kết thúc môn"
              onSubmit={() => academicApi.endEnrollment(enrollment.id)}
            />
          </CardContent>
        </Card>
      )}
      {student?.status === "ACTIVE" && mode === "withdraw" && (
        <Card>
          <CardHeader>
            <CardTitle>Ngừng toàn bộ việc học của {student.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kết thúc các ghi danh của riêng học sinh này và ngừng hồ sơ. Tài
              khoản phụ huynh và các con khác vẫn được giữ.
            </p>
            <ApiForm
              schema={confirmationSchema}
              defaults={{ confirmed: false }}
              fields={[
                {
                  name: "confirmed",
                  label: "Tôi xác nhận ngừng toàn bộ việc học ngay bây giờ.",
                  type: "checkbox",
                },
              ]}
              submitLabel="Xác nhận nghỉ hẳn"
              onSubmit={() => academicApi.endStudent(studentId)}
            />
          </CardContent>
        </Card>
      )}
      {student?.status === "INACTIVE" && (
        <Card>
          <CardContent className="pt-6">
            <p>
              Hồ sơ đã ngừng học. Chức năng khôi phục hồ sơ để học lại chưa sẵn
              sàng; hãy liên hệ quản lý trung tâm.
            </p>
          </CardContent>
        </Card>
      )}
      {studentId && (
        <LeaveHistory key={`leave-history-${studentId}`} studentId={studentId} />
      )}
    </PageContainer>
  );
}
function SingleAbsence({ enrollment }: { enrollment: EnrollmentRecord }) {
  const [sessionId, setSessionId] = useQueryState(
    "sessionId",
    parseAsString.withDefault(""),
  );
  const sessions = useLiveQuery(["leave-sessions", enrollment.id], (signal) =>
    academicApi.sessions(
      { classId: currentEnrollmentClass(enrollment) },
      signal,
    ),
  );
  const options = (sessions.data ?? []).filter(
    (session) =>
      session.status === "SCHEDULED" &&
      !!enrollment.startDate &&
      !!enrollment.endDate &&
      dateOnly(
        new Date(Date.parse(session.startsAt) + 7 * 3600000).toISOString(),
      ) >= dateOnly(enrollment.startDate) &&
      dateOnly(
        new Date(Date.parse(session.startsAt) + 7 * 3600000).toISOString(),
      ) < dateOnly(enrollment.endDate),
  );
  const selected = options.find((session) => session.id === sessionId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ghi nhận nghỉ một buổi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AsyncBoundary
          isLoading={sessions.isPending}
          isError={sessions.isError}
          error={sessions.error}
          onRetry={() => void sessions.refetch()}
          data={options}
          emptyProps={{ title: "Không có buổi đang lên lịch trong kỳ học" }}
        >
          <LiveSelect
            label="Buổi nghỉ"
            value={sessionId}
            options={options.map((session) => ({
              value: session.id,
              label: `${displayMoment(session.startsAt)} · ${session.lesson?.title ?? "Buổi học"}`,
            }))}
            onChange={(value) => void setSessionId(value)}
          />
        </AsyncBoundary>
        {selected && (
          <ApiForm
            key={selected.id}
            schema={reasonSchema}
            fields={[{ name: "reason", label: "Lý do nghỉ", type: "textarea" }]}
            submitLabel="Ghi nhận nghỉ"
            onSubmit={(value) => {
              const day = new Date(Date.parse(selected.startsAt) + 7 * 3600000)
                .toISOString()
                .slice(0, 10);
              return academicApi.createLeave({
                ...value,
                enrollmentId: enrollment.id,
                kind: "SINGLE_ABSENCE",
                sessionId,
                fromDate: day,
                toDate: day,
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
function MakeupPanel({
  studentId,
  enrollments,
}: {
  studentId: string;
  enrollments: EnrollmentRecord[];
}) {
  const [{ sourceId, targetSessionId }, setSelection] = useQueryStates({
    sourceId: parseAsString.withDefault(""),
    targetSessionId: parseAsString.withDefault(""),
  });
  const sources = useLiveQuery(["makeup-sources", studentId], (signal) =>
    academicApi.makeupSources(studentId, signal),
  );
  const candidates = useLiveQuery(
    ["makeup-candidates", studentId, sourceId],
    (signal) => academicApi.makeupCandidates(sourceId, signal),
    !!sourceId && !!sources.data?.some((item) => item.id === sourceId),
  );
  const bookings = useLiveQuery(["makeups"], (signal) =>
    academicApi.makeups(signal),
  );
  const selectedIds = new Set(enrollments.map((item) => item.id));
  const items = bookings.data?.filter((item) =>
    selectedIds.has(item.original.enrollmentId),
  );
  const selectedSource = sources.data?.find((item) => item.id === sourceId);
  const available =
    selectedSource && bookings.data
      ? availableMakeupCandidates(
          candidates.data ?? [],
          bookings.data,
          selectedSource.enrollmentId,
        )
      : [];
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Xếp buổi học bù</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AsyncBoundary
            isLoading={sources.isPending}
            isError={sources.isError}
            error={sources.error}
            onRetry={() => void sources.refetch()}
            data={sources.data}
            emptyProps={{
              title: "Chưa có buổi đủ điều kiện học bù",
              description:
                "Buổi nghỉ cần có danh sách học viên và được ghi nhận trước khi xếp học bù.",
            }}
          >
            <LiveSelect
              label="Buổi gốc"
              value={sourceId}
              options={(sources.data ?? []).map((item) => ({
                value: item.id,
                label: `${item.session.class.name} · ${displayMoment(item.session.startsAt)} · ${item.session.lesson.title}`,
              }))}
              onChange={(value) =>
                void setSelection({ sourceId: value, targetSessionId: "" })
              }
            />
          </AsyncBoundary>
          {!!selectedSource && (
            <AsyncBoundary
              isLoading={candidates.isPending || bookings.isPending}
              isError={candidates.isError || bookings.isError}
              error={candidates.error ?? bookings.error}
              onRetry={() => {
                void candidates.refetch();
                void bookings.refetch();
              }}
              data={available}
              emptyProps={{ title: "Chưa có buổi thay thế" }}
            >
              <LiveSelect
                label="Buổi thay thế"
                value={targetSessionId}
                options={available.map((item) => ({
                  value: item.id,
                  label: `${item.class.name} · ${displayMoment(item.startsAt)} · Sức chứa ${item.class.capacity}`,
                }))}
                onChange={(value) =>
                  void setSelection({ targetSessionId: value })
                }
              />
            </AsyncBoundary>
          )}
          {!!targetSessionId &&
            available.some((item) => item.id === targetSessionId) && (
              <ApiForm
                key={`${sourceId}-${targetSessionId}`}
                schema={confirmationSchema}
                defaults={{ confirmed: false }}
                fields={[
                  {
                    name: "confirmed",
                    label: "Tôi xác nhận xếp buổi thay thế đã chọn.",
                    type: "checkbox",
                  },
                ]}
                submitLabel="Xếp học bù"
                onSubmit={() =>
                  academicApi.bookMakeup({
                    originalParticipantId: sourceId,
                    targetSessionId,
                  })
                }
                onSuccess={() =>
                  void setSelection({ sourceId: "", targetSessionId: "" })
                }
              />
            )}
          <p className="text-sm text-muted-foreground">
            Chỗ trống, kỳ học và trùng lịch được kiểm tra khi xác nhận.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lịch học bù đã xếp</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncBoundary
            isLoading={bookings.isPending}
            isError={bookings.isError}
            error={bookings.error}
            onRetry={() => void bookings.refetch()}
            data={items}
            emptyProps={{ title: "Chưa có lịch học bù" }}
          >
            <div className="space-y-4">
              {items?.map((booking) => (
                <div
                  key={booking.id}
                  className="space-y-3 rounded-2xl border border-border p-4"
                >
                  <p>{displayMoment(booking.replacement.session.startsAt)}</p>
                  <Badge>{STATUS_TEXT[booking.status]}</Badge>
                  {booking.status === "BOOKED" && (
                    <ApiForm
                      schema={confirmationSchema}
                      defaults={{ confirmed: false }}
                      fields={[
                        {
                          name: "confirmed",
                          label: "Xác nhận hủy lịch học bù này",
                          type: "checkbox",
                        },
                      ]}
                      submitLabel="Hủy lịch học bù"
                      onSubmit={() => academicApi.cancelMakeup(booking.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </AsyncBoundary>
        </CardContent>
      </Card>
    </>
  );
}
function TransferPanel({ enrollment }: { enrollment: EnrollmentRecord }) {
  const classes = useLiveQuery(["transfer-classes"], () =>
    registrationApi.classes(),
  );
  const options = (classes.data ?? []).filter(
    (item) =>
      item.id !== currentEnrollmentClass(enrollment) &&
      item.programId === enrollment.class.programId &&
      item.isOpen &&
      Number(item.monthlyFee) === Number(enrollment.class.monthlyFee),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chuyển sang lớp cùng khóa học</CardTitle>
      </CardHeader>
      <CardContent>
        <AsyncBoundary
          isLoading={classes.isPending}
          isError={classes.isError}
          error={classes.error}
          onRetry={() => void classes.refetch()}
          data={options}
          emptyProps={{ title: "Chưa có lớp cùng khóa và học phí để chuyển" }}
        >
          <ApiForm
            schema={transferFormSchema}
            fields={[
              {
                name: "targetClassId",
                label: "Lớp mới",
                type: "select",
                options: options.map((item) => ({
                  value: item.id,
                  label: `${item.name} · ${money(item.monthlyFee)}/tháng`,
                })),
              },
              {
                name: "effectiveAt",
                label: "Hiệu lực từ (giờ Việt Nam)",
                type: "datetime-local",
              },
              { name: "reason", label: "Lý do chuyển", type: "textarea" },
            ]}
            submitLabel="Chuyển lớp"
            onSubmit={(value) =>
              academicApi.transfer(enrollment.id, {
                ...value,
                effectiveAt: vietnamDateTime(String(value.effectiveAt)),
              })
            }
          />
        </AsyncBoundary>
      </CardContent>
    </Card>
  );
}
function LeaveHistory({ studentId }: { studentId: string }) {
  const leaves = useLiveQuery(["leaves", studentId], (signal) =>
    academicApi.leaves({ studentId }, signal),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử nghỉ học</CardTitle>
      </CardHeader>
      <CardContent>
        <AsyncBoundary
          isLoading={leaves.isPending}
          isError={leaves.isError}
          error={leaves.error}
          onRetry={() => void leaves.refetch()}
          data={leaves.data}
          emptyProps={{ title: "Chưa có đơn nghỉ" }}
        >
          <div className="space-y-4">
            {leaves.data?.map((leave) => (
              <div
                key={leave.id}
                className="space-y-3 rounded-2xl border border-border p-4"
              >
                <p className="font-medium">
                  {leave.enrollment.class.name} ·{" "}
                  {leave.kind === "PERIOD_PAUSE"
                    ? "Nghỉ dài hạn"
                    : "Nghỉ một buổi"}
                </p>
                <p>
                  {displayDate(leave.fromDate)} – {displayDate(leave.toDate)}
                </p>
                <p className="whitespace-pre-wrap">{leave.reason}</p>
                <Badge>{STATUS_TEXT[leave.status]}</Badge>
                {leave.decisionNote && leave.decisionNote !== leave.reason && (
                  <p>{leave.decisionNote}</p>
                )}
                {leave.status === "PENDING" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[true, false].map((approve) => (
                      <ApiForm
                        key={String(approve)}
                        schema={reasonSchema}
                        fields={[
                          {
                            name: "reason",
                            label: approve ? "Ghi chú duyệt" : "Lý do từ chối",
                            type: "textarea",
                          },
                        ]}
                        submitLabel={approve ? "Duyệt đơn" : "Từ chối đơn"}
                        onSubmit={(value) =>
                          academicApi.decideLeave(
                            leave.id,
                            approve,
                            String(value.reason),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                {(leave.status === "PENDING" ||
                  leave.status === "APPROVED") && (
                  <ApiForm
                    schema={confirmationSchema}
                    defaults={{ confirmed: false }}
                    fields={[
                      {
                        name: "confirmed",
                        label: "Xác nhận hủy đơn nghỉ",
                        type: "checkbox",
                      },
                    ]}
                    submitLabel="Hủy đơn"
                    onSubmit={() => academicApi.cancelLeave(leave.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </AsyncBoundary>
        <ApiFeedback error={leaves.error} />
      </CardContent>
    </Card>
  );
}

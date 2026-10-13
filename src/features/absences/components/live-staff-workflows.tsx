"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, currentEnrollmentClass } from "@/features/academic/api";
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
  endLeaveEarlySchema,
  localDateTimeSchema,
  reasonSchema,
  requiredId,
  rescheduleMakeupSchema,
  todayLocalDate,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import {
  LiveSelect,
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { ROUTES } from "@/constants/routes";
import type {
  EnrollmentRecord,
  LeaveRecord,
  MakeupCandidate,
  MakeupRecord,
} from "@/types/academic-workflows";
import type { StudentListItem } from "@/types/backend";

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
      {student && (
        <ReactivatePanel key={`reactivate-${student.id}`} student={student} />
      )}
      {studentId && (
        <LeaveHistory
          key={`leave-history-${studentId}`}
          studentId={studentId}
        />
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
  // BE evaluates each target with the same rules as booking (term, leave, conflict, seats).
  const available = (candidates.data ?? []).filter((item) => item.eligible);
  const blocked = (candidates.data ?? []).filter((item) => !item.eligible);
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
                "Ghi nhận nghỉ một buổi ở thẻ phía trên, hoặc chờ giáo viên chốt vắng, rồi xếp học bù.",
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
              isLoading={candidates.isPending}
              isError={candidates.isError}
              error={candidates.error}
              onRetry={() => void candidates.refetch()}
              data={available}
              emptyProps={{
                title: "Chưa có buổi thay thế còn đủ điều kiện",
                description:
                  "Cần buổi cùng bài, chưa diễn ra, còn chỗ và không trùng lịch của học viên.",
              }}
            >
              <LiveSelect
                label="Buổi thay thế"
                value={targetSessionId}
                options={available.map((item) => ({
                  value: item.id,
                  label: candidateLabel(item),
                }))}
                onChange={(value) =>
                  void setSelection({ targetSessionId: value })
                }
              />
            </AsyncBoundary>
          )}
          {!!selectedSource && !!blocked.length && (
            <div className="space-y-2 rounded-2xl border border-border p-4 text-sm">
              <p className="font-medium">Buổi cùng bài không xếp được</p>
              <ul className="space-y-1 text-muted-foreground">
                {blocked.map((item) => (
                  <li key={item.id}>
                    {item.class.name} · {displayMoment(item.startsAt)}:{" "}
                    {item.reasonCodes
                      .map((code) => MAKEUP_REASON_TEXT[code] ?? code)
                      .join("; ")}
                  </li>
                ))}
              </ul>
            </div>
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
            Số chỗ trống là ảnh chụp lúc tải; hệ thống kiểm tra lại khi xác
            nhận.
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
                    <RescheduleMakeup booking={booking} />
                  )}
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
                {leave.status === "APPROVED" &&
                  leave.kind === "PERIOD_PAUSE" &&
                  dateOnly(leave.toDate) >= todayLocalDate() && (
                    <EndLeaveEarly leave={leave} />
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
const MAKEUP_REASON_TEXT: Record<string, string> = {
  INVALID_MAKEUP_SOURCE: "buổi gốc không còn hợp lệ",
  INVALID_MAKEUP_TARGET: "buổi không còn mở để học bù",
  OUTSIDE_ENROLLMENT: "ngoài kỳ học của ghi danh",
  ABSENCE_NOT_APPROVED: "buổi nghỉ chưa được duyệt",
  TARGET_DURING_LEAVE: "trong thời gian nghỉ đã duyệt",
  STUDENT_SCHEDULE_CONFLICT: "trùng lịch học khác của con",
  SESSION_FULL: "đã đủ sĩ số",
};
function candidateLabel(item: MakeupCandidate) {
  return `${item.class.name} · ${displayMoment(item.startsAt)} · Còn ${item.availableSeats} chỗ`;
}
function RescheduleMakeup({ booking }: { booking: MakeupRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const candidates = useLiveQuery(
    ["makeup-candidates", booking.originalParticipantId],
    (signal) =>
      academicApi.makeupCandidates(booking.originalParticipantId, signal),
    isOpen,
  );
  const options = (candidates.data ?? []).filter(
    (item) => item.eligible && item.id !== booking.replacement.session.id,
  );
  if (!isOpen)
    return (
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        Đổi sang buổi khác
      </Button>
    );
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <p className="font-medium">Đổi buổi học bù</p>
      <AsyncBoundary
        isLoading={candidates.isPending}
        isError={candidates.isError}
        error={candidates.error}
        onRetry={() => void candidates.refetch()}
        data={options}
        emptyProps={{ title: "Chưa có buổi khác còn đủ điều kiện" }}
      >
        <ApiForm
          schema={rescheduleMakeupSchema}
          fields={[
            {
              name: "targetSessionId",
              label: "Buổi mới",
              type: "select",
              options: options.map((item) => ({
                value: item.id,
                label: candidateLabel(item),
              })),
            },
            { name: "reason", label: "Lý do đổi", type: "textarea" },
          ]}
          submitLabel="Đổi buổi học bù"
          onSubmit={(value) => academicApi.rescheduleMakeup(booking.id, value)}
          onSuccess={() => setIsOpen(false)}
        />
      </AsyncBoundary>
      <p className="text-sm text-muted-foreground">
        Chỗ cũ chỉ được trả khi đổi thành công.
      </p>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
        Đóng
      </Button>
    </div>
  );
}
function EndLeaveEarly({ leave }: { leave: LeaveRecord }) {
  const fromDate = dateOnly(leave.fromDate);
  const toDate = dateOnly(leave.toDate);
  const schema = endLeaveEarlySchema.refine(
    (value) => value.effectiveDate > fromDate && value.effectiveDate <= toDate,
    {
      path: ["effectiveDate"],
      message: "Chọn ngày sau ngày bắt đầu và không quá ngày kết thúc kỳ nghỉ.",
    },
  );
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <p className="font-medium">Kết thúc nghỉ sớm</p>
      <p className="text-sm text-muted-foreground">
        Từ ngày đi học lại, các buổi được mở để điểm danh bình thường; các buổi
        trước đó vẫn tính nghỉ có phép.
      </p>
      <ApiForm
        schema={schema}
        defaults={{
          effectiveDate: todayLocalDate() > fromDate ? todayLocalDate() : "",
        }}
        fields={[
          { name: "effectiveDate", label: "Ngày đi học lại", type: "date" },
          { name: "reason", label: "Lý do", type: "textarea" },
        ]}
        submitLabel="Kết thúc nghỉ sớm"
        onSubmit={(value) => academicApi.endLeaveEarly(leave.id, value)}
      />
    </div>
  );
}
function ReactivatePanel({ student }: { student: StudentListItem }) {
  // Set when this panel sends the command: once the list reloads with ACTIVE we show the
  // next step (the form unmounts before a per-call onSuccess could run).
  const [hasRequested, setHasRequested] = useState(false);
  if (student.status !== "INACTIVE" && !hasRequested) return null;
  if (student.status !== "INACTIVE")
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đã mở lại hồ sơ {student.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tạo đăng ký và xác nhận thanh toán để có ghi danh mới.
          </p>
          <Button
            render={
              <Link
                href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                  email: student.parentProfile.user.email,
                  studentId: student.id,
                })}
              />
            }
          >
            Đăng ký lớp mới
          </Button>
        </CardContent>
      </Card>
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cho {student.fullName} học lại</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Hồ sơ đã ngừng học. Cho học lại sẽ dùng lại hồ sơ cũ, giữ nguyên lịch
          sử học tập và thanh toán; các ghi danh cũ không được mở lại.
        </p>
        <ApiForm
          schema={reasonSchema}
          fields={[
            { name: "reason", label: "Lý do cho học lại", type: "textarea" },
          ]}
          submitLabel="Cho học lại"
          successMessage={false}
          onSubmit={(value) => {
            setHasRequested(true);
            return academicApi.reactivateStudent(student.id, value);
          }}
        />
      </CardContent>
    </Card>
  );
}

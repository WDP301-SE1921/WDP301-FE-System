"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import {
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffectedSessions } from "@/components/shared/display/affected-sessions";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import {
  ApiForm,
  type ApiFormValues,
} from "@/components/shared/forms/api-form";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import {
  CompareTable,
  type CompareRow,
} from "@/components/shared/display/compare-table";
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
  scheduleText,
} from "@/features/registration-flow/calendar";
import {
  firstScheduledAfter,
  isDay,
  rangeText,
  scheduledBetween,
  termText,
  vietnamDay,
} from "@/lib/session-preview";
import {
  dateSchema,
  endLeaveEarlySchema,
  localDateTimeSchema,
  reasonSchema,
  requiredId,
  rescheduleMakeupSchema,
  todayLocalDate,
  vietnamDateTime,
  confirmationSchema,
} from "@/lib/validators/web-workflows";
import { LabeledSelect as LiveSelect } from "@/components/shared/pickers/labeled-select";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { ROUTES } from "@/constants/routes";
import { REASON_PRESETS } from "@/constants/reason-presets";
import type {
  EnrollmentRecord,
  LeaveRecord,
  MakeupCandidate,
  MakeupRecord,
} from "@/types/academic-workflows";
import type { RegistrationClass, StudentListItem } from "@/types/backend";

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
/** Lý do khi kết thúc không bắt buộc: BE nhận body trống như trước. */
const endFormSchema = z.object({
  reason: z.string().trim().max(2000, "Lý do tối đa 2000 ký tự.").optional(),
});

/**
 * Các thao tác trong panel "Xử lý" của học sinh. Trước đây mỗi thao tác là một trang riêng
 * dưới /staff/absences; "Đổi một buổi" và "Nghỉ học và học bù" hiển thị cùng các panel
 * nên gộp chung tab makeup.
 */
export const STUDENT_ACTIONS = {
  makeup: "Nghỉ & học bù",
  change: "Đổi lớp / lịch cố định",
  leave: "Nghỉ dài hạn",
  withdraw: "Nghỉ môn / nghỉ hẳn",
} as const;
export type StudentAction = keyof typeof STUDENT_ACTIONS;
const ACTION_KEYS = Object.keys(STUDENT_ACTIONS) as StudentAction[];

/** Query của panel Xử lý (`?studentId=&enrollmentId=&action=`). */
export const studentWorkflowParsers = {
  studentId: parseAsString.withDefault(""),
  enrollmentId: parseAsString.withDefault(""),
  action: parseAsStringLiteral(ACTION_KEYS).withDefault("makeup"),
};
/** Query riêng của từng panel con; đổi tab hoặc đóng panel thì xóa để lần sau bắt đầu sạch. */
const panelParsers = {
  sessionId: parseAsString,
  sourceId: parseAsString,
  targetSessionId: parseAsString,
};
const CLEARED_PANEL = {
  sessionId: null,
  sourceId: null,
  targetSessionId: null,
};

/** Lớp đang học của ghi danh (theo xếp lớp hiện hành), kèm lịch tuần, giáo viên, phòng. */
function currentClassOf(enrollment: EnrollmentRecord): RegistrationClass {
  const classId = currentEnrollmentClass(enrollment);
  return (
    enrollment.placements.find((placement) => placement.classId === classId)
      ?.class ?? enrollment.class
  );
}
const teacherText = (item?: RegistrationClass) =>
  item?.teacher?.displayName ??
  (item?.teacherId ? "Đã phân công" : "Chưa có giáo viên");
const roomText = (item?: RegistrationClass) =>
  item?.room?.name ?? "Chưa xếp phòng";
const scheduleOf = (item?: RegistrationClass) =>
  item?.weeklySchedules?.length
    ? scheduleText(item.weeklySchedules)
    : "Chưa có lịch tuần";
const localMoment = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${displayDate(value.slice(0, 10))}, ${value.slice(11)}`
    : "";

/** Panel bên phải mở từ nút "Xử lý" trên bảng học sinh. */
export function StudentWorkflowSheet() {
  const [{ studentId, enrollmentId, action }, setSelection] = useQueryStates(
    studentWorkflowParsers,
  );
  const [, setPanel] = useQueryStates(panelParsers);
  const student = useLiveQuery(
    ["workflow-student", studentId],
    (signal) => directoryApi.student(studentId, signal),
    !!studentId,
  );
  return (
    <Sheet
      open={!!studentId}
      onOpenChange={(open) => {
        if (open) return;
        void setSelection({
          studentId: null,
          enrollmentId: null,
          action: null,
        });
        void setPanel(CLEARED_PANEL);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="pr-12">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {student.data?.fullName ?? "Xử lý cho học sinh"}
            {student.data?.status === "INACTIVE" && (
              <Badge variant="destructive">Ngừng học</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {student.data
              ? `Khối ${student.data.grade}, phụ huynh ${student.data.parentProfile.user.displayName || student.data.parentProfile.user.email}`
              : "Ghi nghỉ, xếp học bù, đổi lớp hoặc cho nghỉ. Các thay đổi được lưu tại trung tâm."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 pt-4">
          <AsyncBoundary
            isLoading={!!studentId && student.isPending}
            isError={student.isError}
            error={student.error}
            onRetry={() => void student.refetch()}
          >
            {studentId && (
              <StudentWorkflowBody
                key={studentId}
                studentId={studentId}
                student={student.data}
                enrollmentId={enrollmentId}
                action={action}
                onEnrollmentChange={(value) =>
                  void setSelection({ enrollmentId: value })
                }
                onActionChange={(value) => {
                  void setSelection({ action: value });
                  void setPanel(CLEARED_PANEL);
                }}
              />
            )}
          </AsyncBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StudentWorkflowBody({
  studentId,
  student,
  enrollmentId,
  action,
  onEnrollmentChange,
  onActionChange,
}: {
  studentId: string;
  student?: StudentListItem;
  enrollmentId: string;
  action: StudentAction;
  onEnrollmentChange: (value: string) => void;
  onActionChange: (value: StudentAction) => void;
}) {
  const enrollments = useLiveQuery(
    ["student-enrollments", studentId],
    (signal) => directoryApi.studentEnrollments(studentId, signal),
  );
  const enrollment = enrollments.data?.find((item) => item.id === enrollmentId);
  // Hồ sơ đã ngừng: các thao tác trên ghi danh không còn áp dụng, chỉ còn "Cho học lại".
  const isInactive = student?.status === "INACTIVE";
  return (
    <>
      {student && (
        <ReactivatePanel key={`reactivate-${student.id}`} student={student} />
      )}
      {!isInactive && (
        <>
          <AsyncBoundary
            isLoading={enrollments.isPending}
            isError={enrollments.isError}
            error={enrollments.error}
            onRetry={() => void enrollments.refetch()}
            data={enrollments.data}
            emptyProps={{ title: "Học sinh chưa có ghi danh" }}
          >
            <ChoiceCards
              legend="Ghi danh cần xử lý"
              value={enrollmentId}
              onChange={onEnrollmentChange}
              options={(enrollments.data ?? []).map((item) => ({
                value: item.id,
                label: currentClassOf(item).name,
                description: `${STATUS_TEXT[item.status] ?? "Chưa xác định trạng thái"}, ${termText(item.startDate, item.endDate)}`,
              }))}
            />
          </AsyncBoundary>
          <Tabs
            value={action}
            onValueChange={(value) => {
              const next = ACTION_KEYS.find((key) => key === value);
              if (next) onActionChange(next);
            }}
          >
            <TabsList
              aria-label="Chọn thao tác"
              className="h-auto w-full flex-wrap justify-start"
            >
              {ACTION_KEYS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {STUDENT_ACTIONS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {!enrollmentId && action !== "makeup" && action !== "withdraw" && (
            <p className="text-sm text-muted-foreground">
              Chọn ghi danh ở trên để thực hiện thao tác này.
            </p>
          )}
          {enrollment?.status === "ACTIVE" && action === "makeup" && (
            <SingleAbsence key={enrollment.id} enrollment={enrollment} />
          )}
          {action === "makeup" && (
            <MakeupPanel
              key={`makeup-${studentId}`}
              studentId={studentId}
              enrollments={enrollments.data ?? []}
            />
          )}
          {enrollment?.status === "ACTIVE" && action === "leave" && (
            <LeavePanel
              key={enrollment.id}
              enrollment={enrollment}
              studentName={student?.fullName ?? "Học sinh"}
            />
          )}
          {enrollment?.status === "ACTIVE" && action === "change" && (
            <TransferPanel
              key={enrollment.id}
              enrollment={enrollment}
              studentName={student?.fullName ?? "Học sinh"}
            />
          )}
          {student?.status === "ACTIVE" && action === "withdraw" && (
            <WithdrawPanel
              key={`withdraw-${enrollment?.id ?? "none"}`}
              student={student}
              enrollment={enrollment}
              enrollments={enrollments.data ?? []}
            />
          )}
        </>
      )}
      <LeaveHistory key={`leave-history-${studentId}`} studentId={studentId} />
    </>
  );
}
function SingleAbsence({ enrollment }: { enrollment: EnrollmentRecord }) {
  const [sessionId, setSessionId] = useQueryState(
    "sessionId",
    parseAsString.withDefault(""),
  );
  const sessions = useEnrollmentSessions(enrollment);
  const options = (sessions.data ?? []).filter(
    (session) =>
      session.status === "SCHEDULED" &&
      !!enrollment.startDate &&
      !!enrollment.endDate &&
      vietnamDay(session.startsAt) >= dateOnly(enrollment.startDate) &&
      vietnamDay(session.startsAt) < dateOnly(enrollment.endDate),
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
            fields={[
              {
                name: "reason",
                label: "Lý do nghỉ",
                type: "reason",
                presets: REASON_PRESETS.absence,
              },
            ]}
            submitLabel="Ghi nhận nghỉ"
            onSubmit={(value) => {
              const day = vietnamDay(selected.startsAt);
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
/** Buổi của lớp đang học; dùng chung cache giữa "Nghỉ một buổi" và "Nghỉ dài hạn". */
function useEnrollmentSessions(enrollment: EnrollmentRecord) {
  return useLiveQuery(["leave-sessions", enrollment.id], (signal) =>
    academicApi.sessions(
      { classId: currentEnrollmentClass(enrollment) },
      signal,
    ),
  );
}
function LeavePanel({
  enrollment,
  studentName,
}: {
  enrollment: EnrollmentRecord;
  studentName: string;
}) {
  const sessions = useEnrollmentSessions(enrollment);
  const current = currentClassOf(enrollment);
  const impact = (values: ApiFormValues) => {
    const from = values.fromDate;
    const to = values.toDate;
    if (!isDay(from) || !isDay(to) || from > to) return null;
    const list = scheduledBetween(sessions.data ?? [], from, to);
    return {
      from,
      to,
      list,
      back: firstScheduledAfter(sessions.data ?? [], to),
    };
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạm nghỉ dài hạn</CardTitle>
      </CardHeader>
      <CardContent>
        <ApiForm
          schema={pauseFormSchema}
          fields={[
            { name: "fromDate", label: "Từ ngày", type: "date", half: true },
            { name: "toDate", label: "Đến ngày", type: "date", half: true },
            {
              name: "reason",
              label: "Lý do",
              type: "reason",
              presets: REASON_PRESETS.leave,
            },
          ]}
          submitLabel="Xác nhận nghỉ dài hạn"
          onSubmit={(value) =>
            academicApi.createLeave({
              ...value,
              enrollmentId: enrollment.id,
              kind: "PERIOD_PAUSE",
            })
          }
          preview={(values) => {
            const result = impact(values);
            const count = result
              ? `${result.list.length} buổi`
              : "Chọn khoảng ngày";
            const rows: CompareRow[] = [
              {
                label: "Trạng thái",
                before: STATUS_TEXT[enrollment.status] ?? "Đang học",
                after: result
                  ? `Tạm nghỉ ${rangeText(result.from, result.to)}`
                  : "Chọn khoảng ngày",
                state: result ? "changed" : "same",
              },
              {
                label: "Lịch tuần",
                before: scheduleOf(current),
                after: "Giữ nguyên",
              },
              {
                label: "Buổi trong khoảng",
                before: result ? `${count} đi học` : count,
                after: result ? `${count} nghỉ có phép` : count,
                state: result?.list.length ? "changed" : "same",
              },
              {
                label: "Đi học lại",
                before: "Không áp dụng",
                after: result
                  ? result.back
                    ? displayDate(vietnamDay(result.back.startsAt))
                    : "Không còn buổi nào trong kỳ"
                  : "Chọn khoảng ngày",
                state: result ? "changed" : "same",
              },
            ];
            return (
              <div className="space-y-4">
                <CompareTable rows={rows} />
                {result && (
                  <AffectedSessions
                    isLoading={sessions.isPending}
                    isError={sessions.isError}
                    onRetry={() => void sessions.refetch()}
                    first={{
                      sessions: result.list,
                      tag: "Nghỉ có phép",
                      tone: "warning",
                    }}
                    second={{
                      sessions: result.back ? [result.back] : [],
                      tag: "Học bình thường",
                      tone: "plain",
                    }}
                    splitLabel="Đi học lại từ đây"
                  />
                )}
              </div>
            );
          }}
          summary={(values) => {
            const result = impact(values);
            if (!result)
              return "Chọn ngày bắt đầu và ngày kết thúc để xem các buổi bị ảnh hưởng.";
            return `${studentName} nghỉ ${result.list.length} buổi ${current.name} từ ${rangeText(result.from, result.to)}${result.back ? `, đi học lại ${displayDate(vietnamDay(result.back.startsAt))}` : ""}.`;
          }}
        />
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
                      .map(
                        (code) =>
                          MAKEUP_REASON_TEXT[code] ??
                          "chưa đủ điều kiện học bù, hãy tải lại để kiểm tra",
                      )
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
                  <Badge>
                    {STATUS_TEXT[booking.status] ?? "Chưa xác định trạng thái"}
                  </Badge>
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
function TransferPanel({
  enrollment,
  studentName,
}: {
  enrollment: EnrollmentRecord;
  studentName: string;
}) {
  const classes = useLiveQuery(["transfer-classes"], () =>
    registrationApi.classes(),
  );
  const currentId = currentEnrollmentClass(enrollment);
  const listedCurrent = classes.data?.find((item) => item.id === currentId);
  const current = { ...currentClassOf(enrollment), ...listedCurrent };
  const options = (classes.data ?? []).filter(
    (item) =>
      item.id !== currentId &&
      item.programId === enrollment.class.programId &&
      item.isOpen &&
      Number(item.monthlyFee) === Number(enrollment.class.monthlyFee),
  );
  const seats = (item?: RegistrationClass) =>
    item?.rosterCount === undefined
      ? undefined
      : item.capacity - item.rosterCount;
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
          emptyProps={{
            title: "Chưa có lớp cùng khóa và học phí để chuyển",
            description:
              "Chỉ chuyển được sang lớp đang mở của cùng khóa, cùng học phí. Cần Quản lý mở thêm lớp.",
          }}
        >
          <ApiForm
            schema={transferFormSchema}
            fields={[
              {
                name: "targetClassId",
                label: "Lớp mới cùng khóa, cùng học phí",
                type: "choices",
                options: options.map((item) => ({
                  value: item.id,
                  label: item.name,
                  description: (
                    <>
                      <span className="block">{scheduleOf(item)}</span>
                      {seats(item) !== undefined && (
                        <span className="block">Còn {seats(item)} chỗ</span>
                      )}
                    </>
                  ),
                })),
              },
              {
                name: "effectiveAt",
                label: "Hiệu lực từ (giờ Việt Nam)",
                type: "datetime-local",
                half: true,
              },
              {
                name: "reason",
                label: "Lý do chuyển",
                type: "reason",
                presets: REASON_PRESETS.transfer,
              },
            ]}
            submitLabel="Chuyển lớp"
            onSubmit={(value) =>
              academicApi.transfer(enrollment.id, {
                ...value,
                effectiveAt: vietnamDateTime(String(value.effectiveAt)),
              })
            }
            preview={(values) => {
              const target = options.find(
                (item) => item.id === values.targetClassId,
              );
              const differs = (a: string, b: string) =>
                target ? (a === b ? "same" : "changed") : "same";
              const seatText = (
                item: RegistrationClass | undefined,
                extra: number,
              ) =>
                item?.rosterCount === undefined
                  ? `Sức chứa ${item?.capacity ?? "?"}`
                  : `${item.rosterCount + extra} / ${item.capacity}`;
              const pending = "Chọn lớp mới";
              const rows: CompareRow[] = [
                {
                  label: "Lớp",
                  before: current.name,
                  after: target?.name ?? pending,
                  state: target ? "changed" : "same",
                },
                {
                  label: "Lịch tuần",
                  before: scheduleOf(current),
                  after: target ? scheduleOf(target) : pending,
                  state: differs(scheduleOf(current), scheduleOf(target)),
                },
                {
                  label: "Giáo viên",
                  before: teacherText(current),
                  after: target ? teacherText(target) : pending,
                  state: differs(teacherText(current), teacherText(target)),
                },
                {
                  label: "Phòng",
                  before: roomText(current),
                  after: target ? roomText(target) : pending,
                  state: differs(roomText(current), roomText(target)),
                },
                {
                  label: "Sĩ số",
                  before: seatText(current, 0),
                  after: target
                    ? `${seatText(target, 1)}${seats(target) !== undefined ? `, còn ${Math.max((seats(target) ?? 1) - 1, 0)} chỗ` : ""}`
                    : pending,
                  state: target ? "changed" : "same",
                },
                {
                  label: "Học phí",
                  before: `${money(current.monthlyFee)} / tháng`,
                  after: `${money(current.monthlyFee)} / tháng, không đổi`,
                  state: "ok",
                },
                {
                  label: "Kỳ ghi danh",
                  before: termText(enrollment.startDate, enrollment.endDate),
                  after: "Giữ nguyên",
                },
              ];
              return <CompareTable rows={rows} />;
            }}
            summary={(values) => {
              const target = options.find(
                (item) => item.id === values.targetClassId,
              );
              const when = localMoment(values.effectiveAt);
              if (!target || !when)
                return "Chọn lớp mới và thời điểm hiệu lực để xem thay đổi.";
              return `Từ ${when}, ${studentName} học ${target.name} thay cho ${current.name}. Lịch sử xếp lớp cũ được giữ.`;
            }}
          />
        </AsyncBoundary>
      </CardContent>
    </Card>
  );
}
function WithdrawPanel({
  student,
  enrollment,
  enrollments,
}: {
  student: StudentListItem;
  enrollment?: EnrollmentRecord;
  enrollments: EnrollmentRecord[];
}) {
  const canEndOne = enrollment?.status === "ACTIVE";
  const [scope, setScope] = useState<"one" | "all">(canEndOne ? "one" : "all");
  const open = enrollments.filter((item) => item.status !== "ENDED");
  const isAll = scope === "all";
  const rows: CompareRow[] = [
    ...open.map((item) => {
      const ends = isAll || item.id === enrollment?.id;
      return {
        label: currentClassOf(item).name,
        before: `${STATUS_TEXT[item.status] ?? "Đang học"}, ${termText(item.startDate, item.endDate)}`,
        after: ends ? "Kết thúc ngay" : "Học tiếp",
        state: ends ? ("blocked" as const) : ("same" as const),
      };
    }),
    {
      label: "Hồ sơ học sinh",
      before: "Đang học",
      after: isAll ? "Ngừng học, cho học lại được" : "Đang học",
      state: isAll ? "changed" : "same",
    },
    {
      label: "Tài khoản phụ huynh",
      before:
        student.parentProfile.user.displayName ||
        student.parentProfile.user.email,
      after: "Giữ nguyên",
    },
    { label: "Các con khác", before: "Không đổi", after: "Không ảnh hưởng" },
  ];
  const endedCount = isAll ? open.length : 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kết thúc môn học hoặc nghỉ hẳn</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ChoiceCards
          legend="Kết thúc phần nào"
          value={scope}
          onChange={(value) => setScope(value === "one" ? "one" : "all")}
          options={[
            {
              value: "one",
              label: "Một môn",
              description: canEndOne
                ? `Chỉ kết thúc ${currentClassOf(enrollment).name}. Các môn khác học tiếp.`
                : "Chọn một ghi danh đang học ở trên để dùng lựa chọn này.",
              disabled: !canEndOne,
            },
            {
              value: "all",
              label: "Nghỉ hẳn",
              description: "Kết thúc mọi ghi danh của con này và ngừng hồ sơ.",
            },
          ]}
        />
        <CompareTable rows={rows} />
        <div className="rounded-2xl bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            Không mở lại được ghi danh đã kết thúc
          </p>
          <p className="mt-1 text-foreground/80">
            Muốn học tiếp thì dùng &quot;Cho học lại&quot; rồi đăng ký lớp mới.
          </p>
        </div>
        <ApiForm
          key={scope}
          schema={endFormSchema}
          fields={[
            {
              name: "reason",
              label: "Lý do (không bắt buộc)",
              type: "reason",
              presets: REASON_PRESETS.end,
            },
          ]}
          submitLabel={isAll ? "Nghỉ hẳn…" : "Kết thúc môn…"}
          submitVariant="destructive"
          successMessage={false}
          summary={() =>
            isAll
              ? `Kết thúc ${endedCount} ghi danh và ngừng hồ sơ ${student.fullName} ngay khi xác nhận.`
              : `Kết thúc ghi danh ${currentClassOf(enrollment as EnrollmentRecord).name} của ${student.fullName} ngay khi xác nhận.`
          }
          confirm={{
            title: isAll
              ? `Cho ${student.fullName} nghỉ hẳn?`
              : `Kết thúc ${canEndOne ? currentClassOf(enrollment as EnrollmentRecord).name : "môn học"}?`,
            description: () =>
              isAll
                ? `Kết thúc ${endedCount} ghi danh và ngừng hồ sơ. Tài khoản phụ huynh và các con khác vẫn được giữ.`
                : "Ghi danh kết thúc ngay và không mở lại được.",
            confirmText: isAll ? "Xác nhận nghỉ hẳn" : "Kết thúc môn",
            danger: true,
          }}
          onSubmit={(value) => {
            const body = {
              reason:
                typeof value.reason === "string" ? value.reason : undefined,
            };
            return isAll
              ? academicApi.endStudent(student.id, body)
              : academicApi.endEnrollment(
                  (enrollment as EnrollmentRecord).id,
                  body,
                );
          }}
        />
      </CardContent>
    </Card>
  );
}
type LeaveAction = "approve" | "reject" | "endEarly" | "cancel";
const LEAVE_ACTION_TITLE: Record<LeaveAction, string> = {
  approve: "Duyệt đơn nghỉ",
  reject: "Từ chối đơn nghỉ",
  endEarly: "Kết thúc nghỉ sớm",
  cancel: "Hủy đơn nghỉ",
};
function LeaveHistory({ studentId }: { studentId: string }) {
  const leaves = useLiveQuery(["leaves", studentId], (signal) =>
    academicApi.leaves({ studentId }, signal),
  );
  const [active, setActive] = useState<{
    leave: LeaveRecord;
    action: LeaveAction;
  } | null>(null);
  const close = () => setActive(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn nghỉ của học sinh</CardTitle>
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
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp và loại</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.data?.map((leave) => {
                  const canEndEarly =
                    leave.status === "APPROVED" &&
                    leave.kind === "PERIOD_PAUSE" &&
                    dateOnly(leave.toDate) >= todayLocalDate();
                  const canCancel =
                    leave.status === "PENDING" || leave.status === "APPROVED";
                  const open = (action: LeaveAction) =>
                    setActive({ leave, action });
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <p className="font-medium">
                          {leave.enrollment.class.name}
                        </p>
                        <p className="text-muted-foreground">
                          {leave.kind === "PERIOD_PAUSE"
                            ? "Nghỉ dài hạn"
                            : "Nghỉ một buổi"}
                        </p>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {dateOnly(leave.fromDate) === dateOnly(leave.toDate)
                          ? displayDate(leave.fromDate)
                          : rangeText(
                              dateOnly(leave.fromDate),
                              dateOnly(leave.toDate),
                            )}
                      </TableCell>
                      <TableCell className="max-w-56">
                        <p className="line-clamp-2 whitespace-pre-wrap">
                          {leave.reason}
                        </p>
                        {leave.decisionNote &&
                          leave.decisionNote !== leave.reason && (
                            <p className="line-clamp-2 text-muted-foreground">
                              {leave.decisionNote}
                            </p>
                          )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            leave.status === "APPROVED"
                              ? "success"
                              : leave.status === "PENDING"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {STATUS_TEXT[leave.status] ??
                            "Chưa xác định trạng thái"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {leave.status === "PENDING" && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => open("approve")}
                              >
                                Duyệt
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => open("reject")}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          {canEndEarly && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => open("endEarly")}
                            >
                              Kết thúc sớm
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => open("cancel")}
                            >
                              Hủy đơn
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </AsyncBoundary>
        <ApiFeedback error={leaves.error} />
      </CardContent>
      <Dialog open={!!active} onOpenChange={(value) => !value && close()}>
        <DialogContent>
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{LEAVE_ACTION_TITLE[active.action]}</DialogTitle>
                <DialogDescription>
                  {active.leave.enrollment.class.name},{" "}
                  {rangeText(
                    dateOnly(active.leave.fromDate),
                    dateOnly(active.leave.toDate),
                  )}
                </DialogDescription>
              </DialogHeader>
              <LeaveActionForm
                leave={active.leave}
                action={active.action}
                onDone={close}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
function LeaveActionForm({
  leave,
  action,
  onDone,
}: {
  leave: LeaveRecord;
  action: LeaveAction;
  onDone: () => void;
}) {
  if (action === "endEarly")
    return <EndLeaveEarly leave={leave} onDone={onDone} />;
  if (action === "cancel")
    return (
      <ApiForm
        schema={z.object({})}
        fields={[]}
        submitLabel="Hủy đơn nghỉ"
        submitVariant="destructive"
        successMessage={false}
        summary={() =>
          leave.status === "APPROVED"
            ? "Đơn đã duyệt sẽ bị hủy; các buổi trong khoảng nghỉ trở lại học bình thường."
            : "Đơn chờ duyệt sẽ bị hủy."
        }
        onSubmit={() => academicApi.cancelLeave(leave.id)}
        onSuccess={onDone}
      />
    );
  const approve = action === "approve";
  return (
    <ApiForm
      schema={reasonSchema}
      fields={[
        {
          name: "reason",
          label: approve ? "Ghi chú duyệt" : "Lý do từ chối",
          type: "reason",
          presets: approve ? REASON_PRESETS.approve : REASON_PRESETS.reject,
        },
      ]}
      submitLabel={approve ? "Duyệt đơn" : "Từ chối đơn"}
      submitVariant={approve ? "default" : "destructive"}
      successMessage={false}
      onSubmit={(value) =>
        academicApi.decideLeave(leave.id, approve, String(value.reason))
      }
      onSuccess={onDone}
    />
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
            {
              name: "reason",
              label: "Lý do đổi",
              type: "reason",
              presets: REASON_PRESETS.reschedule,
            },
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
function EndLeaveEarly({
  leave,
  onDone,
}: {
  leave: LeaveRecord;
  onDone: () => void;
}) {
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
    <ApiForm
      schema={schema}
      defaults={{
        effectiveDate: todayLocalDate() > fromDate ? todayLocalDate() : "",
      }}
      fields={[
        {
          name: "effectiveDate",
          label: "Ngày đi học lại",
          type: "date",
          description:
            "Từ ngày này các buổi mở lại để điểm danh; các buổi trước đó vẫn tính nghỉ có phép.",
        },
        {
          name: "reason",
          label: "Lý do",
          type: "reason",
          presets: REASON_PRESETS.endLeave,
        },
      ]}
      submitLabel="Kết thúc nghỉ sớm"
      successMessage={false}
      preview={(values) => (
        <CompareTable
          rows={[
            {
              label: "Kỳ nghỉ",
              before: rangeText(fromDate, toDate),
              after: isDay(values.effectiveDate)
                ? `Đến hết ngày trước ${displayDate(values.effectiveDate)}`
                : "Chọn ngày đi học lại",
              state: isDay(values.effectiveDate) ? "changed" : "same",
            },
          ]}
        />
      )}
      onSubmit={(value) => academicApi.endLeaveEarly(leave.id, value)}
      onSuccess={onDone}
    />
  );
}
function ReactivatePanel({ student }: { student: StudentListItem }) {
  // Set when this panel sends the command: once the list reloads with ACTIVE we show the
  // next step (the form unmounts before a per-call onSuccess could run).
  const [hasRequested, setHasRequested] = useState(false);
  if (student.status !== "INACTIVE" && !hasRequested) return null;
  if (student.status !== "INACTIVE")
    return (
      <div className="space-y-3 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/40">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">
          Đã mở lại hồ sơ {student.fullName}
        </p>
        <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
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
      </div>
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cho {student.fullName} học lại</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol
          aria-label="Các bước cho học lại"
          className="grid gap-3 sm:grid-cols-2"
        >
          <li className="rounded-2xl border border-primary bg-primary/5 px-4 py-3">
            <p className="font-medium">Mở lại hồ sơ</p>
            <p className="text-sm text-muted-foreground">Làm ở panel này</p>
          </li>
          <li className="rounded-2xl border border-border bg-muted/50 px-4 py-3">
            <p className="font-medium text-muted-foreground">Đăng ký lớp mới</p>
            <p className="text-sm text-muted-foreground">
              Mở màn đăng ký, chọn sẵn phụ huynh và con
            </p>
          </li>
        </ol>
        <ApiForm
          schema={reasonSchema}
          fields={[
            {
              name: "reason",
              label: "Lý do cho học lại",
              type: "reason",
              presets: REASON_PRESETS.reactivate,
            },
          ]}
          submitLabel="Cho học lại"
          successMessage={false}
          preview={() => (
            <CompareTable
              rows={[
                {
                  label: "Hồ sơ",
                  before: "Ngừng học",
                  after: "Đang học, chưa có lớp",
                  state: "changed",
                },
                {
                  label: "Ghi danh cũ",
                  before: "Đã kết thúc",
                  after: "Giữ nguyên, không mở lại",
                },
                {
                  label: "Lịch sử học và thanh toán",
                  before: "Có",
                  after: "Giữ nguyên",
                },
              ]}
            />
          )}
          summary={() =>
            `Mở lại hồ sơ ${student.fullName}, giữ lịch sử cũ. Bước sau là đăng ký lớp mới.`
          }
          onSubmit={(value) => {
            setHasRequested(true);
            return academicApi.reactivateStudent(student.id, value);
          }}
        />
      </CardContent>
    </Card>
  );
}

"use client";
// Bước 4 và 5 của wizard tạo lớp (Luồng 2, PLAN_GUIDED_WORKFLOWS.md): cho Quản lý thấy lớp dùng
// giáo trình và mục tiêu nào (gắn theo khóa), rồi tự xem trước cả kỳ và tạo buổi bằng một nút (D1 a).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { curriculumApi } from "@/features/curriculum/api";
import {
  clearGenerationAttempt,
  getGenerationAttempt,
  readGenerationAttempt,
} from "@/features/curriculum/generation-storage";
import {
  generateSelectedClasses,
  generationReady,
  type ClassGenerationResult,
} from "@/features/curriculum/generation-plan";
import { sessionRange } from "@/features/curriculum/session-format";
import { useCurrentUser } from "@/hooks/use-current-role";
import { useCurrentTime } from "@/hooks/use-current-time";
import { calendarDateLabel } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import type { ScheduleRangeInput } from "@/lib/validators/curriculum";
import type { CurriculumUnit } from "@/types/curriculum";
import type { OutcomeSet } from "@/types/outcomes";
import type { ScheduleRangePlan } from "../program-setup";
import { ApiFeedback } from "./api-feedback";

const OUTCOME_STATUS_TEXT = {
  DRAFT: "đang soạn",
  APPROVED: "đã duyệt",
} as const;

/** Bước 4: giáo trình và bộ mục tiêu đi theo khóa học của lớp. */
export function WizardCurriculumSummary({
  units,
  sets,
  range,
}: {
  units: CurriculumUnit[];
  sets: OutcomeSet[];
  range: ScheduleRangePlan | null;
}) {
  const unit = range
    ? units.find((item) => item.id === range.unitId)
    : undefined;
  const latest = [...sets].sort((a, b) => b.version - a.version)[0];
  const waiting = units.find((item) => item.status === "PENDING_REVIEW");
  const draft = units.find((item) => item.status === "DRAFT");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Lớp học theo khóa đã chọn nên tự dùng giáo trình và mục tiêu của khóa.
        Bạn không phải gán thêm.
      </p>
      <section
        className="space-y-1 rounded-2xl border border-border p-4"
        aria-label="Giáo trình"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Giáo trình</p>
          <Badge variant={unit ? "success" : "warning"}>
            {unit ? "Đã duyệt áp dụng" : "Chưa có bản duyệt"}
          </Badge>
        </div>
        {unit && range ? (
          <p className="text-sm text-muted-foreground">
            {unit.title} · áp dụng{" "}
            {calendarDateLabel(unit.fromDate.slice(0, 10))} –{" "}
            {calendarDateLabel(range.toDate)}
            {unit._count?.lessons != null && ` · ${unit._count.lessons} bài`}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {waiting
              ? waiting.technicalReviewedAt
                ? "Giáo trình đang chờ Quản lý duyệt áp dụng."
                : "Giáo trình đang chờ giáo viên duyệt nội dung."
              : draft
                ? "Thiết kế giáo trình đang soạn giáo trình cho khóa này."
                : "Khóa chưa có giáo trình. Thiết kế giáo trình cần soạn và gửi duyệt."}{" "}
            Lớp vẫn tạo được; lịch học tạo sau khi giáo trình được duyệt áp
            dụng.
          </p>
        )}
      </section>
      <section
        className="space-y-1 rounded-2xl border border-border p-4"
        aria-label="Mục tiêu khóa học"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Mục tiêu khóa học</p>
          <Badge
            variant={latest?.status === "APPROVED" ? "success" : "neutral"}
          >
            {latest
              ? `Bản ${latest.version} ${OUTCOME_STATUS_TEXT[latest.status]}`
              : "Chưa có"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {latest
            ? `${latest.outcomes.length} mục tiêu. Phụ huynh xem được mục tiêu đã duyệt trên ứng dụng.`
            : "Khóa không bắt buộc có mục tiêu. Thiết kế giáo trình có thể soạn sau."}
        </p>
      </section>
    </div>
  );
}

type SessionsState = "no-range" | "no-teacher" | "ready";

/** Bước 5: tự xem trước các buổi của cả kỳ, mỗi buổi một bài theo thứ tự; một nút để tạo. */
export function WizardSessionsStep({
  classId,
  hasTeacher,
  range,
  onBack,
  onFinish,
}: {
  classId: string;
  hasTeacher: boolean;
  range: ScheduleRangePlan | null;
  onBack: () => void;
  /** `generated` = số buổi đã tạo, `null` khi bỏ qua để tạo lịch sau. */
  onFinish: (generated: number | null) => void;
}) {
  const state: SessionsState = !range
    ? "no-range"
    : !hasTeacher
      ? "no-teacher"
      : "ready";
  if (state !== "ready" || !range)
    return (
      <div className="space-y-4">
        <Alert variant="warning">
          <AlertTitle>Chưa tạo được lịch học cho lớp này</AlertTitle>
          <AlertDescription>
            {state === "no-range"
              ? "Khóa chưa có giáo trình đã duyệt áp dụng. Khi Quản lý duyệt áp dụng giáo trình, hệ thống sẽ hỏi tạo lịch cho các lớp của khóa, kể cả lớp này."
              : "Lớp chưa có giáo viên. Gán giáo viên ở trang lớp, rồi bấm “Tạo lịch học” ở đó hoặc ở thẻ “Lớp cần tạo lịch học” trên Tổng quan."}
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Quay lại
          </Button>
          <div className="flex flex-wrap gap-2">
            {state === "no-teacher" && (
              <Button
                type="button"
                variant="outline"
                render={<Link href={ROUTES.MANAGER.CLASS_DETAIL(classId)} />}
              >
                Gán giáo viên
              </Button>
            )}
            <Button type="button" onClick={() => onFinish(null)}>
              Tiếp: mở đăng ký
            </Button>
          </div>
        </div>
      </div>
    );
  return (
    <SessionsPreview
      classId={classId}
      range={range}
      onBack={onBack}
      onFinish={onFinish}
    />
  );
}

function SessionsPreview({
  classId,
  range,
  onBack,
  onFinish,
}: {
  classId: string;
  range: ScheduleRangePlan;
  onBack: () => void;
  onFinish: (generated: number | null) => void;
}) {
  const user = useCurrentUser();
  const client = useQueryClient();
  const now = useCurrentTime();
  const input: ScheduleRangeInput = {
    curriculumUnitId: range.unitId,
    fromDate: range.fromDate,
    toDate: range.toDate,
  };
  const [result, setResult] = useState<ClassGenerationResult | undefined>(
    undefined,
  );
  const [busy, setBusy] = useState<"preview" | "generate" | null>(null);
  const lock = useRef(false);
  const started = useRef(false);

  async function preview() {
    if (lock.current || !user) return;
    lock.current = true;
    setBusy("preview");
    try {
      // Lần tạo trước chưa rõ kết quả (mất mạng): giữ đúng nội dung và khóa cũ để thử lại.
      const attempt = readGenerationAttempt(user.id, classId);
      setResult(
        attempt
          ? { input: attempt.body, attempt }
          : { input, preview: await curriculumApi.preview(classId, input) },
      );
    } catch (error) {
      setResult({ input, error });
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  // Tới bước là tự xem trước một lần: Quản lý chỉ còn đọc và bấm "Tạo N buổi học".
  useEffect(() => {
    if (started.current || !user) return;
    started.current = true;
    void preview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function generate() {
    if (lock.current || !user || !result) return;
    lock.current = true;
    setBusy("generate");
    let created: number | undefined;
    try {
      await generateSelectedClasses(
        [classId],
        { [classId]: result },
        result.input,
        {
          getAttempt: (id, body) => getGenerationAttempt(user.id, id, body),
          clearAttempt: (id) => clearGenerationAttempt(user.id, id),
          generate: curriculumApi.generate,
          onResult: (_id, next) => {
            setResult(next);
            created = next.generated;
          },
          now: Date.now,
        },
      );
      await Promise.all(
        [
          "curriculum",
          "academic-calendar",
          "academic-generations",
          "registration-class",
          "registration-classes",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    } finally {
      lock.current = false;
      setBusy(null);
    }
    if (created !== undefined) onFinish(created);
  }

  const slots = result?.preview?.slots ?? [];
  const conflicts = slots.filter((slot) => slot.conflicts.length);
  const expired =
    !!result?.preview && Date.parse(result.preview.expiresAt) <= now;
  const canGenerate =
    !busy && generationReady(result, result?.input ?? input, now);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Giáo trình{" "}
        <span className="font-medium text-foreground">{range.title}</span>, từ{" "}
        {calendarDateLabel(range.fromDate)} đến{" "}
        {calendarDateLabel(range.toDate)}. Mỗi buổi học một bài theo thứ tự;
        ngày nghỉ trung tâm được bỏ qua.
      </p>
      {busy === "preview" && (
        <p role="status" className="text-sm">
          Đang xếp buổi học theo giáo trình…
        </p>
      )}
      <ApiFeedback error={result?.error} />
      {result?.error !== undefined && !busy && (
        <Button type="button" variant="outline" onClick={() => void preview()}>
          Xem trước lại
        </Button>
      )}
      {result?.attempt && !result.preview && (
        <Alert variant="warning">
          <AlertTitle>Lần tạo trước chưa rõ kết quả</AlertTitle>
          <AlertDescription>
            Bấm “Tạo buổi học” để thử lại đúng thao tác đó; hệ thống không tạo
            trùng buổi.
          </AlertDescription>
        </Alert>
      )}
      {slots.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{slots.length} buổi</Badge>
            <Badge variant={conflicts.length ? "danger" : "success"}>
              {conflicts.length
                ? `${conflicts.length} buổi trùng lịch`
                : "Không trùng lịch"}
            </Badge>
          </div>
          <div className="max-h-96 overflow-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Buổi</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Bài học
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot, index) => (
                  <TableRow
                    key={slot.startsAt}
                    className={cn(
                      slot.conflicts.length > 0 && "bg-destructive/5",
                    )}
                  >
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell className="text-xs whitespace-normal sm:whitespace-nowrap">
                      {sessionRange(slot.startsAt, slot.endsAt)}
                      {/* Màn hẹp: bài học nằm ngay dưới giờ, không cần cuộn ngang. */}
                      <span className="mt-1 block text-sm sm:hidden">
                        {slot.lessonTitle}
                      </span>
                      {slot.conflicts.length > 0 && (
                        <span className="block text-xs text-destructive sm:hidden">
                          Giáo viên hoặc phòng đã có lớp khác giờ này
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-72 whitespace-normal sm:table-cell">
                      {slot.lessonTitle}
                      {slot.conflicts.length > 0 && (
                        <span className="block text-xs text-destructive">
                          Giáo viên hoặc phòng đã có lớp khác giờ này
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {conflicts.length > 0 && (
            <p className="text-sm text-destructive">
              Sửa lịch tuần hoặc đổi giáo viên, phòng ở trang lớp rồi tạo lịch
              học lại.
            </p>
          )}
          {expired && (
            <p className="text-sm text-destructive">
              Bản xem trước đã hết hạn.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => void preview()}
              >
                Xem trước lại
              </button>
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!!busy}
          onClick={onBack}
        >
          Quay lại
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => onFinish(null)}
          >
            Để sau
          </Button>
          <Button
            type="button"
            disabled={!canGenerate}
            isLoading={busy === "generate"}
            onClick={() => void generate()}
          >
            {slots.length ? `Tạo ${slots.length} buổi học` : "Tạo buổi học"}
          </Button>
        </div>
      </div>
    </div>
  );
}

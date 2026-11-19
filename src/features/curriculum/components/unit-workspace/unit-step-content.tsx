"use client";

import Link from "next/link";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { calendarDateLabel } from "@/lib/calendar-date";
import { unlinkedOutcomeSubmitNote } from "@/lib/outcome-links";
import type { ContentOwner, ContentStepKey } from "../../content-setup";
import { useUnitWorkspace } from "../../hooks/use-unit-workspace";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";
import { curriculumSetupHref } from "../../setup-href";
import { CurriculumSubmitForm } from "../curriculum-review-forms";
import { UnitActionsMenu } from "./unit-actions-menu";
import { UnitEditors } from "./unit-editors";
import { UnitLessonsSection } from "./unit-lessons-section";
import { UnitManagerDecision } from "./unit-manager-decision";
import { UnitNotices } from "./unit-notices";
import { UnitOutcomes } from "./unit-outcomes";
import { UnitReadinessSection } from "./unit-readiness-section";
import { UnitReviewNotes } from "./unit-review-notes";

interface UnitStepContentProps {
  unitId: string;
  programId: string;
  step: ContentStepKey;
  viewer: ContentOwner | null;
  go: (key: ContentStepKey) => void;
  /** Mở một bản giáo trình khác (null = về bản đang soạn); `csv` mở luôn hộp nhập file. */
  openUnit: (unitId: string | null, source?: "csv") => void;
}

/** Nội dung các bước 2, 4, 5, 6 của trang một trang: bảng bài, form gửi duyệt, duyệt áp dụng. */
export function UnitStepContent({
  unitId,
  programId,
  step,
  viewer,
  go,
  openUnit,
}: UnitStepContentProps) {
  const ws = useUnitWorkspace(unitId, {
    mapOutcomesHref: curriculumSetupHref({
      programId,
      unitId,
      step: "mapping",
    }),
    onSubmitted: () => go("teacher"),
    onRevisionCreated: (id, source) => openUnit(id, source),
    onRemoved: () => openUnit(null),
    withReadiness: step === "submit",
  });
  const { query, unit, remove } = ws;
  // Xóa bản nháp xong thì tải lại chi tiết có thể 404: không hiện lỗi, chờ trang chuyển bản.
  if (remove.isSuccess && query.isError) return null;
  return (
    <AsyncBoundary
      isLoading={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      {unit && (
        <div className="min-w-0 space-y-4">
          <UnitNotices ws={ws} />
          {step === "lessons" && <LessonsStep ws={ws} viewer={viewer} />}
          {step === "submit" && <SubmitStep ws={ws} go={go} />}
          {step === "teacher" && (
            <p className="text-sm text-muted-foreground">
              Giáo viên được chọn mở mục Giáo trình trên trang của mình, đọc
              từng bài rồi đồng ý hoặc trả lại kèm nhận xét. Giáo viên đồng ý
              thì bộ mục tiêu đủ điều kiện được duyệt cùng.
            </p>
          )}
          {step === "manager" && <ManagerStep ws={ws} viewer={viewer} />}
          <UnitEditors ws={ws} />
        </div>
      )}
    </AsyncBoundary>
  );
}

function LessonsStep({
  ws,
  viewer,
}: {
  ws: UnitWorkspace;
  viewer: ContentOwner | null;
}) {
  const { unit, regular, canEdit, openEditor } = ws;
  if (!unit) return null;
  const isDesigner = viewer === "DESIGNER";
  return (
    <>
      <div className="space-y-2 rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">
            {unit.title} · bản {unit.version}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={unit.status === "APPROVED" ? "success" : "neutral"}>
              {regular.length} bài
            </Badge>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditor({ kind: "unit" })}
              >
                Sửa thông tin
              </Button>
            )}
            {isDesigner && <UnitActionsMenu ws={ws} showUnitEdit={false} />}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Áp dụng {calendarDateLabel(unit.fromDate.slice(0, 10))} –{" "}
          {calendarDateLabel(unit.toDate.slice(0, 10))}. Mỗi buổi học một bài
          theo thứ tự.
        </p>
      </div>
      <UnitLessonsSection ws={ws} readOnly={!isDesigner} />
      <UnitReviewNotes ws={ws} />
    </>
  );
}

function SubmitStep({
  ws,
  go,
}: {
  ws: UnitWorkspace;
  go: (key: ContentStepKey) => void;
}) {
  const { unit, canEdit, blocked, unlinkedGroups, setFormState, submitted } =
    ws;
  if (!unit) return null;
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {unit.status === "DRAFT"
          ? "Hệ thống kiểm tra thứ tự và nội dung bài, rồi bạn chọn giáo viên duyệt nội dung. Gửi xong, giáo trình bị khóa sửa cho tới khi được duyệt hoặc trả lại."
          : `Đã gửi duyệt${unit.reviewerTeacher?.displayName ? ` cho ${unit.reviewerTeacher.displayName}` : ""}.`}
      </p>
      <UnitReadinessSection ws={ws} />
      {canEdit &&
        (blocked ? (
          <p className="text-sm">
            Sửa các mục chưa đạt ở trên, rồi quay lại gửi duyệt.
          </p>
        ) : (
          <CurriculumSubmitForm
            unit={unit}
            outcomeNote={unlinkedOutcomeSubmitNote(unlinkedGroups)}
            onCancel={() => go("lessons")}
            onStateChange={setFormState}
            onSaved={submitted}
          />
        ))}
    </>
  );
}

function ManagerStep({
  ws,
  viewer,
}: {
  ws: UnitWorkspace;
  viewer: ContentOwner | null;
}) {
  const {
    unit,
    canArchive,
    canRevise,
    busy,
    scheduleOffer,
    openEditor,
    setDeleting,
  } = ws;
  if (!unit) return null;
  const isManager = viewer === "MANAGER";
  if (unit.status === "ARCHIVED")
    return (
      <p className="text-sm text-muted-foreground">
        Bản giáo trình này đã lưu trữ, chỉ để xem lại.
      </p>
    );
  if (unit.status === "APPROVED")
    return (
      <div className="space-y-4">
        <UnitReviewNotes ws={ws} />
        <p className="text-sm">
          Giáo trình đã được duyệt áp dụng. Lớp của khóa dùng giáo trình này khi
          tạo lịch học.
        </p>
        <div className="flex flex-wrap gap-2">
          {isManager && !scheduleOffer && (
            <Button
              variant="outline"
              render={
                <Link
                  href={`${ROUTES.MANAGER.SESSIONS}?${new URLSearchParams({ programId: unit.programId, unitId: unit.id }).toString()}`}
                />
              }
            >
              Tạo lịch học cho lớp của khóa
            </Button>
          )}
          {canArchive && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeleting("unit")}
            >
              Lưu trữ giáo trình
            </Button>
          )}
          {canRevise && (
            <Button
              disabled={busy}
              onClick={() => openEditor({ kind: "revision" })}
            >
              Chuẩn bị giáo trình kỳ tiếp theo
            </Button>
          )}
        </div>
        {isManager && (
          <>
            <UnitOutcomes ws={ws} />
            <UnitLessonsSection ws={ws} readOnly />
          </>
        )}
      </div>
    );
  return (
    <div className="space-y-4">
      <UnitReviewNotes ws={ws} />
      <p className="text-sm text-muted-foreground">
        Quản lý đọc lại giáo trình đã được giáo viên đồng ý, rồi duyệt áp dụng.
        Duyệt xong hệ thống mở màn tạo lịch học cho các lớp của khóa.
      </p>
      {isManager && unit.status === "PENDING_REVIEW" && (
        <>
          <UnitOutcomes ws={ws} />
          <UnitLessonsSection ws={ws} readOnly />
          <UnitManagerDecision ws={ws} />
        </>
      )}
    </div>
  );
}

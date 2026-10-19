"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ChangeDiff } from "@/components/shared/display/change-diff";
import { Stepper as ApprovalStepper } from "@/components/shared/workflows/stepper";
import { todayInVietnam } from "@/lib/calendar-date";
import type { CurriculumUnit, CurriculumUnitDetail } from "@/types/curriculum";
import { curriculumApi } from "../api";
import {
  compareLessons,
  previousCurriculum,
  LESSON_CHANGE_LABELS,
} from "../workspace-selectors";

export function useCurriculumComparison(unit?: CurriculumUnitDetail) {
  const direct = unit && previousCurriculum(unit, []);
  const candidates = useQuery({
    queryKey: ["curriculum", "units", unit?.programId ?? "comparison"],
    queryFn: ({ signal }) => curriculumApi.units(unit!.programId, signal),
    enabled: !!unit && !direct,
    retry: false,
  });
  const reference = unit
    ? previousCurriculum(unit, candidates.data ?? [])
    : null;
  const previous = useQuery({
    queryKey: ["curriculum", "unit", reference?.id ?? "no-previous"],
    queryFn: ({ signal }) => curriculumApi.unit(reference!.id, signal),
    enabled: !!reference,
    retry: false,
  });
  return {
    reference,
    previous: previous.data,
    rows: compareLessons(unit?.lessons ?? [], previous.data?.lessons),
    isPending:
      (!!unit && !direct && candidates.isPending) ||
      (!!reference && previous.isPending),
    error: (!direct ? candidates.error : null) ?? previous.error,
    retry: () => (reference ? previous.refetch() : candidates.refetch()),
  };
}

export function ComparisonNotice({
  comparison,
}: {
  comparison: ReturnType<typeof useCurriculumComparison>;
}) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p>
        {comparison.isPending
          ? "Đang tải bản đối chiếu…"
          : comparison.previous
            ? `${comparison.reference?.inferred ? "Đối chiếu kỳ trước gần nhất (suy luận theo hiệu lực, không xác nhận là bản nguồn)" : "Đối chiếu bản nguồn đã sao chép"}: ${comparison.previous.title} · phiên bản ${comparison.previous.version}. So bài cùng thứ tự; đổi thứ tự có thể tạo chênh lệch.`
            : "Chưa có bản đối chiếu truy cập được. Đọc toàn bộ bài trước khi quyết định."}
      </p>
      {comparison.previous && !comparison.isPending && <p>{(["new", "modified", "unchanged", "removed"] as const).map((change) => `${comparison.rows.filter((row) => row.change === change).length} ${LESSON_CHANGE_LABELS[change].toLocaleLowerCase("vi")}`).join(" · ")}</p>}
      <ApiFeedback
        error={comparison.error}
        retry={() => void comparison.retry()}
      />
    </div>
  );
}

export function LessonChangeContent({
  row,
}: {
  row: ReturnType<typeof compareLessons>[number];
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">
        {LESSON_CHANGE_LABELS[row.change]} · Bài {row.lesson.sequence}
      </p>
      {row.before && row.change === "modified" ? (
        <>
          <ChangeDiff
            label="Tên bài"
            before={row.before.title}
            after={row.lesson.title}
          />
          <ChangeDiff
            className="whitespace-pre-wrap wrap-anywhere [&>div]:items-start [&>div>span]:max-w-full"
            label="Nội dung"
            before={row.before.content}
            after={row.lesson.content}
          />
        </>
      ) : (
        <article className="whitespace-pre-wrap wrap-anywhere leading-7">
          {row.lesson.content}
        </article>
      )}
    </div>
  );
}

export function ApprovalSteps({ unit }: { unit: CurriculumUnit }) {
  const step =
    unit.status === "DRAFT"
      ? 0
      : unit.status === "PENDING_REVIEW"
        ? unit.technicalReviewedAt
          ? 2
          : 1
        : unit.status === "APPROVED" && unit.fromDate.slice(0,10) > todayInVietnam() ? 3 : 4;
  return (
    <ApprovalStepper
      currentStep={step}
      steps={[
        { label: "Soạn bài" },
        {
          label: "Giáo viên thẩm định",
          description:
            unit.reviewerTeacher?.displayName ||
            unit.reviewerTeacher?.email ||
            undefined,
        },
        { label: "Quản lý xác nhận" },
        { label: "Áp dụng", description: unit.fromDate.slice(0, 10) },
      ]}
      allowNavBack={false}
    />
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { calendarDateLabel } from "@/lib/calendar-date";
import { ROUTES } from "@/constants/routes";
import { ApprovalSteps, ComparisonNotice } from "./curriculum-comparison";
import { curriculumEffectiveLabel } from "../workspace-selectors";
import { curriculumStage } from "../presentation";
import { useUnitWorkspace } from "../hooks/use-unit-workspace";
import { UnitActionsMenu } from "./unit-workspace/unit-actions-menu";
import { UnitEditors } from "./unit-workspace/unit-editors";
import { UnitLessonsSection } from "./unit-workspace/unit-lessons-section";
import { UnitManagerDecision } from "./unit-workspace/unit-manager-decision";
import { UnitNotices } from "./unit-workspace/unit-notices";
import { UnitOutcomes } from "./unit-workspace/unit-outcomes";
import { UnitReadinessSection } from "./unit-workspace/unit-readiness-section";
import { UnitReviewNotes } from "./unit-workspace/unit-review-notes";
import { UnitTeacherDecision } from "./unit-workspace/unit-teacher-decision";

export function CurriculumUnitDetailView({ unitId }: { unitId: string }) {
  const ws = useUnitWorkspace(unitId);
  const {
    role,
    today,
    query,
    unit,
    comparison,
    canEdit,
    canRevise,
    canTechnicalReview,
    hasMenu,
    busy,
    regular,
    blocked,
    openEditor,
  } = ws;
  const backHref =
    role === "teacher" ? ROUTES.TEACHER.CURRICULUM : ROUTES.MANAGER.CURRICULUM;
  return (
    <PageContainer>
      <PageHeader
        title={unit?.title ?? "Chi tiết giáo trình"}
        backHref={backHref}
        description={
          unit
            ? [
                unit.program?.name ?? unit.track.subject,
                "Khối " + unit.track.grade,
                "Kỳ học " +
                  calendarDateLabel(unit.fromDate.slice(0, 10)) +
                  " – " +
                  calendarDateLabel(unit.toDate.slice(0, 10)),
              ].join(" · ")
            : undefined
        }
        actions={
          unit && (
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button
                  disabled={busy || blocked}
                  aria-describedby="curriculum-submit-checklist"
                  onClick={() => openEditor({ kind: "submit" })}
                >
                  Gửi duyệt
                </Button>
              )}
              {canTechnicalReview && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    document
                      .getElementById("curriculum-decision")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Duyệt nội dung
                </Button>
              )}
              {canRevise && (
                <Button
                  disabled={busy}
                  onClick={() => openEditor({ kind: "revision" })}
                >
                  Chuẩn bị kỳ tiếp theo
                </Button>
              )}
              {hasMenu && <UnitActionsMenu ws={ws} />}
            </div>
          )
        }
      />
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {unit && (
          <>
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge
                    category="curriculum"
                    status={curriculumStage(unit)}
                  />
                  {curriculumEffectiveLabel(unit, today) && (
                    <p className="text-sm text-muted-foreground">
                      {curriculumEffectiveLabel(unit, today)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {regular.length} bài học · Mỗi buổi một bài
                  </p>
                </div>
                <ApprovalSteps unit={unit} />
                {(comparison.previous ||
                  comparison.isPending ||
                  comparison.error) && (
                  <ComparisonNotice comparison={comparison} />
                )}
                {unit.status === "APPROVED" && (
                  <p className="text-sm text-muted-foreground">
                    Nội dung đã duyệt được giữ nguyên. Mọi thay đổi được chuẩn
                    bị trong giáo trình của kỳ tiếp theo.
                  </p>
                )}
              </CardContent>
            </Card>
            <UnitReadinessSection ws={ws} />
            <UnitNotices ws={ws} />
            <UnitReviewNotes ws={ws} />
            <UnitOutcomes ws={ws} />
            <UnitLessonsSection ws={ws} />
            <UnitTeacherDecision ws={ws} />
            <UnitManagerDecision ws={ws} />
            <UnitEditors ws={ws} />
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}

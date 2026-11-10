"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurriculumUnitDetail } from "@/types/curriculum";
import type { OutcomeSet } from "@/types/outcomes";

const STATUS_TEXT: Record<OutcomeSet["status"], string> = {
  DRAFT: "Bản nháp",
  APPROVED: "Đã duyệt áp dụng",
};

/**
 * Phần "Mục tiêu khóa học" trên trang duyệt giáo trình (W11): danh sách mục tiêu của bộ đi cùng
 * và các bài đã gắn. Không có bộ đi cùng và không có bản đã duyệt cũ thì không hiện gì.
 */
export function UnitOutcomesSection({
  unit,
  companions,
  keptVersion,
  canApproveSet,
  approveLabel,
  onApproveSet,
  approvingSetId,
}: {
  unit: CurriculumUnitDetail;
  companions: OutcomeSet[];
  /** Bản đã duyệt từ kỳ trước, hiện khi không có bộ đi cùng. */
  keptVersion: number | null;
  canApproveSet?: (set: OutcomeSet) => boolean;
  approveLabel?: string;
  onApproveSet?: (set: OutcomeSet) => void;
  approvingSetId?: string | null;
}) {
  if (!companions.length && keptVersion === null) return null;
  const lessonName = new Map(
    unit.lessons.map((lesson) => [lesson.id, `Bài ${lesson.sequence}`]),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mục tiêu khóa học</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!companions.length && keptVersion !== null && (
          <p className="text-sm text-muted-foreground">
            Mục tiêu giữ như bản {keptVersion}.
          </p>
        )}
        {companions.map((set) => (
          <section key={set.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium">
                {set.level} · bản {set.version}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{STATUS_TEXT[set.status]}</Badge>
                {canApproveSet?.(set) && onApproveSet && (
                  <Button
                    size="sm"
                    isLoading={approvingSetId === set.id}
                    disabled={!!approvingSetId}
                    onClick={() => onApproveSet(set)}
                  >
                    {approveLabel}
                  </Button>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {set.outcomes.map((outcome) => {
                const lessons = outcome.lessonLinks
                  .map((link) => lessonName.get(link.lessonId))
                  .filter((name): name is string => !!name);
                return (
                  <li
                    key={outcome.id}
                    className="rounded-xl border border-border p-3 text-sm"
                  >
                    <p className="font-medium">
                      {outcome.code} · {outcome.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {outcome.required ? "Bắt buộc" : "Mở rộng"} ·{" "}
                      {lessons.length
                        ? lessons.join(", ")
                        : outcome.lessonLinks.length
                          ? "Gắn vào bài của giáo trình khác"
                          : "Chưa gắn bài nào"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

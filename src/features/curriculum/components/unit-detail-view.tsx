"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import type { CurriculumLesson } from "@/types/curriculum";
import { curriculumApi } from "../api";
import {
  useCurriculumUnit,
  useCurriculumMutation,
} from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";
import { LessonForm, MonthlyTestForm } from "./lesson-form";

interface Editor {
  kind: "unit" | "LESSON" | "MONTHLY_TEST";
  lesson?: CurriculumLesson;
}

export function CurriculumUnitDetailView({ unitId }: { unitId: string }) {
  const role = useCurrentRole();
  const router = useRouter();
  const query = useCurriculumUnit(unitId);
  const [editor, setEditor] = useState<Editor | null>(null);
  const approve = useCurriculumMutation(() => curriculumApi.approve(unitId));
  const revise = useCurriculumMutation(async () => {
    const result = await curriculumApi.revise(unitId);
    router.push(ROUTES.MANAGER.CURRICULUM_UNIT(result.id));
    return result;
  });
  const unit = query.data;
  const canEdit = role === "curriculum_designer" && unit?.status === "DRAFT";
  const busy = approve.isPending || revise.isPending;
  const saved = () => setEditor(null);
  return (
    <PageContainer>
      <PageHeader
        title={unit?.title ?? "Học phần"}
        backHref={ROUTES.MANAGER.CURRICULUM}
        description={
          unit
            ? `${unit.track.subject} · Khối ${unit.track.grade} · ${unit.fromDate.slice(0, 10)} → ${unit.toDate.slice(0, 10)}`
            : undefined
        }
      />
      <ApiFeedback error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <p>Đang tải học phần…</p>}
      {unit && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={unit.status === "APPROVED" ? "success" : "secondary"}
            >
              {unit.status === "APPROVED" ? "Đã duyệt" : "Bản nháp"} · Phiên bản{" "}
              {unit.version}
            </Badge>
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditor({ kind: "unit" })}
                >
                  Sửa học phần
                </Button>
                <Button onClick={() => setEditor({ kind: "LESSON" })}>
                  Thêm bài học
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditor({ kind: "MONTHLY_TEST" })}
                >
                  Soạn kiểm tra tháng
                </Button>
              </>
            )}
            {role === "center_manager" && unit.status === "DRAFT" && (
              <Button
                disabled={busy}
                isLoading={approve.isPending}
                onClick={() => approve.mutate(undefined)}
              >
                Duyệt học phần
              </Button>
            )}
            {role === "curriculum_designer" && unit.status === "APPROVED" && (
              <Button
                disabled={busy}
                isLoading={revise.isPending}
                onClick={() => revise.mutate(undefined)}
              >
                Tạo phiên bản nháp mới
              </Button>
            )}
          </div>
          <ApiFeedback error={approve.error ?? revise.error} />
          {editor && canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editor.kind === "unit"
                    ? "Sửa học phần"
                    : editor.kind === "LESSON"
                      ? "Soạn bài học"
                      : "Soạn kiểm tra tháng"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editor.kind === "unit" ? (
                  <UnitForm
                    key={`unit-${unit.id}`}
                    unit={unit}
                    onSaved={saved}
                  />
                ) : editor.kind === "LESSON" ? (
                  <LessonForm
                    key={editor.lesson?.id ?? "new-lesson"}
                    unit={unit}
                    lesson={editor.lesson}
                    onSaved={saved}
                  />
                ) : (
                  <MonthlyTestForm
                    key={editor.lesson?.id ?? "new-test"}
                    unit={unit}
                    lesson={editor.lesson}
                    onSaved={saved}
                  />
                )}
                <Button variant="ghost" onClick={saved}>
                  Đóng
                </Button>
              </CardContent>
            </Card>
          )}
          <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Bài học cần có thứ tự liên tục từ 1. Mỗi tháng có lịch học cần một
            bài kiểm tra. Học phần đã duyệt được giữ nguyên; tạo phiên bản mới
            để chỉnh sửa.
          </p>
          {[...unit.lessons]
            .sort(
              (a, b) => a.kind.localeCompare(b.kind) || a.sequence - b.sequence,
            )
            .map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                      {lesson.kind === "MONTHLY_TEST"
                        ? `Kiểm tra ${lesson.monthKey}`
                        : `Bài ${lesson.sequence}`}
                      : {lesson.title}
                    </CardTitle>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditor({ kind: lesson.kind, lesson })}
                      >
                        Sửa nội dung
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">
                    {lesson.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          {!unit.lessons.length && (
            <p className="text-muted-foreground">
              Chưa có bài học hoặc kiểm tra tháng.
            </p>
          )}
        </>
      )}
    </PageContainer>
  );
}

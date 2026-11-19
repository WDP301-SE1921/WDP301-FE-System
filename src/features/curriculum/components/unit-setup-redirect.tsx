"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { ROUTES } from "@/constants/routes";
import { useCurrentRole } from "@/hooks/use-current-role";
import { unitStepKey } from "../content-setup";
import { curriculumSetupHref } from "../setup-href";
import { useCurriculumUnit } from "../hooks/use-curriculum";

/**
 * Đường cũ `/manager/curriculum/[id]`: tải giáo trình rồi chuyển sang trang giáo trình một trang.
 * Giáo viên vẫn xem ở màn của giáo viên.
 */
export function UnitSetupRedirect({ unitId }: { unitId: string }) {
  const router = useRouter();
  const role = useCurrentRole();
  const search = useSearchParams();
  const query = useCurriculumUnit(unitId);
  const unit = query.data;
  const editor = search.get("editor");
  const lesson = search.get("lesson");

  useEffect(() => {
    if (role === "teacher") {
      router.replace(ROUTES.TEACHER.CURRICULUM_UNIT(unitId));
      return;
    }
    if (!unit) return;
    // `editor=submit` mở thẳng bước gửi duyệt (form nằm trong trang), không mở hộp thoại.
    const toSubmit = editor === "submit";
    let href = curriculumSetupHref({
      programId: unit.programId,
      unitId,
      step: toSubmit ? "submit" : unitStepKey(unit),
      editor: toSubmit ? undefined : (editor ?? undefined),
    });
    if (lesson) href += `&lesson=${encodeURIComponent(lesson)}`;
    router.replace(href);
  }, [role, unit, unitId, editor, lesson, router]);

  return (
    <AsyncBoundary
      isLoading={query.isPending}
      isError={query.isError && role !== "teacher"}
      error={query.error}
      onRetry={() => void query.refetch()}
      skeleton={<SkeletonDetailHeader />}
    >
      <SkeletonDetailHeader />
    </AsyncBoundary>
  );
}

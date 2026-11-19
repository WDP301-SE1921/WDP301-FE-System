"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { actsAsManager } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { useVietnamDate } from "@/hooks/use-vietnam-date";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/lib/files/csv";
import type { CurriculumLesson } from "@/types/curriculum";
import { registrationApi } from "@/features/registration-flow/api";
import {
  classesNeedingSchedule,
  describeExcluded,
  schedulableClasses,
} from "@/features/registration-flow/program-setup";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { outcomeApi } from "@/features/outcomes/api";
import { approveCompanionSets } from "@/features/outcomes/approval-chain";
import {
  approvalPlan,
  approvalWarning,
  latestApprovedVersion,
  type SetFailure,
} from "@/features/outcomes/two-stage-approval";
import {
  buildOutcomeMatrixHref,
  companionSets,
  countUnlinked,
  unlinkedDraftOutcomes,
} from "@/lib/outcome-links";
import { curriculumApi } from "../api";
import { useCurriculumUnit, useCurriculumMutation } from "./use-curriculum";
import type { CurriculumFormState } from "./use-curriculum-form";
import { useCurriculumComparison } from "../components/curriculum-comparison";
import { canCopyCurriculum } from "../workspace-selectors";
import {
  neededLessons,
  useCurriculumReadiness,
} from "../components/curriculum-readiness";
import { hasBlockingCheck, submitChecklist } from "../submit-checklist";
import { moveLessonBy } from "../lesson-order";
import { curriculumSetupHref } from "../setup-href";

export interface Editor {
  kind:
    | "unit"
    | "lesson"
    | "import"
    | "submit"
    | "technical-review"
    | "revision"
    | "request-changes";
  lesson?: CurriculumLesson;
}

export interface UnitWorkspaceOptions {
  mapOutcomesHref?: string;
  onRevisionCreated?: (id: string, source?: "csv") => void;
  onRemoved?: () => void;
  onSubmitted?: () => void;
  withReadiness?: boolean;
}

export function useUnitWorkspace(
  unitId: string,
  options: UnitWorkspaceOptions = {},
) {
  const role = useCurrentRole();
  const today = useVietnamDate();
  const user = useCurrentUser();
  const router = useRouter();
  const query = useCurriculumUnit(unitId);
  const [selectedLessonId, setSelectedLessonId] = useQueryState(
    "lesson",
    parseAsString.withDefault(""),
  );
  const [editorKind, setEditorKind] = useQueryState(
    "editor",
    parseAsStringLiteral([
      "unit",
      "lesson",
      "import",
      "submit",
      "technical-review",
      "revision",
      "request-changes",
    ]),
  );
  const editor: Editor | null = editorKind
    ? {
        kind: editorKind,
        lesson:
          editorKind === "lesson"
            ? query.data?.lessons.find(
                (lesson) => lesson.id === selectedLessonId,
              )
            : undefined,
      }
    : null;
  const setEditor = (value: Editor | null) => {
    void setEditorKind(value?.kind ?? null);
    if (value?.kind === "lesson")
      void setSelectedLessonId(value.lesson?.id ?? null);
  };
  const [formState, setFormState] = useState<CurriculumFormState>({
    dirty: false,
    busy: false,
  });
  const [discard, setDiscard] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [notice, setNotice] = useState("");
  const [scheduleOffer, setScheduleOffer] = useState<{
    count: number;
    href: string;
    excluded: string;
    allDone: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState<"unit" | CurriculumLesson | null>(
    null,
  );
  const [positionLesson, setPositionLesson] = useState<CurriculumLesson | null>(
    null,
  );
  const [mappingLesson, setMappingLesson] = useState<CurriculumLesson | null>(
    null,
  );
  const approve = useCurriculumMutation(() => curriculumApi.approve(unitId));
  const remove = useCurriculumMutation(async () => {
    const result = await curriculumApi.remove(unitId);
    if ("deleted" in result)
      (options.onRemoved ?? (() => router.push(ROUTES.MANAGER.CURRICULUM)))();
    return result;
  });
  const removeLesson = useCurriculumMutation((id: string) =>
    curriculumApi.removeLesson(unitId, id),
  );
  const reorder = useCurriculumMutation((ids: string[]) =>
    curriculumApi.reorder(unitId, ids, query.data!.revision),
  );
  const unit = query.data;
  const comparison = useCurriculumComparison(unit);
  const [changeFilter, setChangeFilter] = useQueryState(
    "lessonChanges",
    parseAsStringLiteral([
      "all",
      "changed",
      "new",
      "modified",
      "unchanged",
      "removed",
    ]).withDefault(
      role === "teacher" || actsAsManager(role) ? "changed" : "all",
    ),
  );
  // Bản đầu tiên không có bản để đối chiếu: ẩn cột, nút lọc, và bỏ qua ?lessonChanges= cũ trên URL.
  const hasComparison = !!comparison.previous;
  const effectiveFilter = hasComparison ? changeFilter : "all";
  // Bài "Đã bỏ" so với bản đối chiếu có thể rất nhiều: mặc định ẩn, trừ khi lọc "Đã bỏ" hoặc bấm Hiện.
  const [showRemoved, setShowRemoved] = useState(false);
  const removedCount = hasComparison
    ? comparison.rows.filter((row) => row.change === "removed").length
    : 0;
  const canToggleRemoved =
    removedCount > 0 &&
    (effectiveFilter === "all" || effectiveFilter === "changed");
  const comparisonRows = comparison.rows.filter(
    (row) =>
      (row.change !== "removed" ||
        showRemoved ||
        effectiveFilter === "removed") &&
      (effectiveFilter === "all" ||
        (effectiveFilter === "changed"
          ? row.change !== "unchanged"
          : row.change === effectiveFilter)),
  );
  const selectedRow =
    comparisonRows.find((row) => row.lesson.id === selectedLessonId) ??
    comparisonRows[0];
  // Q6: mọi Thiết kế GT sửa được bản nháp; sửa cùng lúc thì BE trả REVISION_CONFLICT.
  const canEdit = role === "curriculum_designer" && unit?.status === "DRAFT";
  const canRevise =
    role === "curriculum_designer" && !!unit && canCopyCurriculum(unit);
  const canTechnicalReview =
    role === "teacher" &&
    unit?.status === "PENDING_REVIEW" &&
    unit.reviewerTeacherId === user?.id &&
    !unit.technicalReviewedAt;
  const canConfirm =
    actsAsManager(role) &&
    unit?.status === "PENDING_REVIEW" &&
    !!unit.technicalReviewedAt;
  // Người soạn gắn mục tiêu nháp vào bài được cả khi giáo trình đã gửi hoặc đã duyệt
  // áp dụng (BE B1); giáo trình đã lưu trữ thì BE trả LESSON_LOCKED.
  const canMapOutcomes =
    role === "curriculum_designer" &&
    !!unit &&
    ["DRAFT", "PENDING_REVIEW", "APPROVED"].includes(unit.status);
  // Giáo viên và Quản lý cũng cần bộ mục tiêu để duyệt cùng giáo trình (W11).
  const showOutcomes =
    canMapOutcomes ||
    canTechnicalReview ||
    canConfirm ||
    (actsAsManager(role) && unit?.status === "APPROVED") ||
    (role === "teacher" && unit?.reviewerTeacherId === user?.id);
  // Cùng khóa cache với LessonOutcomeDialog nên gắn xong cảnh báo tự cập nhật.
  // Lỗi tải thì không cho duyệt (outcomesUnready) để khỏi bỏ sót bộ mục tiêu.
  const outcomeSets = useLiveQuery(
    ["outcome-sets", unit?.programId, "all"],
    (signal) => academicApi.outcomeSets(unit!.programId, {}, signal),
    showOutcomes,
  );
  // Chưa biết bộ mục tiêu thì chưa cho duyệt: tránh duyệt im lặng bỏ sót bộ (W11).
  const outcomesUnready =
    (canTechnicalReview || canConfirm) &&
    (outcomeSets.isPending || outcomeSets.isError);
  const companions = unit
    ? companionSets(
        outcomeSets.data ?? [],
        unit.lessons.map((lesson) => lesson.id),
      )
    : [];
  const keptVersion = companions.length
    ? null
    : latestApprovedVersion(outcomeSets.data ?? []);
  const client = useQueryClient();
  // Chỉ giáo viên duyệt bộ mục tiêu (BE PR #12); Quản lý duyệt giáo trình không đụng tới bộ.
  const [followUp, setFollowUp] = useState<{ failures: SetFailure[] } | null>(
    null,
  );
  const [retryingFollowUp, setRetryingFollowUp] = useState(false);
  const [approvingSetId, setApprovingSetId] = useState<string | null>(null);
  const reportFollowUp = (failures: SetFailure[]) =>
    setFollowUp(failures.length ? { failures } : null);
  /** Thử lại dựa trên trạng thái lấy lại từ BE, không gọi lại bước giáo trình. */
  async function retryFollowUp() {
    if (!followUp || !unit) return;
    setRetryingFollowUp(true);
    try {
      const fresh = await outcomeApi.sets(unit.programId);
      const plan = approvalPlan(
        "teacher",
        companionSets(fresh, unit.lessons.map((lesson) => lesson.id)),
      );
      const failures = await approveCompanionSets(plan.approvable);
      await client.invalidateQueries({ queryKey: ["web-api"] });
      reportFollowUp(failures);
      if (!failures.length) setNotice("Đã duyệt mục tiêu khóa học.");
    } catch {
      /* Lỗi tải lại bộ: giữ nguyên thông báo, bấm thử lại sau. */
    } finally {
      setRetryingFollowUp(false);
    }
  }
  // Giáo viên đã duyệt nội dung giáo trình duyệt tiếp từng bộ còn nháp (vd bộ bị bỏ qua vì
  // thiếu bài lúc duyệt), kể cả khi Quản lý đã duyệt áp dụng giáo trình.
  const canApproveSets =
    role === "teacher" &&
    unit?.reviewerTeacherId === user?.id &&
    (unit?.status === "APPROVED" ||
      (unit?.status === "PENDING_REVIEW" && !!unit.technicalReviewedAt));
  async function approveOneSet(set: (typeof companions)[number]) {
    if (!canApproveSets) return;
    setApprovingSetId(set.id);
    try {
      const failures = await approveCompanionSets([set]);
      await client.invalidateQueries({ queryKey: ["web-api"] });
      reportFollowUp(failures);
      if (!failures.length) setNotice("Đã duyệt mục tiêu khóa học.");
    } finally {
      setApprovingSetId(null);
    }
  }
  const managerPlan = approvalPlan("center_manager", companions);
  const managerWarning = approvalWarning("center_manager", managerPlan);
  const unlinkedGroups = unlinkedDraftOutcomes(outcomeSets.data ?? []);
  const isOwnerDesigner = role === "curriculum_designer";
  const hasMenu =
    canEdit ||
    isOwnerDesigner ||
    (actsAsManager(role) &&
      !!unit &&
      ["PENDING_REVIEW", "APPROVED"].includes(unit.status));
  const busy = [approve, remove, removeLesson, reorder].some(
    (mutation) => mutation.isPending,
  );
  const error = [approve, remove, removeLesson, reorder].find(
    (mutation) => mutation.error,
  )?.error;
  const regular =
    unit?.lessons
      .filter((lesson) => lesson.kind === "LESSON")
      .sort((a, b) => a.sequence - b.sequence) ?? [];
  // Danh sách kiểm tra gửi duyệt: tính ngay từ bài đang có, tự cập nhật khi thêm hoặc xóa bài.
  const showReadiness = canEdit && (options.withReadiness ?? true);
  const { readiness, reviewerCount } = useCurriculumReadiness(
    unit,
    showReadiness,
  );
  const checks = submitChecklist({
    sequences: regular.map((lesson) => lesson.sequence),
    reviewerCount,
    neededLessons: neededLessons(readiness),
    unlinkedOutcomes: outcomeSets.data ? countUnlinked(unlinkedGroups) : undefined,
  });
  const blocked = hasBlockingCheck(checks);
  const openEditor = (value: Editor) => {
    setFormState({ dirty: false, busy: false });
    setNotice("");
    setEditor(value);
  };
  const closeEditor = () => {
    setEditor(null);
    setFormState({ dirty: false, busy: false });
  };
  const saved = (message: string) => {
    closeEditor();
    setNotice(message);
  };
  function download(createCsv: () => string, filename: string) {
    try {
      downloadCsv(createCsv(), filename);
    } catch {
      toast.error("Chưa tạo được file. Thử lại sau.");
    }
  }
  // Mọi cách đổi thứ tự đều gọi `reorder`; BE đánh lại số bài liên tục từ 1.
  function applyOrder(ids: string[] | null, done?: () => void, message?: string) {
    if (!ids) return;
    reorder.mutate(ids, {
      onSuccess: () => {
        done?.();
        if (message) toast.success(message);
      },
      onError: () =>
        toast.error("Chưa đổi được thứ tự bài. Thứ tự cũ được giữ nguyên."),
    });
  }
  const regularIds = regular.map((lesson) => lesson.id);
  const move = (id: string, direction: -1 | 1) =>
    applyOrder(moveLessonBy(regularIds, id, direction));
  const renumber = () =>
    applyOrder(regularIds, undefined, "Đã đánh số lại bài học.");
  const canRequestChanges =
    actsAsManager(role) && unit?.status === "PENDING_REVIEW";
  const canArchive = actsAsManager(role) && unit?.status === "APPROVED";
  const mapOutcomesHref =
    options.mapOutcomesHref ??
    (unit ? buildOutcomeMatrixHref(unit.programId) : "");
  const submitted = () => {
    saved("Đã gửi giáo viên duyệt nội dung.");
    options.onSubmitted?.();
  };
  const revisionCreated = (id: string, source?: "csv") => {
    closeEditor();
    if (options.onRevisionCreated) options.onRevisionCreated(id, source);
    else
      router.push(
        curriculumSetupHref({
          programId: unit?.programId ?? "",
          unitId: id,
          step: "lessons",
          editor: source === "csv" ? "import" : undefined,
        }),
      );
  };
  async function confirmApproval() {
    if (!unit) return;
    try {
      await approve.mutateAsync(undefined);
      setNotice("Đã duyệt áp dụng giáo trình.");
      try {
        // Lớp đủ điều kiện (có giáo viên, đủ khung giờ) để mở thẳng màn Tạo lịch học.
        const program = await registrationApi.program(unit.programId);
        const { eligible, excluded } = schedulableClasses(
          program.classes,
          program.sessionsPerWeek,
        );
        const params = new URLSearchParams({
          programId: unit.programId,
          unitId: unit.id,
        });
        // Chỉ lớp chưa có buổi tới hết kỳ (và lớp chưa biết do BE cũ) mới cần tạo lịch.
        const { needs, unknown } = classesNeedingSchedule(eligible, unit.toDate);
        const targets = [...needs, ...unknown];
        if (targets.length)
          params.set("classIds", targets.map((c) => c.id).join(","));
        const href = `${ROUTES.MANAGER.SESSIONS}?${params.toString()}`;
        setScheduleOffer({
          count: targets.length,
          href,
          excluded: describeExcluded(excluded),
          allDone: eligible.length > 0 && targets.length === 0,
        });
        // D1 (a): có lớp cần lịch thì mở luôn màn tạo lịch; màn đó tự xem trước theo
        // `unitId`, Quản lý chỉ còn bấm "Tạo lịch học cho N lớp".
        if (targets.length) router.push(href);
      } catch {
        setScheduleOffer(null);
      }
    } catch {
      /* API feedback remains visible. */
    }
  }
  async function confirmDelete() {
    try {
      if (deleting === "unit") await remove.mutateAsync(undefined);
      else if (deleting)
        await removeLesson.mutateAsync(deleting.id);
    } catch {
      /* API feedback remains visible. */
    }
  }
  return {
    role,
    today,
    user,
    router,
    query,
    selectedLessonId,
    setSelectedLessonId,
    editor,
    setEditor,
    formState,
    setFormState,
    discard,
    setDiscard,
    confirmApply,
    setConfirmApply,
    notice,
    setNotice,
    scheduleOffer,
    setScheduleOffer,
    deleting,
    setDeleting,
    positionLesson,
    setPositionLesson,
    mappingLesson,
    setMappingLesson,
    approve,
    remove,
    removeLesson,
    reorder,
    unit,
    comparison,
    changeFilter,
    setChangeFilter,
    hasComparison,
    effectiveFilter,
    showRemoved,
    setShowRemoved,
    removedCount,
    canToggleRemoved,
    comparisonRows,
    selectedRow,
    canEdit,
    canRevise,
    canTechnicalReview,
    canConfirm,
    canMapOutcomes,
    showOutcomes,
    outcomeSets,
    outcomesUnready,
    companions,
    keptVersion,
    client,
    followUp,
    setFollowUp,
    retryingFollowUp,
    approvingSetId,
    reportFollowUp,
    retryFollowUp,
    canApproveSets,
    approveOneSet,
    managerPlan,
    managerWarning,
    unlinkedGroups,
    isOwnerDesigner,
    hasMenu,
    busy,
    error,
    regular,
    showReadiness,
    readiness,
    reviewerCount,
    checks,
    blocked,
    openEditor,
    closeEditor,
    saved,
    download,
    applyOrder,
    regularIds,
    move,
    renumber,
    canRequestChanges,
    canArchive,
    mapOutcomesHref,
    submitted,
    revisionCreated,
    confirmApproval,
    confirmDelete,
  };
}

export type UnitWorkspace = ReturnType<typeof useUnitWorkspace>;

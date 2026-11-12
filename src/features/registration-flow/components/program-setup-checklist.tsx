"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ROUTES } from "@/constants/routes";
import { curriculumApi } from "@/features/curriculum/api";
import { outcomeApi } from "@/features/outcomes/api";
import { todayInVietnam } from "@/lib/calendar-date";
import type { RegistrationProgram } from "@/types/backend";
import {
  programSetupSteps,
  describeExcluded,
  schedulableClasses,
  type SetupAction,
  type SetupOwner,
  type SetupStatus,
  type SetupStep,
} from "../program-setup";

export type ChecklistViewer = SetupOwner | null;
type SheetTab = "curriculum" | "outcomes";

const STATUS_LABEL: Record<SetupStatus, string> = {
  done: "Xong",
  current: "Cần làm",
  blocked: "Chưa làm được",
  todo: "Chưa tới",
};
const STATUS_VARIANT = {
  done: "success",
  current: "warning",
  blocked: "neutral",
  todo: "neutral",
} as const;
const OWNER_LABEL: Record<SetupOwner, string> = {
  MANAGER: "Quản lý",
  DESIGNER: "Thiết kế giáo trình",
  TEACHER: "Giáo viên",
};

/** Câu "Đang chờ …" cho bước của vai trò khác. */
function waitingText(step: SetupStep): string {
  const kind = step.cta?.kind;
  if (kind === "create_class") return "Đang chờ Quản lý tạo lớp";
  if (kind === "fix_class")
    return "Đang chờ Quản lý bổ sung giáo viên và khung giờ";
  if (kind === "edit_program")
    return "Đang chờ Quản lý cập nhật số buổi mỗi tuần";
  if (kind === "create_schedule") return "Đang chờ Quản lý tạo lịch học";
  if (step.key === "outcomes")
    return step.owner === "MANAGER"
      ? "Đang chờ Quản lý duyệt áp dụng cùng giáo trình"
      : "Đang chờ Thiết kế giáo trình soạn mục tiêu";
  if (step.key === "curriculum") {
    if (step.owner === "TEACHER") return "Đang chờ giáo viên duyệt nội dung";
    if (step.owner === "MANAGER") return "Đang chờ Quản lý duyệt áp dụng";
    return "Đang chờ Thiết kế giáo trình soạn giáo trình";
  }
  return `Đang chờ ${OWNER_LABEL[step.owner]}`;
}

/** Checklist "Chuẩn bị khóa": mỗi bước một dòng, mỗi vai trò chỉ thấy nút của mình. */
export function ProgramSetupChecklist({
  programId,
  program,
  viewer,
  onOpenTab,
}: {
  programId: string;
  program: RegistrationProgram;
  viewer: ChecklistViewer;
  onOpenTab: (tab: SheetTab) => void;
}) {
  const sets = useQuery({
    queryKey: ["outcome-sets", programId],
    queryFn: ({ signal }) => outcomeApi.sets(programId, signal),
    retry: false,
  });
  const units = useQuery({
    queryKey: ["curriculum", "units", programId],
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    retry: false,
  });
  const today = todayInVietnam();
  const failed = sets.isError ? sets : units.isError ? units : null;
  return (
    <AsyncBoundary
      isLoading={sets.isPending || units.isPending}
      isError={!!failed}
      error={failed?.error}
      onRetry={() => {
        void sets.refetch();
        void units.refetch();
      }}
    >
      {sets.data && units.data && (
        <ChecklistRows
          programId={programId}
          program={program}
          steps={programSetupSteps({
            sessionsPerWeek: program.sessionsPerWeek,
            classes: program.classes,
            units: units.data,
            outcomeSets: sets.data,
            today,
          })}
          viewer={viewer}
          onOpenTab={onOpenTab}
        />
      )}
    </AsyncBoundary>
  );
}

function actionHref(action: SetupAction, programId: string): string | null {
  switch (action.kind) {
    case "edit_program":
      return `${ROUTES.MANAGER.CURRICULUM}?editProgram=${encodeURIComponent(programId)}`;
    case "create_class":
      return `${ROUTES.MANAGER.CLASS_NEW}?programId=${encodeURIComponent(programId)}`;
    case "fix_class":
      return action.classId
        ? ROUTES.MANAGER.CLASS_DETAIL(action.classId)
        : null;
    case "open_unit":
      return action.unitId
        ? ROUTES.MANAGER.CURRICULUM_UNIT(action.unitId)
        : null;
    case "curriculum":
      return `${ROUTES.MANAGER.CURRICULUM}?tab=curriculum&programId=${encodeURIComponent(programId)}`;
    case "create_schedule": {
      const params = new URLSearchParams({ programId });
      if (action.classIds?.length)
        params.set("classIds", action.classIds.join(","));
      if (action.unitId) params.set("unitId", action.unitId);
      return `${ROUTES.MANAGER.SESSIONS}?${params.toString()}`;
    }
    default:
      return null;
  }
}

function ChecklistRows({
  programId,
  program,
  steps,
  viewer,
  onOpenTab,
}: {
  programId: string;
  program: RegistrationProgram;
  steps: SetupStep[];
  viewer: ChecklistViewer;
  onOpenTab: (tab: SheetTab) => void;
}) {
  const excluded = schedulableClasses(
    program.classes,
    program.sessionsPerWeek,
  ).excluded;
  // Hai luồng của người dùng (PLAN_GUIDED_WORKFLOWS.md): nội dung khóa (Luồng 1) và lớp, lịch học (Luồng 2).
  const groups = [
    { title: "Nội dung khóa", keys: ["outcomes", "curriculum"] },
    { title: "Lớp & lịch học", keys: ["info", "classes", "schedule"] },
  ];
  return (
    <div className="space-y-5" role="group" aria-label="Chuẩn bị khóa">
      {groups.map((group) => (
        <section
          key={group.title}
          className="space-y-2"
          aria-label={group.title}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{group.title}</h3>
            {group.keys.includes("outcomes") &&
              (viewer === "DESIGNER" || viewer === "MANAGER") && (
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link
                      href={`${ROUTES.MANAGER.CURRICULUM_SETUP}?programId=${encodeURIComponent(programId)}`}
                    />
                  }
                >
                  Soạn từng bước
                </Button>
              )}
          </div>
          <ol className="space-y-2" aria-label={group.title}>
            {steps
              .filter((step) => group.keys.includes(step.key))
              .map((step, index) => {
                const mine = viewer === step.owner;
                const action = step.cta;
                const href = action ? actionHref(action, programId) : null;
                const blocker = steps.find((item) => item.status === "current");
                // Chỉ bước "Cần làm" của vai trò khác mới ghi "Đang chờ …"; bước bị chặn nêu bước đang chặn; bước chưa tới không có nút.
                const waiting =
                  step.status === "current" && !mine
                    ? waitingText(step)
                    : step.status === "todo" && step.cta
                      ? "Chưa tới lượt"
                      : step.status === "blocked" && blocker
                        ? viewer === blocker.owner
                          ? `Làm xong bước "${blocker.title}" trước`
                          : waitingText(blocker)
                        : null;
                const showAction =
                  !!action &&
                  mine &&
                  (step.status === "current" ||
                    (step.status === "done" && !!step.warning));
                return (
                  <li
                    key={step.key}
                    className="space-y-1 rounded-xl border border-border px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {index + 1}. {step.title}
                      </p>
                      <Badge variant={STATUS_VARIANT[step.status]}>
                        {STATUS_LABEL[step.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.summary} · Phụ trách: {OWNER_LABEL[step.owner]}
                    </p>
                    {step.warning && (
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {step.warning}
                      </p>
                    )}
                    {step.key === "schedule" &&
                      mine &&
                      action &&
                      excluded.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Chưa tạo cho: {describeExcluded(excluded)}.
                        </p>
                      )}
                    {showAction && action && (
                      <div className="pt-1">
                        {href ? (
                          <Button size="sm" render={<Link href={href} />}>
                            {action.label}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              onOpenTab(
                                action.kind === "outcomes"
                                  ? "outcomes"
                                  : "curriculum",
                              )
                            }
                          >
                            {action.label}
                          </Button>
                        )}
                      </div>
                    )}
                    {waiting && (
                      <p className="text-sm font-medium text-muted-foreground">
                        {waiting}
                      </p>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}

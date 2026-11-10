"use client";
import { parseAsString, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { LiveSelect } from "@/features/academic/components/live-fields";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import { useCurrentUser } from "@/hooks/use-current-role";
import { OUTCOME_MATRIX_FIRST_SET } from "@/lib/outcome-links";
import { useHubTab } from "@/hooks/use-hub-tab";
import {
  programsFromClasses,
  type ProgramOption,
} from "../rules";
import { OutcomeLessonMatrix } from "./outcome-lesson-matrix";
import { OutcomeSetsPanel } from "./outcome-sets-panel";

/** Chọn khóa học (`?outcomeProgram=`) rồi xem/xử lý các bộ CLO của khóa đó. */
function ProgramOutcomesBody({
  programs,
  emptyDescription,
}: {
  programs: ProgramOption[];
  emptyDescription: string;
}) {
  const [selected, setSelected] = useQueryState("outcomeProgram", parseAsString);
  const [matrix, setMatrix] = useQueryState("outcomeMatrix", parseAsString);
  const user = useCurrentUser();
  const programId = programs.some((program) => program.id === selected)
    ? selected!
    : programs[0]?.id;
  if (!programId)
    return (
      <EmptyState title="Chưa có khóa học" description={emptyDescription} />
    );
  const programName = programs.find((program) => program.id === programId)?.label;
  // Màn gắn bài hàng loạt chỉ dành cho Thiết kế GT; vai trò khác mở link thì về danh sách.
  const matrixOpen = matrix !== null && user?.role === "curriculum_designer";
  return (
    <div className="min-w-0 space-y-4">
      <div className="max-w-md">
        <LiveSelect
          label="Khóa học"
          value={programId}
          options={programs.map((program) => ({
            value: program.id,
            label: program.label,
          }))}
          onChange={(value) => {
            void setSelected(value);
            void setMatrix(null);
          }}
        />
      </div>
      {matrixOpen ? (
        <OutcomeLessonMatrix
          key={programId}
          programId={programId}
          programName={programName}
          setId={matrix === OUTCOME_MATRIX_FIRST_SET ? null : matrix}
          onSelectSet={(setId) => void setMatrix(setId)}
          onBack={() => void setMatrix(null)}
        />
      ) : (
        <OutcomeSetsPanel
          key={programId}
          programId={programId}
          programName={programName}
          onOpenMatrix={
            user?.role === "curriculum_designer"
              ? (setId) => void setMatrix(setId)
              : undefined
          }
        />
      )}
    </div>
  );
}

/** Tab "Chuẩn đầu ra (CLO)" của Thiết kế GT: mọi khóa học đang hoạt động. */
export function DesignerOutcomesTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  // Q2: soạn được mục tiêu trước khi có giáo trình nên liệt kê mọi khóa đang hoạt động.
  const programs = useLiveQuery(
    ["outcome-programs", "active"],
    (signal) => registrationApi.programsFiltered({ isActive: "true" }, signal),
    tab === "outcomes",
  );
  if (tab !== "outcomes") return null;
  return (
    <div className="min-w-0 space-y-4">
      {/* Dòng duy nhất còn chữ CLO (Q7), cho người đã quen tên cũ. */}
      <p className="text-sm text-muted-foreground">
        Mục tiêu khóa học trước đây gọi là chuẩn đầu ra (CLO).
      </p>
      <AsyncBoundary
        isLoading={programs.isPending}
        isError={programs.isError}
        error={programs.error}
        onRetry={() => void programs.refetch()}
      >
        <ProgramOutcomesBody
          programs={(programs.data ?? []).map((program) => ({
            id: program.id,
            label: program.name,
          }))}
          emptyDescription="Chưa có khóa học nào đang hoạt động. Nhờ Quản lý tạo khóa học trước."
        />
      </AsyncBoundary>
    </div>
  );
}

/** Tab "Chuẩn đầu ra (CLO)" của Giáo viên: khóa học của các lớp đang dạy. */
export function TeacherOutcomesBody() {
  const classes = useLiveQuery(["teacher-classes"], () =>
    registrationApi.classes(),
  );
  return (
    <AsyncBoundary
      isLoading={classes.isPending}
      isError={classes.isError}
      error={classes.error}
      onRetry={() => void classes.refetch()}
    >
      <ProgramOutcomesBody
        programs={programsFromClasses(classes.data ?? [])}
        emptyDescription="Bạn chưa được phân công lớp nào nên chưa có khóa học để xác minh mục tiêu."
      />
    </AsyncBoundary>
  );
}

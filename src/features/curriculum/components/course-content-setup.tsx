"use client";
// Trang "Soạn khóa học từng bước" (Luồng 1, PLAN_GUIDED_WORKFLOWS.md, L1-a; gộp trang giáo trình
// ngày 2026-11-19, PLAN_CURRICULUM_ONE_PAGE.md). Mỗi bước nhúng màn đang có (bộ mục tiêu, bảng bài,
// form gửi duyệt, ma trận gắn bài, duyệt áp dụng); trạng thái bước tính từ BE nên đổi máy hay đổi
// người làm vẫn đúng.
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { FlowSteps } from "@/components/shared/workflows/flow-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actsAsManager } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { OutcomeLessonMatrix } from "@/features/outcomes/components/outcome-lesson-matrix";
import { OutcomeSetsPanel } from "@/features/outcomes/components/outcome-sets-panel";
import { outcomeApi } from "@/features/outcomes/api";
import { registrationApi } from "@/features/registration-flow/api";
import { useCurrentRole } from "@/hooks/use-current-role";
import { todayInVietnam } from "@/lib/calendar-date";
import type { CurriculumUnit, CurriculumUnitDetail } from "@/types/curriculum";
import type { OutcomeSet } from "@/types/outcomes";
import { curriculumApi } from "../api";
import {
  CONTENT_STEP_KEYS,
  contentSetupSteps,
  pickViewedUnit,
  type ContentOwner,
  type ContentStep,
  type ContentStepKey,
} from "../content-setup";
import { curriculumKeys } from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";
import { UnitStepContent } from "./unit-workspace/unit-step-content";
import {
  UnitVersionSelect,
  unitStatusLabel,
} from "./unit-workspace/unit-version-select";

const parsers = {
  programId: parseAsString.withDefault(""),
  unitId: parseAsString,
  step: parseAsStringLiteral(CONTENT_STEP_KEYS),
  editor: parseAsString,
};
// Các tham số của giáo trình cũ: đổi khóa hay bản thì bỏ đi.
const UNIT_PARAMS_CLEARED = {
  unitId: null,
  editor: null,
  lesson: null,
  lessonChanges: null,
};

export function CourseContentSetup() {
  const [{ programId, unitId }, setQuery] = useQueryStates({
    ...parsers,
    lesson: parseAsString,
    lessonChanges: parseAsString,
  });
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const active = (programs.data ?? []).filter(
    (item) => item.isActive !== false,
  );
  const program = active.find((item) => item.id === programId);
  // Cùng khóa cache với ProgramContentSteps nên không tải thêm lần nữa.
  const units = useQuery({
    queryKey: curriculumKeys.units(programId),
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    enabled: !!program,
    retry: false,
  });
  const viewedId = units.data
    ? (pickViewedUnit(units.data, unitId, todayInVietnam()).viewed?.id ?? "")
    : "";
  return (
    <PageContainer>
      <PageHeader
        title="Soạn khóa học từng bước"
        description="Mục tiêu khóa học → bài học → gắn mục tiêu → gửi duyệt → giáo viên duyệt → Quản lý duyệt áp dụng."
        backHref={ROUTES.MANAGER.CURRICULUM}
      />
      <AsyncBoundary
        isLoading={programs.isPending}
        isError={programs.isError}
        error={programs.error}
        onRetry={() => void programs.refetch()}
      >
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-full max-w-xl space-y-2">
              <Label htmlFor="content-setup-program">Khóa học</Label>
              <Select
                value={programId || null}
                items={active.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onValueChange={(value) =>
                  void setQuery({
                    programId: String(value ?? ""),
                    step: null,
                    ...UNIT_PARAMS_CLEARED,
                  })
                }
              >
                <SelectTrigger id="content-setup-program">
                  <SelectValue placeholder="Chọn khóa học cần soạn" />
                </SelectTrigger>
                <SelectContent>
                  {active.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {item.subject} · Khối {item.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {program && units.data && (
              <UnitVersionSelect
                units={units.data}
                value={viewedId}
                onChange={(id) =>
                  void setQuery({
                    ...UNIT_PARAMS_CLEARED,
                    unitId: id,
                    step: null,
                  })
                }
              />
            )}
          </div>
          {program ? (
            <ProgramContentSteps
              key={program.id}
              programId={program.id}
              programName={program.name}
            />
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="Chọn khóa học để bắt đầu"
                  description="Các bước soạn và duyệt nội dung của khóa sẽ hiện ở đây, kèm việc cần làm tiếp theo."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}

function ProgramContentSteps({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const role = useCurrentRole();
  const [{ unitId }] = useQueryStates(parsers);
  const viewer: ContentOwner | null =
    role === "curriculum_designer"
      ? "DESIGNER"
      : actsAsManager(role)
        ? "MANAGER"
        : null;
  const units = useQuery({
    queryKey: curriculumKeys.units(programId),
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    retry: false,
  });
  // Cùng khóa với OutcomeSetsPanel nên thêm mục tiêu xong thanh bước tự cập nhật.
  const sets = useLiveQuery(["outcome-sets", programId, "all"], (signal) =>
    outcomeApi.sets(programId, signal),
  );
  const { viewed, working } = units.data
    ? pickViewedUnit(units.data, unitId, todayInVietnam())
    : { viewed: null, working: null };
  const detail = useQuery({
    queryKey: curriculumKeys.unit(viewed?.id ?? ""),
    queryFn: ({ signal }) => curriculumApi.unit(viewed!.id, signal),
    enabled: !!viewed,
    retry: false,
  });
  const failed = units.isError ? units : sets.isError ? sets : null;
  return (
    <AsyncBoundary
      isLoading={
        units.isPending || sets.isPending || (!!viewed && detail.isPending)
      }
      isError={!!failed}
      error={failed?.error}
      onRetry={() => {
        void units.refetch();
        void sets.refetch();
      }}
    >
      {units.data && sets.data && (
        <StepsBody
          programId={programId}
          programName={programName}
          viewer={viewer}
          viewed={viewed}
          working={working}
          detail={viewed ? detail.data : undefined}
          sets={sets.data}
        />
      )}
    </AsyncBoundary>
  );
}

function StepsBody({
  programId,
  programName,
  viewer,
  viewed,
  working,
  detail,
  sets,
}: {
  programId: string;
  programName: string;
  viewer: ContentOwner | null;
  viewed: CurriculumUnit | null;
  working: CurriculumUnit | null;
  detail?: CurriculumUnitDetail;
  sets: OutcomeSet[];
}) {
  const [{ step: chosen, editor }, setQuery] = useQueryStates({
    ...parsers,
    lesson: parseAsString,
    lessonChanges: parseAsString,
  });
  const lessons = (detail?.lessons ?? []).filter(
    (lesson) => lesson.kind === "LESSON",
  );
  const steps = contentSetupSteps({
    working: viewed,
    lessonCount: lessons.length,
    outcomeSets: sets,
    viewer,
  });
  const fallback =
    steps.find((item) => item.status === "current" || item.status === "waiting")
      ?.key ?? "manager";
  const active =
    steps.find((item) => item.key === chosen && item.status !== "todo")?.key ??
    fallback;
  const go = (key: ContentStepKey | null) => void setQuery({ step: key });
  // Mở một bản giáo trình (null = về bản đang soạn); tạo bằng CSV thì mở luôn hộp nhập file.
  const openUnit = (id: string | null, source?: "csv") =>
    void setQuery({
      ...UNIT_PARAMS_CLEARED,
      unitId: id,
      step: id ? "lessons" : null,
      editor: id && source === "csv" ? "import" : null,
    });
  // Link cũ `?editor=submit` mở hộp gửi duyệt; trang này gửi duyệt ngay trong bước 4 nên chuyển sang đó.
  const redirectSubmit = editor === "submit";
  useEffect(() => {
    if (redirectSubmit) void setQuery({ step: "submit", editor: null });
  }, [redirectSubmit, setQuery]);
  const step = steps.find((item) => item.key === active)!;
  const nextKey = CONTENT_STEP_KEYS[CONTENT_STEP_KEYS.indexOf(active) + 1];
  const next = steps.find((item) => item.key === nextKey);
  const latest = [...sets].sort((a, b) => b.version - a.version)[0];
  const isDesigner = viewer === "DESIGNER";
  const showUnitContent =
    !!viewed &&
    !redirectSubmit &&
    (active === "lessons" ||
      active === "submit" ||
      active === "teacher" ||
      active === "manager");

  const goNext = next && next.status !== "todo" && (
    <Button type="button" onClick={() => go(next.key)}>
      Tiếp: {next.title.toLowerCase()}
    </Button>
  );

  return (
    <div className="min-w-0 space-y-6">
      {viewed && viewed.id !== working?.id && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <p>
            Đang xem bản {viewed.version} (
            {unitStatusLabel(viewed.status).toLowerCase()})
          </p>
          {working && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openUnit(null)}
            >
              Về bản đang soạn
            </Button>
          )}
        </div>
      )}
      <FlowSteps
        steps={steps}
        activeKey={active}
        onSelect={(key) => go(key as ContentStepKey)}
        label="Các bước soạn khóa học"
      />
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            Bước {CONTENT_STEP_KEYS.indexOf(active) + 1}: {step.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <WaitingNote step={step} />
          {active === "outcomes" && (
            <>
              <p className="text-sm text-muted-foreground">
                Mục tiêu là điều học sinh đạt được sau khóa, phụ huynh đọc được
                trên ứng dụng. Không bắt buộc: khóa không dùng mục tiêu thì bấm
                “Tiếp”.
              </p>
              <OutcomeSetsPanel
                programId={programId}
                programName={programName}
                onOpenMatrix={() => go("mapping")}
              />
            </>
          )}
          {active === "lessons" &&
            !viewed &&
            (isDesigner ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Tạo giáo trình cho khóa: đặt tên và khoảng ngày áp dụng. Có
                  thể chép bài từ giáo trình cũ hoặc nhập từ file Excel (CSV).
                </p>
                <UnitForm
                  programId={programId}
                  onSaved={(id, source) => openUnit(id, source)}
                />
              </>
            ) : (
              <p className="text-sm">Khóa chưa có giáo trình.</p>
            ))}
          {active === "mapping" &&
            (latest &&
            latest.status === "DRAFT" &&
            latest.outcomes.length &&
            lessons.length ? (
              isDesigner ? (
                <OutcomeLessonMatrix
                  programId={programId}
                  programName={programName}
                  setId={latest.id}
                  onSelectSet={() => undefined}
                  onBack={() => go("outcomes")}
                />
              ) : (
                <p className="text-sm">{step.summary}</p>
              )
            ) : (
              <p className="text-sm">
                {step.summary ?? "Chưa có mục tiêu hoặc bài để gắn."}
              </p>
            ))}
          {showUnitContent && (
            <UnitStepContent
              key={viewed.id}
              unitId={viewed.id}
              programId={programId}
              step={active}
              viewer={viewer}
              go={go}
              openUnit={openUnit}
            />
          )}
          <div className="flex flex-wrap justify-end gap-2">{goNext}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function WaitingNote({ step }: { step: ContentStep }) {
  if (step.status !== "waiting") return null;
  return (
    <p
      role="status"
      className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      Đang chờ {step.waitingFor}
      {step.summary ? ` (${step.summary})` : ""}. Bạn chưa phải làm gì ở bước
      này.
    </p>
  );
}

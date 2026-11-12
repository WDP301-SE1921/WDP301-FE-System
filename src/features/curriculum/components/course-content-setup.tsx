"use client";
// Trang "Soạn khóa học từng bước" (Luồng 1, PLAN_GUIDED_WORKFLOWS.md, L1-a). Mỗi bước nhúng màn đang có
// (bộ mục tiêu, form giáo trình, ma trận gắn bài) hoặc mở đúng chỗ trên trang giáo trình; trạng thái
// bước tính từ BE nên đổi máy hay đổi người làm vẫn đúng.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { FlowSteps } from "@/components/shared/workflows/flow-steps";
import { Badge } from "@/components/ui/badge";
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
import { calendarDateLabel, todayInVietnam } from "@/lib/calendar-date";
import type { CurriculumUnit, CurriculumUnitDetail } from "@/types/curriculum";
import type { OutcomeSet } from "@/types/outcomes";
import { curriculumApi } from "../api";
import {
  CONTENT_STEP_KEYS,
  contentSetupSteps,
  pickWorkingUnit,
  type ContentOwner,
  type ContentStep,
  type ContentStepKey,
} from "../content-setup";
import { curriculumKeys } from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";

/** Đường dẫn trang từng bước của một khóa (dùng ở checklist, trang giáo trình, tổng quan). */
export function contentSetupHref(programId: string, step?: ContentStepKey) {
  const params = new URLSearchParams({ programId });
  if (step) params.set("step", step);
  return `${ROUTES.MANAGER.CURRICULUM_SETUP}?${params.toString()}`;
}

/** Thêm `from=setup` để trang giáo trình hiện nút quay về trang từng bước. */
function unitHref(unitId: string, editor?: "lesson" | "import" | "submit") {
  const params = new URLSearchParams({ from: "setup" });
  if (editor) params.set("editor", editor);
  return `${ROUTES.MANAGER.CURRICULUM_UNIT(unitId)}?${params.toString()}`;
}

const parsers = {
  programId: parseAsString.withDefault(""),
  step: parseAsStringLiteral(CONTENT_STEP_KEYS),
};

export function CourseContentSetup() {
  const [{ programId }, setQuery] = useQueryStates(parsers);
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const active = (programs.data ?? []).filter(
    (item) => item.isActive !== false,
  );
  const program = active.find((item) => item.id === programId);
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
          <div className="max-w-xl space-y-2">
            <Label htmlFor="content-setup-program">Khóa học</Label>
            <Select
              value={programId || null}
              items={active.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onValueChange={(value) =>
                void setQuery({ programId: String(value ?? ""), step: null })
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
  const working = units.data
    ? pickWorkingUnit(units.data, todayInVietnam())
    : null;
  const detail = useQuery({
    queryKey: curriculumKeys.unit(working?.id ?? ""),
    queryFn: ({ signal }) => curriculumApi.unit(working!.id, signal),
    enabled: !!working,
    retry: false,
  });
  const failed = units.isError ? units : sets.isError ? sets : null;
  return (
    <AsyncBoundary
      isLoading={
        units.isPending || sets.isPending || (!!working && detail.isPending)
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
          working={working}
          detail={working ? detail.data : undefined}
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
  working,
  detail,
  sets,
}: {
  programId: string;
  programName: string;
  viewer: ContentOwner | null;
  working: CurriculumUnit | null;
  detail?: CurriculumUnitDetail;
  sets: OutcomeSet[];
}) {
  const router = useRouter();
  const [{ step: chosen }, setQuery] = useQueryStates(parsers);
  const lessons = (detail?.lessons ?? []).filter(
    (lesson) => lesson.kind === "LESSON",
  );
  const steps = contentSetupSteps({
    working,
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
  const step = steps.find((item) => item.key === active)!;
  const nextKey = CONTENT_STEP_KEYS[CONTENT_STEP_KEYS.indexOf(active) + 1];
  const next = steps.find((item) => item.key === nextKey);
  const latest = [...sets].sort((a, b) => b.version - a.version)[0];
  const isDesigner = viewer === "DESIGNER";
  const isDraft = working?.status === "DRAFT";

  const goNext = next && next.status !== "todo" && (
    <Button type="button" onClick={() => go(next.key)}>
      Tiếp: {next.title.toLowerCase()}
    </Button>
  );

  return (
    <div className="min-w-0 space-y-6">
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
            (working ? (
              <UnitSummary
                unit={working}
                lessons={lessons.map((item) => item.title)}
              />
            ) : isDesigner ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Tạo giáo trình cho khóa: đặt tên và khoảng ngày áp dụng. Có
                  thể chép bài từ giáo trình cũ hoặc nhập từ file Excel (CSV).
                </p>
                <UnitForm
                  programId={programId}
                  onSaved={(id, source) =>
                    source === "csv"
                      ? router.push(unitHref(id, "import"))
                      : go("lessons")
                  }
                />
              </>
            ) : (
              <p className="text-sm">Khóa chưa có giáo trình.</p>
            ))}
          {active === "lessons" && working && isDesigner && isDraft && (
            <div className="flex flex-wrap gap-2">
              <Button render={<Link href={unitHref(working.id, "lesson")} />}>
                Thêm bài
              </Button>
              <Button
                variant="outline"
                render={<Link href={unitHref(working.id, "import")} />}
              >
                Nhập từ Excel (CSV)
              </Button>
              <Button
                variant="outline"
                render={<Link href={unitHref(working.id)} />}
              >
                Sửa, sắp xếp bài
              </Button>
            </div>
          )}
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
          {active === "submit" && working && (
            <>
              <p className="text-sm text-muted-foreground">
                {isDraft
                  ? "Hệ thống kiểm tra thứ tự và nội dung bài, rồi bạn chọn giáo viên duyệt nội dung. Gửi xong, giáo trình bị khóa sửa cho tới khi được duyệt hoặc trả lại."
                  : `Đã gửi duyệt${working.reviewerTeacher?.displayName ? ` cho ${working.reviewerTeacher.displayName}` : ""}.`}
              </p>
              {isDesigner && isDraft && (
                <Button render={<Link href={unitHref(working.id, "submit")} />}>
                  Kiểm tra và gửi duyệt
                </Button>
              )}
            </>
          )}
          {active === "teacher" && working && (
            <p className="text-sm text-muted-foreground">
              Giáo viên được chọn mở mục Giáo trình trên trang của mình, đọc
              từng bài rồi đồng ý hoặc trả lại kèm nhận xét. Giáo viên đồng ý
              thì bộ mục tiêu đủ điều kiện được duyệt cùng.
            </p>
          )}
          {active === "manager" && working && (
            <ManagerStep unit={working} isManager={viewer === "MANAGER"} />
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

function UnitSummary({
  unit,
  lessons,
}: {
  unit: CurriculumUnit;
  lessons: string[];
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {unit.title} · bản {unit.version}
        </p>
        <Badge variant={unit.status === "APPROVED" ? "success" : "neutral"}>
          {lessons.length} bài
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Áp dụng {calendarDateLabel(unit.fromDate.slice(0, 10))} –{" "}
        {calendarDateLabel(unit.toDate.slice(0, 10))}. Mỗi buổi học một bài theo
        thứ tự.
      </p>
      {lessons.length > 0 && (
        <ol className="list-decimal space-y-0.5 pl-5 text-sm">
          {lessons.slice(0, 5).map((title, index) => (
            <li key={index}>{title}</li>
          ))}
          {lessons.length > 5 && (
            <li className="list-none text-muted-foreground">
              … và {lessons.length - 5} bài nữa
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

function ManagerStep({
  unit,
  isManager,
}: {
  unit: CurriculumUnit;
  isManager: boolean;
}) {
  if (unit.status === "APPROVED")
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Giáo trình đã được duyệt áp dụng. Lớp của khóa dùng giáo trình này khi
          tạo lịch học.
        </p>
        {isManager && (
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
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Quản lý đọc lại giáo trình đã được giáo viên đồng ý, rồi duyệt áp dụng.
        Duyệt xong hệ thống mở màn tạo lịch học cho các lớp của khóa.
      </p>
      {isManager &&
        unit.status === "PENDING_REVIEW" &&
        unit.technicalReviewedAt && (
          <Button render={<Link href={unitHref(unit.id)} />}>
            Mở giáo trình để duyệt áp dụng
          </Button>
        )}
    </div>
  );
}

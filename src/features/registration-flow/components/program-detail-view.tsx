"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SheetCloseButton } from "@/components/shared/actions/sheet-close-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { ROUTES } from "@/constants/routes";
import { curriculumApi } from "@/features/curriculum/api";
import { curriculumStage } from "@/features/curriculum/presentation";
import { calendarDateLabel } from "@/lib/calendar-date";
import { registrationApi } from "../api";

const PROGRAM_TABS = {
  overview: "Tổng quan",
  curriculum: "Giáo trình",
  classes: "Các lớp áp dụng",
} as const;
type ProgramTab = keyof typeof PROGRAM_TABS;
const PROGRAM_TAB_KEYS = Object.keys(PROGRAM_TABS) as ProgramTab[];
/** `program` mở Sheet; tab bên trong đặt tên `programTab` để không đụng tab của màn gộp. */
const programSheetParsers = {
  program: parseAsString,
  programTab: parseAsStringLiteral(PROGRAM_TAB_KEYS).withDefault("overview"),
};

/** Sheet chi tiết khóa học trên màn Khóa học & giáo trình của Quản lý (`?program=<id>`). */
export function ProgramSheet() {
  const [{ program }, setSheet] = useQueryStates(programSheetParsers);
  return (
    <Sheet
      open={!!program}
      onOpenChange={(open) => {
        if (!open) void setSheet({ program: null, programTab: null });
      }}
    >
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
      >
        <SheetCloseButton label="Đóng chi tiết khóa học" />
        {program && <ProgramSheetContent key={program} programId={program} />}
      </SheetContent>
    </Sheet>
  );
}

function ProgramSheetContent({ programId }: { programId: string }) {
  const [{ programTab }, setSheet] = useQueryStates(programSheetParsers);
  const program = useQuery({
    queryKey: ["academic-program", programId],
    queryFn: ({ signal }) => registrationApi.program(programId, signal),
    retry: false,
  });
  const units = useQuery({
    queryKey: ["curriculum", "units", programId],
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    retry: false,
    enabled: programTab === "curriculum",
  });
  const data = program.data;
  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>{data?.name ?? "Khóa học"}</SheetTitle>
        <SheetDescription>
          {data ? `${data.subject} · Khối ${data.grade}` : "Thông tin khóa học."}
        </SheetDescription>
        {data && (
          <div className="pt-1">
            <StatusBadge
              category="program"
              status={data.isActive === false ? "inactive" : "active"}
            />
          </div>
        )}
      </SheetHeader>
      <div className="space-y-4 pt-4">
        <Tabs
          value={programTab}
          onValueChange={(value) => {
            const next = PROGRAM_TAB_KEYS.find((key) => key === value);
            if (next) void setSheet({ programTab: next });
          }}
        >
          <TabsList aria-label="Thông tin khóa học">
            {PROGRAM_TAB_KEYS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {PROGRAM_TABS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <AsyncBoundary
          isLoading={program.isPending}
          isError={program.isError}
          error={program.error}
          onRetry={() => void program.refetch()}
        >
          {data && programTab === "overview" && (
            <p className="text-sm text-muted-foreground">
              Mỗi kỳ, khóa học có một giáo trình đã duyệt dùng chung cho mọi
              lớp của khóa. Quản lý chọn bản đã duyệt khi sinh buổi học cho các
              lớp áp dụng.
            </p>
          )}
          {data && programTab === "classes" && (
            <ul className="space-y-2">
              {data.classes?.map((classroom) => (
                <li
                  key={classroom.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <span>
                    <span className="font-medium">{classroom.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      · {classroom.isActive === false
                        ? "Ngừng hoạt động"
                        : classroom.isOpen
                          ? "Mở đăng ký"
                          : "Đóng đăng ký"}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={ROUTES.MANAGER.CLASS_DETAIL(classroom.id)} />}
                  >
                    Xem lớp
                  </Button>
                </li>
              ))}
              {!data.classes?.length && (
                <li className="text-sm text-muted-foreground">
                  Chưa có lớp áp dụng.
                </li>
              )}
            </ul>
          )}
        </AsyncBoundary>
        {programTab === "curriculum" && (
          <AsyncBoundary
            isLoading={units.isPending}
            isError={units.isError}
            error={units.error}
            onRetry={() => void units.refetch()}
            data={units.data}
            emptyProps={{ title: "Khóa học chưa có giáo trình" }}
          >
            <ul className="space-y-2">
              {units.data?.map((unit) => (
                <li
                  key={unit.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {unit.title} · v{unit.version}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {calendarDateLabel(unit.fromDate.slice(0, 10))} →{" "}
                      {calendarDateLabel(unit.toDate.slice(0, 10))}
                    </p>
                    <StatusBadge category="curriculum" status={curriculumStage(unit)} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={ROUTES.MANAGER.CURRICULUM_UNIT(unit.id)} />}
                  >
                    Xem giáo trình
                  </Button>
                </li>
              ))}
            </ul>
          </AsyncBoundary>
        )}
      </div>
      {data && data.isActive !== false && (
        <SheetFooter className="pt-6">
          <Button
            render={
              <Link
                href={`${ROUTES.MANAGER.CLASS_NEW}?programId=${encodeURIComponent(programId)}`}
              />
            }
          >
            Tạo lớp từ khóa học
          </Button>
        </SheetFooter>
      )}
    </>
  );
}

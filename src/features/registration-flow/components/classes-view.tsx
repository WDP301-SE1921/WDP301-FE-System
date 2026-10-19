"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import {
  RowActions,
  type RowActionItem,
} from "@/components/shared/data-table/row-actions";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets";
import type { ClassHubTab } from "@/constants/class-hub";
import { ROUTES } from "@/constants/routes";
import { subjectDotClass } from "@/constants/subjects";
import { useHubTab } from "@/hooks/use-hub-tab";
import { cn } from "@/lib/utils";
import type { RegistrationClass } from "@/types/backend";
import { registrationApi } from "../api";
import { money, scheduleText } from "../calendar";
import { canOpenRegistration, useClassStateMutation } from "../class-state";
import { useTeacherNames } from "../teacher-names";

const ALL = "all";
const STATUS_FILTERS = {
  all: "Tất cả trạng thái",
  open: "Đang mở đăng ký",
  closed: "Đóng đăng ký",
  inactive: "Ngừng hoạt động",
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;
const STATUS_KEYS = Object.keys(STATUS_FILTERS) as StatusFilter[];
const GRADE_ITEMS = {
  all: "Tất cả khối",
  "6": "Khối 6",
  "7": "Khối 7",
  "8": "Khối 8",
  "9": "Khối 9",
};
const VIEW_KEYS = ["cards", "table"] as const;
const classesParsers = {
  search: parseAsString.withDefault(""),
  subject: parseAsString.withDefault(ALL),
  grade: parseAsStringLiteral([ALL, "6", "7", "8", "9"]).withDefault(ALL),
  status: parseAsStringLiteral(STATUS_KEYS).withDefault(ALL),
  teacher: parseAsString,
  view: parseAsStringLiteral(VIEW_KEYS).withDefault("cards"),
};

type ClassRole = "staff" | "center_manager";

interface PendingState {
  classroom: RegistrationClass;
  body: { isOpen?: boolean; isActive?: boolean };
}

function classStatus(classroom: RegistrationClass) {
  if (classroom.isActive === false)
    return { label: "Ngừng hoạt động", variant: "secondary" as const };
  return classroom.isOpen
    ? { label: "Mở ĐK", variant: "success" as const }
    : { label: "Đóng ĐK", variant: "outline" as const };
}

/** Danh sách lớp chỉ trả `teacherId`; tên lấy từ danh sách giáo viên đang hoạt động. */
function teacherName(classroom: RegistrationClass, names: Map<string, string>) {
  if (!classroom.teacherId) return null;
  return (
    classroom.teacher?.displayName ||
    classroom.teacher?.email ||
    names.get(classroom.teacherId) ||
    "Giáo viên đã gán"
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** Thân tab "Lớp học" trên màn Lớp học của Quản lý; chỉ hiện khi tab đó đang mở. */
export function ClassesTab({ tabs }: { tabs: readonly ClassHubTab[] }) {
  const [tab] = useHubTab(tabs);
  return tab === "classes" ? <ClassesBoard role="center_manager" /> : null;
}

/** Lưới / bảng lớp học dùng chung cho Quản lý và Nhân viên. */
export function ClassesBoard({ role }: { role: ClassRole }) {
  const isStaff = role === "staff";
  const router = useRouter();
  const [filters, setFilters] = useQueryStates(classesParsers);
  const [pending, setPending] = useState<PendingState | null>(null);
  const classState = useClassStateMutation();
  const { names: teacherNames } = useTeacherNames();
  const query = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const subjects = [
    ...new Set((query.data ?? []).map((item) => item.program.subject)),
  ].sort((left, right) => left.localeCompare(right, "vi"));
  const needle = filters.search.trim().toLocaleLowerCase("vi");
  const rows =
    query.data?.filter((item) => {
      const text =
        `${item.name} ${item.program.subject} ${item.program.grade} ${teacherName(item, teacherNames) ?? ""}`.toLocaleLowerCase(
          "vi",
        );
      const status =
        item.isActive === false ? "inactive" : item.isOpen ? "open" : "closed";
      return (
        text.includes(needle) &&
        (filters.subject === ALL || item.program.subject === filters.subject) &&
        (filters.grade === ALL ||
          String(item.program.grade) === filters.grade) &&
        (filters.status === ALL || filters.status === status) &&
        (filters.teacher !== "unassigned" || !item.teacherId)
      );
    }) ?? [];
  const actionsFor = (classroom: RegistrationClass): RowActionItem[] => {
    const sessionsHref = isStaff
      ? `${ROUTES.STAFF.SCHEDULE}?${new URLSearchParams({ classId: classroom.id })}`
      : ROUTES.MANAGER.CLASS_SESSIONS(classroom.id);
    const items: RowActionItem[] = [
      {
        id: "sessions",
        label: "Xem buổi học",
        onClick: () => router.push(sessionsHref),
      },
    ];
    if (isStaff) return items;
    items.push(
      {
        id: "registration",
        label: classroom.isOpen ? "Đóng đăng ký" : "Mở đăng ký",
        disabled: !classroom.isOpen && !canOpenRegistration(classroom),
        onClick: () =>
          setPending({ classroom, body: { isOpen: !classroom.isOpen } }),
      },
      {
        id: "active",
        label:
          classroom.isActive === false ? "Kích hoạt lớp" : "Ngừng hoạt động",
        danger: classroom.isActive !== false,
        onClick: () =>
          setPending({
            classroom,
            body: { isActive: classroom.isActive === false },
          }),
      },
    );
    return items;
  };
  /** Thao tác chính hiện trên thẻ/dòng (thiết kế 5.3: nút Chi tiết + menu ⋯). */
  const primaryAction = (classroom: RegistrationClass) =>
    isStaff ? (
      <Button
        size="xs"
        disabled={
          classroom.isActive === false ||
          !classroom.isOpen ||
          !classroom.weeklySchedules.length
        }
        render={
          <Link
            href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({ classId: classroom.id })}
          />
        }
        aria-label={`Thêm học sinh vào lớp ${classroom.name}`}
      >
        Thêm học sinh
      </Button>
    ) : (
      <Button
        size="xs"
        variant="outline"
        render={<Link href={ROUTES.MANAGER.CLASS_DETAIL(classroom.id)} />}
        aria-label={`Chi tiết lớp ${classroom.name}`}
      >
        Chi tiết
      </Button>
    );
  const pendingText = pending
    ? pending.body.isOpen !== undefined
      ? pending.body.isOpen
        ? {
            title: `Mở đăng ký lớp ${pending.classroom.name}?`,
            description: "Nhân viên có thể đăng ký học sinh mới vào lớp.",
            confirm: "Mở đăng ký",
          }
        : {
            title: `Đóng đăng ký lớp ${pending.classroom.name}?`,
            description:
              "Lớp không nhận đăng ký mới; học sinh đang học vẫn học bình thường.",
            confirm: "Đóng đăng ký",
          }
      : pending.body.isActive
        ? {
            title: `Kích hoạt lại lớp ${pending.classroom.name}?`,
            description:
              "Lớp hoạt động trở lại; mở đăng ký riêng khi sẵn sàng.",
            confirm: "Kích hoạt lớp",
          }
        : {
            title: `Ngừng hoạt động lớp ${pending.classroom.name}?`,
            description:
              "Lớp ngừng hoạt động sẽ không nhận đăng ký và không hiện trong lớp đang mở.",
            confirm: "Ngừng hoạt động",
          }
    : null;
  return (
    <div className="min-w-0 space-y-4">
      <FilterBar
        searchPlaceholder="Tên lớp, môn hoặc giáo viên…"
        onClearFilters={() =>
          void setFilters({
            subject: null,
            grade: null,
            status: null,
            teacher: null,
          })
        }
      >
        <Select
          items={{
            [ALL]: "Tất cả môn",
            ...Object.fromEntries(subjects.map((name) => [name, name])),
          }}
          value={filters.subject}
          onValueChange={(value) =>
            void setFilters({ subject: value === ALL ? null : String(value) })
          }
        >
          <SelectTrigger className="w-40 rounded-xl" aria-label="Lọc môn">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả môn</SelectItem>
            {subjects.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={GRADE_ITEMS}
          value={filters.grade}
          onValueChange={(value) =>
            void setFilters({
              grade:
                value === ALL ? null : (String(value) as typeof filters.grade),
            })
          }
        >
          <SelectTrigger className="w-36 rounded-xl" aria-label="Lọc khối">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GRADE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={STATUS_FILTERS}
          value={filters.status}
          onValueChange={(value) =>
            void setFilters({
              status:
                STATUS_KEYS.find((key) => key === value && key !== ALL) ?? null,
            })
          }
        >
          <SelectTrigger
            className="w-44 rounded-xl"
            aria-label="Lọc trạng thái"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {STATUS_FILTERS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.teacher === "unassigned" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void setFilters({ teacher: null })}
          >
            Bỏ lọc chưa phân công
          </Button>
        )}
      </FilterBar>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {query.data ? `${rows.length} lớp học` : ""}
        </span>
        <Tabs
          value={filters.view}
          onValueChange={(value) =>
            void setFilters({ view: value === "table" ? "table" : null })
          }
        >
          <TabsList aria-label="Kiểu hiển thị">
            <TabsTrigger value="cards">Thẻ</TabsTrigger>
            <TabsTrigger value="table">Bảng</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ApiFeedback error={classState.error} />
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={rows}
        skeleton={<SkeletonCardList count={4} />}
        emptyProps={{
          title: "Chưa có lớp phù hợp",
          description: "Thử đổi từ khóa hoặc bộ lọc.",
        }}
      >
        {filters.view === "table" ? (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Môn · khối</TableHead>
                  <TableHead>Lịch tuần</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead className="text-right">Sĩ số</TableHead>
                  <TableHead className="text-right">Học phí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => {
                  const status = classStatus(item);
                  const teacher = teacherName(item, teacherNames);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-2.5 shrink-0 rounded-full",
                              subjectDotClass(item.program.subject),
                            )}
                          />
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.program.subject} · Khối {item.program.grade}
                      </TableCell>
                      <TableCell className="max-w-56 whitespace-normal">
                        {scheduleText(item.weeklySchedules) ||
                          "Chưa có lịch tuần"}
                      </TableCell>
                      <TableCell>
                        {teacher ?? (
                          <Badge variant="warning">Chưa phân công</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.room?.name ?? "Chưa gán phòng"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.rosterCount ?? "—"}/{item.capacity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(item.monthlyFee)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {primaryAction(item)}
                          <RowActions items={actionsFor(item)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
            {rows.map((item) => {
              const status = classStatus(item);
              const teacher = teacherName(item, teacherNames);
              const seats =
                item.rosterCount !== undefined && item.capacity > 0
                  ? Math.min(
                      100,
                      Math.round((item.rosterCount / item.capacity) * 100),
                    )
                  : null;
              return (
                <Card
                  key={item.id}
                  size="sm"
                  className={cn(
                    "min-w-0",
                    !item.teacherId && "border-amber-300",
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-2 font-semibold leading-snug">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            subjectDotClass(item.program.subject),
                          )}
                        />
                        <span className="min-w-0 break-words">{item.name}</span>
                      </p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.program.subject} · Khối {item.program.grade} ·{" "}
                      {item.room?.name ?? "Chưa gán phòng"}
                    </p>
                    <p className="text-sm">
                      {scheduleText(item.weeklySchedules) ||
                        "Chưa có lịch tuần"}
                    </p>
                    {teacher ? (
                      <p className="flex items-center gap-2 text-sm">
                        <span
                          aria-hidden="true"
                          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold"
                        >
                          {initials(teacher)}
                        </span>
                        {teacher}
                      </p>
                    ) : (
                      <Badge variant="warning">Chưa phân công giáo viên</Badge>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Sĩ số</span>
                        <span className="font-semibold tabular-nums">
                          {item.rosterCount !== undefined
                            ? `${item.rosterCount}/${item.capacity}`
                            : `Tối đa ${item.capacity}`}
                        </span>
                      </div>
                      {seats !== null && (
                        <Progress
                          value={seats}
                          aria-label={`Sĩ số lớp ${item.name}`}
                        />
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
                      <span className="text-sm font-semibold tabular-nums">
                        {money(item.monthlyFee)}
                        <span className="font-normal text-muted-foreground">
                          /tháng
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        {primaryAction(item)}
                        <RowActions items={actionsFor(item)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncBoundary>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pendingText?.title}
        description={pendingText?.description}
        confirmText={pendingText?.confirm}
        variant={pending?.body.isActive === false ? "danger" : "default"}
        isLoading={classState.isPending}
        onConfirm={async () => {
          if (!pending) return;
          try {
            await classState.mutateAsync({
              id: pending.classroom.id,
              body: pending.body,
            });
          } catch {
            /* Lỗi hiện ở ApiFeedback phía trên lưới. */
          }
        }}
      />
    </div>
  );
}

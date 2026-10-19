"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table/data-table";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ROUTES } from "@/constants/routes";
import { PAGINATION_DEFAULTS } from "@/constants/ui";
// Bảng chỉ ghi query; Sheet và hộp thoại phụ huynh nằm ở feature directory, ghép ở trang.
import { parentPanelParsers } from "@/features/directory/parent-panel";
import type { ParentListItem, StudentListItem } from "@/types/backend";
import { registrationApi } from "../api";
import { displayDate } from "../calendar";

const ALL = "all";
const PARENT_STATUS_ITEMS = {
  all: "Tất cả trạng thái",
  ACTIVE: "Đang hoạt động",
  DISABLED: "Đã khóa",
};
const STUDENT_STATUS_ITEMS = {
  all: "Tất cả trạng thái",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
};
const GRADE_ITEMS = {
  all: "Tất cả khối",
  "6": "Khối 6",
  "7": "Khối 7",
  "8": "Khối 8",
  "9": "Khối 9",
};

function DirectorySelect({
  items,
  value,
  onChange,
}: {
  items: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(String(next))}
    >
      <SelectTrigger className="w-44 rounded-xl" aria-label={items.all}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Thao tác của Quản lý trên dòng phụ huynh. */
interface ParentRowActions {
  view: (parentId: string) => void;
  edit: (parentId: string) => void;
  lock: (parentId: string) => void;
}

function ManagerParentActions({
  parent,
  actions,
}: {
  parent: ParentListItem;
  actions: ParentRowActions;
}) {
  const name = parent.displayName || parent.email;
  const isActive = parent.status === "ACTIVE";
  return (
    <div className="flex flex-nowrap gap-1">
      <Button
        size="sm"
        variant="outline"
        aria-label={`Xem phụ huynh ${name}`}
        onClick={() => actions.view(parent.id)}
      >
        Xem
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Sửa phụ huynh ${name}`}
        onClick={() => actions.edit(parent.id)}
      >
        Sửa
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={isActive ? "text-destructive" : undefined}
        aria-label={`${isActive ? "Xóa" : "Mở khóa"} phụ huynh ${name}`}
        onClick={() => actions.lock(parent.id)}
      >
        {isActive ? "Xóa" : "Mở khóa"}
      </Button>
    </div>
  );
}

function StaffParentActions({ parent }: { parent: ParentListItem }) {
  const name = parent.displayName || parent.email;
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        aria-label={`Xem hồ sơ con của ${name}`}
        render={
          <Link
            href={`${ROUTES.STAFF.STUDENTS}?${new URLSearchParams({ parentUserId: parent.id })}`}
          />
        }
      >
        Xem hồ sơ con
      </Button>
      {parent.status === "ACTIVE" &&
        parent.emailVerifiedAt &&
        !!parent.parentProfile?._count.students && (
          <Button
            size="sm"
            aria-label={`Đăng ký học cho con của ${name}`}
            render={
              <Link
                href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({ email: parent.email })}
              />
            }
          >
            Đăng ký học
          </Button>
        )}
    </div>
  );
}

const parentColumns = (
  actions?: ParentRowActions,
): LegacyColumnDef<ParentListItem>[] => [
  {
    id: "parent",
    header: "Phụ huynh",
    cell: ({ row: { original: parent } }) => (
      <div className="min-w-48 space-y-1">
        <p className="font-medium">{parent.displayName || "Chưa có tên"}</p>
        <p className="text-sm text-muted-foreground">{parent.email}</p>
      </div>
    ),
  },
  {
    id: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.parentProfile?.phone || "Chưa cập nhật",
  },
  {
    id: "children",
    header: "Hồ sơ con",
    cell: ({ row }) =>
      `${row.original.parentProfile?._count.students ?? 0} hồ sơ`,
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row: { original: parent } }) => (
      <div className="flex flex-wrap gap-1">
        <Badge variant={parent.status === "ACTIVE" ? "success" : "secondary"}>
          {parent.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
        </Badge>
        {actions && !parent.emailVerifiedAt && (
          <Badge variant="warning">Chưa xác minh email</Badge>
        )}
      </div>
    ),
  },
  ...(actions
    ? []
    : [
        {
          id: "verified",
          header: "Xác minh email",
          cell: ({ row }) => (
            <Badge variant={row.original.emailVerifiedAt ? "info" : "warning"}>
              {row.original.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh"}
            </Badge>
          ),
        } satisfies LegacyColumnDef<ParentListItem>,
      ]),
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row: { original: parent } }) =>
      actions ? (
        <ManagerParentActions parent={parent} actions={actions} />
      ) : (
        <StaffParentActions parent={parent} />
      ),
  },
];

const studentColumns = (
  isStaff: boolean,
  onProcess?: (studentId: string) => void,
): LegacyColumnDef<StudentListItem>[] => [
  {
    accessorKey: "fullName",
    header: "Họ tên con",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.fullName}</span>
    ),
  },
  {
    id: "grade",
    header: "Khối",
    cell: ({ row }) => `Khối ${row.original.grade}`,
  },
  {
    id: "dateOfBirth",
    header: "Ngày sinh",
    cell: ({ row }) =>
      row.original.dateOfBirth
        ? displayDate(row.original.dateOfBirth)
        : "Chưa cập nhật",
  },
  {
    id: "parent",
    header: "Phụ huynh",
    cell: ({ row: { original: child } }) => (
      <div className="space-y-1">
        <p className="font-medium">
          {child.parentProfile.user.displayName || "Chưa có tên"}
        </p>
        <p className="text-sm text-muted-foreground">
          {child.parentProfile.user.email}
        </p>
        {child.parentProfile.phone && (
          <p className="text-xs text-muted-foreground">
            {child.parentProfile.phone}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "ACTIVE" ? "success" : "secondary"}
      >
        {row.original.status === "ACTIVE"
          ? "Đang hoạt động"
          : "Ngừng hoạt động"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row: { original: child } }) => (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          aria-label={`Xem ghi danh của ${child.fullName}`}
          render={
            <Link
              href={
                isStaff
                  ? ROUTES.STAFF.STUDENT_DETAIL(child.id)
                  : ROUTES.MANAGER.STUDENT_DETAIL(child.id)
              }
            />
          }
        >
          Xem ghi danh
        </Button>
        {onProcess && (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Xử lý nghỉ học, học bù hoặc đổi lớp cho ${child.fullName}`}
            onClick={() => onProcess(child.id)}
          >
            Xử lý
          </Button>
        )}
        {isStaff && child.status === "ACTIVE" && (
          <Button
            size="sm"
            aria-label={`Đăng ký học cho ${child.fullName}`}
            render={
              <Link
                href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                  email: child.parentProfile.user.email,
                  studentId: child.id,
                })}
              />
            }
          >
            Đăng ký học
          </Button>
        )}
      </div>
    ),
  },
];

function ParentsDirectory({ actions }: { actions?: ParentRowActions }) {
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [{ page, pageSize, status }, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE),
    status: parseAsStringLiteral([ALL, "ACTIVE", "DISABLED"]).withDefault(
      "ACTIVE",
    ),
  });
  const resetPage = useCallback(() => {
    void setFilters({ page: null });
  }, [setFilters]);
  const filters = {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, pageSize)),
    search: search.trim() || undefined,
    status: status === ALL ? undefined : status,
  };
  const query = useQuery({
    queryKey: ["registration-parents", filters],
    queryFn: ({ signal }) => registrationApi.parents(filters, signal),
  });
  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4">
        <FilterBar
          searchPlaceholder="Tìm tên hoặc email phụ huynh…"
          onSearchChange={resetPage}
          onClearFilters={() => void setFilters({ status: null, page: null })}
        >
          <DirectorySelect
            items={PARENT_STATUS_ITEMS}
            value={status}
            onChange={(next) =>
              void setFilters({ status: next as typeof status, page: null })
            }
          />
          {query.data && (
            <span className="ml-auto text-xs text-muted-foreground">
              {query.data.total} phụ huynh
            </span>
          )}
        </FilterBar>
        <DataTable
          columns={parentColumns(actions)}
          data={query.data?.items ?? []}
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyTitle="Chưa có phụ huynh phù hợp"
          emptyDescription="Thử đổi từ khóa hoặc trạng thái để xem danh sách."
        />
        <TablePagination totalItems={query.data?.total ?? 0} />
      </CardContent>
    </Card>
  );
}

function StudentsDirectory({
  isStaff,
  onProcess,
}: {
  isStaff: boolean;
  onProcess?: (studentId: string) => void;
}) {
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [{ page, pageSize, status, grade, parentUserId }, setFilters] =
    useQueryStates({
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE),
      status: parseAsStringLiteral([ALL, "ACTIVE", "INACTIVE"]).withDefault(
        "ACTIVE",
      ),
      grade: parseAsStringLiteral([ALL, "6", "7", "8", "9"]).withDefault(ALL),
      parentUserId: parseAsString,
    });
  const resetPage = useCallback(() => {
    void setFilters({ page: null });
  }, [setFilters]);
  const filters = {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, pageSize)),
    search: search.trim() || undefined,
    status: status === ALL ? undefined : status,
    grade: grade === ALL ? undefined : Number(grade),
    parentUserId: parentUserId || undefined,
  };
  const query = useQuery({
    queryKey: ["registration-students", filters],
    queryFn: ({ signal }) => registrationApi.students(filters, signal),
  });
  return (
    <Card className="min-w-0">
      <CardContent className="min-w-0 space-y-4">
        <FilterBar
          searchPlaceholder="Tìm tên con hoặc email phụ huynh…"
          onSearchChange={resetPage}
          onClearFilters={() =>
            void setFilters({
              status: null,
              grade: null,
              parentUserId: null,
              page: null,
            })
          }
        >
          <DirectorySelect
            items={STUDENT_STATUS_ITEMS}
            value={status}
            onChange={(next) =>
              void setFilters({ status: next as typeof status, page: null })
            }
          />
          <DirectorySelect
            items={GRADE_ITEMS}
            value={grade}
            onChange={(next) =>
              void setFilters({ grade: next as typeof grade, page: null })
            }
          />
          {parentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void setFilters({ parentUserId: null, page: null })}
            >
              Xem tất cả phụ huynh
            </Button>
          )}
          {query.data && (
            <span className="ml-auto text-xs text-muted-foreground">
              {query.data.total} hồ sơ con
            </span>
          )}
        </FilterBar>
        <DataTable
          columns={studentColumns(isStaff, onProcess)}
          data={query.data?.items ?? []}
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyTitle="Chưa có hồ sơ con phù hợp"
          emptyDescription="Thử đổi từ khóa, khối hoặc trạng thái để xem danh sách."
        />
        <TablePagination totalItems={query.data?.total ?? 0} />
      </CardContent>
    </Card>
  );
}

const HUB_TABS = { students: "Học sinh", parents: "Phụ huynh" } as const;
type HubTab = keyof typeof HUB_TABS;
const HUB_TAB_KEYS = Object.keys(HUB_TABS) as HubTab[];

/**
 * Một màn "Học sinh & phụ huynh" cho Nhân viên và Quản lý.
 * - Nhân viên: nút "Xử lý" trên dòng học sinh mở panel nghỉ học, học bù, đổi lớp (`?studentId=`).
 * - Quản lý: dòng phụ huynh có Xem (Sheet `?parentId=`), Sửa và Khóa (hộp thoại).
 */
export function StudentsHub({ role }: { role: "staff" | "center_manager" }) {
  const isStaff = role === "staff";
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(HUB_TAB_KEYS).withDefault("students"),
  );
  const [, setListState] = useQueryStates({
    search: parseAsString,
    page: parseAsInteger,
    status: parseAsString,
    grade: parseAsString,
    parentUserId: parseAsString,
  });
  const [, setWorkflow] = useQueryStates({
    studentId: parseAsString,
    enrollmentId: parseAsString,
    action: parseAsString,
  });
  const [, setParentPanel] = useQueryStates(parentPanelParsers);
  const parentActions: ParentRowActions | undefined = isStaff
    ? undefined
    : {
        view: (parentId) => void setParentPanel({ parentId }),
        edit: (parentId) => void setParentPanel({ parentEdit: parentId }),
        lock: (parentId) => void setParentPanel({ parentLock: parentId }),
      };
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Học sinh & phụ huynh"
        description={
          isStaff
            ? "Hồ sơ con và tài khoản phụ huynh. Bấm Xử lý trên dòng học sinh để ghi nghỉ, xếp học bù, đổi lớp hoặc cho nghỉ."
            : "Phụ huynh tự đăng ký và tạo hồ sơ con trên ứng dụng. Trung tâm xem, sửa thông tin liên hệ và khóa tài khoản."
        }
      />
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = HUB_TAB_KEYS.find((key) => key === value);
          if (!next) return;
          // Bộ lọc của hai bảng khác nhau nên đổi tab thì bắt đầu lại từ đầu.
          void setListState({
            search: null,
            page: null,
            status: null,
            grade: null,
            parentUserId: null,
          });
          void setParentPanel({
            parentId: null,
            parentEdit: null,
            parentLock: null,
          });
          void setTab(next);
        }}
      >
        <TabsList aria-label="Chọn danh sách">
          {HUB_TAB_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {HUB_TABS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "parents" ? (
        <ParentsDirectory key="parents" actions={parentActions} />
      ) : (
        <StudentsDirectory
          key="students"
          isStaff={isStaff}
          onProcess={
            isStaff
              ? (studentId) =>
                  void setWorkflow({
                    studentId,
                    enrollmentId: null,
                    action: null,
                  })
              : undefined
          }
        />
      )}
    </PageContainer>
  );
}

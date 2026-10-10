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
import { useCurrentUser } from "@/hooks/use-current-role";
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

const parentColumns = (isStaff: boolean): LegacyColumnDef<ParentListItem>[] => [
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
      <Badge variant={parent.status === "ACTIVE" ? "success" : "secondary"}>
        {parent.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
      </Badge>
    ),
  },
  {
    id: "verified",
    header: "Xác minh email",
    cell: ({ row }) => (
      <Badge variant={row.original.emailVerifiedAt ? "info" : "warning"}>
        {row.original.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row: { original: parent } }) => (
      <div className="flex flex-wrap gap-2">
        {!isStaff && (
          <Button
            size="sm"
            variant="outline"
            render={<Link href={ROUTES.MANAGER.PARENT_DETAIL(parent.id)} />}
          >
            Xem tài khoản
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          render={
            <Link
              href={`${isStaff ? ROUTES.STAFF.STUDENTS : ROUTES.MANAGER.STUDENTS}?${new URLSearchParams({ parentUserId: parent.id })}`}
            />
          }
        >
          Xem hồ sơ con
        </Button>
        {isStaff &&
          parent.status === "ACTIVE" &&
          parent.emailVerifiedAt &&
          !!parent.parentProfile?._count.students && (
            <Button
              size="sm"
              render={
                <Link
                  href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                    email: parent.email,
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

const studentColumns = (
  isStaff: boolean,
): LegacyColumnDef<StudentListItem>[] => [
  { accessorKey: "fullName", header: "Họ tên con" },
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
        {isStaff && child.status === "ACTIVE" && (
          <Button
            size="sm"
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

export function RegistrationParentsView() {
  const user = useCurrentUser();
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
    <PageContainer>
      <PageHeader
        title="Phụ huynh"
        description="Danh sách tài khoản phụ huynh và hồ sơ con đã tạo trên ứng dụng."
      />
      <Card>
        <CardContent className="space-y-4">
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
            columns={parentColumns(user?.role === "staff")}
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
    </PageContainer>
  );
}

export function RegistrationStudentsView() {
  const user = useCurrentUser();
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
    <PageContainer>
      <PageHeader
        title="Hồ sơ con"
        description="Danh sách hồ sơ con cùng thông tin phụ huynh. Chọn hồ sơ để đăng ký học."
      />
      <Card>
        <CardContent className="space-y-4">
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
                onClick={() =>
                  void setFilters({ parentUserId: null, page: null })
                }
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
            columns={studentColumns(user?.role === "staff")}
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
    </PageContainer>
  );
}

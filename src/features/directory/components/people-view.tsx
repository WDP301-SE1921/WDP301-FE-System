"use client";
import { useState } from "react";
import Link from "next/link";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { DescriptionList } from "@/components/shared/display/description-list";
import { UserCell } from "@/components/shared/display/user-cell";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/toast";
import { AREA, canAccessArea } from "@/constants/role-access";
import { ROUTES } from "@/constants/routes";
import type { WebRole } from "@/constants/roles";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import type { BackendUser, RegistrationClass } from "@/types/backend";
import { directoryApi } from "../api";
import {
  currentMonth,
  teacherMonthStats,
  TeacherMonthSessions,
  useMonthSessions,
} from "./teacher-month-sessions";
import {
  AccountEditForm,
  StaffAccountCreateForm,
  type AccountKind,
} from "./accounts-view";
import {
  INVITATION_LABEL,
  InvitationForm,
  InvitationsTable,
} from "./invitations-panel";

const PAGE_SIZE = 20;
const PEOPLE_TABS = {
  teachers: "Giáo viên",
  staff: "Nhân viên",
  managers: "Quản lý",
  invites: "Lời mời",
} as const;
type PeopleTab = keyof typeof PEOPLE_TABS;
const PEOPLE_TAB_KEYS = Object.keys(PEOPLE_TABS) as PeopleTab[];
const PRIMARY_ACTION: Partial<Record<PeopleTab, string>> = {
  teachers: "Mời giáo viên",
  staff: "Tạo tài khoản",
  managers: "Mời quản lý",
};
/** Query riêng của từng tab; đổi tab thì xóa hết để bảng mới bắt đầu sạch. */
const LIST_RESET = {
  search: null,
  page: null,
  managersPage: null,
  teacherInvitesPage: null,
  managerInvitesPage: null,
  person: null,
  personMonth: null,
};

function StatusBadge({ status }: { status: BackendUser["status"] }) {
  return (
    <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
      {status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
    </Badge>
  );
}

/** Lớp đang hoạt động theo giáo viên phụ trách hiện tại (một lần đọc danh sách lớp). */
function classesByTeacher(classes: RegistrationClass[] = []) {
  const result = new Map<string, RegistrationClass[]>();
  for (const classroom of classes) {
    if (!classroom.teacherId || classroom.isActive === false) continue;
    result.set(classroom.teacherId, [
      ...(result.get(classroom.teacherId) ?? []),
      classroom,
    ]);
  }
  return result;
}

/**
 * Nhân sự: giáo viên, nhân viên, quản lý trung tâm và lời mời trên một màn (`?tab=`).
 * Bấm Xem mở Sheet `?person=<id>`; Sửa / Khóa dùng hộp thoại.
 */
export function PeopleHub({ role }: { role: WebRole }) {
  const canSeeTeachers = canAccessArea(role, AREA.TEACHERS);
  const tabs = PEOPLE_TAB_KEYS.filter(
    (key) => key !== "teachers" || canSeeTeachers,
  );
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabs).withDefault(tabs[0]),
  );
  const [, setListState] = useQueryStates({
    search: parseAsString,
    page: parseAsInteger,
    managersPage: parseAsInteger,
    teacherInvitesPage: parseAsInteger,
    managerInvitesPage: parseAsInteger,
    person: parseAsString,
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BackendUser | null>(null);
  const [toggling, setToggling] = useState<BackendUser | null>(null);
  const counts = useLiveQuery(["people-counts"], async (signal) => {
    const [teachers, staff, managers, teacherInvites, managerInvites] =
      await Promise.all([
        canSeeTeachers
          ? directoryApi.accounts("teachers", { page: 1, limit: 1 }, signal)
          : null,
        directoryApi.accounts("staff", { page: 1, limit: 1 }, signal),
        directoryApi.managers({ page: 1, limit: 1 }, signal),
        directoryApi.invitations("teacher", { page: 1, limit: 1 }, signal),
        directoryApi.invitations("manager", { page: 1, limit: 1 }, signal),
      ]);
    return {
      teachers: teachers?.total,
      staff: staff.total,
      managers: managers.total,
      invites: teacherInvites.total + managerInvites.total,
    } satisfies Record<PeopleTab, number | undefined>;
  });
  const kind: AccountKind = tab === "teachers" ? "teachers" : "staff";
  const actionLabel = PRIMARY_ACTION[tab];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Nhân sự"
        description="Giáo viên, nhân viên vận hành và quản lý trung tâm. Mời giáo viên, quản lý qua email; tạo tài khoản nhân viên; khóa hoặc mở tài khoản."
        actions={
          actionLabel ? (
            <Button onClick={() => setCreating(true)}>{actionLabel}</Button>
          ) : undefined
        }
      />
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = tabs.find((key) => key === value);
          if (!next) return;
          void setListState(LIST_RESET);
          void setTab(next);
        }}
      >
        <TabsList aria-label="Nhóm tài khoản">
          {tabs.map((key) => (
            <TabsTrigger key={key} value={key}>
              {PEOPLE_TABS[key]}
              {counts.data?.[key] !== undefined && (
                <Badge variant="neutral" className="ml-1.5 h-5 px-2">
                  {counts.data[key]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "invites" ? (
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {(["teacher", "manager"] as const).map((invitationKind) => (
            <Card key={invitationKind} className="min-w-0">
              <CardHeader>
                <CardTitle>
                  Lời mời {INVITATION_LABEL[invitationKind]}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <InvitationsTable
                  kind={invitationKind}
                  pageParamKey={`${invitationKind}InvitesPage`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="min-w-0">
          <CardContent className="min-w-0 space-y-4">
            <FilterBar
              key={tab}
              searchPlaceholder="Tìm tên hoặc email…"
              onSearchChange={() =>
                void setListState({ page: null, managersPage: null })
              }
            />
            {tab === "managers" ? (
              <ManagersTable />
            ) : (
              <AccountsTable
                key={kind}
                kind={kind}
                onEdit={setEditing}
                onToggle={setToggling}
              />
            )}
          </CardContent>
        </Card>
      )}
      {tab !== "managers" && tab !== "invites" && (
        <PersonSheet kind={kind} onEdit={setEditing} />
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>
              {tab === "staff"
                ? "Tạo tài khoản đăng nhập cho nhân viên vận hành."
                : "Người nhận tự đặt họ tên và mật khẩu, sau đó chờ quản lý duyệt ở tab Lời mời."}
            </DialogDescription>
          </DialogHeader>
          {creating &&
            (tab === "staff" ? (
              <StaffAccountCreateForm onDone={() => setCreating(false)} />
            ) : tab === "teachers" || tab === "managers" ? (
              <InvitationForm
                key={tab}
                kind={tab === "teachers" ? "teacher" : "manager"}
              />
            ) : null)}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa tài khoản</DialogTitle>
            <DialogDescription>
              Sửa họ tên hoặc khóa tài khoản. Email đăng nhập không đổi được.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <AccountEditForm
              key={editing.id}
              kind={kind}
              account={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!toggling}
        onOpenChange={(open) => {
          if (!open) setToggling(null);
        }}
      >
        <DialogContent>
          {toggling && (
            <AccountStatusBody
              key={toggling.id}
              kind={kind}
              account={toggling}
              onDone={() => setToggling(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function AccountsTable({
  kind,
  onEdit,
  onToggle,
}: {
  kind: AccountKind;
  onEdit: (account: BackendUser) => void;
  onToggle: (account: BackendUser) => void;
}) {
  const [{ search, page }] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });
  const [, setPerson] = useQueryState("person", parseAsString);
  const query = useLiveQuery(["accounts", kind, search, page], (signal) =>
    directoryApi.accounts(
      kind,
      { search: search.trim() || undefined, page: Math.max(1, page), limit: PAGE_SIZE },
      signal,
    ),
  );
  const classes = useLiveQuery(
    ["people-teacher-classes"],
    () => registrationApi.classes(),
    kind === "teachers",
  );
  const byTeacher = classesByTeacher(classes.data);
  const month = currentMonth();
  const monthSessions = useMonthSessions(month, kind === "teachers");
  const monthLabel = `T${Number(month.slice(5, 7))}`;
  const statsFor = (teacherId: string) =>
    teacherMonthStats(monthSessions.data, teacherId, monthSessions.dataUpdatedAt);
  const sessionCell = (value: (id: string) => number) =>
    function SessionCountCell({ row }: { row: { original: BackendUser } }) {
      if (monthSessions.isPending)
        return <span className="text-muted-foreground">…</span>;
      if (monthSessions.isError)
        return <span className="text-muted-foreground">—</span>;
      return <span className="tabular-nums">{value(row.original.id)}</span>;
    };
  const columns: DataTableColumn<BackendUser>[] = [
    {
      id: "name",
      header: kind === "teachers" ? "Giáo viên" : "Họ tên",
      cell: ({ row }) => (
        <UserCell
          name={row.original.displayName || "Chưa có tên"}
          sub={kind === "teachers" ? row.original.email : undefined}
        />
      ),
    },
    ...(kind === "teachers"
      ? [
          {
            id: "classes",
            header: "Lớp phụ trách",
            cell: ({ row }) => {
              if (classes.isPending)
                return <span className="text-muted-foreground">Đang tải…</span>;
              if (classes.isError)
                return <span className="text-destructive">Chưa tải được lớp</span>;
              const names = (byTeacher.get(row.original.id) ?? []).map(
                (classroom) => classroom.name,
              );
              return names.length ? (
                <span className="block max-w-72 whitespace-normal">
                  {names.join(" · ")}
                </span>
              ) : (
                <span className="text-muted-foreground">Chưa phân công</span>
              );
            },
          } satisfies DataTableColumn<BackendUser>,
          {
            id: "taught",
            header: `Đã dạy ${monthLabel}`,
            cell: sessionCell((id) => statsFor(id).taught),
          } satisfies DataTableColumn<BackendUser>,
          {
            id: "pending",
            header: "Chờ điểm danh",
            cell: sessionCell((id) => statsFor(id).pending),
          } satisfies DataTableColumn<BackendUser>,
        ]
      : [
          { accessorKey: "email", header: "Email" } satisfies DataTableColumn<BackendUser>,
          {
            id: "role",
            header: "Vai trò",
            cell: () => <Badge variant="warning">Nhân viên</Badge>,
          } satisfies DataTableColumn<BackendUser>,
        ]),
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: { original: account } }) => {
        const name = account.displayName || account.email;
        return (
          <div className="flex flex-nowrap gap-1">
            {kind === "teachers" && (
              <Button
                size="sm"
                variant="outline"
                aria-label={`Xem giáo viên ${name}`}
                onClick={() => void setPerson(account.id)}
              >
                Xem
              </Button>
            )}
            <Button
              size="sm"
              variant={kind === "teachers" ? "ghost" : "outline"}
              aria-label={`Sửa tài khoản ${name}`}
              onClick={() => onEdit(account)}
            >
              Sửa
            </Button>
            {kind === "staff" && (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`${account.status === "ACTIVE" ? "Khóa" : "Mở khóa"} tài khoản ${name}`}
                onClick={() => onToggle(account)}
              >
                {account.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];
  return (
    <>
      {kind === "teachers" && (
        <ApiFeedback error={classes.error} retry={() => void classes.refetch()} />
      )}
      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle="Chưa có tài khoản phù hợp"
        emptyDescription="Thử tìm theo tên hoặc email khác."
      />
      <TablePagination
        totalItems={query.data?.total ?? 0}
        fixedPageSize={PAGE_SIZE}
      />
      {kind === "staff" && (
        <p className="text-xs text-muted-foreground">
          Danh sách hiện chỉ gồm tài khoản Nhân viên; tài khoản Thiết kế giáo
          trình chưa quản lý được trên màn này.
        </p>
      )}
    </>
  );
}

const managerColumns: DataTableColumn<BackendUser>[] = [
  {
    id: "name",
    header: "Họ tên",
    cell: ({ row }) => (
      <UserCell name={row.original.displayName || "Chưa có tên"} />
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

/** Mọi quản lý có cùng quyền quản lý trung tâm; API không cho sửa tài khoản quản lý. */
function ManagersTable() {
  const [{ search, managersPage }] = useQueryStates({
    search: parseAsString.withDefault(""),
    managersPage: parseAsInteger.withDefault(1),
  });
  const query = useLiveQuery(["managers", search, managersPage], (signal) =>
    directoryApi.managers(
      {
        search: search.trim() || undefined,
        page: Math.max(1, managersPage),
        limit: PAGE_SIZE,
      },
      signal,
    ),
  );
  return (
    <>
      <DataTable
        columns={managerColumns}
        data={query.data?.items ?? []}
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle="Chưa có tài khoản quản lý phù hợp"
      />
      <TablePagination
        totalItems={query.data?.total ?? 0}
        pageParamKey="managersPage"
        fixedPageSize={PAGE_SIZE}
      />
      <p className="text-xs text-muted-foreground">
        Mọi quản lý có cùng quyền quản lý trung tâm.
      </p>
    </>
  );
}

/** Sheet xem một tài khoản giáo viên / nhân viên (`?person=<id>`). */
function PersonSheet({
  kind,
  onEdit,
}: {
  kind: AccountKind;
  onEdit: (account: BackendUser) => void;
}) {
  const [{ person }, setPerson] = useQueryStates({
    person: parseAsString,
    personMonth: parseAsString,
  });
  return (
    <Sheet
      open={!!person}
      onOpenChange={(open) => {
        if (!open) void setPerson({ person: null, personMonth: null });
      }}
    >
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
      >
        <SheetCloseButton label="Đóng hồ sơ nhân sự" />
        {person && (
          <PersonSheetContent
            key={`${kind}-${person}`}
            kind={kind}
            id={person}
            onEdit={onEdit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PersonSheetContent({
  kind,
  id,
  onEdit,
}: {
  kind: AccountKind;
  id: string;
  onEdit: (account: BackendUser) => void;
}) {
  const account = useLiveQuery(["account", kind, id], (signal) =>
    directoryApi.account(kind, id, signal),
  );
  const classes = useLiveQuery(
    ["people-teacher-classes"],
    () => registrationApi.classes(),
    kind === "teachers",
  );
  const teaching = classesByTeacher(classes.data).get(id) ?? [];
  const data = account.data;
  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>
          {data
            ? data.displayName || data.email
            : kind === "teachers"
              ? "Thông tin giáo viên"
              : "Thông tin nhân viên"}
        </SheetTitle>
        <SheetDescription className="break-all">
          {data?.email ?? "Thông tin tài khoản tại trung tâm."}
        </SheetDescription>
        {data && (
          <div className="pt-1">
            <StatusBadge status={data.status} />
          </div>
        )}
      </SheetHeader>
      <div className="space-y-6 pt-4">
        <AsyncBoundary
          isLoading={account.isPending}
          isError={account.isError}
          error={account.error}
          onRetry={() => void account.refetch()}
        >
          {data && (
            <DescriptionList
              cols={1}
              items={[
                {
                  label: "Vai trò",
                  value: kind === "teachers" ? "Giáo viên" : "Nhân viên",
                },
                {
                  label: "Xác minh email",
                  value: data.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh",
                },
              ]}
            />
          )}
        </AsyncBoundary>
        {kind === "teachers" && (
          <section className="space-y-3" aria-labelledby="person-classes">
            <h3 id="person-classes" className="text-sm font-semibold">
              Lớp phụ trách · {classes.isPending ? "…" : teaching.length}
            </h3>
            <AsyncBoundary
              isLoading={classes.isPending}
              isError={classes.isError}
              error={classes.error}
              onRetry={() => void classes.refetch()}
              data={teaching}
              emptyProps={{ title: "Chưa phân công lớp" }}
            >
              <ul className="space-y-2">
                {teaching.map((classroom) => (
                  <li
                    key={classroom.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                  >
                    <span>
                      <span className="font-medium">{classroom.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        · {classroom.program.subject} · Khối{" "}
                        {classroom.program.grade}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link href={ROUTES.MANAGER.CLASS_DETAIL(classroom.id)} />
                      }
                    >
                      Xem lớp
                    </Button>
                  </li>
                ))}
              </ul>
            </AsyncBoundary>
          </section>
        )}
        {kind === "teachers" && <TeacherMonthSessions teacherId={id} />}
      </div>
      {data && (
        <SheetFooter className="pt-6">
          <Button variant="outline" onClick={() => onEdit(data)}>
            Sửa
          </Button>
        </SheetFooter>
      )}
    </>
  );
}

/** Khóa / mở tài khoản nhân viên. PATCH kiểm đủ `accountUpdateSchema` nên gửi lại họ tên. */
function AccountStatusBody({
  kind,
  account,
  onDone,
}: {
  kind: AccountKind;
  account: BackendUser;
  onDone: () => void;
}) {
  const action = useLiveCommand();
  const isActive = account.status === "ACTIVE";
  const name = account.displayName || account.email;
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isActive ? `Khóa tài khoản ${name}?` : `Mở khóa tài khoản ${name}?`}
        </DialogTitle>
        <DialogDescription>
          {isActive
            ? "Tài khoản bị khóa không đăng nhập được; dữ liệu đã làm vẫn giữ và mở lại được."
            : "Người dùng đăng nhập lại được với email và mật khẩu cũ."}
        </DialogDescription>
      </DialogHeader>
      {!account.displayName && (
        <p className="text-sm text-destructive" role="alert">
          Tài khoản chưa có họ tên. Đặt họ tên bằng nút Sửa trước khi đổi trạng
          thái.
        </p>
      )}
      <ApiFeedback error={action.error} />
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Hủy
        </Button>
        <Button
          variant={isActive ? "danger" : "default"}
          disabled={!account.displayName}
          isLoading={action.isPending}
          onClick={() =>
            action.mutate(
              () =>
                directoryApi.updateAccount(kind, account.id, {
                  displayName: account.displayName ?? "",
                  status: isActive ? "DISABLED" : "ACTIVE",
                }),
              {
                onSuccess: () => {
                  toast.success(
                    isActive
                      ? `Đã khóa tài khoản ${name}.`
                      : `Đã mở khóa tài khoản ${name}.`,
                  );
                  onDone();
                },
              },
            )
          }
        >
          {isActive ? "Khóa tài khoản" : "Mở khóa"}
        </Button>
      </DialogFooter>
    </>
  );
}

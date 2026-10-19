"use client";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SheetCloseButton } from "@/components/shared/actions/sheet-close-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { currentEnrollmentClass } from "@/features/academic/api";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import {
  dateOnly,
  displayDate,
  money,
  todayInVietnam,
} from "@/features/registration-flow/calendar";
import { parentUpdateSchema } from "@/lib/validators/web-workflows";
import type { EnrollmentRecord } from "@/types/academic-workflows";
import type { ParentLookup, StudentProfile } from "@/types/backend";
import { directoryApi } from "../api";
import { parentPanelParsers } from "../parent-panel";
import { ACCOUNT_STATUS_OPTIONS } from "./accounts-view";

/**
 * Sheet xem phụ huynh và hộp thoại Sửa / Xóa (khóa) của Quản lý, mở theo query trên URL
 * (`?parentId=`, `?parentEdit=`, `?parentLock=`). Hộp thoại mở chồng lên Sheet được.
 */
export function ParentAccountPanels() {
  const [{ parentId, parentEdit, parentLock }, setPanel] =
    useQueryStates(parentPanelParsers);
  return (
    <>
      <Sheet
        open={!!parentId}
        onOpenChange={(open) => {
          if (!open) void setPanel({ parentId: null });
        }}
      >
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-2xl"
          showCloseButton={false}
        >
          <SheetCloseButton label="Đóng hồ sơ phụ huynh" />
          {parentId && (
            <ParentSheetContent
              key={parentId}
              parentId={parentId}
              onEdit={() => void setPanel({ parentEdit: parentId })}
            />
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!parentEdit}
        onOpenChange={(open) => {
          if (!open) void setPanel({ parentEdit: null });
        }}
      >
        <DialogContent>
          {parentEdit && (
            <ParentEditBody
              key={parentEdit}
              parentId={parentEdit}
              onDone={() => void setPanel({ parentEdit: null })}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!parentLock}
        onOpenChange={(open) => {
          if (!open) void setPanel({ parentLock: null });
        }}
      >
        <DialogContent>
          {parentLock && (
            <ParentLockBody
              key={parentLock}
              parentId={parentLock}
              onDone={() => void setPanel({ parentLock: null })}
              onDeleted={() =>
                void setPanel({
                  parentId: null,
                  parentEdit: null,
                  parentLock: null,
                })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function useParent(parentId: string) {
  return useLiveQuery(["parent", parentId], (signal) =>
    directoryApi.parent(parentId, signal),
  );
}

function ParentSheetContent({
  parentId,
  onEdit,
}: {
  parentId: string;
  onEdit: () => void;
}) {
  const parent = useParent(parentId);
  const data = parent.data;
  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>
          {data ? data.displayName || data.email : "Thông tin phụ huynh"}
        </SheetTitle>
        <SheetDescription className="break-all">
          {data
            ? [data.email, data.parentProfile?.phone].filter(Boolean).join(" · ")
            : "Tài khoản phụ huynh, hồ sơ con và lịch sử thanh toán."}
        </SheetDescription>
        {data && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant={data.status === "ACTIVE" ? "success" : "secondary"}>
              {data.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
            </Badge>
            <Badge variant={data.emailVerifiedAt ? "info" : "warning"}>
              {data.emailVerifiedAt
                ? "Đã xác minh email"
                : "Chưa xác minh email"}
            </Badge>
          </div>
        )}
      </SheetHeader>
      <div className="space-y-6 pt-4">
        <AsyncBoundary
          isLoading={parent.isPending}
          isError={parent.isError}
          error={parent.error}
          onRetry={() => void parent.refetch()}
        >
          {data && <ParentChildren parent={data} />}
        </AsyncBoundary>
      </div>
      {data && (
        <SheetFooter className="pt-6">
          <Button variant="outline" onClick={onEdit}>
            Sửa thông tin
          </Button>
        </SheetFooter>
      )}
    </>
  );
}

interface ChildEnrollments {
  child: StudentProfile;
  enrollments: EnrollmentRecord[];
}

/** Lớp đang học hôm nay của một ghi danh (theo lớp đang xếp), hoặc null nếu ngoài thời hạn. */
function currentClassName(enrollment: EnrollmentRecord, today: string) {
  if (
    enrollment.status !== "ACTIVE" ||
    !enrollment.startDate ||
    !enrollment.endDate ||
    dateOnly(enrollment.startDate) > today ||
    dateOnly(enrollment.endDate) <= today
  )
    return null;
  const classId = currentEnrollmentClass(enrollment);
  return (
    enrollment.placements.find((placement) => placement.classId === classId)
      ?.class?.name ?? enrollment.class.name
  );
}

function ParentChildren({ parent }: { parent: ParentLookup }) {
  const children = parent.parentProfile?.students ?? [];
  // Mỗi con một lần đọc ghi danh (kèm biên lai); chỉ chạy khi Sheet mở.
  const enrollments = useLiveQuery(
    ["parent-enrollments", parent.id, children.map((child) => child.id)],
    (signal) =>
      Promise.all(
        children.map(async (child) => ({
          child,
          enrollments: await directoryApi.studentEnrollments(child.id, signal),
        })),
      ),
    children.length > 0,
  );
  const today = todayInVietnam();
  const rows = enrollments.data ?? [];
  const payments = rows
    .flatMap(({ child, enrollments: items }: ChildEnrollments) =>
      items.flatMap((enrollment) => {
        const payment = enrollment.registrationOrder?.payment;
        return payment ? [{ child, enrollment, payment }] : [];
      }),
    )
    .sort((left, right) =>
      right.payment.confirmedAt.localeCompare(left.payment.confirmedAt),
    );
  const total = payments.reduce(
    (sum, item) => sum + Number(item.payment.amount),
    0,
  );
  return (
    <>
      <section className="space-y-3" aria-labelledby="parent-children">
        <h3 id="parent-children" className="text-sm font-semibold">
          Hồ sơ con · {children.length}
        </h3>
        {!children.length && (
          <p className="text-sm text-muted-foreground">
            Phụ huynh chưa tạo hồ sơ con trên ứng dụng.
          </p>
        )}
        {children.map((child) => {
          const classes = (
            rows.find((row) => row.child.id === child.id)?.enrollments ?? []
          )
            .map((enrollment) => currentClassName(enrollment, today))
            .filter((name): name is string => !!name);
          return (
            <div
              key={child.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {child.fullName}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · Khối {child.grade}
                    {child.status !== "ACTIVE" && " · Ngừng học"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {enrollments.isPending
                    ? "Đang tải lớp…"
                    : classes.length
                      ? classes.join(" · ")
                      : "Chưa có lớp đang học"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={<Link href={ROUTES.MANAGER.STUDENT_DETAIL(child.id)} />}
              >
                Xem học sinh
              </Button>
            </div>
          );
        })}
      </section>
      {children.length > 0 && (
        <section className="space-y-3" aria-labelledby="parent-payments">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="parent-payments" className="text-sm font-semibold">
              Lịch sử thanh toán
            </h3>
            {enrollments.data && (
              <span className="text-sm text-muted-foreground">
                Tổng {money(total)}
              </span>
            )}
          </div>
          <AsyncBoundary
            isLoading={enrollments.isPending}
            isError={enrollments.isError}
            error={enrollments.error}
            onRetry={() => void enrollments.refetch()}
            data={payments}
            emptyProps={{ title: "Chưa có khoản thu" }}
          >
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Học sinh · lớp</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Biên lai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(({ child, enrollment, payment }) => (
                    <TableRow key={payment.id}>
                      <TableCell>{displayDate(payment.confirmedAt)}</TableCell>
                      <TableCell className="max-w-56 whitespace-normal">
                        {child.fullName} · {enrollment.class.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.receiptNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AsyncBoundary>
        </section>
      )}
    </>
  );
}

function ParentEditBody({
  parentId,
  onDone,
}: {
  parentId: string;
  onDone: () => void;
}) {
  const parent = useParent(parentId);
  const data = parent.data;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Sửa thông tin phụ huynh</DialogTitle>
        <DialogDescription>
          Email đăng nhập do phụ huynh quản lý trên ứng dụng, trung tâm chỉ sửa
          họ tên, số điện thoại và trạng thái.
        </DialogDescription>
      </DialogHeader>
      <AsyncBoundary
        isLoading={parent.isPending}
        isError={parent.isError}
        error={parent.error}
        onRetry={() => void parent.refetch()}
      >
        {data && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-edit-email">Email đăng nhập</Label>
              <Input
                id="parent-edit-email"
                value={data.email}
                readOnly
                disabled
              />
            </div>
            <ApiForm
              key={data.id}
              schema={parentUpdateSchema}
              defaults={{
                displayName: data.displayName ?? "",
                status: data.status,
                phone: data.parentProfile?.phone ?? "",
              }}
              fields={[
                { name: "displayName", label: "Họ tên" },
                { name: "phone", label: "Số điện thoại liên hệ" },
                {
                  name: "status",
                  label: "Trạng thái",
                  type: "select",
                  options: ACCOUNT_STATUS_OPTIONS,
                  description:
                    "Khóa thì phụ huynh không đăng nhập được; hồ sơ con, biên lai và điểm số vẫn giữ.",
                },
              ]}
              successMessage={false}
              onSubmit={(value) => directoryApi.updateParent(parentId, value)}
              onSuccess={() => {
                toast.success("Đã lưu thông tin phụ huynh.");
                onDone();
              }}
            />
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

/**
 * "Xóa" của Quản lý. Tài khoản chưa có hồ sơ con thì xóa hẳn được (BE-9); BE vẫn từ chối
 * (`PARENT_IN_USE`) nếu đã có đăng ký hay hoạt động. Còn lại thì khóa, đã khóa thì mở khóa.
 * PATCH kiểm đủ `parentUpdateSchema`, nên khóa/mở gửi lại họ tên và số điện thoại hiện tại.
 */
function ParentLockBody({
  parentId,
  onDone,
  onDeleted,
}: {
  parentId: string;
  onDone: () => void;
  onDeleted: () => void;
}) {
  const parent = useParent(parentId);
  const action = useLiveCommand();
  const client = useQueryClient();
  const data = parent.data;
  const isActive = data?.status === "ACTIVE";
  const name = data ? data.displayName || data.email : "phụ huynh";
  const childCount = data?.parentProfile?.students.length ?? 0;
  const canDelete = !!data && childCount === 0;
  const removal = useMutation({
    mutationFn: () => directoryApi.deleteParent(parentId),
    onSuccess: async () => {
      // Không đọc lại tài khoản vừa xóa (sẽ 404); làm mới mọi bảng còn lại.
      await client.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(parentId),
      });
      toast.success(`Đã xóa tài khoản ${name}.`);
      onDeleted();
    },
  });
  const busy = action.isPending || removal.isPending;
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isActive || !data
            ? `Xóa tài khoản ${name}?`
            : `Mở khóa tài khoản ${name}?`}
        </DialogTitle>
        <DialogDescription>
          {isActive || !data
            ? "Khóa tài khoản: phụ huynh không đăng nhập được, dữ liệu vẫn giữ và mở lại được."
            : "Phụ huynh đăng nhập lại được trên ứng dụng với email và mật khẩu cũ."}
        </DialogDescription>
      </DialogHeader>
      <AsyncBoundary
        isLoading={parent.isPending}
        isError={parent.isError}
        error={parent.error}
        onRetry={() => void parent.refetch()}
      >
        {data && (
          <div className="space-y-3 text-sm">
            {canDelete ? (
              <p className="text-muted-foreground">
                Tài khoản chưa có hồ sơ con nên xóa hẳn được, nếu phụ huynh
                chưa đăng ký học và chưa dùng tài khoản. Xóa rồi thì không khôi
                phục được.
              </p>
            ) : (
              isActive && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  Tài khoản đã có {childCount} hồ sơ con nên không xóa hẳn
                  được, để giữ biên lai, điểm danh và điểm số. Bạn có thể khóa
                  tài khoản thay vì xóa.
                </p>
              )
            )}
            {!data.displayName && (
              <p className="text-destructive" role="alert">
                Phụ huynh chưa có họ tên. Đặt họ tên bằng nút Sửa trước khi đổi
                trạng thái.
              </p>
            )}
            <ApiFeedback error={action.error ?? removal.error} />
          </div>
        )}
      </AsyncBoundary>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Hủy
        </Button>
        {canDelete && (
          <Button
            variant="danger"
            disabled={busy}
            isLoading={removal.isPending}
            onClick={() => {
              action.reset();
              removal.mutate();
            }}
          >
            Xóa hẳn
          </Button>
        )}
        <Button
          variant={!isActive ? "default" : canDelete ? "outline" : "danger"}
          disabled={!data?.displayName || busy}
          isLoading={action.isPending}
          onClick={() => {
            if (!data) return;
            removal.reset();
            action.mutate(
              () =>
                directoryApi.updateParent(parentId, {
                  displayName: data.displayName ?? "",
                  phone: data.parentProfile?.phone ?? "",
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
            );
          }}
        >
          {isActive ? "Khóa tài khoản" : "Mở khóa"}
        </Button>
      </DialogFooter>
    </>
  );
}

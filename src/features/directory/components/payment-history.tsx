"use client";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { money } from "@/features/registration-flow/calendar";
import type { RegistrationOrder } from "@/types/backend";
import { directoryApi, type PaymentRecord } from "../api";

export function LivePaymentHistory({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const [{ view, listPage, search, fromDate, toDate, status }, setFilters] =
    useQueryStates({
      view: parseAsStringLiteral(["registrations", "payments"]).withDefault(
        "registrations",
      ),
      listPage: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(""),
      fromDate: parseAsString.withDefault(""),
      toDate: parseAsString.withDefault(""),
      status: parseAsStringLiteral([
        "all",
        "DRAFT",
        "COMPLETED",
        "CANCELLED",
      ]).withDefault("all"),
    });
  const filters = {
    page: Math.max(1, listPage),
    limit: 20,
    search: search.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };
  const orders = useLiveQuery(
    ["registration-history", filters, status],
    (signal) =>
      directoryApi.registrations(
        { ...filters, status: status === "all" ? undefined : status },
        signal,
      ),
    view === "registrations",
  );
  const payments = useLiveQuery(
    ["payment-history", filters],
    (signal) => directoryApi.payments(filters, signal),
    view === "payments",
  );
  const active = view === "registrations" ? orders : payments;
  const total = active.data?.total ?? 0;
  const orderColumns: DataTableColumn<RegistrationOrder>[] = [
    {
      id: "student",
      header: "Học sinh",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.studentFullName}</span>
      ),
    },
    {
      id: "class",
      header: "Lớp học",
      cell: ({ row }) => row.original.class.name,
    },
    { accessorKey: "parentEmail", header: "Email phụ huynh" },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "COMPLETED"
              ? "success"
              : row.original.status === "DRAFT"
                ? "warning"
                : "secondary"
          }
        >
          {STATUS_TEXT[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: "Học phí",
      cell: ({ row }) => (
        <p className="text-right font-medium tabular-nums">
          {money(row.original.quotedAmount)}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Mở bill hoặc biên lai của ${row.original.studentFullName}`}
          onClick={() => onOpen(row.original.id)}
        >
          Mở bill / biên lai
        </Button>
      ),
    },
  ];
  const paymentColumns: DataTableColumn<PaymentRecord>[] = [
    { accessorKey: "receiptNumber", header: "Số biên lai" },
    {
      id: "student",
      header: "Học sinh / Phụ huynh",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">
            {row.original.registrationOrder.studentFullName}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.registrationOrder.parentEmail}
          </p>
        </div>
      ),
    },
    {
      id: "class",
      header: "Lớp học",
      cell: ({ row }) => row.original.registrationOrder.class.name,
    },
    {
      id: "amount",
      header: "Đã nhận",
      cell: ({ row }) => (
        <p className="text-right font-medium tabular-nums">
          {money(row.original.amount)}
        </p>
      ),
    },
    {
      id: "confirmed",
      header: "Xác nhận thanh toán",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p>{displayMoment(row.original.confirmedAt)}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.confirmedByManager.displayName ??
              row.original.confirmedByManager.email}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Xem biên lai ${row.original.receiptNumber}`}
          onClick={() => onOpen(row.original.registrationOrder.id)}
        >
          Xem biên lai
        </Button>
      ),
    },
  ];
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Đăng ký và thanh toán tại trung tâm</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <Tabs
          value={view}
          onValueChange={(value) =>
            void setFilters({ view: value as typeof view, listPage: null })
          }
        >
          <TabsList className="h-auto max-w-full flex-wrap">
            <TabsTrigger value="registrations">Đăng ký</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán đã xác nhận</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="history-search">
              Tìm tên con hoặc email phụ huynh
            </Label>
            <Input
              id="history-search"
              value={search}
              onChange={(event) =>
                void setFilters({ search: event.target.value, listPage: null })
              }
            />
          </div>
          {view === "registrations" && (
            <LiveSelect
              label="Trạng thái"
              value={status}
              options={[
                { value: "all", label: "Tất cả" },
                ...["DRAFT", "COMPLETED", "CANCELLED"].map((value) => ({
                  value,
                  label: STATUS_TEXT[value],
                })),
              ]}
              onChange={(value) =>
                void setFilters({
                  status: value as typeof status,
                  listPage: null,
                })
              }
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="history-from">Từ ngày</Label>
            <Input
              id="history-from"
              type="date"
              value={fromDate}
              onChange={(event) =>
                void setFilters({
                  fromDate: event.target.value,
                  listPage: null,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-to">Đến ngày</Label>
            <Input
              id="history-to"
              type="date"
              value={toDate}
              onChange={(event) =>
                void setFilters({ toDate: event.target.value, listPage: null })
              }
            />
          </div>
        </div>
        {view === "registrations" ? (
          <DataTable
            columns={orderColumns}
            data={orders.data?.items ?? []}
            isLoading={orders.isPending}
            isError={orders.isError}
            error={orders.error}
            onRetry={() => void orders.refetch()}
            emptyTitle="Chưa có đăng ký phù hợp"
            emptyDescription="Thử đổi từ khóa, trạng thái hoặc khoảng ngày."
          />
        ) : (
          <DataTable
            columns={paymentColumns}
            data={payments.data?.items ?? []}
            isLoading={payments.isPending}
            isError={payments.isError}
            error={payments.error}
            onRetry={() => void payments.refetch()}
            emptyTitle="Chưa có thanh toán phù hợp"
            emptyDescription="Thử đổi từ khóa hoặc khoảng ngày."
          />
        )}
        {view === "payments" && payments.data && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Tổng học phí trong bộ lọc</p>
            <p className="font-semibold tabular-nums">
              {money(payments.data.totalAmount)}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={listPage <= 1 || active.isFetching}
            onClick={() => void setFilters({ listPage: listPage - 1 })}
          >
            Trang trước
          </Button>
          <span>
            Trang {Math.max(1, listPage)} · {total} kết quả
          </span>
          <Button
            variant="outline"
            disabled={listPage * 20 >= total || active.isFetching}
            onClick={() => void setFilters({ listPage: listPage + 1 })}
          >
            Trang sau
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

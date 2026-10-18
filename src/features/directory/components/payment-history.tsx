"use client";
import type { ReactNode } from "react";
import {
  parseAsBoolean,
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
import { todayLocalDate } from "@/lib/validators/web-workflows";
import type { RegistrationOrder } from "@/types/backend";
import { directoryApi, type PaymentRecord } from "../api";

const ORDER_ACTION: Record<RegistrationOrder["status"], string> = {
  DRAFT: "Thu phí",
  COMPLETED: "Biên lai",
  CANCELLED: "Xem",
};

/** Đăng ký đã tạo hoặc tra cứu trên thiết bị này (bộ lọc "Tạo trong phiên này"). */
export interface RecentRegistrations {
  orders: RegistrationOrder[];
  isPending: boolean;
  failedIds: string[];
}

export function LivePaymentHistory({
  onOpen,
  searchAction,
  recent,
}: {
  onOpen: (id: string) => void;
  /** Nút phụ cạnh ô tìm kiếm, ví dụ mở đăng ký theo mã vừa gõ. */
  searchAction?: (search: string) => ReactNode;
  recent?: RecentRegistrations;
}) {
  const [
    { view, listPage, search, fromDate, toDate, status, recentOnly },
    setFilters,
  ] = useQueryStates({
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
      recentOnly: parseAsBoolean.withDefault(false),
    });
  const showRecent = view === "registrations" && recentOnly && !!recent;
  const today = todayLocalDate();
  const monthStart = `${today.slice(0, 8)}01`;
  const presets = [
    { label: "Hôm nay", fromDate: today, toDate: today },
    { label: "Tháng này", fromDate: monthStart, toDate: today },
  ];
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
    view === "registrations" && !showRecent,
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
          variant={row.original.status === "DRAFT" ? "default" : "outline"}
          aria-label={`${ORDER_ACTION[row.original.status]} · ${row.original.studentFullName} · ${row.original.class.name}`}
          onClick={() => onOpen(row.original.id)}
        >
          {ORDER_ACTION[row.original.status]}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="history-search">
              Tìm tên con, email phụ huynh, số biên lai hoặc mã đăng ký
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="history-search"
                value={search}
                disabled={showRecent}
                onChange={(event) =>
                  void setFilters({
                    search: event.target.value,
                    listPage: null,
                  })
                }
              />
              {searchAction?.(search.trim())}
            </div>
          </div>
          {view === "registrations" && !showRecent && (
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
              disabled={showRecent}
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
              disabled={showRecent}
              value={toDate}
              onChange={(event) =>
                void setFilters({ toDate: event.target.value, listPage: null })
              }
            />
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Lọc nhanh theo thời gian"
          role="group"
        >
          {presets.map((preset) => {
            const isActive =
              !showRecent &&
              fromDate === preset.fromDate &&
              toDate === preset.toDate;
            return (
              <Button
                key={preset.label}
                size="sm"
                variant={isActive ? "secondary" : "outline"}
                aria-pressed={isActive}
                onClick={() =>
                  void setFilters(
                    isActive
                      ? { fromDate: null, toDate: null, listPage: null }
                      : {
                          fromDate: preset.fromDate,
                          toDate: preset.toDate,
                          recentOnly: null,
                          listPage: null,
                        },
                  )
                }
              >
                {preset.label}
              </Button>
            );
          })}
          {view === "registrations" && recent && (
            <Button
              size="sm"
              variant={showRecent ? "secondary" : "outline"}
              aria-pressed={showRecent}
              onClick={() =>
                void setFilters({
                  recentOnly: showRecent ? null : true,
                  listPage: null,
                })
              }
            >
              Tạo trong phiên này
            </Button>
          )}
        </div>
        {showRecent ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Danh sách trên thiết bị này. Tìm theo mã đăng ký để mở đăng ký từ
              phiên hoặc thiết bị khác.
            </p>
            <DataTable
              columns={orderColumns}
              data={recent.orders}
              isLoading={recent.isPending && !recent.orders.length}
              emptyTitle="Chưa có đăng ký trong phiên làm việc"
              emptyDescription="Đăng ký tạo hoặc tra cứu trên thiết bị này sẽ hiện ở đây."
            />
            {recent.failedIds.map((id) => (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-medium break-all">{id}</p>
                  <p className="text-xs text-muted-foreground">
                    Chưa tải được trạng thái
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onOpen(id)}>
                  Mở đăng ký
                </Button>
              </div>
            ))}
          </div>
        ) : view === "registrations" ? (
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
        {!showRecent && (
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
        )}
      </CardContent>
    </Card>
  );
}

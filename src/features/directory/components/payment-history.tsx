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
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { money } from "@/features/registration-flow/calendar";
import { directoryApi } from "../api";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đăng ký và thanh toán tại trung tâm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[
            ["registrations", "Đăng ký"],
            ["payments", "Thanh toán đã xác nhận"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={view === value ? "default" : "outline"}
              onClick={() =>
                void setFilters({ view: value as typeof view, listPage: null })
              }
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
        <AsyncBoundary
          isLoading={active.isPending}
          isError={active.isError}
          error={active.error}
          onRetry={() => void active.refetch()}
          data={active.data?.items}
          emptyProps={{ title: "Chưa có dữ liệu phù hợp" }}
        >
          {view === "registrations"
            ? orders.data?.items.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {order.studentFullName} · {order.class.name}
                    </p>
                    <p className="text-sm">
                      {order.parentEmail} · {STATUS_TEXT[order.status]} ·{" "}
                      {money(order.quotedAmount)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => onOpen(order.id)}>
                    Mở bill / biên lai
                  </Button>
                </div>
              ))
            : payments.data?.items.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {payment.receiptNumber} ·{" "}
                      {payment.registrationOrder.studentFullName}
                    </p>
                    <p>
                      {payment.registrationOrder.class.name} ·{" "}
                      {money(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {displayMoment(payment.confirmedAt)} ·{" "}
                      {payment.confirmedByManager.displayName ??
                        payment.confirmedByManager.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onOpen(payment.registrationOrder.id)}
                  >
                    Xem biên lai
                  </Button>
                </div>
              ))}
        </AsyncBoundary>
        {view === "payments" && payments.data && (
          <p>Tổng học phí trong bộ lọc: {money(payments.data.totalAmount)}</p>
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
            Trang {listPage} · {total} kết quả
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

"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import type { RegistrationOrder } from "@/types/backend";
import { registrationApi } from "../api";
import { recentRegistrations, rememberRegistration } from "../storage";
import { ApiFeedback } from "./api-feedback";
import { RegistrationReceipt } from "./registration-receipt";
import { RegistrationBillPanel } from "@/features/billing/components/registration-bill-panel";
import { LivePaymentHistory } from "@/features/directory/components/payment-history";
import { Badge } from "@/components/ui/badge";
import { SheetCloseButton } from "@/components/shared/actions/sheet-close-button";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  readCompletedSummary,
  readPendingRegistrations,
} from "@/features/dashboard/staff-summary";
import { money } from "../calendar";

const idSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Nhập mã đăng ký.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Mã đăng ký không hợp lệ."),
});
/** Mã đăng ký là cuid; chỉ gợi ý mở theo mã khi chuỗi tìm kiếm trông giống một mã. */
const MIN_LOOKUP_LENGTH = 20;
const ORDER_STATUS_TEXT: Record<RegistrationOrder["status"], string> = {
  DRAFT: "Bản nháp, chờ thu học phí",
  COMPLETED: "Đã thu tiền",
  CANCELLED: "Đã hủy",
};
function subscribe(callback: () => void) {
  window.addEventListener("edugrade:registrations-changed", callback);
  return () =>
    window.removeEventListener("edugrade:registrations-changed", callback);
}

export function RegistrationPaymentsView() {
  const user = useCurrentUser();
  const [registrationId, setRegistrationId] = useQueryState(
    "registrationId",
    parseAsString,
  );
  const historyRaw = useSyncExternalStore(
    subscribe,
    () => (user ? JSON.stringify(recentRegistrations(user.id)) : "[]"),
    () => "[]",
  );
  const history = JSON.parse(historyRaw) as { id: string }[];
  const queries = useQueries({
    queries: history.map((entry) => ({
      queryKey: ["registration", entry.id],
      queryFn: () => registrationApi.get(entry.id),
      retry: false,
    })),
  });
  const order = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: () => registrationApi.get(registrationId!),
    enabled: !!registrationId,
    retry: false,
    staleTime: 0,
  });
  const receipt = useQuery({
    queryKey: ["registration-receipt", registrationId],
    queryFn: () => registrationApi.receipt(registrationId!),
    enabled: !!registrationId && order.data?.status === "COMPLETED",
    retry: false,
  });
  function lookup(id: string) {
    void setRegistrationId(id);
    if (user) rememberRegistration(user.id, id);
  }
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Đăng ký & biên lai"
        description="Thu học phí cho đăng ký nháp, mở lại bill hoặc biên lai của đăng ký đã hoàn tất."
      />
      <RegistrationTotals />
      <LivePaymentHistory
        onOpen={(id) => void setRegistrationId(id)}
        searchAction={(search) =>
          search.length >= MIN_LOOKUP_LENGTH &&
          idSchema.safeParse({ id: search }).success ? (
            <Button
              variant="outline"
              className="shrink-0"
              isLoading={order.isFetching && registrationId === search}
              onClick={() => lookup(search)}
            >
              Mở theo mã đăng ký
            </Button>
          ) : null
        }
        recent={{
          orders: queries.flatMap((query) => (query.data ? [query.data] : [])),
          isPending: queries.some((query) => query.isPending),
          failedIds: history
            .filter((_, index) => queries[index]?.isError)
            .map((entry) => entry.id),
        }}
      />
      <Sheet
        open={!!registrationId}
        onOpenChange={(open) => {
          if (!open) void setRegistrationId(null);
        }}
      >
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-2xl"
          data-registration-sheet
          showCloseButton={false}
        >
          <SheetCloseButton label="Đóng đăng ký" />
          <SheetHeader className="pr-12">
            <SheetTitle>
              {order.data
                ? `${order.data.studentFullName} · ${order.data.class.name}`
                : "Đăng ký"}
            </SheetTitle>
            <SheetDescription className="break-all">
              {order.data
                ? `${ORDER_STATUS_TEXT[order.data.status]} · Mã đăng ký ${order.data.id}`
                : `Mã đăng ký ${registrationId ?? ""}`}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <ApiFeedback
              error={order.error}
              retry={() => void order.refetch()}
            />
            {registrationId && order.isPending && <p>Đang tải đăng ký…</p>}
            {order.data && (
              <RegistrationBillPanel
                key={order.data.id}
                registrationId={order.data.id}
              />
            )}
            {order.data?.status === "DRAFT" && (
              <Button
                variant="outline"
                render={
                  <Link
                    href={`${ROUTES.STAFF.ENROLLMENT_NEW}?${new URLSearchParams({ registrationId: order.data.id })}`}
                  />
                }
              >
                Mở đăng ký để chọn lại lớp hoặc hủy bill
              </Button>
            )}
            <ApiFeedback
              error={receipt.error}
              retry={() => void receipt.refetch()}
            />
            {receipt.data && order.data?.status === "COMPLETED" && (
              <RegistrationReceipt receipt={receipt.data} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

/** Chip tổng hợp: đơn chờ thu và đơn đã thu, kèm tổng tiền (dùng chung với Dashboard Nhân viên). */
function RegistrationTotals() {
  const pending = useLiveQuery(["staff-dashboard", "pending"], (signal) =>
    readPendingRegistrations(signal),
  );
  const completed = useLiveQuery(["staff-dashboard", "completed"], (signal) =>
    readCompletedSummary(signal),
  );
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      <Badge variant="warning" className="h-auto px-3 py-1 text-sm">
        {pending.data
          ? `${pending.data.count} chờ thu · ${money(pending.data.amount)}`
          : pending.isError
            ? "Chưa tải được đơn chờ thu"
            : "Đang tải đơn chờ thu…"}
      </Badge>
      <Badge variant="success" className="h-auto px-3 py-1 text-sm">
        {completed.data
          ? `${completed.data.count} hoàn tất · ${money(completed.data.amount)}`
          : completed.isError
            ? "Chưa tải được đơn hoàn tất"
            : "Đang tải đơn hoàn tất…"}
      </Badge>
    </div>
  );
}

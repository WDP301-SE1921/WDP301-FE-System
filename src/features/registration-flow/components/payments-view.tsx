"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { registrationApi } from "../api";
import { recentRegistrations, rememberRegistration } from "../storage";
import { ApiFeedback, FieldError } from "./api-feedback";
import { RegistrationReceipt } from "./registration-receipt";
import { RegistrationBillPanel } from "@/features/billing/components/registration-bill-panel";
import { LivePaymentHistory } from "@/features/directory/components/payment-history";

const idSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Nhập mã đăng ký.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Mã đăng ký không hợp lệ."),
});
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
  const [lookupId, setLookupId] = useState(registrationId ?? "");
  const form = useForm<{ id: string }>({
    resolver: zodResolver(idSchema),
    defaultValues: { id: registrationId ?? "" },
  });
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
  async function lookup(input: { id: string }) {
    setLookupId(input.id);
    await setRegistrationId(input.id);
    if (user) rememberRegistration(user.id, input.id);
  }
  return (
    <PageContainer>
      <PageHeader
        title="Đăng ký và biên lai học phí"
        description="Danh sách đăng ký và thanh toán tại trung tâm. Tra cứu mã để mở bill hoặc biên lai."
      />
      <LivePaymentHistory
        onOpen={(id) => {
          form.setValue("id", id);
          void setRegistrationId(id);
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Tra cứu mã đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            noValidate
            onSubmit={form.handleSubmit(lookup)}
          >
            <Label htmlFor="payment-registration-id">Mã đăng ký</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input id="payment-registration-id" {...form.register("id")} />
              <Button
                type="submit"
                isLoading={order.isFetching && lookupId === registrationId}
              >
                Tra cứu
              </Button>
            </div>
            <FieldError message={form.formState.errors.id?.message} />
          </form>
        </CardContent>
      </Card>
      <ApiFeedback error={order.error} retry={() => void order.refetch()} />
      {registrationId && order.isPending && <p>Đang tải đăng ký…</p>}
      {order.data && (
        <RegistrationBillPanel
          key={order.data.id}
          registrationId={order.data.id}
        />
      )}
      {order.data?.status === "DRAFT" && (
        <div>
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
        </div>
      )}
      <ApiFeedback error={receipt.error} retry={() => void receipt.refetch()} />
      {receipt.data && order.data?.status === "COMPLETED" && (
        <RegistrationReceipt receipt={receipt.data} />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký gần đây trong phiên này</CardTitle>
          <CardDescription>
            Danh sách trên thiết bị này. Tra cứu bằng mã để mở đăng ký từ phiên
            hoặc thiết bị khác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!history.length && (
            <p className="text-sm text-muted-foreground">
              Chưa có đăng ký trong phiên làm việc.
            </p>
          )}
          {queries.map((query, index) => (
            <div
              key={history[index].id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-medium">
                  {query.data
                    ? `${query.data.studentFullName} · ${query.data.class.name}`
                    : history[index].id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {query.data?.status === "COMPLETED"
                    ? "Đã thu tiền"
                    : query.data?.status === "DRAFT"
                      ? "Bản nháp"
                      : query.data?.status === "CANCELLED"
                        ? "Đã hủy"
                        : query.isPending
                          ? "Đang tải…"
                          : "Chưa tải được trạng thái"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("id", history[index].id);
                  void setRegistrationId(history[index].id);
                }}
              >
                Mở đăng ký
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

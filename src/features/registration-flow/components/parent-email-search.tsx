"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registrationApi } from "../api";
import { ApiFeedback } from "./api-feedback";

export const PARENT_SEARCH_DEBOUNCE_MS = 400;

export function ParentEmailSearch({
  value,
  onChange,
  onSelect,
  disabled = false,
  id = "parent-email-search",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (email: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const normalized = value.trim().toLowerCase();
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebounced(normalized),
      PARENT_SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [normalized]);
  const query = useQuery({
    queryKey: ["parent-email-suggestions", debounced],
    queryFn: ({ signal }) => registrationApi.searchParents(debounced, signal),
    enabled:
      open &&
      !disabled &&
      debounced.length >= 2 &&
      debounced.length <= 255 &&
      debounced === normalized,
    retry: false,
    staleTime: 0,
  });
  const current = debounced === normalized;
  const show = open && normalized.length >= 2 && normalized.length <= 255;
  return (
    <div className="space-y-3">
      <Label htmlFor={id}>Tìm email phụ huynh</Label>
      <Input
        id={id}
        type="text"
        inputMode="email"
        autoComplete="off"
        maxLength={255}
        placeholder="Gõ ít nhất 2 ký tự email…"
        value={value}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        aria-controls={show ? `${id}-results` : undefined}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        onChange={(event) => {
          setOpen(true);
          onChange(event.target.value);
        }}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        Gõ từ 2 ký tự, chọn đúng tài khoản trong danh sách rồi chọn hồ sơ con có
        sẵn.
      </p>
      {show && (
        <div
          id={`${id}-results`}
          className="space-y-2 rounded-xl border border-border p-3"
        >
          {(!current || query.isFetching) && (
            <p role="status" className="text-sm text-muted-foreground">
              Đang tìm phụ huynh…
            </p>
          )}
          {current && (
            <ApiFeedback
              error={query.error}
              retry={() => void query.refetch()}
            />
          )}
          {current && query.isSuccess && !query.data.length && (
            <p role="status" className="text-sm text-muted-foreground">
              Không có tài khoản khớp. Nếu chưa có tài khoản, phụ huynh tải app,
              tự đăng ký và tạo hồ sơ con.
            </p>
          )}
          {current &&
            !query.isFetching &&
            query.data?.map((parent) => (
              <Button
                key={parent.id}
                variant="ghost"
                type="button"
                disabled={disabled || parent.status !== "ACTIVE"}
                className="h-auto w-full justify-start rounded-xl px-3 py-3 text-left whitespace-normal"
                onClick={() => {
                  setOpen(false);
                  onSelect(parent.email);
                }}
              >
                <span className="min-w-0">
                  <span className="block break-all font-medium">
                    {parent.email}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {parent.displayName || "Phụ huynh"}
                    {parent.status !== "ACTIVE" ? " · Tài khoản đã khóa" : ""}
                  </span>
                </span>
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

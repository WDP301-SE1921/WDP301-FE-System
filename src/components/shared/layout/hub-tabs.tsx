"use client";

import { useMemo } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHubTab } from "@/hooks/use-hub-tab";

export interface HubTabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Thanh tab của một màn gộp, giữ tab trên URL (`?tab=`). Đổi tab thì xóa các query riêng của
 * tab cũ (`resetKeys`) để bộ lọc, phân trang, Sheet của tab mới bắt đầu sạch.
 */
export function HubTabs<T extends string>({
  items,
  ariaLabel,
  resetKeys = [],
}: {
  items: HubTabItem<T>[];
  ariaLabel: string;
  resetKeys?: readonly string[];
}) {
  const values = items.map((item) => item.value);
  const [tab, setTab] = useHubTab(values);
  const resetKey = resetKeys.join(",");
  const resetParsers = useMemo(
    () =>
      Object.fromEntries(
        resetKey
          .split(",")
          .filter(Boolean)
          .map((key) => [key, parseAsString]),
      ),
    [resetKey],
  );
  const [, reset] = useQueryStates(resetParsers);
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        const next = values.find((candidate) => candidate === value);
        if (!next) return;
        void reset(
          Object.fromEntries(Object.keys(resetParsers).map((key) => [key, null])),
        );
        void setTab(next);
      }}
    >
      <TabsList aria-label={ariaLabel} className="h-auto flex-wrap justify-start">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
            {item.count !== undefined && (
              <Badge variant="neutral" className="ml-1.5 h-5 px-2">
                {item.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

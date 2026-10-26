"use client";

import * as React from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusTabOption {
  value: string;
  label: string;
  count?: number;
}

export interface StatusTabsProps {
  options: StatusTabOption[];
  paramKey?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function StatusTabs({
  options,
  paramKey = "status",
  defaultValue = "all",
  onChange,
  className,
}: StatusTabsProps) {
  const [activeTab, setActiveTab] = useQueryState(
    paramKey,
    parseAsString.withDefault(defaultValue),
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value === defaultValue ? null : value);
    onChange?.(value);
  };

  return (
    <Tabs
      value={activeTab || defaultValue}
      onValueChange={(val) => handleTabChange(val as string)}
      className={cn("min-w-0", className)}
    >
      <TabsList
        aria-label="Lọc theo trạng thái"
        className="max-w-full flex-wrap justify-start bg-muted/60 p-1 rounded-2xl group-data-horizontal/tabs:h-auto sm:rounded-full"
      >
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className="h-auto min-h-9 flex-none rounded-full px-3.5 py-1 text-xs gap-1.5 font-medium data-active:bg-background data-active:shadow-xs motion-reduce:transition-none"
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <Badge
                variant={activeTab === opt.value ? "default" : "secondary"}
                className="px-1.5 py-0 text-[10px] h-4 rounded-full"
              >
                {opt.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export { StatusTabs };

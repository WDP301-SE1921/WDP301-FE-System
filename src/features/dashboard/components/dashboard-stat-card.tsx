import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatCard({
  label,
  value,
  note,
  icon,
  tone = "orange",
  trend,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ReactNode;
  tone?: "orange" | "amber" | "green" | "purple" | "teal" | "blue";
  trend?: number[];
}) {
  return (
    <Card className="relative min-w-0 overflow-hidden p-0">
      <CardContent className="flex min-h-32 items-start gap-3 p-5">
        <span
          data-tone={tone}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-6"
        >
          {icon}
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-5">{label}</p>
          <p className="break-words text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
      </CardContent>
      {trend && trend.length > 1 && (
        <svg
          viewBox="0 0 100 40"
          className="pointer-events-none absolute right-4 bottom-4 h-10 w-24 text-primary/60"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            points={trend
              .map(
                (point, index) =>
                  `${(index * 100) / (trend.length - 1)},${36 - (point * 32) / Math.max(1, ...trend)}`,
              )
              .join(" ")}
          />
        </svg>
      )}
    </Card>
  );
}

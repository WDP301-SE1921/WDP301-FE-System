"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ColumnDatum {
  key: string;
  /** Nhãn trục ngang (ngắn). */
  label: string;
  /** Nhãn đầy đủ trong tooltip và bảng. */
  title?: string;
  value: number;
}

const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Biểu đồ cột một chuỗi, một trục. Rê/focus cột để xem số; nút chuyển sang bảng cho người
 * không xem được biểu đồ. Màu theo token `--primary` nên tự đổi theo theme.
 */
export function ColumnChart({
  data,
  ariaLabel,
  valueLabel,
  format,
  labelEvery = 1,
}: {
  data: ColumnDatum[];
  ariaLabel: string;
  /** Tên cột số trong bảng (vd. "Học phí"). */
  valueLabel: string;
  format: (value: number) => string;
  /** Chỉ hiện nhãn trục ngang mỗi N cột khi dữ liệu dày. */
  labelEvery?: number;
}) {
  const [showTable, setShowTable] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((item) => item.value));
  const width = 640,
    height = 160,
    gap = 2,
    step = width / Math.max(1, data.length),
    bar = Math.max(4, Math.min(36, step * 0.6) - gap);
  const focus = active === null ? null : data[active];
  return (
    <div className="space-y-2">
      {showTable ? (
        <div className="max-h-56 overflow-auto rounded-xl border border-border">
          <Table>
            <TableCaption className="sr-only">{ariaLabel}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Mốc</TableHead>
                <TableHead className="text-right">{valueLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.key}>
                  <TableCell>{item.title ?? item.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {format(item.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="relative flex gap-2">
          <div className="flex h-40 w-10 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
            {[max, max / 2, 0].map((value, index) => (
              <span key={index}>{value > 0 ? compact.format(value) : "0"}</span>
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="block h-40 w-full overflow-visible"
            role="img"
            aria-label={`${ariaLabel}. Bấm "Xem dạng bảng" để đọc số liệu.`}
          >
            {[0, height / 2, height].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                className="stroke-border"
                strokeDasharray={y === height ? undefined : "3 4"}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {data.map((item, index) => {
              const h = (item.value / max) * height;
              const x = step * index + (step - bar) / 2;
              const r = Math.min(4, h / 2, bar / 2);
              const y = height - h;
              return (
                <g
                  key={item.key}
                  tabIndex={0}
                  role="presentation"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                >
                  {/* Vùng bắt chuột cao hết khung để cột thấp vẫn dễ rê. */}
                  <rect
                    x={step * index}
                    y={0}
                    width={step}
                    height={height}
                    fill="transparent"
                  />
                  {h > 0 && (
                    <path
                      d={`M${x},${height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + bar - r},${y} Q${x + bar},${y} ${x + bar},${y + r} L${x + bar},${height} Z`}
                      fill="var(--primary)"
                      opacity={active === null || active === index ? 1 : 0.45}
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div
            className="grid text-center text-[11px] text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {data.map((item, index) => (
              <span key={item.key} className="truncate">
                {index % labelEvery === 0 ? item.label : ""}
              </span>
            ))}
          </div>
          </div>
          {focus && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md"
              style={{
                left: `calc(2.5rem + (100% - 2.5rem) * ${(active + 0.5) / Math.max(1, data.length)})`,
              }}
            >
              <p className="text-muted-foreground">
                {focus.title ?? focus.label}
              </p>
              <p className="font-semibold tabular-nums">{format(focus.value)}</p>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button
          size="xs"
          variant="ghost"
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
        >
          {showTable ? "Xem biểu đồ" : "Xem dạng bảng"}
        </Button>
      </div>
    </div>
  );
}

/** Thanh ngang một chuỗi (vd. học sinh theo khối, lấp chỗ theo lớp). */
export function HorizontalBars({
  rows,
  format,
  max,
}: {
  rows: { key: string; label: string; value: number; note?: string }[];
  format: (value: number) => string;
  /** Mặc định là giá trị lớn nhất; truyền 100 cho tỉ lệ %. */
  max?: number;
}) {
  const top = Math.max(1, max ?? Math.max(0, ...rows.map((row) => row.value)));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {format(row.value)}
              {row.note ? ` · ${row.note}` : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(100, (row.value / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useId } from "react";
import { money } from "@/features/registration-flow/calendar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalyticsBucket, AnalyticsTrendPoint } from "../types";

function periodLabel(period: string, bucket: AnalyticsBucket) {
  const [year, month, day] = period.split("-");
  return bucket === "MONTH" ? `T${Number(month)}/${year}` : `${day}/${month}`;
}

export function RevenueChart({
  points,
  bucket,
}: {
  points: AnalyticsTrendPoint[];
  bucket: AnalyticsBucket;
}) {
  const gradient = useId();
  const maxRevenue = Math.max(
    1,
    ...points.map((point) => point.confirmedRevenue),
  );
  const maxSessions = Math.max(
    1,
    ...points.map((point) => point.completedSessions),
  );
  const width = 660,
    height = 156,
    step = width / Math.max(1, points.length);
  const scale = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const coordinates = points.map((point, index) => ({
    x: step * (index + 0.5),
    y: height - (point.completedSessions / maxSessions) * (height - 10),
  }));
  return (
    <div className="space-y-2">
      <div className="flex h-40 gap-2">
        <div className="flex w-10 shrink-0 flex-col justify-between pb-7 text-right text-[11px] tabular-nums text-muted-foreground">
          {[maxRevenue, maxRevenue / 2, 0].map((value, index) => (
            <span key={index}>{value > 1 ? scale.format(value) : "0"}</span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height + 30}`}
          className="h-full min-w-0 flex-1"
          role="img"
          aria-label="Doanh thu học phí đã xác nhận theo tháng và số buổi hoàn thành. Số liệu chi tiết ở bảng bên dưới."
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--chart-1)" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {[0, height / 2, height].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              className="stroke-border"
            />
          ))}
          {points.map((point, index) => (
            <g key={point.period}>
              <rect
                x={step * index + step * 0.25}
                y={height - (point.confirmedRevenue / maxRevenue) * height}
                width={step * 0.5}
                height={(point.confirmedRevenue / maxRevenue) * height}
                rx="4"
                fill={`url(#${gradient})`}
              >
                <title>
                  {periodLabel(point.period, bucket)}:{" "}
                  {money(point.confirmedRevenue)}
                </title>
              </rect>
              <text
                x={step * (index + 0.5)}
                y={height + 24}
                textAnchor="middle"
                className="fill-muted-foreground text-xs"
              >
                {periodLabel(point.period, bucket)}
              </text>
            </g>
          ))}
          <polyline
            points={coordinates.map(({ x, y }) => `${x},${y}`).join(" ")}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth="2.5"
          />
          {coordinates.map(({ x, y }, index) => (
            <circle
              key={points[index].period}
              cx={x}
              cy={y}
              r="5"
              fill="var(--chart-2)"
              stroke="var(--card)"
              strokeWidth="1.5"
            >
              <title>
                {periodLabel(points[index].period, bucket)}:{" "}
                {points[index].completedSessions} buổi hoàn thành
              </title>
            </circle>
          ))}
        </svg>
        <div className="flex w-6 shrink-0 flex-col justify-between pb-7 text-[11px] tabular-nums text-muted-foreground">
          {[maxSessions, Math.round(maxSessions / 2), 0].map((value, index) => (
            <span key={index}>{value}</span>
          ))}
        </div>
      </div>
      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer rounded-xl px-2 py-1 hover:bg-muted">
          Xem số liệu sáu tháng
        </summary>
        <div className="max-h-40 overflow-auto">
          <Table>
            <TableCaption className="sr-only">
              Doanh thu và buổi học đã hoàn thành
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tháng</TableHead>
                <TableHead className="text-right">Học phí</TableHead>
                <TableHead className="text-right">Buổi hoàn thành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point) => (
                <TableRow key={point.period}>
                  <TableCell>{periodLabel(point.period, bucket)}</TableCell>
                  <TableCell className="text-right">
                    {money(point.confirmedRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {point.completedSessions}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}

export function StudentDistributionChart({
  students,
}: {
  students: { grade: number }[];
}) {
  const knownGrades = new Set(students.map((student) => student.grade));
  const grades = [...knownGrades].sort((left, right) => left - right);
  const segments = grades.map((grade, index) => ({
    label: `Khối ${grade}`,
    value: students.filter((student) => student.grade === grade).length,
    color: `var(--chart-${(index % 5) + 1})`,
  }));
  const total = students.length,
    circumference = 2 * Math.PI * 68;
  return (
    <div className="flex min-h-44 flex-wrap items-center justify-center gap-5">
      <div className="relative size-44 shrink-0">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label={`Phân bố ${total} hồ sơ học sinh hoạt động: ${segments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}`}
        >
          <circle
            cx="90"
            cy="90"
            r="68"
            fill="none"
            strokeWidth="28"
            className="stroke-muted"
          />
          {segments.map((segment, index) => {
            const length = total ? (segment.value / total) * circumference : 0,
              currentOffset = total
                ? (segments
                    .slice(0, index)
                    .reduce((sum, previous) => sum + previous.value, 0) /
                    total) *
                  circumference
                : 0;
            return (
              <circle
                key={segment.label}
                cx="90"
                cy="90"
                r="68"
                fill="none"
                stroke={segment.color}
                strokeWidth="28"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 90 90)"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-2xl font-semibold tabular-nums">
            {total}
          </strong>
          <span className="text-xs text-muted-foreground">Hồ sơ học sinh</span>
        </div>
      </div>
      <dl className="min-w-32 flex-1 space-y-3 text-sm">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-4"
          >
            <dt className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ background: segment.color }}
              />
              {segment.label}
            </dt>
            <dd
              className="font-semibold tabular-nums"
              title={`${segment.value} hồ sơ`}
            >
              {Math.round((segment.value / total) * 100)}%
            </dd>
          </div>
        ))}
        {total === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có hồ sơ đang hoạt động.
          </p>
        )}
      </dl>
    </div>
  );
}

export function ActivityChart({
  actions,
  total,
}: {
  actions: string[];
  total: number;
}) {
  const categories = [
    "Đóng học phí",
    "Đăng ký",
    "Nghỉ học",
    "Dạy thay",
    "Khác",
  ];
  const counts = [0, 0, 0, 0, 0];
  for (const action of actions) {
    const index =
      action === "REGISTRATION_CONFIRM_PAYMENT"
        ? 0
        : action.startsWith("REGISTRATION_")
          ? 1
          : action.startsWith("LEAVE_") || action === "STUDENT_END_STUDY"
            ? 2
            : action === "SESSION_SUBSTITUTE_ASSIGNED"
              ? 3
              : 4;
    counts[index]++;
  }
  const max = Math.max(1, ...counts);
  return (
    <div className="space-y-2">
      <svg
        viewBox="0 0 400 190"
        className="h-44 w-full"
        role="img"
        aria-label={categories
          .map((category, index) => `${category}: ${counts[index]}`)
          .join(", ")}
      >
        {[48, 96, 144].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="400"
            y2={y}
            className="stroke-border"
          />
        ))}
        {categories.map((category, index) => {
          const height = (counts[index] / max) * 116;
          return (
            <g key={category}>
              <rect
                x={index * 80 + 14}
                y={144 - height}
                width="52"
                height={height}
                rx="7"
                fill={`var(--chart-${index + 1})`}
              />
              <text
                x={index * 80 + 40}
                y={Math.max(14, 134 - height)}
                textAnchor="middle"
                className="fill-foreground text-sm font-semibold"
              >
                {counts[index]}
              </text>
              <text
                x={index * 80 + 40}
                y="166"
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {category}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-muted-foreground">
        {total > actions.length
          ? `${actions.length} hoạt động mới nhất trong ${total} sự kiện của kỳ`
          : `${total} sự kiện ghi nhận trong kỳ`}
      </p>
    </div>
  );
}

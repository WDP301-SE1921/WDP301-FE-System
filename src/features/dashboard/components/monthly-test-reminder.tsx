"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { MonthlyTestClass } from "@/features/assignments/monthly-test";

const VISIBLE = 5;

/** Nhắc nhẹ giáo viên: lớp chưa có bài kiểm tra trong tháng. Chỉ nhắc, không chặn (Q5). */
export function MonthlyTestReminder({
  classes,
  today,
}: {
  classes: MonthlyTestClass[];
  today: string;
}) {
  const [all, setAll] = useState(false);
  if (!classes.length) return null;
  const month = Number(today.slice(5, 7));
  const rows = all ? classes : classes.slice(0, VISIBLE);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhắc bài kiểm tra tháng {month}</CardTitle>
        <CardDescription>
          Các lớp chưa có bài kiểm tra trong tháng này.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
            >
              <span className="text-sm">
                {item.name}: tháng {month} chưa có bài kiểm tra
              </span>
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link
                    href={`${ROUTES.TEACHER.ASSIGNMENT_NEW}?classId=${encodeURIComponent(item.id)}&kind=TEST`}
                  />
                }
              >
                Tạo bài kiểm tra
              </Button>
            </li>
          ))}
        </ul>
        {classes.length > VISIBLE && (
          <Button
            variant="link"
            className="mt-2 h-auto p-0"
            onClick={() => setAll(!all)}
          >
            {all ? "Thu gọn" : `Xem thêm ${classes.length - VISIBLE} lớp`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

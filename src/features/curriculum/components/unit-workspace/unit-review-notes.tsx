"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitReviewNotes({ ws }: { ws: UnitWorkspace }) {
  const { unit } = ws;
  if (!unit || !(unit.reviewNote || unit.technicalReviewNote)) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhận xét và nội dung cần sửa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unit.technicalReviewNote && (
          <div>
            <p className="text-sm font-medium">Giáo viên duyệt nội dung</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {unit.technicalReviewNote}
            </p>
          </div>
        )}
        {unit.reviewNote && (
          <div>
            <p className="text-sm font-medium">Quản lý</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {unit.reviewNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

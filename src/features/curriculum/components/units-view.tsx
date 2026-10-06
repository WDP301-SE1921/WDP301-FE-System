"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { useCurriculumUnits } from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";

export function CurriculumUnitsView({ programId }: { programId?: string }) {
  const router = useRouter();
  const role = useCurrentRole();
  const units = useCurriculumUnits(programId);
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [isCreating, setIsCreating] = useState(false);
  const rows =
    units.data?.filter((unit) =>
      `${unit.title} ${unit.track.subject} ${unit.track.grade}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
    ) ?? [];
  return (
    <PageContainer>
      <PageHeader
        title="Thiết kế giáo trình"
        description="Soạn học phần theo môn và khối, bài học theo thứ tự và kiểm tra mỗi tháng."
        actions={
          role === "curriculum_designer" && (
            <Button onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? "Đóng form" : "Tạo học phần"}
            </Button>
          )
        }
      />
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Học phần mới</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitForm
              programId={programId}
              onSaved={(id) => router.push(ROUTES.MANAGER.CURRICULUM_UNIT(id))}
            />
          </CardContent>
        </Card>
      )}
      <Input
        aria-label="Tìm học phần"
        placeholder="Tìm học phần, môn hoặc khối…"
        value={search}
        onChange={(event) => void setSearch(event.target.value)}
      />
      <ApiFeedback error={units.error} retry={() => void units.refetch()} />
      {units.isPending && <p>Đang tải học phần…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{unit.title}</CardTitle>
                <Badge
                  variant={unit.status === "APPROVED" ? "success" : "secondary"}
                >
                  {unit.status === "APPROVED" ? "Đã duyệt" : "Bản nháp"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                {unit.track.subject} · Khối {unit.track.grade} · Phiên bản{" "}
                {unit.version}
              </p>
              <p className="text-sm text-muted-foreground">
                {unit.fromDate.slice(0, 10)} → {unit.toDate.slice(0, 10)} ·{" "}
                {unit._count?.lessons ?? 0} nội dung
              </p>
              <Button
                variant="outline"
                render={<Link href={ROUTES.MANAGER.CURRICULUM_UNIT(unit.id)} />}
              >
                Xem học phần
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {units.isSuccess && !rows.length && (
        <p className="rounded-2xl border border-border p-6 text-center text-muted-foreground">
          Chưa có học phần phù hợp.
        </p>
      )}
    </PageContainer>
  );
}

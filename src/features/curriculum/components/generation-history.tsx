"use client";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { curriculumApi } from "../api";
import { sessionTime } from "../session-format";
import { calendarDateLabel } from "@/lib/calendar-date";

export function GenerationHistory({ classId }: { classId: string }) {
  const [id, setId] = useQueryState(
    "generation",
    parseAsString.withDefault(""),
  );
  const list = useQuery({
    queryKey: ["academic-generations", classId],
    queryFn: ({ signal }) => curriculumApi.generations(classId, signal),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["academic-generation", id],
    queryFn: ({ signal }) => curriculumApi.generation(id, signal),
    enabled: !!id,
    retry: false,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Giáo trình đã áp dụng và lịch sử sinh lịch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncBoundary
          isLoading={list.isPending}
          isError={list.isError}
          error={list.error}
          onRetry={() => void list.refetch()}
          data={list.data}
          emptyProps={{ title: "Chưa có đợt sinh lịch" }}
        >
          {list.data?.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-medium">{row.unit?.title ?? "Giáo trình"}</p>
                <p className="text-sm text-muted-foreground">
                  {calendarDateLabel(row.fromDate.slice(0, 10))} –{" "}
                  {calendarDateLabel(row.toDate.slice(0, 10))} ·{" "}
                  {row._count?.sessions ?? 0} buổi
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void setId(id === row.id ? null : row.id)}
              >
                Xem đợt sinh
              </Button>
            </div>
          ))}
        </AsyncBoundary>
        {id && (
          <AsyncBoundary
            isLoading={detail.isPending}
            isError={detail.isError}
            error={detail.error}
            onRetry={() => void detail.refetch()}
          >
            {detail.data?.classId === classId && (
              <div className="space-y-2 rounded-xl bg-muted p-3">
                {detail.data.sessions.map((session) => (
                  <p key={session.id} className="text-sm">
                    {sessionTime(session.startsAt)} →{" "}
                    {sessionTime(session.endsAt)}
                  </p>
                ))}
              </div>
            )}
          </AsyncBoundary>
        )}
      </CardContent>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { CompareTable } from "@/components/shared/display/compare-table";
import { toast } from "@/components/ui/toast";
import { REASON_PRESETS } from "@/constants/reason-presets";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { reasonSchema, requiredId } from "@/lib/validators/web-workflows";
import { dayLabel, timeRange } from "@/lib/session-preview";
import type { SubstituteCandidate } from "@/types/academic-workflows";

const substituteFormSchema = z.object({
  teacherId: requiredId,
  reason: reasonSchema.shape.reason,
});

const teacherName = (
  teacher?: { displayName: string | null; email?: string } | null,
) => teacher?.displayName ?? teacher?.email ?? "Chưa có tên";

/**
 * SRS §3.1, §5.4: only the manager assigns a substitute for one existing session.
 * Dùng trong tab "Dạy thay" của Sheet buổi học (Lịch học). Danh sách ứng viên giữ nguyên điều
 * kiện của BE (đang rảnh giờ này); giáo viên cùng môn với buổi học được đưa lên đầu.
 */
export function SubstituteForm({
  sessionId,
  onDone,
}: {
  sessionId: string;
  onDone?: () => void;
}) {
  const detail = useLiveQuery(["substitute-session", sessionId], (signal) =>
    academicApi.session(sessionId, signal),
  );
  const candidates = useLiveQuery(
    ["substitute-candidates", sessionId],
    (signal) => academicApi.substituteCandidates(sessionId, signal),
  );
  const subject = detail.data?.class.program.subject;
  const teaches = (teacher: SubstituteCandidate) =>
    !!subject && !!teacher.subjects?.includes(subject);
  const sorted = [...(candidates.data ?? [])].sort(
    (a, b) => Number(teaches(b)) - Number(teaches(a)),
  );
  // Chỉ lọc phần hiển thị; danh sách ứng viên vẫn là đúng danh sách BE trả về.
  const [search, setSearch] = useState("");
  const needle = search.trim().toLocaleLowerCase("vi");
  const shown = needle
    ? sorted.filter((teacher) =>
        `${teacher.displayName ?? ""} ${teacher.email}`
          .toLocaleLowerCase("vi")
          .includes(needle),
      )
    : sorted;
  return (
    <AsyncBoundary
      isLoading={detail.isPending || candidates.isPending}
      isError={detail.isError || candidates.isError}
      error={detail.error ?? candidates.error}
      onRetry={() => {
        void detail.refetch();
        void candidates.refetch();
      }}
      data={candidates.data}
      emptyProps={{
        title: "Không có giáo viên rảnh",
        description: "Mọi giáo viên đang hoạt động đều có buổi trùng giờ này.",
      }}
    >
      {detail.data && sorted.length > 6 && (
        <div className="mb-4 space-y-2">
          <Label htmlFor={`${sessionId}-teacher-search`}>Tìm giáo viên rảnh</Label>
          <Input
            id={`${sessionId}-teacher-search`}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tên hoặc email"
          />
          <p className="text-sm text-muted-foreground">
            {shown.length} / {sorted.length} giáo viên
            {subject ? `, người dạy ${subject} ở đầu danh sách` : ""}.
          </p>
        </div>
      )}
      {detail.data && (
        <ApiForm
          schema={substituteFormSchema}
          fields={[
            {
              name: "teacherId",
              label: "Giáo viên rảnh giờ này",
              type: "choices",
              options: shown.map((teacher) => ({
                value: teacher.id,
                label: teacherName(teacher),
                description: teacher.subjects?.length
                  ? `${teaches(teacher) ? "Cùng môn, " : ""}đang dạy ${teacher.subjects.join(", ")}`
                  : teacher.email,
              })),
            },
            {
              name: "reason",
              label: "Lý do",
              type: "reason",
              presets: REASON_PRESETS.substitute,
            },
          ]}
          submitLabel="Xếp dạy thay"
          successMessage={false}
          preview={(values) => {
            const picked = sorted.find((teacher) => teacher.id === values.teacherId);
            const current = teacherName(detail.data.teacher);
            return (
              <CompareTable
                rows={[
                  {
                    label: `Giáo viên buổi ${dayLabel(detail.data.startsAt)}`,
                    before: current,
                    after: picked ? teacherName(picked) : "Chọn giáo viên dạy thay",
                    state: picked ? "changed" : "same",
                  },
                  {
                    label: "Giờ học",
                    before: timeRange(detail.data.startsAt, detail.data.endsAt),
                    after: "Giữ nguyên",
                  },
                  {
                    label: "Bài học, học viên",
                    before: detail.data.lesson?.title ?? "Bài của buổi",
                    after: "Giữ nguyên",
                  },
                  {
                    label: "Các buổi khác của lớp",
                    before: "Theo phân công của lớp",
                    after: "Giữ nguyên",
                  },
                ]}
              />
            );
          }}
          summary={(values) => {
            const picked = sorted.find((teacher) => teacher.id === values.teacherId);
            if (!picked) return "Chọn giáo viên dạy thay để xem thay đổi.";
            return `Chỉ buổi ${dayLabel(detail.data.startsAt)} do ${teacherName(picked)} dạy. Các buổi khác vẫn là ${teacherName(detail.data.teacher)}.`;
          }}
          onSubmit={(value) =>
            academicApi.substitute(sessionId, {
              ...value,
              expectedRevision: detail.data.revision,
            })
          }
          onSuccess={() => {
            toast.success("Đã xếp giáo viên dạy thay cho buổi học.");
            onDone?.();
          }}
        />
      )}
    </AsyncBoundary>
  );
}

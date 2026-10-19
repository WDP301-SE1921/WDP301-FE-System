"use client";
import { z } from "zod";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { toast } from "@/components/ui/toast";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { reasonSchema, requiredId } from "@/lib/validators/web-workflows";

const substituteFormSchema = z.object({
  teacherId: requiredId,
  reason: reasonSchema.shape.reason,
});

/**
 * SRS §3.1, §5.4: only the manager assigns a substitute for one existing session.
 * Dùng trong tab "Dạy thay" của Sheet buổi học (Lịch học).
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
      {detail.data && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Giáo viên hiện tại:{" "}
            {detail.data.teacher?.displayName ?? "chưa có tên"}. Chỉ hiện giáo
            viên đang rảnh giờ này; buổi học, bài học và danh sách học viên được
            giữ nguyên.
          </p>
          <ApiForm
            schema={substituteFormSchema}
            fields={[
              {
                name: "teacherId",
                label: "Giáo viên dạy thay",
                type: "select",
                options: (candidates.data ?? []).map((teacher) => ({
                  value: teacher.id,
                  label: teacher.displayName ?? teacher.email,
                })),
              },
              { name: "reason", label: "Lý do", type: "textarea" },
            ]}
            submitLabel="Xếp dạy thay"
            successMessage={false}
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
        </div>
      )}
    </AsyncBoundary>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { partialFailureMessage } from "@/features/outcomes/two-stage-approval";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitNotices({ ws }: { ws: UnitWorkspace }) {
  const {
    error,
    notice,
    outcomesUnready,
    outcomeSets,
    followUp,
    retryingFollowUp,
    retryFollowUp,
    scheduleOffer,
  } = ws;
  return (
    <>
      <ApiFeedback error={error} />
      {notice && (
        <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm">
          {notice}
        </p>
      )}
      {outcomesUnready && (
        <div className="space-y-2 rounded-xl border border-border bg-muted p-4 text-sm">
          <p>
            {outcomeSets.isError
              ? "Chưa tải được mục tiêu khóa học. Tải lại trước khi duyệt để mục tiêu được duyệt cùng giáo trình."
              : "Đang tải mục tiêu khóa học…"}
          </p>
          {outcomeSets.isError && (
            <Button size="sm" onClick={() => void outcomeSets.refetch()}>
              Tải lại
            </Button>
          )}
        </div>
      )}
      {followUp && (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-border bg-muted p-4 text-sm"
        >
          <p>{partialFailureMessage(followUp.failures)}</p>
          <Button
            size="sm"
            isLoading={retryingFollowUp}
            onClick={() => void retryFollowUp()}
          >
            Thử lại phần mục tiêu
          </Button>
        </div>
      )}
      {scheduleOffer && (
        <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
          {scheduleOffer.count > 0 ? (
            <Button render={<Link href={scheduleOffer.href} />}>
              Tạo lịch học cho {scheduleOffer.count} lớp
            </Button>
          ) : (
            <p>
              {scheduleOffer.allDone
                ? "Mọi lớp đã có buổi học tới hết kỳ."
                : "Chưa có lớp đủ điều kiện. Kiểm tra bước Lớp & giáo viên."}
            </p>
          )}
          {scheduleOffer.excluded && (
            <p className="text-muted-foreground">
              Chưa tạo cho: {scheduleOffer.excluded}.
            </p>
          )}
        </div>
      )}
    </>
  );
}

"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  countUnlinked,
  unlinkedOutcomeLines,
  type UnlinkedOutcomeGroup,
} from "@/lib/outcome-links";

/** Khối vàng nhắc Thiết kế GT gắn bài cho mục tiêu nháp; không chặn thao tác nào. */
export function OutcomeLinkWarning({
  groups,
  onLink,
}: {
  groups: UnlinkedOutcomeGroup[];
  onLink: () => void;
}) {
  const total = countUnlinked(groups);
  const lines = unlinkedOutcomeLines(groups);
  return (
    <Alert variant="warning" role="status" className="space-y-2">
      {lines.length === 1 ? (
        <p>
          Còn {total} mục tiêu chưa gắn bài: {lines[0]}.
        </p>
      ) : (
        <>
          <p>Còn {total} mục tiêu chưa gắn bài:</p>
          <ul className="list-inside list-disc space-y-1">
            {lines.map((line) => (
              <li key={line}>{line}.</li>
            ))}
          </ul>
        </>
      )}
      <p>
        Mỗi mục tiêu cần ít nhất 1 bài thì giáo viên mới duyệt được nội dung bộ
        mục tiêu. Bạn gắn được bất cứ lúc nào, kể cả sau khi giáo trình đã được
        duyệt áp dụng.
      </p>
      <Button size="sm" variant="outline" onClick={onLink}>
        Gắn mục tiêu
      </Button>
    </Alert>
  );
}

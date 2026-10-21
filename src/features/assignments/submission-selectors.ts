import type {
  AssignmentDetail,
  SubmissionRecord,
} from "@/types/academic-workflows";

/** A retry/second attempt is still one student having submitted, never another assigned recipient. */
export function latestSubmissions(submissions: readonly SubmissionRecord[]) {
  const latest = new Map<string, SubmissionRecord>();
  for (const submission of submissions) {
    const current = latest.get(submission.recipientId);
    if (
      !current ||
      submission.attemptNo > current.attemptNo ||
      (submission.attemptNo === current.attemptNo &&
        submission.submittedAt > current.submittedAt)
    )
      latest.set(submission.recipientId, submission);
  }
  return latest;
}

export function submissionSummary(
  assignment: Pick<AssignmentDetail, "recipients">,
  submissions: readonly SubmissionRecord[],
) {
  const latest = latestSubmissions(submissions);
  const own = assignment.recipients.flatMap(
    (recipient) => latest.get(recipient.id) ?? [],
  );
  return {
    assigned: assignment.recipients.length,
    submitted: own.length,
    ungraded: own.filter((item) => !item.grades.length).length,
    draft: own.filter((item) =>
      ["DRAFT", "APPROVED"].includes(item.grades[0]?.status),
    ).length,
    published: own.filter((item) => item.grades[0]?.status === "PUBLISHED")
      .length,
    missing: assignment.recipients.length - own.length,
  };
}

export const ASSIGNMENT_FILTERS = [
  "all",
  "need-grading",
  "open",
  "draft",
  "closed",
] as const;
export type AssignmentFilter = (typeof ASSIGNMENT_FILTERS)[number];

export function matchesAssignmentFilter(
  assignment: { status: string; dueAt: string },
  ungraded: number,
  filter: AssignmentFilter,
  now: number,
) {
  if (filter === "need-grading") return ungraded > 0;
  if (filter === "open")
    return (
      assignment.status === "PUBLISHED" && Date.parse(assignment.dueAt) > now
    );
  if (filter === "draft") return assignment.status === "DRAFT";
  if (filter === "closed") return assignment.status === "CLOSED";
  return true;
}

import { academicApi } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import type {
  AssignmentDetail,
  SubmissionRecord,
} from "@/types/academic-workflows";

export interface AssignmentWorkspaceRow {
  assignment: AssignmentDetail;
  submissions: SubmissionRecord[];
  className: string;
}

/** Existing read APIs have no list counts. Bound detail/submission requests rather than inventing totals. */
export async function readAssignmentWorkspaces(
  signal?: AbortSignal,
): Promise<AssignmentWorkspaceRow[]> {
  const [assignments, classes] = await Promise.all([
    academicApi.assignments(signal),
    registrationApi.classes(),
  ]);
  const rows: AssignmentWorkspaceRow[] = [];
  for (let start = 0; start < assignments.length; start += 4) {
    rows.push(
      ...(await Promise.all(
        assignments.slice(start, start + 4).map(async (summary) => {
          const [assignment, submissions] = await Promise.all([
            academicApi.assignment(summary.id, signal),
            academicApi.submissions(summary.id, signal),
          ]);
          return {
            assignment,
            submissions,
            className:
              classes.find((item) => item.id === assignment.classId)?.name ??
              "Lớp được giao",
          };
        }),
      )),
    );
  }
  return rows;
}

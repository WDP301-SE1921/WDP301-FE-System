import { userFacingMessage } from "@/lib/api/error-message";
import type { OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "./api";
import type { ApprovalRole, SetFailure } from "./two-stage-approval";

/**
 * Duyệt lần lượt từng bộ (giáo viên: `technical-approve`, Quản lý: `approve`). Một bộ lỗi
 * không dừng các bộ sau; trả danh sách bộ lỗi để hiện và thử lại riêng từng bộ.
 */
export async function approveCompanionSets(
  role: ApprovalRole,
  sets: readonly OutcomeSet[],
): Promise<SetFailure[]> {
  const failures: SetFailure[] = [];
  for (const set of sets) {
    try {
      if (role === "teacher") await outcomeApi.technicalApprove(set.id);
      else await outcomeApi.approve(set.id);
    } catch (error) {
      failures.push({
        setId: set.id,
        label: `${set.level} · bản ${set.version}`,
        message: userFacingMessage(error),
      });
    }
  }
  return failures;
}

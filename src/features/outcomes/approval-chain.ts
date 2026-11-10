import { userFacingMessage } from "@/lib/api/error-message";
import type { OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "./api";
import type { SetFailure } from "./two-stage-approval";

/**
 * Giáo viên duyệt lần lượt từng bộ (`technical-approve`, từ BE PR #12 là bước duyệt cuối). Một bộ
 * lỗi không dừng các bộ sau; trả danh sách bộ lỗi để hiện và thử lại riêng từng bộ.
 */
export async function approveCompanionSets(
  sets: readonly OutcomeSet[],
): Promise<SetFailure[]> {
  const failures: SetFailure[] = [];
  for (const set of sets) {
    try {
      await outcomeApi.technicalApprove(set.id);
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

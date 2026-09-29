"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getGradingDetail,
  getGradingQueueCounts,
  getGradingQueueRows,
  getGradingQueueSummary,
  getSubmissionCounts,
  getSubmissionRows,
  type GradingDetail,
  type GradingQueueFilters,
  type GradingQueueRow,
  type GradingQueueSummary,
  type GradingQueueTab,
  type SubmissionCounts,
  type SubmissionRow,
  type SubmissionRowFilters,
} from "@/features/grading/selectors"
import {
  mockBulkApproveHighConfidence,
  mockPublishGrading,
  mockSaveGradingReview,
  type GradingReviewInput,
} from "@/mocks/data/assignments"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useSubmissions(assignmentId: string, filters: SubmissionRowFilters = {}) {
  return useQuery<SubmissionRow[]>({
    queryKey: ["submissions", assignmentId, filters],
    queryFn: () => mockQuery(() => getSubmissionRows(assignmentId, filters)),
    enabled: assignmentId.length > 0,
  })
}

export function useSubmissionCounts(assignmentId: string) {
  return useQuery<SubmissionCounts>({
    queryKey: ["submissions", assignmentId, "counts"],
    queryFn: () => mockQuery(() => getSubmissionCounts(assignmentId)),
    enabled: assignmentId.length > 0,
  })
}

export function useGradingQueue(filters: GradingQueueFilters) {
  return useQuery<GradingQueueRow[]>({
    queryKey: ["grading", "queue", filters],
    queryFn: () => mockQuery(() => getGradingQueueRows(filters)),
  })
}

export function useGradingQueueSummary() {
  return useQuery<GradingQueueSummary>({
    queryKey: ["grading", "queue-summary"],
    queryFn: () => mockQuery(() => getGradingQueueSummary()),
  })
}

export function useGradingQueueCounts(filters: Omit<GradingQueueFilters, "tab"> = {}) {
  return useQuery<Record<GradingQueueTab, number>>({
    queryKey: ["grading", "queue-counts", filters],
    queryFn: () => mockQuery(() => getGradingQueueCounts(filters)),
  })
}

export function useGradingDetail(submissionId: string) {
  return useQuery<GradingDetail | null>({
    queryKey: ["grading", "detail", submissionId],
    queryFn: () => mockQuery(() => getGradingDetail(submissionId)),
    enabled: submissionId.length > 0,
  })
}

function invalidateGradingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["grading"] })
  queryClient.invalidateQueries({ queryKey: ["submissions"] })
  queryClient.invalidateQueries({ queryKey: ["assignments"] })
  queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] })
}

export interface SaveGradingReviewVariables {
  submissionId: string
  input: GradingReviewInput
}

/** Lưu điểm/nhận xét đã chỉnh — chuyển "Đã duyệt", KHÔNG công bố. */
export function useSaveGradingReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: SaveGradingReviewVariables) =>
      mockMutation(variables, ({ submissionId, input }) =>
        mockSaveGradingReview(submissionId, input)
      ),
    onSuccess: () => invalidateGradingQueries(queryClient),
  })
}

export interface PublishGradingVariables {
  submissionId: string
  input?: GradingReviewInput
}

/** Lưu (nếu có chỉnh sửa) rồi công bố kết quả cho phụ huynh/học sinh xem. */
export function usePublishGrading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: PublishGradingVariables) =>
      mockMutation(variables, ({ submissionId, input }) => mockPublishGrading(submissionId, input)),
    onSuccess: () => invalidateGradingQueries(queryClient),
  })
}

/** Duyệt nhanh hàng loạt bài AI tin cậy cao — giữ nguyên điểm AI làm điểm cuối cùng. */
export function useBulkApproveHighConfidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissionIds: string[]) =>
      mockMutation(submissionIds, (ids) => mockBulkApproveHighConfidence(ids)),
    onSuccess: () => invalidateGradingQueries(queryClient),
  })
}

import { z } from "zod"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Zod schema cho form duyệt điểm AI (PROMPT T6B) — form cục bộ ở
 * `grading-detail-view.tsx`, KHÔNG liên quan tới `assignmentFormSchema` (T5B).
 * `scores` là mảng điểm theo đúng thứ tự `GradingDetail.questionRows` — ghép lại
 * với `questionId` ở tầng component trước khi gọi mutation, để form không cần biết
 * `questionId` (tránh phải đăng ký field ẩn cho từng câu).
 */
export const gradingReviewSchema = z.object({
  scores: z.array(z.number().min(0, VALIDATION_MSG.SCORE_MIN)),
  finalComment: z.string().trim(),
})

export type GradingReviewFormInput = z.infer<typeof gradingReviewSchema>

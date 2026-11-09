import { z } from "zod";
import { requiredId } from "./web-workflows";

/** Giới hạn khớp DTO CLO của BE (`academic.dto.ts`). */
const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} cần ít nhất ${min} ký tự.`)
    .max(max, `${label} tối đa ${max} ký tự.`);
const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const outcomeSetCreateSchema = z.object({
  programId: requiredId,
  level: text(2, 100, "Cấp độ"),
  /** Bộ cùng khóa để chép CLO và liên kết bài học; rỗng = bộ mới trống. */
  copyFromId: optionalId,
});

export const outcomeSetUpdateSchema = z.object({
  level: text(2, 100, "Cấp độ"),
});

export const learningOutcomeSchema = z.object({
  code: text(2, 64, "Mã mục tiêu"),
  title: text(2, 255, "Tên mục tiêu"),
  statement: text(12, 5000, "Phát biểu mục tiêu"),
  sourceTitle: text(5, 255, "Tên nguồn"),
  sourceUrl: z
    .string()
    .trim()
    // Khớp BE `@IsUrl`: chỉ http/https.
    .url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: "Đường dẫn nguồn không hợp lệ.",
    })
    .min(12, "Đường dẫn nguồn cần ít nhất 12 ký tự.")
    .max(2000),
  sourceLocator: text(12, 255, "Vị trí trong nguồn"),
  sourceNote: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || undefined),
  required: z.boolean(),
  /** Số phiên bản mục tiêu đang sửa; BE trả REVISION_CONFLICT nếu đã có người sửa trước. Bỏ trống khi tạo mới. */
  expectedRevision: z.number().int().min(1).optional(),
});

export const sourceReviewSchema = z.object({
  sourceLocator: text(12, 255, "Mục/trang nguồn"),
  sourceNote: text(12, 5000, "Giải thích đối chiếu"),
});

export const outcomeChangeRequestSchema = z.object({
  reason: text(1, 2000, "Lý do"),
});

export const lessonOutcomeSchema = z.object({
  outcomeIds: z
    .array(requiredId)
    .refine((value) => new Set(value).size === value.length, "Mục tiêu bị trùng."),
});

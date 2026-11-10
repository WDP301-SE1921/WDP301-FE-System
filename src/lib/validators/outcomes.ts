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

/** Nguồn căn cứ không bắt buộc (B3): để trống thì bỏ qua, có nhập thì kiểm độ dài. */
const optionalText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự.`)
    .optional()
    .refine((value) => !value || value.length >= min, `${label} cần ít nhất ${min} ký tự.`);

export const learningOutcomeSchema = z.object({
  code: text(2, 64, "Mã mục tiêu"),
  title: text(2, 255, "Mục tiêu"),
  /** Để trống thì `outcomeApi.saveOutcome` gửi bằng tên mục tiêu (BE vẫn bắt buộc `statement`). */
  statement: optionalText(2, 5000, "Mô tả chi tiết"),
  sourceTitle: optionalText(2, 255, "Tên nguồn"),
  // Khớp BE `@IsUrl`: chỉ http/https, không đòi độ dài tối thiểu.
  sourceUrl: z
    .string()
    .trim()
    .max(2000, "Đường dẫn nguồn tối đa 2000 ký tự.")
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return (
          (url.protocol === "http:" || url.protocol === "https:") &&
          url.hostname.includes(".")
        );
      } catch {
        return false;
      }
    }, "Đường dẫn nguồn không hợp lệ."),
  sourceLocator: optionalText(2, 255, "Vị trí trong nguồn"),
  sourceNote: z.string().trim().max(5000).optional(),
  required: z.boolean(),
  /** Số phiên bản mục tiêu đang sửa; BE trả REVISION_CONFLICT nếu đã có người sửa trước. Bỏ trống khi tạo mới. */
  expectedRevision: z.number().int().min(1).optional(),
});

/** Form thêm/sửa mục tiêu: `kind` thay cho `required` (hai thẻ Bắt buộc/Mở rộng). */
export const outcomeFormSchema = learningOutcomeSchema
  .omit({ required: true, expectedRevision: true })
  .extend({ kind: z.enum(["required", "optional"]) });

export const sourceReviewSchema = z.object({
  sourceLocator: text(2, 255, "Mục/trang nguồn"),
  sourceNote: text(5, 5000, "Giải thích đối chiếu"),
  /** Số phiên bản mục tiêu lúc mở hộp; BE so lại sau khi khóa dòng. */
  expectedRevision: z.number().int().min(1).optional(),
});

export const outcomeChangeRequestSchema = z.object({
  reason: text(1, 2000, "Lý do"),
});

export const lessonOutcomeSchema = z.object({
  outcomeIds: z
    .array(requiredId)
    .refine((value) => new Set(value).size === value.length, "Mục tiêu bị trùng."),
});

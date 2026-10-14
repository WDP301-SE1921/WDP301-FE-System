import { z } from "zod";

export const ASSIGNMENT_FILE_LIMIT = 5 * 1024 * 1024;
export const ASSIGNMENT_FILE_ACCEPT = ".csv,.docx,.pdf";
export const assignmentImportFileSchema = z.object({
  file: z.custom<FileList>((value) => {
    const files = value as FileList | undefined;
    return (
      files?.length === 1 &&
      files[0].size > 0 &&
      files[0].size <= ASSIGNMENT_FILE_LIMIT &&
      /\.(csv|docx|pdf)$/i.test(files[0].name)
    );
  }, "Chọn một file CSV, DOCX hoặc PDF tối đa 5 MiB."),
});

// Extraction can omit answer keys; teachers complete them in the normal editor.
export const assignmentImportPreviewSchema = z.object({
  fileName: z.string().max(255),
  format: z.enum(["CSV", "DOCX", "PDF"]),
  title: z.string().max(255).optional(),
  instructions: z.string().max(10000).optional(),
  usedAi: z.boolean(),
  warnings: z.array(z.string().max(2000)).max(300),
  questions: z
    .array(
      z.object({
        kind: z.enum(["MULTIPLE_CHOICE", "ESSAY"]),
        prompt: z.string().min(1).max(10000),
        choices: z
          .array(z.string().min(1).max(10000))
          .min(2)
          .max(10)
          .nullable()
          .optional(),
        correctAnswer: z.string().max(10000).optional(),
        rubric: z.string().max(10000).optional(),
        maxScore: z.number().min(0.01).max(100),
      }),
    )
    .min(1)
    .max(100),
});

import { z } from "zod";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const avatarFileSchema = z
  .instanceof(File, { error: "Chọn một ảnh PNG hoặc JPG." })
  .refine((file) => file.size > 0 && file.size <= AVATAR_MAX_BYTES, {
    error: "Ảnh phải có dung lượng lớn hơn 0 và tối đa 5 MiB.",
  })
  .refine(
    (file) =>
      (/\.png$/i.test(file.name) && file.type === "image/png") ||
      (/\.jpe?g$/i.test(file.name) && file.type === "image/jpeg"),
    { error: "Chỉ chọn ảnh PNG hoặc JPG có định dạng hợp lệ." },
  );

export const avatarFormSchema = z.object({ file: avatarFileSchema });

const signedUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
  );
});
const ttl = z.number().int().positive().max(604800);

export const signedAccessUrlSchema = z.object({
  url: signedUrl,
  expiresIn: ttl,
});
export const avatarUrlResponseSchema = z.union([
  signedAccessUrlSchema,
  z.object({ url: z.null(), expiresIn: z.null() }),
]);

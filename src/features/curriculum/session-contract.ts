import { z } from "zod";
import { sessionRescheduleSchema } from "@/lib/validators/curriculum";
/** Session cancel was removed on 19/11/2026: reschedule is the only saved session action. */
export const sessionActionSchema = z.object({
  action: z.literal("reschedule"),
  body: sessionRescheduleSchema,
});
export type SessionAction = z.infer<typeof sessionActionSchema>;
export function vietnamLocalInput(value: string) {
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16);
}
export function utcFromVietnamLocal(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !z.iso.date().safeParse(value.slice(0, 10)).success
  )
    throw new Error("Chọn ngày giờ hợp lệ.");
  return new Date(value + ":00+07:00").toISOString();
}

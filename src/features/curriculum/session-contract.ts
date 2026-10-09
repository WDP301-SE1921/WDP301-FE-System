import { z } from "zod";
import {
  sessionCancelSchema,
  sessionRescheduleSchema,
} from "@/lib/validators/curriculum";
export const sessionActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reschedule"), body: sessionRescheduleSchema }),
  z.object({ action: z.literal("cancel"), body: sessionCancelSchema }),
]);
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

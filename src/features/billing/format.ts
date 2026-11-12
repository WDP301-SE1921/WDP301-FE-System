export function paymentTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

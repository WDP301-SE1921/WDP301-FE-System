import { apiRequest } from "@/lib/api/client";

export interface PushSettings {
  enabled: boolean;
  publicKey: string;
}

export interface BrowserPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const pushApi = {
  settings: (signal?: AbortSignal) =>
    apiRequest<PushSettings>("push/public-key", { signal }),
  save: (subscription: BrowserPushSubscription) =>
    apiRequest<{ subscribed: boolean }>("push/subscriptions", {
      method: "POST",
      body: subscription,
    }),
  remove: (endpoint: string) =>
    apiRequest<{ subscribed: boolean }>("push/subscriptions", {
      method: "DELETE",
      body: { endpoint },
    }),
};

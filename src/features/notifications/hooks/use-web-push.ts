"use client";

import { useCallback, useEffect, useState } from "react";
import { pushApi, type BrowserPushSubscription } from "../push-api";

export type WebPushState =
  "loading" | "unavailable" | "blocked" | "ready" | "subscribed";

function supportsWebPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function subscriptionPayload(
  subscription: PushSubscription,
): BrowserPushSubscription | null {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

async function registration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export function useWebPush() {
  const [state, setState] = useState<WebPushState>(() =>
    supportsWebPush() ? "loading" : "unavailable",
  );
  const [publicKey, setPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!supportsWebPush()) {
      return;
    }
    const controller = new AbortController();
    void pushApi
      .settings(controller.signal)
      .then(async (settings) => {
        if (!settings.enabled || !settings.publicKey) {
          setState("unavailable");
          return;
        }
        setPublicKey(settings.publicKey);
        if (Notification.permission === "denied") {
          setState("blocked");
          return;
        }
        const serviceWorker = await registration();
        const current = await serviceWorker.pushManager.getSubscription();
        if (current) {
          const payload = subscriptionPayload(current);
          if (payload) await pushApi.save(payload);
          setState("subscribed");
        } else {
          setState("ready");
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason);
          setState("unavailable");
        }
      });
    return () => controller.abort();
  }, []);

  const enable = useCallback(async () => {
    if (!publicKey || busy) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "ready");
        return;
      }
      const serviceWorker = await registration();
      const subscription =
        (await serviceWorker.pushManager.getSubscription()) ??
        (await serviceWorker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(publicKey),
        }));
      const payload = subscriptionPayload(subscription);
      if (!payload) throw new Error("PUSH_SUBSCRIPTION_INVALID");
      await pushApi.save(payload);
      setState("subscribed");
    } catch (reason) {
      setError(reason);
      setState(Notification.permission === "denied" ? "blocked" : "ready");
    } finally {
      setBusy(false);
    }
  }, [busy, publicKey]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const serviceWorker = await registration();
      const subscription = await serviceWorker.pushManager.getSubscription();
      if (subscription) {
        await pushApi.remove(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("ready");
    } catch (reason) {
      setError(reason);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { state, busy, error, enable, disable };
}

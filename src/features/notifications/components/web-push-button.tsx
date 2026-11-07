"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api/client";
import { useWebPush } from "../hooks/use-web-push";

export function WebPushButton() {
  const push = useWebPush();
  if (push.state === "unavailable" || push.state === "loading") return null;
  if (push.state === "blocked") {
    return (
      <p className="text-xs text-muted-foreground">
        Trình duyệt đang chặn thông báo ngoài ứng dụng. Hãy bật lại trong cài
        đặt trang web.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={push.state === "subscribed" ? "outline" : "default"}
        size="sm"
        isLoading={push.busy}
        onClick={() =>
          void (push.state === "subscribed" ? push.disable() : push.enable())
        }
        leftIcon={<HugeiconsIcon icon={Notification02Icon} />}
      >
        {push.state === "subscribed"
          ? "Tắt thông báo ngoài ứng dụng"
          : "Bật thông báo ngoài ứng dụng"}
      </Button>
      {Boolean(push.error) && (
        <p className="text-xs text-destructive">
          {apiErrorMessage(push.error)}
        </p>
      )}
    </div>
  );
}

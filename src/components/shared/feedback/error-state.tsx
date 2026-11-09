import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ACTION_LABEL, ERROR_MSG } from "@/constants/messages";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { userFacingMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Có lỗi xảy ra",
  message = ERROR_MSG.DEFAULT,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Alert variant="danger" className={cn("my-4 min-w-0", className)}>
      <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" className="size-5" />
      <AlertTitle className="wrap-break-word leading-6">{title}</AlertTitle>
      <AlertDescription className="flex min-w-0 flex-col gap-3 opacity-100 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 flex-1 wrap-anywhere leading-6">
          {userFacingMessage(message, ERROR_MSG.DEFAULT)}
        </span>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="min-h-11 shrink-0 self-start rounded-xl border-destructive/20 bg-background text-destructive hover:bg-destructive/5 hover:text-destructive sm:self-center"
          >
            <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" className="size-4" />
            <span>{ACTION_LABEL.RETRY}</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export { ErrorState };

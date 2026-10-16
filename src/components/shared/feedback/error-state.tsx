import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ACTION_LABEL, ERROR_MSG } from "@/constants/messages";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { userFacingMessage } from "@/lib/api/error-message";

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
    <Alert variant="danger" className={`my-4 ${className}`}>
      <HugeiconsIcon icon={Alert01Icon} className="size-5" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{userFacingMessage(message, ERROR_MSG.DEFAULT)}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="xs"
            onClick={onRetry}
            className="shrink-0 rounded-full border-red-300 bg-white hover:bg-red-50 text-red-800"
          >
            <HugeiconsIcon icon={RefreshIcon} className="mr-1 size-3" />
            <span>{ACTION_LABEL.RETRY}</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export { ErrorState };

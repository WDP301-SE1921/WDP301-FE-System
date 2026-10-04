"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError, apiErrorMessage } from "@/lib/api/client";

export function ApiFeedback({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertTitle>{apiErrorMessage(error)}</AlertTitle>
      <AlertDescription>
        {error instanceof ApiError && error.requestId && (
          <p className="text-xs">Mã yêu cầu: {error.requestId}</p>
        )}
        {retry && (
          <Button className="mt-2" variant="outline" size="sm" onClick={retry}>
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
export const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

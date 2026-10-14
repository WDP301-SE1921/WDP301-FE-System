"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api/client";

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
      {retry && (
        <AlertDescription>
          <Button className="mt-2" variant="outline" size="sm" onClick={retry}>
            Thử lại
          </Button>
        </AlertDescription>
      )}
    </Alert>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

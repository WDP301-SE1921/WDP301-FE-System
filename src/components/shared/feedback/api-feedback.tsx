"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api/client";
import { userFacingMessage } from "@/lib/api/error-message";

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
      {userFacingMessage(message, "Vui lòng kiểm tra lại thông tin đã nhập.")}
    </p>
  ) : null;
}

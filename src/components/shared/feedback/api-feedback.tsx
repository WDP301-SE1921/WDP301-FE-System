"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api/client";
import { userFacingMessage } from "@/lib/api/error-message";
import { courseConflictDetails } from "@/lib/api/course-conflict-details";

export function ApiFeedback({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  const details = courseConflictDetails(error);
  return (
    <Alert variant="destructive">
      <AlertTitle>{apiErrorMessage(error)}</AlertTitle>
      {!!details.length && <AlertDescription><ul className="list-inside list-disc">{details.map((detail, index) => <li key={index}>{detail}</li>)}</ul></AlertDescription>}
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

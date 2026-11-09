"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-role";
import { submissionFileQueryOptions } from "@/features/grading/file-access";

export function useSubmissionFile(fileId: string, enabled: boolean) {
  const user = useCurrentUser();
  return useQuery(
    submissionFileQueryOptions(
      user?.id,
      fileId,
      enabled && user?.role === "teacher",
    ),
  );
}

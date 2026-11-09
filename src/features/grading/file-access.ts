import { queryOptions } from "@tanstack/react-query";
import { academicApi } from "@/features/academic/api";
import { isAccessFresh, toFileAccess } from "@/lib/storage/signed-url";

export function submissionFileQueryOptions(
  userId: string | undefined,
  fileId: string,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: ["web-api", userId, "submission-file-preview", fileId],
    enabled: !!userId && enabled,
    queryFn: async ({ signal }) =>
      toFileAccess(await academicApi.previewFile(fileId, signal), Date.now()),
    retry: false,
    staleTime: 0,
    gcTime: 300_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: (query) =>
      !query.state.error &&
      !isAccessFresh(query.state.data, Date.now(), 15_000),
    refetchInterval: (query) => {
      const expiresAt = query.state.data?.expiresAt;
      return !query.state.error && expiresAt
        ? Math.max(1000, expiresAt - Date.now() - 15_000)
        : false;
    },
  });
}

export function submissionFileKind(url: string): "image" | "pdf" | "other" {
  const pathname = new URL(url).pathname;
  if (/\.(png|jpe?g)$/i.test(pathname)) return "image";
  return /\.pdf$/i.test(pathname) ? "pdf" : "other";
}

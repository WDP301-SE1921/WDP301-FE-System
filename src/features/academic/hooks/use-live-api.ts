"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-role";

export function useLiveQuery<T>(
  key: readonly unknown[],
  queryFn: (signal: AbortSignal) => Promise<T>,
  enabled = true,
  pollWhile?: (value: T) => boolean,
) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ["web-api", user?.id, ...key],
    queryFn: ({ signal }) => queryFn(signal),
    enabled: !!user && enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data && pollWhile?.(query.state.data) ? 2000 : false,
  });
}
export function useLiveCommand() {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (command: () => Promise<unknown>) => command(),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["web-api", user?.id] }),
        client.invalidateQueries({ queryKey: ["registration-classes"] }),
        client.invalidateQueries({ queryKey: ["registration-class"] }),
        client.invalidateQueries({ queryKey: ["registration-students"] }),
        client.invalidateQueries({ queryKey: ["registration-parents"] }),
        client.invalidateQueries({ queryKey: ["academic-calendar"] }),
        client.invalidateQueries({ queryKey: ["academic-session"] }),
        client.invalidateQueries({ queryKey: ["curriculum"] }),
      ]);
    },
  });
}

"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-role";
import { chatApi } from "../api";

export function chatKeys(userId: string | undefined) {
  const base = ["web-api", userId, "chat"] as const;
  return {
    base,
    conversations: [...base, "conversations"] as const,
    users: (search: string) => [...base, "users", search] as const,
    messages: (conversationId: string) =>
      [...base, "messages", conversationId] as const,
    unread: [...base, "unread-count"] as const,
  };
}

export function useChatUsers(search: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: chatKeys(user?.id).users(search),
    queryFn: ({ signal }) => chatApi.users(search, signal),
    enabled: !!user,
    retry: false,
    staleTime: 30_000,
  });
}

export function useChatConversations() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: chatKeys(user?.id).conversations,
    queryFn: ({ signal }) => chatApi.conversations(signal),
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadChatCount() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: chatKeys(user?.id).unread,
    queryFn: ({ signal }) => chatApi.unread(signal),
    select: (data) => data.unreadCount,
    enabled: !!user,
    retry: false,
    refetchInterval: 60_000,
  });
}

export function useChatMessages(conversationId: string | null) {
  const user = useCurrentUser();
  return useInfiniteQuery({
    queryKey: chatKeys(user?.id).messages(conversationId ?? "none"),
    queryFn: ({ pageParam, signal }) =>
      chatApi.messages(conversationId!, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!user && !!conversationId,
    retry: false,
  });
}

export function useChatActions() {
  const user = useCurrentUser();
  const client = useQueryClient();
  const keys = chatKeys(user?.id);
  const refresh = () => client.invalidateQueries({ queryKey: keys.base });
  const createConversation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: refresh,
  });
  const send = useMutation({
    mutationFn: ({
      conversationId,
      body,
      file,
    }: {
      conversationId: string;
      body: string;
      file?: File;
    }) => chatApi.send(conversationId, body, file),
    onSuccess: refresh,
  });
  const read = useMutation({
    mutationFn: chatApi.read,
    onSuccess: refresh,
  });
  const revoke = useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => chatApi.revoke(conversationId, messageId),
    onSuccess: refresh,
  });
  return { createConversation, send, read, revoke };
}

import { apiRequest } from "@/lib/api/client";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "STAFF" | "TEACHER" | "CURRICULUM_DESIGNER";
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  attachment?: {
    name: string;
    mimeType: string;
    size: number;
    url: string;
    expiresIn: number;
    isImage: boolean;
  };
  createdAt: string;
  deletedAt?: string;
  sender: ChatUser;
}

export interface ChatConversation {
  id: string;
  participant: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessagePage {
  items: ChatMessage[];
  nextCursor: string | null;
}

export const chatApi = {
  users: (search: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ limit: "50" });
    if (search.trim()) query.set("search", search.trim());
    return apiRequest<ChatUser[]>(`chat/users?${query}`, { signal });
  },
  conversations: (signal?: AbortSignal) =>
    apiRequest<ChatConversation[]>("chat/conversations", { signal }),
  createConversation: (participantUserId: string) =>
    apiRequest<ChatConversation>("chat/conversations", {
      method: "POST",
      body: { participantUserId },
    }),
  messages: (
    conversationId: string,
    cursor?: string | null,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ limit: "50" });
    if (cursor) query.set("cursor", cursor);
    return apiRequest<ChatMessagePage>(
      `chat/conversations/${encodeURIComponent(conversationId)}/messages?${query}`,
      { signal },
    );
  },
  send: (conversationId: string, body: string, file?: File) => {
    const payload = file ? new FormData() : { body };
    if (payload instanceof FormData) {
      if (body) payload.set("body", body);
      payload.set("file", file!);
    }
    return apiRequest<ChatMessage>(
      `chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: "POST", body: payload },
    );
  },
  revoke: (conversationId: string, messageId: string) =>
    apiRequest<ChatMessage>(
      `chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "DELETE" },
    ),
  read: (conversationId: string) =>
    apiRequest<{ unreadCount: number; readAt: string }>(
      `chat/conversations/${encodeURIComponent(conversationId)}/read`,
      { method: "POST" },
    ),
  unread: (signal?: AbortSignal) =>
    apiRequest<{ unreadCount: number }>("chat/unread-count", { signal }),
};

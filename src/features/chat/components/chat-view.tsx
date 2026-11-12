"use client";

import {
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { parseAsString, useQueryState } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  ArrowLeft01Icon,
  BubbleChatIcon,
  Cancel01Icon,
  Delete02Icon,
  Download01Icon,
  File01Icon,
  Search01Icon,
  SentIcon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ROLE_LABEL } from "@/constants/roles";
import { useCurrentUser } from "@/hooks/use-current-role";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage, ChatUser } from "../api";
import {
  useChatActions,
  useChatConversations,
  useChatMessages,
  useChatUsers,
} from "../hooks/use-chat";

const ROLE_MAP = {
  MANAGER: ROLE_LABEL.center_manager,
  STAFF: ROLE_LABEL.staff,
  TEACHER: ROLE_LABEL.teacher,
  CURRICULUM_DESIGNER: ROLE_LABEL.curriculum_designer,
} as const;

const messageTime = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

const CHAT_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😊",
  "👍",
  "👏",
  "🙌",
  "🙏",
  "💪",
  "🎉",
  "❤️",
  "🔥",
  "✅",
  "⭐",
  "📚",
  "📝",
  "📌",
  "💡",
  "⏰",
  "🤝",
  "👋",
  "💯",
  "🚀",
] as const;

function fileSize(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? `${parts[0][0]}${parts.at(-1)![0]}`
      : parts[0]?.slice(0, 2) || "EG"
  ).toUpperCase();
}

function UserAvatar({
  user,
  size = "default",
}: {
  user: ChatUser;
  size?: "default" | "lg";
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ChatView() {
  const user = useCurrentUser();
  const [conversationId, setConversationId] = useQueryState(
    "conversation",
    parseAsString,
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ChatMessage | null>(null);
  const deferredSearch = useDeferredValue(search);
  const conversations = useChatConversations();
  const users = useChatUsers(deferredSearch);
  const messages = useChatMessages(conversationId);
  const { createConversation, send, read, revoke } = useChatActions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMarkedReadRef = useRef<string | null>(null);
  const conversation =
    conversations.data?.find((item) => item.id === conversationId) ?? null;
  const conversationUserIds = useMemo(
    () => new Set(conversations.data?.map((item) => item.participant.id) ?? []),
    [conversations.data],
  );
  const availableUsers = (users.data ?? []).filter(
    (item) => !conversationUserIds.has(item.id),
  );
  const filteredConversations = (conversations.data ?? []).filter((item) => {
    const needle = search.trim().toLocaleLowerCase("vi");
    return (
      !needle ||
      item.participant.name.toLocaleLowerCase("vi").includes(needle) ||
      item.participant.email.toLocaleLowerCase("vi").includes(needle)
    );
  });
  const messageItems =
    messages.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? [];
  const latestMessageId = messageItems.at(-1)?.id;
  const latestMessageSenderId = messageItems.at(-1)?.sender.id;

  useEffect(() => {
    if (
      !conversationId ||
      !latestMessageId ||
      latestMessageSenderId === user?.id ||
      lastMarkedReadRef.current === latestMessageId
    )
      return;
    lastMarkedReadRef.current = latestMessageId;
    read.mutate(conversationId, {
      onError: () => {
        if (lastMarkedReadRef.current === latestMessageId)
          lastMarkedReadRef.current = null;
      },
    });
  }, [conversationId, latestMessageId, latestMessageSenderId, read, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationId, latestMessageId]);

  const startConversation = async (participantUserId: string) => {
    const created = await createConversation.mutateAsync(participantUserId);
    await setConversationId(created.id);
    setSearch("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!conversationId || (!body && !selectedFile) || send.isPending) return;
    const file = selectedFile ?? undefined;
    setDraft("");
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      await send.mutateAsync({ conversationId, body, file });
    } catch {
      setDraft(body);
      setSelectedFile(file ?? null);
    }
  };

  const chooseFile = (file: File | undefined) => {
    setFileError("");
    if (!file) return;
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setFileError("Tệp phải có dung lượng từ 1 byte đến 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const addEmoji = (emoji: string) => {
    setDraft((value) => `${value}${emoji}`.slice(0, 2000));
    setEmojiOpen(false);
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    await revoke.mutateAsync({
      conversationId: revokeTarget.conversationId,
      messageId: revokeTarget.id,
    });
    setRevokeTarget(null);
  };

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Trò chuyện nội bộ"
        description="Trao đổi tức thì giữa quản lý, nhân viên, giáo viên và thiết kế giáo trình."
      />
      <Card className="grid h-[calc(100dvh-12rem)] min-h-[32rem] min-w-0 overflow-hidden rounded-2xl lg:grid-cols-[21rem_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-h-0 border-r border-border bg-muted/20",
            conversationId ? "hidden lg:flex" : "flex",
            "flex-col",
          )}
        >
          <div className="space-y-3 border-b border-border p-4">
            <h2 className="font-heading font-semibold">Tin nhắn</h2>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm người để trò chuyện"
              aria-label="Tìm người để trò chuyện"
              prefixIcon={<HugeiconsIcon icon={Search01Icon} />}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {conversations.isPending ? (
              <ConversationSkeleton />
            ) : conversations.isError ? (
              <div className="p-2">
                <ApiFeedback
                  error={conversations.error}
                  retry={() => void conversations.refetch()}
                />
              </div>
            ) : (
              <>
                {!!filteredConversations.length && (
                  <ul aria-label="Các cuộc trò chuyện" className="space-y-1">
                    {filteredConversations.map((item) => (
                      <ConversationRow
                        key={item.id}
                        item={item}
                        active={item.id === conversationId}
                        onSelect={() => void setConversationId(item.id)}
                      />
                    ))}
                  </ul>
                )}
                {!!availableUsers.length && (
                  <section
                    className="mt-4"
                    aria-label="Bắt đầu cuộc trò chuyện"
                  >
                    <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Bắt đầu trò chuyện
                    </p>
                    <ul className="space-y-1">
                      {availableUsers.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            disabled={createConversation.isPending}
                            onClick={() => void startConversation(item.id)}
                          >
                            <UserAvatar user={item} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {item.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {ROLE_MAP[item.role]}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {!filteredConversations.length && !availableUsers.length && (
                  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <HugeiconsIcon icon={BubbleChatIcon} className="size-5" />
                    </span>
                    <p className="text-sm font-semibold">
                      Không tìm thấy người phù hợp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Thử tìm theo tên hoặc email.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        <section
          className={cn(
            "min-h-0 min-w-0",
            !conversationId && "hidden lg:block",
          )}
        >
          {!conversationId ? (
            <EmptyConversation />
          ) : !conversation ? (
            <div className="flex h-full items-center justify-center p-6">
              {conversations.isPending ? (
                <Skeleton className="h-20 w-72 rounded-2xl" />
              ) : (
                <div className="text-center">
                  <p className="font-semibold">
                    Không tìm thấy cuộc trò chuyện
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => void setConversationId(null)}
                  >
                    Quay lại danh sách
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full lg:hidden"
                  aria-label="Quay lại danh sách trò chuyện"
                  onClick={() => void setConversationId(null)}
                  leftIcon={<HugeiconsIcon icon={ArrowLeft01Icon} />}
                />
                <UserAvatar user={conversation.participant} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-heading font-semibold">
                    {conversation.participant.name}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROLE_MAP[conversation.participant.role]} ·{" "}
                    {conversation.participant.email}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/10 px-3 py-4 sm:px-6">
                {messages.hasNextPage && (
                  <div className="mb-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={messages.isFetchingNextPage}
                      onClick={() => void messages.fetchNextPage()}
                    >
                      Tải tin nhắn cũ hơn
                    </Button>
                  </div>
                )}
                {messages.isPending ? (
                  <MessageSkeleton />
                ) : messages.isError ? (
                  <ApiFeedback
                    error={messages.error}
                    retry={() => void messages.refetch()}
                  />
                ) : !messageItems.length ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <HugeiconsIcon icon={BubbleChatIcon} className="size-5" />
                    </span>
                    <p className="font-semibold">Bắt đầu cuộc trò chuyện</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Gửi lời chào hoặc trao đổi công việc với{" "}
                      {conversation.participant.name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" aria-live="polite">
                    {messageItems.map((message) => {
                      const own = message.sender.id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            own ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] sm:max-w-[70%]",
                              own && "text-right",
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed whitespace-pre-wrap break-words",
                                own
                                  ? "rounded-br-xl bg-primary text-primary-foreground"
                                  : "rounded-bl-xl border border-border bg-background",
                              )}
                            >
                              {message.deletedAt ? (
                                <p className="italic opacity-75">
                                  Tin nhắn đã được thu hồi
                                </p>
                              ) : message.attachment ? (
                                <MessageAttachment
                                  attachment={message.attachment}
                                />
                              ) : null}
                              {!message.deletedAt && message.body && (
                                <p className={cn(message.attachment && "mt-2")}>
                                  {message.body}
                                </p>
                              )}
                            </div>
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1.5 px-1 text-[0.6875rem] text-muted-foreground",
                                own && "justify-end",
                              )}
                            >
                              <time>
                                {messageTime.format(
                                  new Date(message.createdAt),
                                )}
                              </time>
                              {own && !message.deletedAt && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                  onClick={() => setRevokeTarget(message)}
                                  aria-label="Gỡ tin nhắn này"
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    className="size-3"
                                  />
                                  Gỡ
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={submit}
                className="border-t border-border bg-background p-3 sm:p-4"
              >
                {send.isError && (
                  <p role="alert" className="mb-2 text-xs text-destructive">
                    {apiErrorMessage(send.error)}
                  </p>
                )}
                {fileError && (
                  <p role="alert" className="mb-2 text-xs text-destructive">
                    {fileError}
                  </p>
                )}
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                    <HugeiconsIcon
                      icon={File01Icon}
                      className="size-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fileSize(selectedFile.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Bỏ tệp đính kèm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      leftIcon={<HugeiconsIcon icon={Cancel01Icon} />}
                    />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx,.xlsx,.pptx,.csv,.txt,.zip"
                    onChange={(event) => chooseFile(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full"
                    aria-label="Đính kèm ảnh hoặc tệp"
                    disabled={send.isPending}
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<HugeiconsIcon icon={Attachment01Icon} />}
                  />
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 rounded-full"
                          aria-label="Chọn biểu tượng cảm xúc"
                          disabled={send.isPending}
                          leftIcon={<HugeiconsIcon icon={SmileIcon} />}
                        />
                      }
                    />
                    <PopoverContent align="start" className="w-72 p-3">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        Biểu tượng cảm xúc
                      </p>
                      <div className="grid grid-cols-6 gap-1">
                        {CHAT_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="flex size-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            aria-label={`Thêm ${emoji}`}
                            onClick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    maxLength={2000}
                    rows={1}
                    placeholder="Nhập tin nhắn…"
                    aria-label="Nội dung tin nhắn"
                    className="max-h-32 min-h-10 resize-none py-2.5"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 rounded-full"
                    disabled={!draft.trim() && !selectedFile}
                    isLoading={send.isPending}
                    aria-label="Gửi tin nhắn"
                    leftIcon={<HugeiconsIcon icon={SentIcon} />}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Enter để gửi · Shift + Enter để xuống dòng · Tệp tối đa 10 MB
                </p>
              </form>
            </div>
          )}
        </section>
      </Card>
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            revoke.reset();
          }
        }}
        onConfirm={confirmRevoke}
        title="Gỡ tin nhắn?"
        description={
          revoke.isError
            ? `Không thể gỡ tin nhắn: ${apiErrorMessage(revoke.error)}`
            : "Tin nhắn sẽ được thu hồi với tất cả mọi người trong cuộc trò chuyện. Hành động này không thể hoàn tác."
        }
        confirmText="Gỡ tin nhắn"
        variant="danger"
        isLoading={revoke.isPending}
      />
    </PageContainer>
  );
}

function MessageAttachment({
  attachment,
}: {
  attachment: NonNullable<ChatMessage["attachment"]>;
}) {
  if (attachment.isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl bg-black/5"
        aria-label={`Mở ảnh ${attachment.name}`}
      >
        {/* URL ký tạm thời có hostname thay đổi theo môi trường nên không dùng next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-80 w-full object-contain"
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-56 items-center gap-3 rounded-xl border border-current/15 bg-background/10 p-3 transition-opacity hover:opacity-80"
      aria-label={`Tải tệp ${attachment.name}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/20">
        <HugeiconsIcon icon={File01Icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {attachment.name}
        </span>
        <span className="block text-xs opacity-70">
          {fileSize(attachment.size)}
        </span>
      </span>
      <HugeiconsIcon icon={Download01Icon} className="size-4 shrink-0" />
    </a>
  );
}

function ConversationRow({
  item,
  active,
  onSelect,
}: {
  item: ChatConversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          active ? "bg-primary/10" : "hover:bg-muted",
        )}
      >
        <UserAvatar user={item.participant} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                item.unreadCount ? "font-bold" : "font-semibold",
              )}
            >
              {item.participant.name}
            </span>
            {!!item.unreadCount && (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[0.6875rem]">
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Badge>
            )}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-xs",
              item.unreadCount
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.lastMessage?.deletedAt
              ? "Tin nhắn đã được thu hồi"
              : item.lastMessage?.body ||
                (item.lastMessage?.attachment?.isImage
                  ? "📷 Hình ảnh"
                  : item.lastMessage?.attachment
                    ? `📎 ${item.lastMessage.attachment.name}`
                    : ROLE_MAP[item.participant.role])}
          </span>
        </span>
      </button>
    </li>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-2" aria-label="Đang tải cuộc trò chuyện">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-3 rounded-2xl p-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4" aria-label="Đang tải tin nhắn">
      <Skeleton className="h-12 w-2/3 rounded-2xl" />
      <Skeleton className="ml-auto h-16 w-3/5 rounded-2xl" />
      <Skeleton className="h-10 w-1/2 rounded-2xl" />
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={BubbleChatIcon} className="size-7" />
      </span>
      <div>
        <h2 className="font-heading text-lg font-semibold">
          Chọn một cuộc trò chuyện
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Chọn đồng nghiệp ở danh sách bên trái để xem và gửi tin nhắn realtime.
        </p>
      </div>
    </div>
  );
}

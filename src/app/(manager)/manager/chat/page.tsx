import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/layout/page-container";
import { ChatView } from "@/features/chat/components/chat-view";

export const metadata: Metadata = { title: "Trò chuyện nội bộ" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-[70dvh] rounded-2xl" />
        </PageContainer>
      }
    >
      <ChatView />
    </Suspense>
  );
}

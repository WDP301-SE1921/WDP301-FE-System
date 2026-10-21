"use client";
import { useState } from "react";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { EmailDeliveriesTable } from "./email-deliveries-view";
import {
  AnnouncementComposer,
  AnnouncementsTable,
  EmailQueueResults,
  type EmailQueueResult,
} from "./live-announcements-view";

/**
 * Thông báo: soạn email cho phụ huynh bên trái (thông báo lớp / nhắc học phí),
 * theo dõi thông báo đã lưu và trạng thái gửi email bên phải.
 */
export function NotificationsHub() {
  const [queued, setQueued] = useState<EmailQueueResult[] | null>(null);
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Thông báo"
        description="Soạn email cho phụ huynh bên trái, theo dõi trạng thái gửi bên phải."
      />
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-20">
          <AnnouncementComposer onQueued={setQueued} />
          {queued && <EmailQueueResults results={queued} />}
        </div>
        <div className="min-w-0 space-y-6">
          <AnnouncementsTable onQueued={setQueued} />
          <EmailDeliveriesTable />
        </div>
      </div>
    </PageContainer>
  );
}

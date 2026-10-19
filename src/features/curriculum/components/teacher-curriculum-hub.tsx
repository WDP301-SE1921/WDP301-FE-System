"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurriculumUnitsBody } from "./units-view";
import { CurriculumFeedbackBody } from "./live-feedback-view";

export function TeacherCurriculumHub() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["review", "feedback"]).withDefault("review"),
  );
  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title="Giáo trình"
        description="Đọc giáo trình được phân công, thẩm định chuyên môn và gửi phản hồi bài học."
      />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          void setTab(value === "feedback" ? "feedback" : "review")
        }
      >
        <TabsList>
          <TabsTrigger value="review">Giáo trình & thẩm định</TabsTrigger>
          <TabsTrigger value="feedback">Phản hồi</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "feedback" ? (
        <CurriculumFeedbackBody />
      ) : (
        <CurriculumUnitsBody />
      )}
    </PageContainer>
  );
}

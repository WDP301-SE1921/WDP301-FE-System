"use client";
import { z } from "zod";
import { useCurrentUser } from "@/hooks/use-current-role";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  feedbackSchema,
  requiredId,
  resolveFeedbackSchema,
} from "@/lib/validators/web-workflows";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { useHubTab } from "@/hooks/use-hub-tab";
const createSchema = feedbackSchema.extend({ lessonId: requiredId });
const resolveSchema = resolveFeedbackSchema
  .omit({ resolutionLessonId: true })
  .extend({ resolutionLessonId: z.string().optional() });
/** Trang Phản hồi giáo trình riêng (Giáo viên). */
export function LiveCurriculumFeedback() {
  return (
    <PageContainer>
      <PageHeader
        title="Phản hồi giáo trình"
        description="Theo dõi ý kiến về bài học và phản hồi của người soạn."
      />
      <CurriculumFeedbackBody />
    </PageContainer>
  );
}

/** Tab "Phản hồi giáo trình" trên màn Khóa học & giáo trình (Quản lý, Thiết kế giáo trình). */
export function CurriculumFeedbackTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  return tab === "feedback" ? (
    <div className="min-w-0 space-y-4">
      <CurriculumFeedbackBody />
    </div>
  ) : null;
}

function CurriculumFeedbackBody() {
  const user = useCurrentUser();
  const data = useLiveQuery(["feedback-workspace"], async (signal) => {
    const [feedback, lessons] = await Promise.all([
      academicApi.feedback(signal),
      academicApi.lessons(signal),
    ]);
    return { feedback, lessons };
  });
  return (
    <>
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && (
          <>
            {user?.role === "teacher" && (
              <Card>
                <CardHeader>
                  <CardTitle>Gửi phản hồi bài học</CardTitle>
                </CardHeader>
                <CardContent>
                  <ApiForm
                    schema={createSchema}
                    fields={[
                      {
                        name: "lessonId",
                        label: "Bài học",
                        type: "select",
                        options: data.data.lessons.map((lesson) => ({
                          value: lesson.id,
                          label: lesson.title,
                        })),
                      },
                      {
                        name: "content",
                        label: "Nội dung phản hồi",
                        type: "textarea",
                      },
                    ]}
                    submitLabel="Gửi phản hồi"
                    onSubmit={(value) =>
                      academicApi.createFeedback(String(value.lessonId), {
                        content: value.content,
                      })
                    }
                  />
                </CardContent>
              </Card>
            )}
            {data.data.feedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <CardTitle>
                    {data.data!.lessons.find(
                      (lesson) => lesson.id === feedback.lessonId,
                    )?.title ?? "Phản hồi bài học"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>{displayMoment(feedback.createdAt)}</p>
                  <Badge>{STATUS_TEXT[feedback.status]}</Badge>
                  <p className="whitespace-pre-wrap">{feedback.content}</p>
                  {feedback.response && (
                    <p className="whitespace-pre-wrap">
                      Phản hồi: {feedback.response}
                    </p>
                  )}
                  {user?.role !== "teacher" && (
                    <ApiForm
                      key={`${feedback.id}-${feedback.status}-${feedback.response}`}
                      schema={resolveSchema}
                      defaults={{
                        status: feedback.status,
                        response: feedback.response ?? "",
                        resolutionLessonId: feedback.resolutionLessonId ?? "",
                      }}
                      fields={[
                        {
                          name: "status",
                          label: "Trạng thái xử lý",
                          type: "select",
                          options: [
                            "OPEN",
                            "IN_PROGRESS",
                            "RESOLVED",
                            "DECLINED",
                          ].map((status) => ({
                            value: status,
                            label: STATUS_TEXT[status],
                          })),
                        },
                        {
                          name: "response",
                          label: "Nội dung phản hồi",
                          type: "textarea",
                        },
                        {
                          name: "resolutionLessonId",
                          label: "Bản sửa đã duyệt (nếu có)",
                          type: "select",
                          options: [
                            { value: "", label: "Không gắn bản sửa" },
                            ...data
                              .data!.lessons.filter(
                                (lesson) =>
                                  lesson.basedOnId === feedback.lessonId &&
                                  lesson.status === "APPROVED",
                              )
                              .map((lesson) => ({
                                value: lesson.id,
                                label: lesson.title,
                              })),
                          ],
                        },
                      ]}
                      submitLabel="Lưu phản hồi"
                      onSubmit={(value) =>
                        academicApi.resolveFeedback(feedback.id, {
                          ...value,
                          resolutionLessonId:
                            value.resolutionLessonId || undefined,
                        })
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {!data.data.feedback.length && <p>Chưa có phản hồi giáo trình.</p>}
          </>
        )}
      </AsyncBoundary>
    </>
  );
}

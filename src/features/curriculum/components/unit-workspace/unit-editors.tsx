"use client";

import { actsAsManager } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { unlinkedOutcomeSubmitNote } from "@/lib/outcome-links";
import { LessonOutcomeDialog } from "@/features/outcomes/components/lesson-outcome-dialog";
import { UnitForm } from "../unit-form";
import { LessonForm } from "../lesson-form";
import { LessonPositionDialog } from "../lesson-position-dialog";
import { moveLessonTo } from "../../lesson-order";
import { CurriculumImport } from "../curriculum-import";
import {
  CurriculumSubmitForm,
  CurriculumTechnicalReviewForm,
  CurriculumRevisionForm,
  CurriculumRequestChangesForm,
} from "../curriculum-review-forms";
import type { Editor, UnitWorkspace } from "../../hooks/use-unit-workspace";

const editorTitles: Record<Editor["kind"], string> = {
  unit: "Thông tin giáo trình",
  lesson: "Soạn bài học",
  import: "Nhập bài từ file",
  submit: "Gửi duyệt",
  "technical-review": "Duyệt nội dung",
  revision: "Làm bản mới của giáo trình",
  "request-changes": "Trả lại giáo trình để sửa",
};

export function UnitEditors({ ws }: { ws: UnitWorkspace }) {
  const {
    role,
    user,
    router,
    editor,
    formState,
    setFormState,
    discard,
    setDiscard,
    confirmApply,
    setConfirmApply,
    deleting,
    setDeleting,
    positionLesson,
    setPositionLesson,
    mappingLesson,
    setMappingLesson,
    approve,
    remove,
    removeLesson,
    reorder,
    unit,
    canEdit,
    canRevise,
    canTechnicalReview,
    canMapOutcomes,
    outcomesUnready,
    companions,
    reportFollowUp,
    managerWarning,
    unlinkedGroups,
    regular,
    closeEditor,
    saved,
    applyOrder,
    regularIds,
    submitted,
    revisionCreated,
    confirmApproval,
    confirmDelete,
  } = ws;
  if (!unit) return null;
  return (
    <>
      <Sheet
        open={editor?.kind === "lesson"}
        onOpenChange={(open) => {
          if (!open && !formState.busy)
            if (formState.dirty) setDiscard(true);
            else closeEditor();
        }}
      >
        <SheetContent
          className="flex w-full flex-col overflow-y-auto sm:max-w-2xl"
          showCloseButton={false}
        >
          <SheetHeader>
            <SheetTitle>
              {editor?.lesson
                ? `Sửa bài ${editor.lesson.sequence}`
                : "Thêm bài học"}
            </SheetTitle>
            <SheetDescription>{unit.title}</SheetDescription>
          </SheetHeader>
          {editor?.kind === "lesson" && canEdit && (
            <LessonForm
              key={editor.lesson?.id ?? "new"}
              unit={unit}
              lesson={editor.lesson}
              onStateChange={setFormState}
              onSaved={() => saved("Đã lưu bài học.")}
            />
          )}
          <Button
            variant="outline"
            disabled={formState.busy}
            onClick={() => (formState.dirty ? setDiscard(true) : closeEditor())}
          >
            Đóng
          </Button>
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!editor && editor.kind !== "lesson"}
        onOpenChange={(open) => {
          if (!open && !formState.busy) {
            if (formState.dirty) setDiscard(true);
            else closeEditor();
          }
        }}
      >
        <DialogContent
          size={
            editor?.kind === "lesson" || editor?.kind === "import"
              ? "full"
              : "xl"
          }
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>
              {editor ? editorTitles[editor.kind] : "Giáo trình"}
            </DialogTitle>
            <DialogDescription>{unit.title}</DialogDescription>
          </DialogHeader>
          {editor?.kind === "unit" && canEdit && (
            <UnitForm
              key={unit.id}
              unit={unit}
              onStateChange={setFormState}
              onSaved={() => saved("Đã lưu thông tin giáo trình.")}
            />
          )}
          {editor?.kind === "import" && canEdit && user && (
            <CurriculumImport
              unit={unit}
              userId={user.id}
              onStateChange={setFormState}
            />
          )}
          {editor?.kind === "submit" && canEdit && (
            <CurriculumSubmitForm
              unit={unit}
              outcomeNote={unlinkedOutcomeSubmitNote(unlinkedGroups)}
              onCancel={() =>
                formState.dirty ? setDiscard(true) : closeEditor()
              }
              onStateChange={setFormState}
              onSaved={submitted}
            />
          )}
          {editor?.kind === "technical-review" && canTechnicalReview && (
            <CurriculumTechnicalReviewForm
              unit={unit}
              companions={companions}
              outcomesUnready={outcomesUnready}
              onStateChange={setFormState}
              onSaved={(approved, failures) => {
                if (approved) {
                  saved("Đã duyệt nội dung giáo trình.");
                  reportFollowUp(failures);
                } else {
                  closeEditor();
                  router.push(ROUTES.TEACHER.CURRICULUM);
                }
              }}
            />
          )}
          {editor?.kind === "revision" && canRevise && (
            <CurriculumRevisionForm
              unit={unit}
              onStateChange={setFormState}
              onCreated={revisionCreated}
            />
          )}
          {editor?.kind === "request-changes" &&
            actsAsManager(role) &&
            unit.status === "PENDING_REVIEW" && (
              <CurriculumRequestChangesForm
                unit={unit}
                onStateChange={setFormState}
                onSaved={() => saved("Đã gửi yêu cầu chỉnh sửa.")}
              />
            )}
          {!(editor?.kind === "submit" && canEdit) && (
            <Button
              variant="outline"
              disabled={formState.busy}
              onClick={() =>
                formState.dirty ? setDiscard(true) : closeEditor()
              }
            >
              Đóng
            </Button>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={discard}
        onOpenChange={setDiscard}
        title="Bỏ thay đổi chưa lưu?"
        description="Nội dung bạn đang soạn chưa được lưu. Đóng sẽ bỏ các thay đổi này."
        confirmText="Bỏ thay đổi"
        cancelText="Tiếp tục soạn"
        variant="danger"
        onConfirm={closeEditor}
      />
      <ConfirmDialog
        open={confirmApply}
        onOpenChange={setConfirmApply}
        title="Duyệt áp dụng giáo trình?"
        description={`Bản ${unit.version} áp dụng từ hôm nay cho các lớp tạo lịch sau đó. Bản đang áp dụng (nếu có) được lưu trữ ngay; lớp đang học bản đó học tiếp tới hết bài, các buổi học đã tạo được giữ nguyên. Duyệt xong, hệ thống mở màn tạo lịch học cho các lớp của khóa (đã xem trước, bạn bấm một lần để tạo).${managerWarning ? " " + managerWarning : ""}`}
        confirmText="Duyệt áp dụng"
        isLoading={approve.isPending}
        onConfirm={confirmApproval}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        variant={unit.status === "APPROVED" ? "default" : "danger"}
        title={
          deleting === "unit"
            ? unit.status === "APPROVED"
              ? "Lưu trữ giáo trình?"
              : "Xóa giáo trình nháp?"
            : "Xóa bài học?"
        }
        description={deleting === "unit" ? unit.title : deleting?.title}
        isLoading={remove.isPending || removeLesson.isPending}
        onConfirm={confirmDelete}
      />
      {canMapOutcomes && (
        <LessonOutcomeDialog
          lesson={mappingLesson}
          programId={unit.programId}
          isCurriculumApproved={unit.status === "APPROVED"}
          onClose={() => setMappingLesson(null)}
        />
      )}
      <LessonPositionDialog
        lesson={positionLesson}
        currentPosition={
          positionLesson ? regularIds.indexOf(positionLesson.id) + 1 : 1
        }
        count={regular.length}
        busy={reorder.isPending}
        onClose={() => setPositionLesson(null)}
        onSubmit={(lesson, position) =>
          applyOrder(moveLessonTo(regularIds, lesson.id, position), () =>
            setPositionLesson(null),
          )
        }
      />
    </>
  );
}

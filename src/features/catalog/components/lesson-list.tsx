"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { ERROR_MSG } from "@/constants/messages/error"
import { LessonFormDialog } from "@/features/catalog/components/lesson-form-dialog"
import { useDeleteLesson, useReorderLessons } from "@/features/catalog/hooks/use-catalog"
import { MockError } from "@/mocks/utils/mock-query"
import type { Lesson } from "@/types/catalog"

export interface LessonListProps {
  programId: string
  lessons: Lesson[]
}

/**
 * Kéo-thả bằng HTML5 DnD gốc (không thêm thư viện DnD mới — repo chưa cài
 * `@dnd-kit/*` hay tương đương, xem `.claude/rules/implement-ui.md`).
 */
function LessonList({ programId, lessons }: LessonListProps) {
  const reorderLessons = useReorderLessons()
  const deleteLesson = useDeleteLesson()

  const [localLessons, setLocalLessons] = React.useState(lessons)
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const [lessonDialog, setLessonDialog] = React.useState<
    { mode: "create" } | { mode: "edit"; lesson: Lesson } | null
  >(null)
  const [deletingLesson, setDeletingLesson] = React.useState<Lesson | null>(null)

  // Đồng bộ state cục bộ khi `lessons` (từ query) đổi — điều chỉnh state ngay lúc
  // render thay vì trong effect để tránh cascading render (react-hooks/set-state-in-effect).
  const [prevLessons, setPrevLessons] = React.useState(lessons)
  if (lessons !== prevLessons) {
    setPrevLessons(lessons)
    setLocalLessons(lessons)
  }

  const resetDrag = () => {
    setDraggingId(null)
    setOverId(null)
  }

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      resetDrag()
      return
    }

    const fromIndex = localLessons.findIndex((item) => item.id === draggingId)
    const toIndex = localLessons.findIndex((item) => item.id === targetId)
    if (fromIndex === -1 || toIndex === -1) {
      resetDrag()
      return
    }

    const reordered = [...localLessons]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setLocalLessons(reordered)
    resetDrag()

    reorderLessons.mutate(
      { programId, orderedLessonIds: reordered.map((item) => item.id) },
      {
        onSuccess: () => toast.success(CATALOG_MSG.LESSON_REORDER_SUCCESS),
        onError: (error) => {
          setLocalLessons(lessons)
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  const handleConfirmDelete = () => {
    if (!deletingLesson) return

    deleteLesson.mutate(
      { lessonId: deletingLesson.id, programId },
      {
        onSuccess: () => {
          toast.success(CATALOG_MSG.LESSON_DELETE_SUCCESS)
          setDeletingLesson(null)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => setLessonDialog({ mode: "create" })}
        >
          {CATALOG_MSG.LESSON_CREATE}
        </Button>
      </div>

      {localLessons.length === 0 ? (
        <EmptyState
          title={CATALOG_MSG.LESSON_EMPTY_TITLE}
          description={CATALOG_MSG.LESSON_EMPTY_DESC}
        />
      ) : (
        <ul className="space-y-2">
          {localLessons.map((lesson, index) => (
            <li
              key={lesson.id}
              draggable
              onDragStart={() => setDraggingId(lesson.id)}
              onDragOver={(event) => {
                event.preventDefault()
                if (overId !== lesson.id) setOverId(lesson.id)
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(lesson.id)
              }}
              onDragEnd={resetDrag}
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-shadow",
                draggingId === lesson.id && "opacity-50 shadow-lg",
                overId === lesson.id && draggingId !== lesson.id && "border-primary/60 bg-primary/5"
              )}
            >
              <span className="mt-1 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing">
                <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
              </span>

              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{lesson.title}</p>
                {lesson.chapter && (
                  <p className="truncate text-xs text-primary">{lesson.chapter}</p>
                )}
                {lesson.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {lesson.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={CATALOG_MSG.LESSON_ACTION_EDIT}
                  onClick={() => setLessonDialog({ mode: "edit", lesson })}
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-destructive hover:text-destructive"
                  aria-label={CATALOG_MSG.LESSON_ACTION_DELETE}
                  onClick={() => setDeletingLesson(lesson)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertDescription>{CATALOG_MSG.LESSON_ORDER_HINT_TITLE}</AlertDescription>
      </Alert>

      {lessonDialog && (
        <LessonFormDialog
          key={lessonDialog.mode === "edit" ? lessonDialog.lesson.id : "create"}
          open={Boolean(lessonDialog)}
          onOpenChange={(open) => {
            if (!open) setLessonDialog(null)
          }}
          mode={lessonDialog.mode}
          programId={programId}
          lesson={lessonDialog.mode === "edit" ? lessonDialog.lesson : undefined}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingLesson)}
        onOpenChange={(open) => {
          if (!open) setDeletingLesson(null)
        }}
        title={CATALOG_MSG.LESSON_DELETE_CONFIRM_TITLE}
        description={CATALOG_MSG.LESSON_DELETE_CONFIRM_DESC}
        variant="danger"
        isLoading={deleteLesson.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export { LessonList }

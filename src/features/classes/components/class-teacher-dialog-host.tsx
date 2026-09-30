"use client"

import { ChangeClassTeacherDialog } from "@/features/classes/components/change-class-teacher-dialog"
import { useClassDetail } from "@/features/classes/hooks/use-classes"

export interface ClassTeacherDialogHostProps {
  /** Lớp cần gán / đổi giáo viên; `null` thì không hiện gì. */
  classId: string | null
  onClose: () => void
}

/**
 * Mở modal gán/đổi giáo viên từ danh sách lớp (không có sẵn `ClassDetail` như ở trang chi
 * tiết): tải chi tiết lớp rồi dựng `ChangeClassTeacherDialog`. `key` gồm chế độ để form dựng
 * lại khi lớp vừa được gán xong (chuyển từ "gán" sang "đổi").
 */
function ClassTeacherDialogHost({ classId, onClose }: ClassTeacherDialogHostProps) {
  const detail = useClassDetail(classId ?? "")

  if (!classId || !detail.data) return null

  const mode = detail.data.classRecord.teacherId ? "change" : "assign"

  return (
    <ChangeClassTeacherDialog
      key={`${classId}-${mode}`}
      detail={detail.data}
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    />
  )
}

export { ClassTeacherDialogHost }

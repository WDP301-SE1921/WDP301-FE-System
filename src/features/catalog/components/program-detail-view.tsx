"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, Edit02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyText } from "@/components/shared/display/money-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { ROUTES } from "@/constants/routes"
import { LessonList } from "@/features/catalog/components/lesson-list"
import { ProgramFormDialog } from "@/features/catalog/components/program-form-dialog"
import { useCatalogProgramDetail } from "@/features/catalog/hooks/use-catalog"
import type { ProgramRow } from "@/features/catalog/selectors"

export interface ProgramDetailViewProps {
  programId: string
}

function ProgramDetailView({ programId }: ProgramDetailViewProps) {
  const detail = useCatalogProgramDetail(programId)
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={detail.isPending}
        isError={detail.isError}
        error={detail.error}
        onRetry={() => detail.refetch()}
        skeleton={<SkeletonDetailHeader />}
        // `data`/`isEmpty` không truyền: bản thân "không tìm thấy" (null) đã được
        // xử lý riêng bên dưới bằng ErrorState, không nhờ AsyncBoundary suy luận rỗng.
        isEmpty={false}
      >
        {detail.data === null ? (
          <ErrorState
            title={CATALOG_MSG.PROGRAM_NOT_FOUND_TITLE}
            message={CATALOG_MSG.PROGRAM_NOT_FOUND_DESC}
          />
        ) : (
          detail.data && (
            <div className="space-y-6">
              <ProgramHero row={detail.data.row} onEdit={() => setIsEditOpen(true)} />

              {detail.data.lessons.length < detail.data.row.program.totalLessons && (
                <Alert variant="warning">
                  <HugeiconsIcon icon={Alert01Icon} />
                  <AlertTitle>{CATALOG_MSG.LESSON_MISSING_TITLE}</AlertTitle>
                  <AlertDescription>
                    {CATALOG_MSG.LESSON_MISSING_DESC(
                      detail.data.row.program.totalLessons - detail.data.lessons.length,
                      detail.data.row.program.totalLessons
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <SectionCard title={CATALOG_MSG.LESSONS_SECTION_TITLE}>
                <div className="space-y-4">
                  <Alert variant="info">
                    <HugeiconsIcon icon={InformationCircleIcon} />
                    <AlertDescription>{CATALOG_MSG.LESSON_MONTHLY_TEST_NOTE}</AlertDescription>
                  </Alert>
                  <LessonList programId={programId} lessons={detail.data.lessons} />
                </div>
              </SectionCard>

              {isEditOpen && (
                <ProgramFormDialog
                  open={isEditOpen}
                  onOpenChange={setIsEditOpen}
                  mode="edit"
                  program={detail.data.row.program}
                />
              )}
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function ProgramHero({
  row,
  onEdit,
}: {
  row: ProgramRow
  onEdit: () => void
}) {
  const { program, subjectCode } = row

  return (
    <div className="space-y-4">
      <PageHeader
        title={program.name}
        backHref={ROUTES.MANAGER.CATALOG}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: CATALOG_MSG.BREADCRUMB_CATALOG, href: ROUTES.MANAGER.CATALOG },
          { label: CATALOG_MSG.BREADCRUMB_PROGRAMS, href: ROUTES.MANAGER.CATALOG },
          { label: program.name },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={Edit02Icon} />}
            onClick={onEdit}
          >
            {CATALOG_MSG.PROGRAM_ACTION_EDIT}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SubjectTag code={subjectCode} />
        <Badge variant="secondary" className="rounded-full">
          {STUDENT_MSG.GRADE_LABEL(program.grade)}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          <MoneyText amount={program.monthlyFee} />
          <span className="text-muted-foreground">{CATALOG_MSG.PROGRAM_DETAIL_FEE_UNIT}</span>
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {CATALOG_MSG.PROGRAM_DETAIL_LESSON_COUNT(program.totalLessons)}
        </Badge>
        {program.textbook && (
          <Badge variant="outline" className="rounded-full">
            {CATALOG_MSG.PROGRAM_DETAIL_TEXTBOOK(program.textbook)}
          </Badge>
        )}
      </div>
    </div>
  )
}

export { ProgramDetailView }

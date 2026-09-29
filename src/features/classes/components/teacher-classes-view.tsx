"use client"

import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import { CURRENT_TEACHER_ID } from "@/mocks/data/catalog"
import { getClassAverageAttendanceRate } from "@/features/classes/selectors"
import { TeacherClassCard } from "@/features/classes/components/teacher-class-card"
import { useClasses } from "@/features/classes/hooks/use-classes"

function TeacherClassesView() {
  const classes = useClasses({ teacherId: CURRENT_TEACHER_ID })

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_CLASS_MSG.LIST_TITLE}
        description={
          classes.data ? TEACHER_CLASS_MSG.LIST_DESC(classes.data.rows.length) : undefined
        }
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: TEACHER_CLASS_MSG.LIST_TITLE },
        ]}
      />

      <AsyncBoundary
        isLoading={classes.isPending}
        isError={classes.isError}
        error={classes.error}
        onRetry={() => classes.refetch()}
        skeleton={<SkeletonCardList />}
        data={classes.data?.rows}
      >
        {classes.data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.data.rows.map((row) => (
              <TeacherClassCard
                key={row.classRecord.id}
                row={row}
                averageAttendanceRate={getClassAverageAttendanceRate(row.classRecord.id)}
              />
            ))}
          </div>
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

export { TeacherClassesView }

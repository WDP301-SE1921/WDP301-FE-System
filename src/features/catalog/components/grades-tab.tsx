"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { useCatalogGrades } from "@/features/catalog/hooks/use-catalog"
import type { GradeRow } from "@/features/catalog/selectors"

const columns: LegacyColumnDef<GradeRow>[] = [
  {
    id: "grade",
    header: CATALOG_MSG.GRADE_COL_NAME,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {STUDENT_MSG.GRADE_LABEL(row.original.grade)}
      </span>
    ),
  },
  {
    id: "programCount",
    header: CATALOG_MSG.GRADE_COL_PROGRAM_COUNT,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-foreground">{row.original.programCount}</span>
    ),
  },
  {
    id: "classCount",
    header: CATALOG_MSG.GRADE_COL_CLASS_COUNT,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-foreground">{row.original.classCount}</span>
    ),
  },
]

function GradesTab() {
  const grades = useCatalogGrades()

  return (
    <Card className="gap-4">
      <DataTable
        columns={columns}
        data={grades.data ?? []}
        isLoading={grades.isPending}
        isError={grades.isError}
        error={grades.error}
        onRetry={() => grades.refetch()}
      />
    </Card>
  )
}

export { GradesTab }

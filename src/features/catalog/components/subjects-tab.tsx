"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { useCatalogSubjects } from "@/features/catalog/hooks/use-catalog"
import type { SubjectRow } from "@/features/catalog/selectors"

const columns: LegacyColumnDef<SubjectRow>[] = [
  {
    id: "subject",
    header: CATALOG_MSG.SUBJECT_COL_NAME,
    cell: ({ row }) => <SubjectTag code={row.original.subject.code} />,
  },
  {
    id: "programCount",
    header: CATALOG_MSG.SUBJECT_COL_PROGRAM_COUNT,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-foreground">{row.original.programCount}</span>
    ),
  },
  {
    id: "classCount",
    header: CATALOG_MSG.SUBJECT_COL_CLASS_COUNT,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-foreground">{row.original.classCount}</span>
    ),
  },
]

function SubjectsTab() {
  const subjects = useCatalogSubjects()

  return (
    <Card className="gap-4">
      <DataTable
        columns={columns}
        data={subjects.data ?? []}
        isLoading={subjects.isPending}
        isError={subjects.isError}
        error={subjects.error}
        onRetry={() => subjects.refetch()}
      />
    </Card>
  )
}

export { SubjectsTab }

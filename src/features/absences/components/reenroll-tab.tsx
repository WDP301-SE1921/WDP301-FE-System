"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ROUTES } from "@/constants/routes"
import { useReenrollRows } from "@/features/absences/hooks/use-absences"

function ReenrollTab() {
  const router = useRouter()
  const { data: rows = [], isPending } = useReenrollRows()

  return (
    <SectionCard title={ABSENCE_MSG.TAB_REENROLL}>
      {isPending ? (
        <SkeletonTable rows={2} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState description={ABSENCE_MSG.REENROLL_EMPTY} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{ABSENCE_MSG.REENROLL_COL_STUDENT}</TableHead>
              <TableHead>{ABSENCE_MSG.REENROLL_COL_SUBJECTS}</TableHead>
              <TableHead>{ABSENCE_MSG.REENROLL_COL_DATE}</TableHead>
              <TableHead>{ABSENCE_MSG.REENROLL_COL_REASON}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.record.id}>
                <TableCell>
                  <UserCell name={row.student.name} sub={row.student.code} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.subjectCodes.map((code) => (
                      <SubjectTag key={code} code={code} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <DateText value={row.record.effectiveDate} />
                </TableCell>
                <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                  {row.record.reason}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      toast.info(ABSENCE_MSG.REENROLL_HINT(row.student.name))
                      router.push(
                        ROUTES.MANAGER.ENROLLMENT_NEW_FOR({
                          parentId: row.student.parentAccountId,
                          studentId: row.student.id,
                        })
                      )
                    }}
                  >
                    {ABSENCE_MSG.REENROLL_ACTION}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}

export { ReenrollTab }

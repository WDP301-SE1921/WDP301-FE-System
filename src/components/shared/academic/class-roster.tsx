"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import type { RegistrationClass } from "@/types/backend";
/** Danh sách ghi danh của lớp; cột Phụ huynh chỉ có khi API trả liên hệ (Quản lý, Nhân viên). */
export function ClassRoster({
  roster,
  onPageChange,
}: {
  roster: RegistrationClass["enrollments"];
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (!roster) return null;
  const showParent = roster.items.some((row) => row.studentProfile.parentProfile);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách ghi danh · {roster.total}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học sinh</TableHead>
              {showParent && <TableHead>Phụ huynh</TableHead>}
              <TableHead>Khối</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời hạn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.studentProfile.fullName}</TableCell>
                {showParent && (
                  <TableCell className="whitespace-normal">
                    {row.studentProfile.parentProfile ? (
                      <>
                        <span className="block">
                          {row.studentProfile.parentProfile.user.displayName ||
                            row.studentProfile.parentProfile.user.email}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {[
                            row.studentProfile.parentProfile.phone,
                            row.studentProfile.parentProfile.user.email,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                )}
                <TableCell>{row.studentProfile.grade}</TableCell>
                <TableCell>
                  {(
                    {
                      ACTIVE: "Đang học",
                      ENDED: "Đã kết thúc",
                      PAUSED: "Tạm dừng",
                    } as Record<string, string>
                  )[row.status] ?? row.status}
                </TableCell>
                <TableCell>
                  {row.startDate?.slice(0, 10)} → {row.endDate?.slice(0, 10)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!roster.items.length && (
          <p className="py-4 text-sm text-muted-foreground">
            Chưa có ghi danh tại lớp này.
          </p>
        )}
        <p className="my-3 text-xs text-muted-foreground">
          Học viên đang học tại lớp ở thời điểm xem, đã tính các lần chuyển lớp
          có hiệu lực.
        </p>
        <TablePagination
          totalItems={roster.total}
          pageParamKey="rosterPage"
          fixedPageSize={roster.limit}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

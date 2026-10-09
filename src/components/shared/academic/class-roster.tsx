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
export function ClassRoster({
  roster,
  onPageChange,
}: {
  roster: RegistrationClass["enrollments"];
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (!roster) return null;
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
              <TableHead>Khối</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời hạn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.studentProfile.fullName}</TableCell>
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
          Danh sách ghi danh gốc tại lớp. Học viên chuyển lớp được xác định theo
          từng buổi học.
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

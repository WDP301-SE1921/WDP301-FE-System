"use client";
import { useState } from "react";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import { confirmationSchema, roomSchema } from "@/lib/validators/web-workflows";
import type { RoomRecord } from "@/types/academic-workflows";

interface RoomDialogState {
  room: RoomRecord;
  mode: "edit" | "toggle";
}

/** SRS §3.1, §6.2: rooms the manager chooses when creating a class. */
export function LiveRoomsView() {
  const rooms = useLiveQuery(["rooms"], (signal) =>
    registrationApi.rooms(signal),
  );
  const [dialog, setDialog] = useState<RoomDialogState | null>(null);
  const columns: DataTableColumn<RoomRecord>[] = [
    {
      accessorKey: "name",
      header: "Tên phòng",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "capacity",
      header: "Sức chứa",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.capacity} chỗ</span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: { original: room } }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label={`Sửa phòng ${room.name}`}
            onClick={() => setDialog({ room, mode: "edit" })}
          >
            Sửa
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${room.isActive ? "Ngừng sử dụng" : "Dùng lại"} phòng ${room.name}`}
            onClick={() => setDialog({ room, mode: "toggle" })}
          >
            {room.isActive ? "Ngừng sử dụng" : "Dùng lại"}
          </Button>
        </div>
      ),
    },
  ];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Phòng học"
        description="Phòng dùng khi tạo lớp. Sức chứa phòng phải từ sĩ số lớp trở lên; phòng đang có buổi sắp tới không thể ngừng sử dụng."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Thêm phòng</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={roomSchema}
              defaults={{ name: "", capacity: 20 }}
              fields={[
                { name: "name", label: "Tên phòng" },
                { name: "capacity", label: "Sức chứa", type: "number" },
              ]}
              submitLabel="Thêm phòng"
              onSubmit={(value) => registrationApi.createRoom(value)}
            />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Danh sách phòng</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <DataTable
              columns={columns}
              data={rooms.data ?? []}
              isLoading={rooms.isPending}
              isError={rooms.isError}
              error={rooms.error}
              onRetry={() => void rooms.refetch()}
              emptyTitle="Chưa có phòng học"
              emptyDescription="Thêm phòng ở cột bên trái để dùng khi tạo lớp."
            />
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          {dialog && (
            <RoomDialogBody
              key={`${dialog.room.id}-${dialog.mode}`}
              {...dialog}
              onDone={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function RoomDialogBody({
  room,
  mode,
  onDone,
}: RoomDialogState & { onDone: () => void }) {
  if (mode === "edit")
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sửa phòng {room.name}</DialogTitle>
          <DialogDescription>
            Sức chứa phải từ sĩ số các lớp đang dùng phòng trở lên.
          </DialogDescription>
        </DialogHeader>
        <ApiForm
          schema={roomSchema}
          defaults={{ name: room.name, capacity: room.capacity }}
          fields={[
            { name: "name", label: "Tên phòng" },
            { name: "capacity", label: "Sức chứa", type: "number" },
          ]}
          submitLabel="Lưu phòng"
          successMessage={false}
          onSubmit={(value) => registrationApi.updateRoom(room.id, value)}
          onSuccess={() => {
            toast.success(`Đã lưu phòng ${room.name}.`);
            onDone();
          }}
        />
      </>
    );
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {room.isActive ? "Ngừng sử dụng" : "Dùng lại"} phòng {room.name}
        </DialogTitle>
        <DialogDescription>
          {room.isActive
            ? "Phòng ngừng sử dụng sẽ không được chọn khi tạo lớp. Phòng đang có buổi sắp tới không thể ngừng sử dụng."
            : "Phòng sẽ được chọn lại khi tạo lớp."}
        </DialogDescription>
      </DialogHeader>
      <ApiForm
        schema={confirmationSchema}
        defaults={{ confirmed: false }}
        fields={[
          {
            name: "confirmed",
            label: room.isActive
              ? "Xác nhận ngừng sử dụng phòng này"
              : "Xác nhận dùng lại phòng này",
            type: "checkbox",
          },
        ]}
        submitLabel={room.isActive ? "Ngừng sử dụng" : "Dùng lại phòng"}
        successMessage={false}
        onSubmit={() =>
          registrationApi.updateRoom(room.id, { isActive: !room.isActive })
        }
        onSuccess={() => {
          toast.success(
            room.isActive
              ? `Đã ngừng sử dụng phòng ${room.name}.`
              : `Đã dùng lại phòng ${room.name}.`,
          );
          onDone();
        }}
      />
    </>
  );
}

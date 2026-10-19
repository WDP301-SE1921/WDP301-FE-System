"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import type { ClassHubTab } from "@/constants/class-hub";
import { useHubTab } from "@/hooks/use-hub-tab";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";

interface RoomDialogState {
  room: RoomRecord;
  mode: "edit" | "toggle";
}

/** Thân tab "Phòng học" trên màn Lớp học (chỉ vai trò có quyền phòng). */
export function RoomsTab({ tabs }: { tabs: readonly ClassHubTab[] }) {
  const [tab] = useHubTab(tabs);
  return tab === "rooms" ? <RoomsPanel /> : null;
}

/** SRS §3.1, §6.2: rooms the manager chooses when creating a class. */
function RoomsPanel() {
  const rooms = useLiveQuery(["rooms"], (signal) =>
    registrationApi.rooms(signal),
  );
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const classesByRoom = new Map<string, string[]>();
  for (const classroom of classes.data ?? [])
    if (classroom.roomId && classroom.isActive !== false)
      classesByRoom.set(classroom.roomId, [
        ...(classesByRoom.get(classroom.roomId) ?? []),
        classroom.name,
      ]);
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
      id: "classes",
      header: "Lớp đang dùng",
      cell: ({ row }) => {
        if (classes.isPending)
          return <span className="text-muted-foreground">Đang tải…</span>;
        if (classes.isError)
          return (
            <span className="text-muted-foreground">Chưa tải được lớp</span>
          );
        const names = classesByRoom.get(row.original.id) ?? [];
        return names.length ? (
          <span className="block max-w-64 whitespace-normal">
            {names.join(" · ")}
          </span>
        ) : (
          <span className="text-muted-foreground">Chưa có lớp</span>
        );
      },
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
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
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
                {
                  name: "capacity",
                  label: "Sức chứa",
                  type: "number",
                  description: "Phải từ sĩ số lớp trở lên, tối đa 10.000.",
                },
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
          <CardContent className="min-w-0 space-y-3">
            <ApiFeedback
              error={classes.error}
              retry={() => void classes.refetch()}
            />
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
            <p className="text-xs text-muted-foreground">
              Phòng dùng khi tạo lớp. Phòng có buổi học sắp tới thì không ngừng
              sử dụng được.
            </p>
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
    </>
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

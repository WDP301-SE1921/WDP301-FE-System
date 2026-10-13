"use client";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import { confirmationSchema, roomSchema } from "@/lib/validators/web-workflows";
import type { RoomRecord } from "@/types/academic-workflows";

/** SRS §3.1, §6.2: rooms the manager chooses when creating a class. */
export function LiveRoomsView() {
  const rooms = useLiveQuery(["rooms"], (signal) =>
    registrationApi.rooms(signal),
  );
  return (
    <PageContainer>
      <PageHeader
        title="Phòng học"
        description="Phòng dùng khi tạo lớp. Sức chứa phòng phải từ sĩ số lớp trở lên; phòng đang có buổi sắp tới không thể ngừng sử dụng."
      />
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
      <AsyncBoundary
        isLoading={rooms.isPending}
        isError={rooms.isError}
        error={rooms.error}
        onRetry={() => void rooms.refetch()}
        data={rooms.data}
        emptyProps={{ title: "Chưa có phòng học" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.data?.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}

function RoomCard({ room }: { room: RoomRecord }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{room.name}</CardTitle>
          <Badge variant={room.isActive ? "success" : "secondary"}>
            {room.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiForm
          schema={roomSchema}
          defaults={{ name: room.name, capacity: room.capacity }}
          fields={[
            { name: "name", label: "Tên phòng" },
            { name: "capacity", label: "Sức chứa", type: "number" },
          ]}
          submitLabel="Lưu phòng"
          onSubmit={(value) => registrationApi.updateRoom(room.id, value)}
        />
        <ApiForm
          key={String(room.isActive)}
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
          onSubmit={() =>
            registrationApi.updateRoom(room.id, { isActive: !room.isActive })
          }
        />
      </CardContent>
    </Card>
  );
}

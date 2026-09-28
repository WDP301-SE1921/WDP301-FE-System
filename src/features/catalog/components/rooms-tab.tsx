"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { useCatalogRooms } from "@/features/catalog/hooks/use-catalog"
import type { RoomRow } from "@/features/catalog/selectors"
import { RoomFormDialog } from "@/features/catalog/components/room-form-dialog"
import type { Room } from "@/types/catalog"

function RoomsTab() {
  const rooms = useCatalogRooms()
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)

  const columns = React.useMemo<LegacyColumnDef<RoomRow>[]>(
    () => [
      {
        id: "name",
        header: CATALOG_MSG.ROOM_COL_NAME,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.room.name}</span>
        ),
      },
      {
        id: "capacity",
        header: CATALOG_MSG.ROOM_COL_CAPACITY,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.room.capacity}
          </span>
        ),
      },
      {
        id: "classCount",
        header: CATALOG_MSG.ROOM_COL_CLASS_COUNT,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-foreground">{row.original.classCount}</span>
        ),
      },
      {
        id: "status",
        header: CATALOG_MSG.ROOM_COL_STATUS,
        cell: ({ row }) => (
          <StatusBadge
            category="room"
            status={row.original.room.isActive ? "active" : "inactive"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <RowActions
            items={[
              {
                id: "edit",
                label: CATALOG_MSG.ROOM_ACTION_EDIT,
                onClick: () => setEditingRoom(row.original.room),
              },
            ]}
          />
        ),
      },
    ],
    []
  )

  return (
    <Card className="gap-4">
      <DataTable
        columns={columns}
        data={rooms.data ?? []}
        isLoading={rooms.isPending}
        isError={rooms.isError}
        error={rooms.error}
        onRetry={() => rooms.refetch()}
      />

      {editingRoom && (
        <RoomFormDialog
          key={editingRoom.id}
          open={Boolean(editingRoom)}
          onOpenChange={(open) => {
            if (!open) setEditingRoom(null)
          }}
          room={editingRoom}
        />
      )}
    </Card>
  )
}

export { RoomsTab }

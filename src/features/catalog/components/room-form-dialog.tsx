"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { FloppyDiskIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { useUpdateRoom } from "@/features/catalog/hooks/use-catalog"
import { roomFormSchema, type RoomFormInput } from "@/lib/validators/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import type { Room } from "@/types/catalog"

export interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room
}

/** Nơi gọi phải truyền `key={room.id}` để form reset đúng khi đổi phòng đang sửa. */
function RoomFormDialog({ open, onOpenChange, room }: RoomFormDialogProps) {
  const updateRoom = useUpdateRoom()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormInput>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: room.name,
      capacity: room.capacity,
      isActive: room.isActive,
    },
  })

  const onSubmit = (values: RoomFormInput) => {
    updateRoom.mutate(
      { roomId: room.id, input: values },
      {
        onSuccess: () => {
          toast.success(CATALOG_MSG.ROOM_UPDATE_SUCCESS)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{CATALOG_MSG.ROOM_MODAL_EDIT_TITLE}</DialogTitle>
        </DialogHeader>

        <form id="room-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="room-name" required>
              {CATALOG_MSG.ROOM_FIELD_NAME}
            </Label>
            <Input id="room-name" error={Boolean(errors.name)} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-capacity" required>
              {CATALOG_MSG.ROOM_FIELD_CAPACITY}
            </Label>
            <Controller
              control={control}
              name="capacity"
              render={({ field }) => (
                <Input
                  id="room-capacity"
                  type="number"
                  min={1}
                  error={Boolean(errors.capacity)}
                  suffixIcon={
                    <span className="text-xs text-muted-foreground">
                      {CATALOG_MSG.ROOM_FIELD_CAPACITY_UNIT}
                    </span>
                  }
                  value={field.value || ""}
                  onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                />
              )}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="room-active" className="cursor-pointer">
                  {CATALOG_MSG.ROOM_FIELD_ACTIVE}
                </Label>
                <Switch id="room-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="room-form"
            className="rounded-full"
            isLoading={updateRoom.isPending}
            leftIcon={<HugeiconsIcon icon={FloppyDiskIcon} />}
          >
            {ACTION_LABEL.SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { RoomFormDialog }

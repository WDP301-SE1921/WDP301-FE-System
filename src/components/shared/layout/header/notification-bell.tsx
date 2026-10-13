"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { Notification01Icon, Task01Icon } from "@hugeicons/core-free-icons"

export interface NotificationItem {
  id: string
  title: string
  time: string
  unread?: boolean
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Yêu cầu đăng ký học bù mới từ phụ huynh",
    time: "10 phút trước",
    unread: true,
  },
  {
    id: "2",
    title: "Có 3 bài kiểm tra môn Toán cần phê duyệt",
    time: "1 giờ trước",
    unread: true,
  },
  {
    id: "3",
    title: "Đã gửi thành công 45 thông báo qua Email",
    time: "Hôm nay",
    unread: false,
  },
]

function NotificationBell() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full text-muted-foreground hover:text-foreground"
          />
        }
      >
        <HugeiconsIcon icon={Notification01Icon} className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
        <span className="sr-only">Thông báo</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-3.5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold text-foreground">
              Thông báo & Việc cần làm
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} mới
              </span>
            )}
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {MOCK_NOTIFICATIONS.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                item.unread ? "bg-muted/20" : ""
              }`}
            >
              <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                <HugeiconsIcon icon={Task01Icon} className="size-4" />
              </div>
              <div className="flex-1 text-xs">
                <p className={`font-medium text-foreground ${item.unread ? "font-semibold" : ""}`}>
                  {item.title}
                </p>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationBell }

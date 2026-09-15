"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ACTION_LABEL } from "@/constants/messages"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  UserAdd01Icon,
  TeacherIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons"

function QuickCreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="default"
            size="sm"
            className="hidden sm:inline-flex rounded-full gap-1.5"
          />
        }
      >
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        <span>{ACTION_LABEL.QUICK_CREATE}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem>
          <HugeiconsIcon icon={UserAdd01Icon} />
          <span>Thêm học sinh mới</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={TeacherIcon} />
          <span>Tạo lớp học mới</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Invoice01Icon} />
          <span>Lập phiếu thu học phí</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { QuickCreateMenu }

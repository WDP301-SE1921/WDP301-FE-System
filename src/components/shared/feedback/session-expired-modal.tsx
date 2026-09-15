"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ERROR_MSG } from "@/constants/messages"
import { ROUTES } from "@/constants/routes"
import { onSessionExpired } from "@/lib/auth-events"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockKeyIcon } from "@hugeicons/core-free-icons"

function SessionExpiredModal() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setOpen(true)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleReLogin = () => {
    setOpen(false)
    router.push(ROUTES.AUTH.LOGIN)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="sm" showCloseButton={false}>
        <DialogHeader className="items-center text-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <HugeiconsIcon icon={LockKeyIcon} className="size-6" />
          </div>
          <DialogTitle>Phiên làm việc hết hạn</DialogTitle>
          <DialogDescription>{ERROR_MSG.UNAUTHORIZED}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-2">
          <Button onClick={handleReLogin} className="w-full rounded-full">
            Đăng nhập lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SessionExpiredModal }

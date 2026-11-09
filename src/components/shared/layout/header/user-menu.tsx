"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTION_LABEL } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { clearSession } from "@/lib/auth/session";
import { apiRequest, ApiError, apiErrorMessage } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  SecurityPasswordIcon,
  Logout01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";

export interface UserMenuProps {
  /** Tên người dùng; chưa biết (trước khi hydrate) thì hiện nhãn trung tính. */
  name?: string;
  roleLabel?: string;
  avatarUrl?: string;
  onAvatarStatusChange?: React.ComponentProps<
    typeof AvatarImage
  >["onLoadingStatusChange"];
  email?: string;
  /** Dòng nhỏ dưới tên — mặc định hiện `email`, truyền vào để hiện thứ khác. */
  subtitleLine?: string;
  /** Route "Tài khoản"/"Đổi mật khẩu" trỏ tới — mặc định trang hồ sơ khu back-office. */
  accountHref?: string;
  /** Mặc định: xóa phiên (cookie role + hồ sơ đã lưu) rồi về trang đăng nhập. */
  onLogout?: () => void;
}

function UserMenu({
  name = "Tài khoản",
  roleLabel,
  avatarUrl,
  onAvatarStatusChange,
  email,
  subtitleLine,
  accountHref = ROUTES.MANAGER.PROFILE,
  onLogout,
}: UserMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Tải lại hẳn trang đăng nhập: xóa cache rồi ở lại trang cũ sẽ làm các truy vấn đang hiển thị
  // gọi lại API bằng phiên vừa hủy (401). Tải trang mới bỏ toàn bộ cache và truy vấn đang chạy.
  const leave = () => {
    clearSession();
    window.location.replace(ROUTES.AUTH.LOGIN);
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    setIsLoggingOut(true);
    try {
      // Dừng các truy vấn đang chạy để không gọi API bằng phiên sắp hủy (401 sau khi đăng xuất).
      await queryClient.cancelQueries();
      await apiRequest("auth/logout", { method: "POST" });
      leave();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) leave();
      else toast.error(apiErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Mở menu tài khoản ${name}`}
        className="flex min-h-11 min-w-11 max-w-full items-center gap-2.5 rounded-full p-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none motion-reduce:transition-none"
      >
        <Avatar size="sm">
          <AvatarImage
            src={avatarUrl}
            alt={name}
            onLoadingStatusChange={onAvatarStatusChange}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 max-w-48 flex-col text-left xl:flex">
          <div className="flex items-center gap-1.5">
            <span
              className="min-w-0 truncate text-xs font-semibold leading-tight text-foreground"
              title={name}
            >
              {name}
            </span>
            {roleLabel && (
              <Badge
                variant="info"
                className="max-w-24 shrink-0 truncate px-1.5 py-0 text-[10px] h-4"
                title={roleLabel}
              >
                {roleLabel}
              </Badge>
            )}
          </div>
          {(subtitleLine ?? email) && (
            <span
              className="truncate text-[11px] text-muted-foreground"
              title={subtitleLine ?? email}
            >
              {subtitleLine ?? email}
            </span>
          )}
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-3.5 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="wrap-break-word font-semibold text-foreground">
              {name}
            </span>
            {email && (
              <span className="wrap-break-word text-xs text-muted-foreground font-normal">
                {email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(accountHref)}>
            <HugeiconsIcon icon={UserIcon} />
            <span>{ACTION_LABEL.ACCOUNT}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`${accountHref}?tab=password`)}
          >
            <HugeiconsIcon icon={SecurityPasswordIcon} />
            <span>{ACTION_LABEL.CHANGE_PASSWORD}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} />
          <span>{ACTION_LABEL.LOGOUT}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };

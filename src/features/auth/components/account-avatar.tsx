"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/feedback/api-feedback";
import { toast } from "@/components/ui/toast";
import {
  useAvatarMutations,
  useCurrentAvatar,
} from "@/features/auth/hooks/use-avatar";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { avatarFileSchema, avatarFormSchema } from "@/lib/validators/storage";
import type { AuthUser } from "@/types/auth";

export function AccountAvatar({ user }: { user: AuthUser }) {
  const avatar = useCurrentAvatar(user);
  const { upload, remove } = useAvatarMutations(user);
  const input = useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof avatarFormSchema>>({
    resolver: zodResolver(avatarFormSchema),
  });
  const watchedFile = useWatch({ control: form.control, name: "file" });
  // A native file input initially registers an empty FileList, not a chosen File.
  const file = watchedFile instanceof File ? watchedFile : undefined;
  const [preview, setPreview] = useState<{ file: File; url: string }>();
  const [notice, setNotice] = useState("");
  const busy = upload.isPending || remove.isPending;
  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview.url);
  }, [preview]);
  const clear = () => {
    form.reset();
    setPreview(undefined);
    if (input.current) input.current.value = "";
  };
  const failure = (error: unknown) => {
    const uncertain =
      error instanceof ApiError && (error.status === 0 || error.status >= 500);
    setNotice(
      uncertain
        ? "Chưa xác định được kết quả lưu ảnh. Kiểm tra ảnh hiện tại trước khi thử lại."
        : apiErrorMessage(error),
    );
  };
  const save = async ({ file }: z.infer<typeof avatarFormSchema>) => {
    setNotice("");
    try {
      await upload.mutateAsync(file);
      clear();
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      failure(error);
    }
  };
  const deleteAvatar = async () => {
    setNotice("");
    try {
      await remove.mutateAsync();
      clear();
      toast.success("Đã xóa ảnh đại diện.");
    } catch (error) {
      failure(error);
    }
  };
  const localUrl = file && preview?.file === file ? preview.url : undefined;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <form
      onSubmit={(event) => void form.handleSubmit(save)(event)}
      aria-label="Ảnh đại diện"
      aria-busy={busy}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20 shrink-0">
          <AvatarImage
            src={localUrl ?? avatar.url}
            alt={
              localUrl
                ? "Ảnh đại diện đã chọn, chưa lưu"
                : `Ảnh đại diện của ${user.name}`
            }
            onLoadingStatusChange={localUrl ? undefined : avatar.onImageStatus}
          />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="account-avatar-file">Ảnh đại diện</Label>
          <p id="account-avatar-help" className="text-sm text-muted-foreground">
            PNG hoặc JPG, tối đa 5 MiB.
          </p>
          <input
            {...form.register("file")}
            ref={(element) => {
              form.register("file").ref(element);
              input.current = element;
            }}
            id="account-avatar-file"
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            className="sr-only"
            tabIndex={-1}
            disabled={busy}
            aria-describedby="account-avatar-help account-avatar-error"
            aria-invalid={!!form.formState.errors.file}
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (!chosen) return;
              setNotice("");
              form.setValue("file", chosen, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setPreview(
                avatarFileSchema.safeParse(chosen).success
                  ? { file: chosen, url: URL.createObjectURL(chosen) }
                  : undefined,
              );
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 motion-reduce:transition-none"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              Chọn ảnh
            </Button>
            {user.hasAvatar && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-destructive motion-reduce:transition-none"
                disabled={busy}
                isLoading={remove.isPending}
                onClick={() => void deleteAvatar()}
              >
                Xóa ảnh
              </Button>
            )}
          </div>
        </div>
      </div>
      <div id="account-avatar-error">
        <FieldError message={form.formState.errors.file?.message} />
      </div>
      {file && (
        <div className="space-y-2">
          <p className="wrap-break-word text-sm text-muted-foreground">
            Đã chọn: {file.name}. Ảnh chưa được lưu.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              className="min-h-11 motion-reduce:transition-none"
              disabled={busy || !!form.formState.errors.file}
              isLoading={upload.isPending}
            >
              Lưu ảnh
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 motion-reduce:transition-none"
              disabled={busy}
              onClick={() => {
                clear();
                setNotice("");
              }}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}
      {notice && (
        <p role="alert" className="text-sm text-destructive">
          {notice}
        </p>
      )}
      {(avatar.isError || avatar.hasImageError) && !file && (
        <div className="space-y-2" role="status">
          <p className="text-sm text-muted-foreground">
            Không tải được ảnh đại diện. Bạn vẫn có thể sử dụng tài khoản.
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 motion-reduce:transition-none"
            isLoading={avatar.isFetching}
            disabled={busy}
            onClick={() => void avatar.refresh()}
          >
            Thử lại ảnh
          </Button>
        </div>
      )}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          {remove.isPending ? "Đang xóa ảnh…" : "Đang lưu ảnh…"}
        </p>
      )}
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { parseStoredUser, readStoredUserRaw } from "@/lib/auth/session";
import { isAccessFresh, toFileAccess } from "@/lib/storage/signed-url";
import { academicApi } from "@/features/academic/api";
import { submissionFileKind } from "@/features/grading/file-access";
import { useSubmissionFile } from "@/features/grading/hooks/use-submission-file";
import { useCurrentUser } from "@/hooks/use-current-role";
import type { FileAccess } from "@/types/storage";

function fileError(error: unknown) {
  if (error instanceof ApiError && error.status === 403)
    return "Bạn không có quyền truy cập tệp bài làm này.";
  if (error instanceof ApiError && error.status === 404)
    return "Tệp bài làm không còn tồn tại.";
  return "Không tải được tệp bài làm. Vui lòng thử lại sau.";
}

export function SubmissionFile({ id, index }: { id: string; index: number }) {
  const user = useCurrentUser();
  return (
    <SubmissionFileItem
      key={`${user?.id}:${id}`}
      id={id}
      index={index}
      ownerId={user?.role === "teacher" ? user.id : undefined}
    />
  );
}

function SubmissionFileItem({
  id,
  index,
  ownerId,
}: {
  id: string;
  index: number;
  ownerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [ready, setReady] = useState<FileAccess>();
  const pending = useRef<
    { controller: AbortController; tab: Window | null } | undefined
  >(undefined);
  useEffect(
    () => () => {
      pending.current?.controller.abort();
      pending.current?.tab?.close();
    },
    [],
  );
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(
      () => setReady(undefined),
      Math.max(0, ready.expiresAt - Date.now() - 1000),
    );
    return () => clearTimeout(timer);
  }, [ready]);
  const download = async () => {
    if (!ownerId || pending.current) return;
    const controller = new AbortController();
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const attempt = { controller, tab };
    pending.current = attempt;
    setBusy(true);
    setError(undefined);
    setReady(undefined);
    try {
      const access = toFileAccess(
        await academicApi.downloadFile(id, controller.signal),
        Date.now(),
      );
      if (
        controller.signal.aborted ||
        parseStoredUser(readStoredUserRaw())?.id !== ownerId
      ) {
        tab?.close();
        return;
      }
      if (tab && !tab.closed) {
        tab.location.replace(access.url);
        attempt.tab = null;
      } else setReady(access);
    } catch (failure) {
      tab?.close();
      if (!controller.signal.aborted) setError(failure);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (pending.current === attempt) pending.current = undefined;
    }
  };
  return (
    <section
      className="space-y-3 rounded-xl border border-border p-3"
      aria-label={`Tệp bài làm ${index + 1}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Tệp {index + 1}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 motion-reduce:transition-none"
            aria-expanded={open}
            disabled={!ownerId}
            onClick={() => setOpen(!open)}
          >
            {open ? "Đóng xem trước" : "Xem tệp"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 motion-reduce:transition-none"
            disabled={!ownerId || busy}
            isLoading={busy}
            onClick={() => void download()}
          >
            Tải tệp
          </Button>
        </div>
      </div>
      {open && <FilePreview id={id} index={index} />}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Đang chuẩn bị tệp tải xuống…
        </p>
      )}
      {!!error && (
        <p role="alert" className="text-sm text-destructive">
          {fileError(error)}
        </p>
      )}
      {ready && (
        <div className="space-y-2" role="status">
          <p className="text-sm text-muted-foreground">
            Tệp đã sẵn sàng. Bấm để tải xuống.
          </p>
          <Button
            variant="outline"
            className="min-h-11 motion-reduce:transition-none"
            render={
              <a
                href={ready.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  if (!isAccessFresh(ready, Date.now(), 1000)) {
                    event.preventDefault();
                    void download();
                  }
                }}
              />
            }
          >
            Tải tệp đã sẵn sàng
          </Button>
        </div>
      )}
    </section>
  );
}

function FilePreview({ id, index }: { id: string; index: number }) {
  const query = useSubmissionFile(id, true);
  const retries = useRef(0);
  const [failed, setFailed] = useState<FileAccess>();
  const imageFailed = !!query.data && failed === query.data;
  const retry = () => {
    retries.current = 0;
    void query.refetch();
  };
  if (query.isPending)
    return (
      <div role="status" aria-label="Đang tải tệp">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  if (query.isError)
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-destructive">
          {fileError(query.error)}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          isLoading={query.isFetching}
          onClick={retry}
        >
          Thử lại tệp
        </Button>
      </div>
    );
  if (!query.data) return null;
  const kind = submissionFileKind(query.data.url);
  return (
    <div className="space-y-2">
      {kind === "image" && !imageFailed ? (
        <Image
          src={query.data.url}
          unoptimized
          width={1200}
          height={1600}
          loading="lazy"
          alt={`Bài làm của học sinh, tệp ${index + 1}`}
          className="h-auto max-h-[70vh] w-full rounded-xl object-contain"
          onError={() => {
            setFailed(query.data);
            if (retries.current++ === 0) void query.refetch();
          }}
        />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {kind === "pdf"
            ? "Tệp PDF. Tải xuống để xem bài làm."
            : kind === "image"
              ? "Không tải được ảnh bài làm. Bạn có thể thử lại hoặc tải tệp."
              : "Tệp này chưa hỗ trợ xem trước. Tải xuống để xem bài làm."}
        </p>
      )}
      {imageFailed && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          isLoading={query.isFetching}
          onClick={retry}
        >
          Thử lại ảnh
        </Button>
      )}
      {query.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Đang làm mới tệp…
        </p>
      )}
    </div>
  );
}

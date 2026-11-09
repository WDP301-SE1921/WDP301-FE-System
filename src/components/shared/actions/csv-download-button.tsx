"use client";

import { useMutation } from "@tanstack/react-query";
import { ExportButton } from "@/components/shared/actions/export-button";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { downloadCsv } from "@/lib/files/csv";

interface CsvDownloadButtonProps {
  createCsv: () => string;
  filename: string;
  label?: string;
  disabled?: boolean;
}

/** Download content without saving or publishing the surrounding form. */
export function CsvDownloadButton({
  createCsv,
  filename,
  label = "Xuất CSV",
  disabled = false,
}: CsvDownloadButtonProps) {
  const download = useMutation({
    mutationFn: async () => downloadCsv(createCsv(), filename),
    retry: false,
  });
  return (
    <div className="space-y-2">
      <ExportButton
        type="button"
        label={label}
        exportingLabel="Đang tạo CSV…"
        disabled={disabled || download.isPending}
        onExport={() => download.mutateAsync().catch(() => undefined)}
      />
      <ApiFeedback error={download.error} />
    </div>
  );
}

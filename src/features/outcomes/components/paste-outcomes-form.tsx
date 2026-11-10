"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import { ApiError } from "@/lib/api/client";
import { userFacingMessage } from "@/lib/api/error-message";
import type { OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "../api";
import { nextOutcomeCode } from "../outcome-code";
import { PASTE_MAX_LINES, parsePasteLines, pasteCodes } from "../paste-outcomes";

type RowState = "waiting" | "running" | "done" | "error";
interface Row {
  text: string;
  state: RowState;
  message?: string;
  /** Dòng sai ngay lúc kiểm (quá ngắn/dài): không đưa vào "Thử lại". */
  invalid?: boolean;
}

/** Dán nhiều mục tiêu: mỗi dòng một mục tiêu, tạo lần lượt với mã tự gợi (C29). */
export function PasteOutcomesForm({
  set,
  programId,
  onClose,
}: {
  set: OutcomeSet;
  programId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"required" | "optional">("required");
  // Tên mục tiêu đã có trước khi bắt đầu dán, để không coi dòng trùng là "đã tạo".
  const existingTitles = useRef<Set<string> | null>(null);
  const program = useLiveQuery(
    ["program-code", programId],
    (signal) => registrationApi.program(programId, signal),
    set.outcomes.length === 0,
  );
  const parsed = parsePasteLines(text);
  const fallback = {
    subjectCode: program.data?.subjectRecord?.code,
    grade: program.data?.grade,
  };

  const patch = (index: number, value: Partial<Row>) =>
    setRows((current) =>
      current?.map((row, i) => (i === index ? { ...row, ...value } : row)) ?? current,
    );

  async function run(list: Row[], onlyFailed: boolean) {
    setBusy(true);
    // Lấy lại bộ trước khi tạo để mã gợi tiếp sau mã mới nhất.
    let codes: string[] = set.outcomes.map((item) => item.code);
    let titles: string[] = set.outcomes.map((item) => item.title);
    const reload = async () => {
      // Tải cả danh sách bộ của khóa rồi tìm theo id.
      const fresh = (await outcomeApi.sets(programId)).find((item) => item.id === set.id);
      if (!fresh) throw new Error("outcome set not found");
      codes = fresh.outcomes.map((item) => item.code);
      titles = fresh.outcomes.map((item) => item.title);
    };
    try {
      await reload();
    } catch {
      // Dùng bộ đang hiện nếu không tải lại được.
    }
    if (!existingTitles.current) existingTitles.current = new Set(titles);
    // Thử lại: dòng đã có trong bộ mà không có từ đầu là lần trước BE đã tạo (vd quá thời gian chờ).
    const afterReload = new Set(titles);
    for (let i = 0; i < list.length; i++) {
      if (list[i].invalid) continue;
      if (onlyFailed !== (list[i].state === "error")) continue;
      if (existingTitles.current?.has(list[i].text)) {
        patch(i, { state: "error", message: "Đã có, bỏ qua.", invalid: true });
        continue;
      }
      if (onlyFailed && afterReload.has(list[i].text)) {
        patch(i, { state: "done", message: undefined });
        continue;
      }
      patch(i, { state: "running", message: undefined });
      let attempt = 0;
      for (;;) {
        const [code] = pasteCodes((used) => nextOutcomeCode(used, fallback), codes, 1);
        if (!code) {
          patch(i, {
            state: "error",
            message: "Chưa gợi được mã. Thêm một mục tiêu bằng tay trước rồi dán tiếp.",
          });
          break;
        }
        try {
          await outcomeApi.saveOutcome(set.id, {
            code,
            title: list[i].text,
            statement: list[i].text,
            required: kind === "required",
          });
          codes.push(code);
          titles.push(list[i].text);
          patch(i, { state: "done" });
          break;
        } catch (error) {
          if (error instanceof ApiError && error.code === "RESOURCE_CONFLICT" && attempt < 2) {
            // Trùng mã: có thể dòng này đã tạo ở lần trước, tải lại rồi tính mã tiếp.
            attempt += 1;
            try {
              await reload();
            } catch {
              codes.push(code);
            }
            if (titles.includes(list[i].text)) {
              patch(i, { state: "done" });
              break;
            }
            continue;
          }
          patch(i, { state: "error", message: userFacingMessage(error) });
          break;
        }
      }
    }
    setBusy(false);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["web-api"] }),
      client.invalidateQueries({ queryKey: ["outcome-sets", programId] }),
    ]);
  }

  async function start() {
    const list: Row[] = parsed.lines.map((line) => ({
      text: line.text,
      state: line.error ? "error" : "waiting",
      message: line.error,
      invalid: !!line.error,
    }));
    setRows(list);
    await run(list, false);
  }

  const done = rows?.filter((row) => row.state === "done").length ?? 0;
  const failed = rows?.filter((row) => row.state === "error").length ?? 0;
  const retryable = rows?.filter((row) => row.state === "error" && !row.invalid).length ?? 0;
  const finished = !!rows && !busy && rows.every((row) => row.state === "done");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Dán nhiều mục tiêu</DialogTitle>
        <DialogDescription>
          Mỗi dòng là một mục tiêu (tối đa {PASTE_MAX_LINES} dòng). Mã được gợi tự động.
        </DialogDescription>
      </DialogHeader>
      {!rows ? (
        <div className="space-y-3">
          <Textarea
            rows={10}
            aria-label="Danh sách mục tiêu, mỗi dòng một mục tiêu"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={"Giải được phương trình bậc nhất một ẩn\nVẽ được đồ thị hàm số y = ax + b"}
          />
          <ChoiceCards
            legend="Loại cho tất cả mục tiêu dán vào"
            value={kind}
            onChange={(value) => setKind(value as "required" | "optional")}
            options={[
              { value: "required", label: "Bắt buộc" },
              { value: "optional", label: "Mở rộng" },
            ]}
          />
          {parsed.tooMany && (
            <p className="text-sm text-destructive">
              Chỉ tạo được {PASTE_MAX_LINES} mục tiêu mỗi lần. Các dòng sau dòng thứ{" "}
              {PASTE_MAX_LINES} sẽ bị bỏ, hãy dán phần còn lại ở lần sau.
            </p>
          )}
          <Button
            disabled={!parsed.lines.length || busy}
            onClick={() => void start()}
          >
            Tạo {parsed.lines.length} mục tiêu
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium" aria-live="polite">
            Đã tạo {done}/{rows.length}
            {failed ? `, ${failed} dòng lỗi` : ""}
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {rows.map((row, index) => (
              <li key={index} className="rounded-xl border border-border p-2">
                <span className="mr-2 text-muted-foreground">
                  {row.state === "done"
                    ? "Xong"
                    : row.state === "running"
                      ? "Đang tạo…"
                      : row.state === "error"
                        ? "Lỗi"
                        : "Chờ"}
                </span>
                {row.text}
                {row.message && (
                  <p className="text-destructive">{row.message}</p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {retryable > 0 && !busy && (
              <Button onClick={() => void run(rows, true)}>Thử lại các dòng lỗi</Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (finished) toast.success(`Đã thêm ${done} mục tiêu.`);
                onClose();
              }}
            >
              {finished ? "Xong" : failed ? `Đóng (${failed} dòng chưa tạo)` : "Đóng"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CompareRow {
  label: ReactNode;
  before: ReactNode;
  after: ReactNode;
  /** `changed`: tô xanh; `blocked`: không đạt điều kiện / mất đi; `ok`: điều kiện đạt; mặc định: giữ nguyên. */
  state?: "same" | "changed" | "blocked" | "ok";
}

/**
 * Bảng "Hiện tại → Sau khi xác nhận". Chỉ hiển thị: mọi giá trị do nơi gọi tính từ dữ liệu đã tải,
 * không gọi API và không quyết định thao tác có được gửi hay không. Dưới `sm` mỗi hàng thành một
 * khối: giá trị cũ gạch ngang, giá trị mới ngay bên dưới.
 */
export function CompareTable({
  rows,
  caption = "Hiện tại và sau khi xác nhận",
  beforeLabel = "Hiện tại",
  afterLabel = "Sau khi xác nhận",
}: {
  rows: CompareRow[];
  caption?: ReactNode;
  beforeLabel?: ReactNode;
  afterLabel?: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{caption}</h3>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sr-only sm:not-sr-only">
            <tr className="text-left">
              <th scope="col" className="w-36 px-4 py-3 font-medium text-muted-foreground">
                <span className="sr-only">Mục</span>
              </th>
              <th scope="col" className="bg-muted/50 px-4 py-3 font-semibold">
                {beforeLabel}
              </th>
              <th scope="col" className="w-8 bg-muted/50 px-0 py-3">
                <span className="sr-only">thành</span>
              </th>
              <th scope="col" className="bg-primary/5 px-4 py-3 font-semibold text-primary">
                {afterLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const state = row.state ?? "same";
              const isChanged = state === "changed";
              return (
                <tr
                  key={index}
                  className="grid grid-cols-1 border-t border-border first:border-t-0 sm:table-row sm:first:border-t"
                >
                  <th
                    scope="row"
                    className="px-4 pt-3 text-left font-medium text-muted-foreground sm:py-3 sm:font-normal"
                  >
                    {row.label}
                  </th>
                  <td
                    className={cn(
                      "px-4 text-muted-foreground sm:bg-muted/50 sm:py-3 sm:text-foreground/80",
                      isChanged && "line-through decoration-muted-foreground/60 sm:no-underline",
                      state === "same" && "hidden sm:table-cell",
                    )}
                  >
                    {row.before}
                  </td>
                  <td
                    aria-hidden="true"
                    className={cn(
                      "hidden px-0 text-center sm:table-cell sm:bg-muted/50 sm:py-3",
                      isChanged || state === "blocked"
                        ? "text-primary"
                        : "text-muted-foreground/50",
                    )}
                  >
                    {state === "same" || state === "ok" ? "=" : "→"}
                  </td>
                  <td
                    className={cn(
                      "px-4 pb-3 sm:py-3",
                      isChanged && "bg-primary/5 font-semibold text-primary",
                      state === "blocked" && "bg-destructive/5 font-semibold text-destructive",
                      state === "ok" && "font-semibold text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {row.after}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

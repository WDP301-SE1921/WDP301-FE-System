"use client";

import { actsAsManager } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  curriculumCsv,
  curriculumCsvTemplate,
  outcomeCodeMap,
  outcomeCodesReady,
} from "../../csv-export";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitActionsMenu({
  ws,
  showUnitEdit = true,
}: {
  ws: UnitWorkspace;
  showUnitEdit?: boolean;
}) {
  const {
    role,
    unit,
    canEdit,
    isOwnerDesigner,
    hasMenu,
    busy,
    formState,
    regular,
    openEditor,
    download,
    setDeleting,
  } = ws;
  if (!unit || !hasMenu) return null;
  const codeById = outcomeCodeMap(ws.outcomeSets.data ?? []);
  const codesReady = outcomeCodesReady(unit.lessons, codeById);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={busy}
            aria-label="Thêm thao tác với giáo trình"
          />
        }
      >
        Thêm
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <>
            {showUnitEdit && (
              <DropdownMenuItem onClick={() => openEditor({ kind: "unit" })}>
                Sửa thông tin giáo trình
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openEditor({ kind: "import" })}>
              Nhập bài từ file
            </DropdownMenuItem>
          </>
        )}
        {isOwnerDesigner && (
          <>
            <DropdownMenuItem
              onClick={() => download(curriculumCsvTemplate, "giao-trinh-mau")}
            >
              Tải file mẫu
            </DropdownMenuItem>
            {ws.outcomeSets.isError && !codesReady ? (
              <DropdownMenuItem
                closeOnClick={false}
                onClick={() => void ws.outcomeSets.refetch()}
              >
                Chưa tải được mã mục tiêu. Tải lại để xuất bài kèm mã. Bấm để tải lại.
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={formState.dirty || !regular.length || !codesReady}
                onClick={() =>
                  download(
                    () => curriculumCsv(unit.lessons, codeById),
                    unit.title,
                  )
                }
              >
                {codesReady ? "Xuất bài ra file" : "Đang tải mã mục tiêu…"}
              </DropdownMenuItem>
            )}
          </>
        )}
        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleting("unit")}
            >
              Xóa bản nháp
            </DropdownMenuItem>
          </>
        )}
        {actsAsManager(role) && unit.status === "PENDING_REVIEW" && (
          <DropdownMenuItem
            onClick={() => openEditor({ kind: "request-changes" })}
          >
            Trả lại để sửa
          </DropdownMenuItem>
        )}
        {actsAsManager(role) && unit.status === "APPROVED" && (
          <DropdownMenuItem onClick={() => setDeleting("unit")}>
            Lưu trữ giáo trình
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

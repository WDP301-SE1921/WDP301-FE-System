import * as React from "react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PrintLayout } from "@/components/shared/actions/print-layout"
import { formatMoneyInWords } from "@/lib/format"

export interface ReceiptLine {
  id: string
  /** Nội dung thu, vd "Học phí môn Toán 8A". */
  label: string
  /** Mô tả phụ dưới nội dung, vd giai đoạn áp dụng. */
  note?: string
  /** Số lượng hiển thị, vd "3 tháng" hoặc "1 bộ". */
  quantity: string
  unitPrice: number
  amount: number
}

export interface ReceiptParty {
  label: string
  value: string
  sub?: string
}

export interface ReceiptProps {
  /** Mã biên lai, vd "BL-20260915-0012". */
  code: string
  issuedAt: string
  /** Badge trạng thái ở góc, vd "Đã thanh toán". */
  statusLabel?: string
  centerName: string
  centerAddress: string
  centerContact: string
  /** Khối thông tin bên trái (học sinh, phụ huynh). */
  parties: ReceiptParty[]
  /** Khối thông tin bên phải (môn, lớp, lịch học, thời gian học). */
  courseInfo: ReceiptParty[]
  lines: ReceiptLine[]
  total: number
  methodLabel: string
  payerName: string
  confirmedByName: string
  confirmedByRole: string
  confirmedAt: string
  className?: string
}

/**
 * Biên lai thu học phí, dùng chung cho mọi luồng cần in biên lai
 * (wizard Đăng ký học và Lịch sử thanh toán) — xem `.claude/skills/enrollment-flow`.
 * Bọc sẵn `PrintLayout` nên gọi `window.print()` từ nút bên ngoài là in được.
 */
function Receipt({
  code,
  issuedAt,
  statusLabel,
  centerName,
  centerAddress,
  centerContact,
  parties,
  courseInfo,
  lines,
  total,
  methodLabel,
  payerName,
  confirmedByName,
  confirmedByRole,
  confirmedAt,
  className,
}: ReceiptProps) {
  return (
    <PrintLayout>
      <div className={cn("space-y-5 rounded-2xl bg-white p-6 text-zinc-900", className)}>
        {/* Đầu biên lai */}
        <div className="flex flex-col gap-4 border-b-2 border-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground">
              EG
            </span>
            <div className="min-w-0">
              <p className="font-heading text-base font-bold text-primary">
                {centerName}
              </p>
              <p className="text-xs text-zinc-600">{centerAddress}</p>
              <p className="text-xs text-zinc-600">{centerContact}</p>
            </div>
          </div>

          <div className="shrink-0 space-y-1 sm:text-right">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
              Chứng từ thu tiền điện tử
            </p>
            <p className="font-heading text-lg font-bold text-primary">
              BIÊN LAI THU HỌC PHÍ
            </p>
            <p className="font-mono text-xs text-zinc-600">Số BL: {code}</p>
            <p className="text-xs text-zinc-600">Ngày phát hành: {issuedAt}</p>
            {statusLabel && (
              <Badge variant="success" className="rounded-full">
                {statusLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Thông tin học sinh & khóa học */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PartyBlock title="Thông tin học sinh & phụ huynh" items={parties} />
          <PartyBlock title="Khóa học áp dụng" items={courseInfo} />
        </div>

        {/* Bảng nội dung thu */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nội dung thu</TableHead>
              <TableHead>Thời lượng</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <p className="text-sm font-medium text-zinc-900">{line.label}</p>
                  {line.note && (
                    <p className="text-xs text-zinc-500">{line.note}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {line.quantity}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-zinc-600">
                  {line.unitPrice.toLocaleString("vi-VN")} ₫
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums text-zinc-900">
                  {line.amount.toLocaleString("vi-VN")} ₫
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Tổng cộng */}
        <div className="flex flex-col gap-2 rounded-2xl bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Phương thức: <span className="font-medium text-zinc-900">{methodLabel}</span>
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-600">Tổng cộng:</span>
            <span className="font-heading text-2xl font-bold tabular-nums text-primary">
              {total.toLocaleString("vi-VN")} ₫
            </span>
          </p>
        </div>

        <p className="text-xs text-zinc-600 italic">
          Số tiền viết bằng chữ: {formatMoneyInWords(total)}.
        </p>

        {/* Chữ ký */}
        <div className="grid grid-cols-1 gap-5 border-t border-zinc-200 pt-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
              Người nộp tiền
            </p>
            <p className="text-xs text-zinc-500 italic">Ký điện tử qua app PH</p>
            <p className="text-sm font-semibold text-zinc-900">{payerName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
              Người xác nhận thu
            </p>
            <p className="text-xs text-zinc-500 italic">
              Xác nhận lúc {confirmedAt}
            </p>
            <p className="text-sm font-semibold text-primary">{confirmedByName}</p>
            <p className="text-xs text-zinc-500">{confirmedByRole}</p>
          </div>
        </div>
      </div>
    </PrintLayout>
  )
}

function PartyBlock({
  title,
  items,
}: {
  title: string
  items: ReceiptParty[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">{title}</p>
      <dl className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-zinc-500">{item.label}</dt>
            <dd className="text-sm font-medium text-zinc-900">
              {item.value}
              {item.sub && (
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  {item.sub}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { Receipt }

"use client";
import { useState, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInWords } from "@/lib/format";
import {
  caretAfterDigits,
  formatMoneyDigits,
  isMoneyTextTooLong,
  parseMoneyText,
} from "../money";

interface MoneyInputProps {
  id: string;
  /** Số đồng; `NaN` khi ô đang trống. */
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** id dòng lỗi, để trình đọc màn hình đọc lỗi kèm ô. */
  errorId?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Ô nhập tiền VND: hiện số có dấu chấm ngăn cách (1.500.000) và dòng số tiền bằng chữ
 * bên dưới. Giá trị đưa ra ngoài luôn là số, tối đa 999.999.999.999.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  name,
  disabled,
  invalid,
  errorId,
  inputRef,
}: MoneyInputProps) {
  const wordsId = `${id}-words`;
  // Chỉ là trạng thái hiển thị của lần gõ vừa rồi (số thừa đã bị cắt), không phải giá trị form.
  const [isTooLong, setIsTooLong] = useState(false);
  return (
    <>
      <Input
        id={id}
        ref={inputRef}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        aria-invalid={invalid || isTooLong || undefined}
        aria-describedby={[wordsId, errorId].filter(Boolean).join(" ")}
        value={formatMoneyDigits(value)}
        onBlur={onBlur}
        onChange={(event) => {
          const input = event.currentTarget;
          const caret = input.selectionStart ?? input.value.length;
          // Giữ con trỏ sau đúng số chữ số đã đứng trước nó, vì dấu chấm được chèn lại.
          const digitsBefore = input.value
            .slice(0, caret)
            .replace(/\D/g, "").length;
          const next = parseMoneyText(input.value);
          setIsTooLong(isMoneyTextTooLong(input.value));
          onChange(next);
          const position = caretAfterDigits(formatMoneyDigits(next), digitsBefore);
          requestAnimationFrame(() => {
            if (document.activeElement === input)
              input.setSelectionRange(position, position);
          });
        }}
      />
      {isTooLong ? (
        <p id={wordsId} role="alert" className="text-xs text-destructive">
          Vượt quá 999.999.999.999 đồng.
        </p>
      ) : (
        <p id={wordsId} className="text-xs text-muted-foreground">
          {Number.isFinite(value)
            ? formatMoneyInWords(value)
            : "Chưa nhập số tiền."}
        </p>
      )}
    </>
  );
}

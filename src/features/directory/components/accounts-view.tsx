"use client";
import { z } from "zod";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { BackendUser } from "@/types/backend";
import {
  accountCreateSchema,
  accountUpdateSchema,
} from "@/lib/validators/web-workflows";
import { directoryApi, type AccountKind } from "../api";

export const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "DISABLED", label: "Đã khóa" },
];

export type { AccountKind };

/** Vai trò BE → nhãn hiển thị của tài khoản nội bộ. */
export const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  STAFF: "Nhân viên",
  CURRICULUM_DESIGNER: "Thiết kế giáo trình",
  TEACHER: "Giáo viên",
};
/** `kind` chọn API tạo tài khoản; `accountCreateSchema` bỏ trường này trước khi gửi. */
const staffAccountCreateSchema = accountCreateSchema.extend({
  kind: z.enum(["staff", "curriculum-designers"]),
});

/** Quản lý tạo tài khoản Nhân viên hoặc Thiết kế giáo trình (BE-10). */
export function StaffAccountCreateForm({ onDone }: { onDone: () => void }) {
  return (
    <ApiForm
      schema={staffAccountCreateSchema}
      defaults={{ kind: "staff", email: "", displayName: "", password: "" }}
      fields={[
        {
          name: "kind",
          label: "Vai trò",
          type: "select",
          options: [
            { value: "staff", label: ACCOUNT_ROLE_LABEL.STAFF },
            {
              value: "curriculum-designers",
              label: ACCOUNT_ROLE_LABEL.CURRICULUM_DESIGNER,
            },
          ],
          description:
            "Nhân viên vận hành ghi danh, nghỉ học, học bù. Thiết kế giáo trình soạn khóa học và giáo trình.",
        },
        { name: "displayName", label: "Họ tên" },
        { name: "email", label: "Email", type: "email" },
        {
          name: "password",
          label: "Mật khẩu ban đầu",
          type: "password",
          description:
            "Ít nhất 8 ký tự. Cung cấp mật khẩu cho người nhận qua kênh riêng.",
        },
      ]}
      submitLabel="Tạo tài khoản"
      successMessage={false}
      onSubmit={({ kind, ...value }) =>
        directoryApi.createAccount(
          kind === "curriculum-designers" ? kind : "staff",
          value,
        )
      }
      onSuccess={(result) => {
        const role = (result as BackendUser | undefined)?.role;
        toast.success(
          `Đã tạo tài khoản ${(ACCOUNT_ROLE_LABEL[role ?? "STAFF"] ?? "nhân viên").toLowerCase()}.`,
        );
        onDone();
      }}
    />
  );
}

/** Sửa họ tên và khóa / mở tài khoản giáo viên, nhân viên, thiết kế giáo trình. Email chỉ đọc. */
export function AccountEditForm({
  kind,
  account,
  onDone,
}: {
  kind: AccountKind;
  account: BackendUser;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`account-email-${account.id}`}>Email</Label>
        <Input
          id={`account-email-${account.id}`}
          value={account.email}
          readOnly
          disabled
        />
      </div>
      <ApiForm
        key={account.id}
        schema={accountUpdateSchema}
        defaults={{
          displayName: account.displayName ?? "",
          status: account.status,
        }}
        fields={[
          { name: "displayName", label: "Họ tên" },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: ACCOUNT_STATUS_OPTIONS,
            description:
              "Khóa thì không đăng nhập được; dữ liệu lớp và buổi dạy vẫn giữ.",
          },
        ]}
        successMessage={false}
        onSubmit={(value) =>
          directoryApi.updateAccount(kind, account.id, value)
        }
        onSuccess={() => {
          toast.success("Đã lưu tài khoản.");
          onDone();
        }}
      />
    </div>
  );
}

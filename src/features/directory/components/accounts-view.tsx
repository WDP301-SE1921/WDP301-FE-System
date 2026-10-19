"use client";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { BackendUser } from "@/types/backend";
import {
  accountCreateSchema,
  accountUpdateSchema,
} from "@/lib/validators/web-workflows";
import { directoryApi } from "../api";

export const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "DISABLED", label: "Đã khóa" },
];

export type AccountKind = "staff" | "teachers";

/** Quản lý tạo tài khoản Nhân viên; Thiết kế giáo trình chờ BE-10 nên không có ô chọn vai trò. */
export function StaffAccountCreateForm({ onDone }: { onDone: () => void }) {
  return (
    <ApiForm
      schema={accountCreateSchema}
      defaults={{ email: "", displayName: "", password: "" }}
      fields={[
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
      onSubmit={(value) => directoryApi.createAccount("staff", value)}
      onSuccess={() => {
        toast.success("Đã tạo tài khoản nhân viên.");
        onDone();
      }}
    />
  );
}

/** Sửa họ tên và khóa / mở tài khoản giáo viên hoặc nhân viên. Email chỉ đọc. */
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
        key={`${account.id}-${account.status}-${account.displayName}`}
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

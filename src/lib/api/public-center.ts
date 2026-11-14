import type { CenterInfo, PublicSubject } from "@/types/backend";
import { backendBaseUrl, readBackend } from "./server";

/** Trang công khai chờ BE tối đa chừng này rồi hiện bản không có dữ liệu trung tâm. */
const PUBLIC_TIMEOUT_MS = 5000;
/** Admin sửa thông tin trung tâm hoặc môn học thì trang công khai đổi theo sau tối đa 5 phút. */
const PUBLIC_REVALIDATE_SECONDS = 300;

async function readPublic<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${backendBaseUrl()}/${path}`, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(PUBLIC_TIMEOUT_MS),
    });
    return await readBackend<T>(response);
  } catch (error) {
    console.warn(
      `[public-center] Không đọc được ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/** Thông tin liên hệ của trung tâm; `null` khi BE lỗi hoặc không tới được. */
export function getPublicCenter(): Promise<CenterInfo | null> {
  return readPublic<CenterInfo>("center");
}

/** Môn đang hoạt động; mảng rỗng khi BE lỗi hoặc không tới được. */
export async function getPublicSubjects(): Promise<PublicSubject[]> {
  const subjects = await readPublic<PublicSubject[]>("center/subjects");
  return Array.isArray(subjects) ? subjects : [];
}

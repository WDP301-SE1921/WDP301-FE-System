import { cookies } from "next/headers"
import { isWebRole, type WebRole } from "@/constants/roles"
import { STORAGE_KEYS } from "@/constants/storage-keys"

/**
 * Role của request hiện tại, đọc ở Server Component (layout/page). `proxy.ts` đã chặn role
 * sai trước khi tới đây, nên `null` chỉ xảy ra khi route không nằm sau proxy.
 */
export async function getServerRole(): Promise<WebRole | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(STORAGE_KEYS.ROLE_COOKIE)?.value
  return isWebRole(value) ? value : null
}

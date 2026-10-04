import { headers } from "next/headers";
import { isWebRole, type WebRole } from "@/constants/roles";
import { VERIFIED_ROLE_HEADER } from "@/lib/api/server";

/**
 * Role validated against /auth/me by Proxy. The inbound client header is overwritten
 * before protected layouts/pages render; a role cookie is never used as authorization.
 */
export async function getServerRole(): Promise<WebRole | null> {
  const requestHeaders = await headers();
  const value = requestHeaders.get(VERIFIED_ROLE_HEADER);
  return isWebRole(value) ? value : null;
}

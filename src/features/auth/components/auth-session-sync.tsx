"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { persistSession, readStoredUserRaw } from "@/lib/auth/session";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { AuthUser } from "@/types/auth";
import type { WebRole } from "@/constants/roles";

export function AuthSessionSync({ role }: { role: WebRole }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiRequest<AuthUser>("auth/me"),
    retry: false,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (!query.data) return;
    if (readStoredUserRaw() !== JSON.stringify(query.data))
      persistSession(
        query.data,
        window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE) !== null,
      );
    if (query.data.role !== role) router.refresh();
  }, [query.data, role, router]);
  return null;
}

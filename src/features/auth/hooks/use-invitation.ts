"use client"

import { useQuery } from "@tanstack/react-query"
import { mockGetInvitation } from "@/mocks/data/auth"
import { mockQuery } from "@/mocks/utils/mock-query"
import type { Invitation } from "@/types/auth"

/** Giải mã lời mời từ token trên URL. Đổi `queryFn` khi có endpoint thật. */
export function useInvitation(token: string) {
  return useQuery<Invitation>({
    queryKey: ["invitation", token],
    queryFn: () => mockQuery(() => mockGetInvitation(token)),
    enabled: token.length > 0,
    retry: false,
  })
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { curriculumApi } from "../api";
import type { CurriculumFilters } from "@/types/curriculum";
import { ApiError } from "@/lib/api/client";
import { isCurriculumQuery } from "../query-refresh";

export const curriculumKeys = {
  all: ["curriculum"] as const,
  units: (programId?: string) =>
    ["curriculum", "units", programId ?? "all"] as const,
  unit: (id: string) => ["curriculum", "unit", id] as const,
  sessions: (classId: string) => ["curriculum", "sessions", classId] as const,
};

export function useCurriculumUnits(programId?: string) {
  return useQuery({
    queryKey: curriculumKeys.units(programId),
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    retry: false,
  });
}
export function useCurriculumUnit(id: string) {
  return useQuery({
    queryKey: curriculumKeys.unit(id),
    queryFn: ({ signal }) => curriculumApi.unit(id, signal),
    retry: false,
  });
}
export function useCurriculumUnitPage(filters: CurriculumFilters) {
  return useQuery({
    queryKey: ["curriculum", "units", filters],
    queryFn: ({ signal }) => curriculumApi.unitPage(filters, signal),
    retry: false,
  });
}
export function useCurriculumMutation<T>(
  mutationFn: (input: T) => Promise<unknown>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: () => client.invalidateQueries({ predicate: (query) => isCurriculumQuery(query.queryKey) }),
    onError: (error) => {
      if (error instanceof ApiError && ["CURRICULUM_EFFECTIVE_PERIOD_CONFLICT", "REVISION_CONFLICT", "UNIT_LOCKED", "UNIT_NOT_APPROVED", "PREVIEW_STALE"].includes(error.code))
        void client.invalidateQueries({ predicate: (query) => isCurriculumQuery(query.queryKey) });
    },
  });
}

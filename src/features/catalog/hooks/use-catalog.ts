"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  findProgramRow,
  getGradeRows,
  getProgramLessons,
  getProgramRows,
  getRoomRows,
  getSubjectRows,
  type GradeRow,
  type ProgramRow,
  type RoomRow,
  type SubjectRow,
} from "@/features/catalog/selectors"
import {
  mockAddLesson,
  mockCreateProgram,
  mockDeleteLesson,
  mockReorderLessons,
  mockUpdateLesson,
  mockUpdateProgram,
  mockUpdateRoom,
  type LessonInput,
  type ProgramInput,
  type RoomInput,
} from "@/mocks/data/catalog"
import type { Lesson, Program, Room } from "@/types/catalog"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useCatalogPrograms() {
  return useQuery<ProgramRow[]>({
    queryKey: ["catalog-programs"],
    queryFn: () => mockQuery(() => getProgramRows()),
  })
}

export interface ProgramDetailData {
  row: ProgramRow
  lessons: Lesson[]
}

export function useCatalogProgramDetail(programId: string) {
  return useQuery<ProgramDetailData | null>({
    queryKey: ["catalog-program", programId],
    queryFn: () =>
      mockQuery(() => {
        const row = findProgramRow(programId)
        if (!row) return null
        return { row, lessons: getProgramLessons(programId) }
      }),
    enabled: programId.length > 0,
  })
}

export function useCatalogRooms() {
  return useQuery<RoomRow[]>({
    queryKey: ["catalog-rooms"],
    queryFn: () => mockQuery(() => getRoomRows()),
  })
}

export function useCatalogSubjects() {
  return useQuery<SubjectRow[]>({
    queryKey: ["catalog-subjects"],
    queryFn: () => mockQuery(() => getSubjectRows()),
  })
}

export function useCatalogGrades() {
  return useQuery<GradeRow[]>({
    queryKey: ["catalog-grades"],
    queryFn: () => mockQuery(() => getGradeRows()),
  })
}

export function useCreateProgram() {
  const queryClient = useQueryClient()

  return useMutation<Program, Error, ProgramInput>({
    mutationFn: (input) => mockMutation(input, mockCreateProgram),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-programs"] })
      queryClient.invalidateQueries({ queryKey: ["catalog-grades"] })
      queryClient.invalidateQueries({ queryKey: ["catalog-subjects"] })
    },
  })
}

export interface UpdateProgramVariables {
  programId: string
  input: ProgramInput
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()

  return useMutation<Program, Error, UpdateProgramVariables>({
    mutationFn: ({ programId, input }) =>
      mockMutation({ programId, input }, (vars) => mockUpdateProgram(vars.programId, vars.input)),
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-programs"] })
      queryClient.invalidateQueries({ queryKey: ["catalog-program", program.id] })
      queryClient.invalidateQueries({ queryKey: ["catalog-grades"] })
      queryClient.invalidateQueries({ queryKey: ["catalog-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useAddLesson() {
  const queryClient = useQueryClient()

  return useMutation<Lesson, Error, LessonInput>({
    mutationFn: (input) => mockMutation(input, mockAddLesson),
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-program", lesson.programId] })
    },
  })
}

export interface UpdateLessonVariables {
  lessonId: string
  programId: string
  title: string
  chapter: string
  description: string
}

export function useUpdateLesson() {
  const queryClient = useQueryClient()

  return useMutation<Lesson, Error, UpdateLessonVariables>({
    mutationFn: (vars) =>
      mockMutation(vars, () =>
        mockUpdateLesson(vars.lessonId, {
          title: vars.title,
          chapter: vars.chapter,
          description: vars.description,
        })
      ),
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-program", lesson.programId] })
    },
  })
}

export interface DeleteLessonVariables {
  lessonId: string
  programId: string
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, Error, DeleteLessonVariables>({
    mutationFn: (vars) => mockMutation(vars, () => mockDeleteLesson(vars.lessonId)),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-program", vars.programId] })
    },
  })
}

export interface ReorderLessonsVariables {
  programId: string
  orderedLessonIds: string[]
}

export function useReorderLessons() {
  const queryClient = useQueryClient()

  return useMutation<Lesson[], Error, ReorderLessonsVariables>({
    mutationFn: (vars) =>
      mockMutation(vars, () => mockReorderLessons(vars.programId, vars.orderedLessonIds)),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-program", vars.programId] })
    },
  })
}

export interface UpdateRoomVariables {
  roomId: string
  input: RoomInput
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation<Room, Error, UpdateRoomVariables>({
    mutationFn: ({ roomId, input }) =>
      mockMutation({ roomId, input }, (vars) => mockUpdateRoom(vars.roomId, vars.input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-rooms"] })
    },
  })
}

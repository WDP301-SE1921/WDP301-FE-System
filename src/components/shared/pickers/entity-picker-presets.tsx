"use client"

import * as React from "react"
import { EntityPicker, type EntityOption, type EntityPickerProps } from "./entity-picker"

export interface PresetPickerProps extends Omit<EntityPickerProps, "queryKey" | "placeholder"> {
  placeholder?: string
}

/**
 * Student Picker preset component
 */
export function StudentPicker({
  fetcher,
  label = "Học sinh",
  placeholder = "Tìm tên, mã học sinh...",
  ...props
}: PresetPickerProps) {
  return (
    <EntityPicker
      queryKey="picker-students"
      fetcher={fetcher}
      label={label}
      placeholder={placeholder}
      {...props}
    />
  )
}

/**
 * Teacher Picker preset component
 */
export function TeacherPicker({
  fetcher,
  label = "Giáo viên",
  placeholder = "Tìm tên, sđt giáo viên...",
  ...props
}: PresetPickerProps) {
  return (
    <EntityPicker
      queryKey="picker-teachers"
      fetcher={fetcher}
      label={label}
      placeholder={placeholder}
      {...props}
    />
  )
}

/**
 * Class Picker preset component
 */
export function ClassPicker({
  fetcher,
  label = "Lớp học",
  placeholder = "Tìm mã lớp, tên môn...",
  ...props
}: PresetPickerProps) {
  return (
    <EntityPicker
      queryKey="picker-classes"
      fetcher={fetcher}
      label={label}
      placeholder={placeholder}
      {...props}
    />
  )
}

/**
 * Parent Picker preset component
 */
export function ParentPicker({
  fetcher,
  label = "Phụ huynh",
  placeholder = "Tìm tên, sđt phụ huynh...",
  ...props
}: PresetPickerProps) {
  return (
    <EntityPicker
      queryKey="picker-parents"
      fetcher={fetcher}
      label={label}
      placeholder={placeholder}
      {...props}
    />
  )
}

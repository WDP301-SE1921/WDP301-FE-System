"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  Book01Icon,
  Calendar01Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  Folder01Icon,
  InformationCircleIcon,
  Location01Icon,
  TeacherIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { SectionCard } from "@/components/shared/display/section-card"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer"
import { BUSINESS_RULES, WEEKDAYS } from "@/constants/business-rules"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROUTES } from "@/constants/routes"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { SUBJECT_MAP } from "@/constants/subjects"
import { formatDate } from "@/lib/format"
import { classFormSchema, type ClassFormInput } from "@/lib/validators/class"
import {
  findAvailableRooms,
  findRoomConflict,
  previewSessions,
} from "@/mocks/data/classes"
import { MOCK_CLASSES, MOCK_PROGRAMS, MOCK_SUBJECTS, MOCK_TEACHERS } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { useCreateClass } from "@/features/classes/hooks/use-create-class"

const GRADE_OPTIONS = [6, 7, 8, 9]

const GRADE_ITEMS: Record<string, string> = Object.fromEntries(
  GRADE_OPTIONS.map((grade) => [String(grade), STUDENT_MSG.GRADE_LABEL(grade)])
)

const SUBJECT_ITEMS: Record<string, string> = Object.fromEntries(
  MOCK_SUBJECTS.map((subject) => [
    subject.id,
    SUBJECT_MAP[subject.code]?.name ?? subject.name,
  ])
)

const TEACHER_ITEMS: Record<string, string> = Object.fromEntries(
  MOCK_TEACHERS.map((teacher) => [teacher.id, teacher.name])
)

const ROOM_ITEMS: Record<string, string> = Object.fromEntries(
  Array.from(new Map(MOCK_CLASSES.map((item) => [item.room, item.capacity]))).map(
    ([room, capacity]) => [room, `${room} · ${CLASS_MSG.ROOM_CAPACITY(capacity)}`]
  )
)

/** Số buổi hiển thị trong card xem trước, phần còn lại cuộn trong ScrollArea. */
const PREVIEW_LIMIT = 12

function ClassFormView() {
  const router = useRouter()
  const createClass = useCreateClass()

  const form = useForm<ClassFormInput>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      subjectId: "",
      grade: "",
      programId: "",
      capacity: BUSINESS_RULES.CLASS_CAPACITY_MAX,
      weekdays: [],
      startTime: "15:00",
      endTime: "16:30",
      startDate: "",
      teacherId: "",
      room: "",
    },
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form
  const values = useWatch({ control }) as ClassFormInput

  /** Chương trình lọc theo môn + khối đã chọn. */
  const programItems = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        MOCK_PROGRAMS.filter((program) => {
          if (values.subjectId && program.subjectId !== values.subjectId) return false
          if (values.grade && String(program.grade) !== values.grade) return false
          return true
        }).map((program) => [
          program.id,
          `${program.name} · ${CLASS_MSG.FIELD_PROGRAM_LESSONS(program.totalLessons)}`,
        ])
      ),
    [values.subjectId, values.grade]
  )

  const preview = React.useMemo(
    () =>
      previewSessions({
        programId: values.programId,
        weekdays: values.weekdays,
        startDate: values.startDate,
        startTime: values.startTime,
        endTime: values.endTime,
      }),
    [
      values.programId,
      values.weekdays,
      values.startDate,
      values.startTime,
      values.endTime,
    ]
  )

  const conflict = React.useMemo(
    () =>
      findRoomConflict({
        room: values.room,
        weekdays: values.weekdays,
        startTime: values.startTime,
        endTime: values.endTime,
      }),
    [values.room, values.weekdays, values.startTime, values.endTime]
  )

  const availableRooms = React.useMemo(
    () =>
      conflict
        ? findAvailableRooms({
            weekdays: values.weekdays,
            startTime: values.startTime,
            endTime: values.endTime,
          }).slice(0, 3)
        : [],
    [conflict, values.weekdays, values.startTime, values.endTime]
  )

  const durationMinutes = React.useMemo(() => {
    if (!values.startTime || !values.endTime) return 0
    const [startHour, startMinute] = values.startTime.split(":").map(Number)
    const [endHour, endMinute] = values.endTime.split(":").map(Number)
    return endHour * 60 + endMinute - (startHour * 60 + startMinute)
  }, [values.startTime, values.endTime])

  const totalHours = Math.round(((preview.length * durationMinutes) / 60) * 10) / 10

  const toggleWeekday = (label: string) => {
    const next = values.weekdays.includes(label)
      ? values.weekdays.filter((item) => item !== label)
      : [...values.weekdays, label]

    // Giữ thứ tự T2 → CN cho dễ đọc.
    const ordered = WEEKDAYS.filter((day) => next.includes(day.shortLabel)).map(
      (day) => day.shortLabel
    )
    setValue("weekdays", ordered, { shouldValidate: true })
  }

  const onSubmit = (input: ClassFormInput) => {
    createClass.mutate(input, {
      onSuccess: (result) => {
        toast.success(CLASS_MSG.CREATE_SUCCESS(result.sessionCount))
        router.push(ROUTES.MANAGER.CLASS_DETAIL(result.classId))
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title={CLASS_MSG.CREATE_TITLE}
        description={CLASS_MSG.CREATE_DESC}
        backHref={ROUTES.MANAGER.CLASSES}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: CLASS_MSG.LIST_TITLE, href: ROUTES.MANAGER.CLASSES },
          { label: CLASS_MSG.CREATE_TITLE },
        ]}
        actions={
          <Badge variant="info" className="rounded-full">
            {CLASS_MSG.CREATE_DRAFT_BADGE}
          </Badge>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* 1 — Thông tin lớp */}
            <SectionCard
              title={CLASS_MSG.SECTION_INFO_TITLE}
              description={CLASS_MSG.SECTION_INFO_DESC}
              action={<StepBadge label={CLASS_MSG.STEP_INFO} />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-name" required>
                    {CLASS_MSG.FIELD_NAME}
                  </Label>
                  <Input
                    id="class-name"
                    placeholder={CLASS_MSG.FIELD_NAME_PLACEHOLDER}
                    error={Boolean(errors.name)}
                    prefixIcon={<HugeiconsIcon icon={Folder01Icon} />}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormSelect
                    control={control}
                    name="subjectId"
                    label={CLASS_MSG.FIELD_SUBJECT}
                    placeholder={CLASS_MSG.FIELD_SUBJECT_PLACEHOLDER}
                    items={SUBJECT_ITEMS}
                    error={errors.subjectId?.message}
                    onAfterChange={() => setValue("programId", "")}
                  />
                  <FormSelect
                    control={control}
                    name="grade"
                    label={CLASS_MSG.FIELD_GRADE}
                    placeholder={CLASS_MSG.FIELD_GRADE_PLACEHOLDER}
                    items={GRADE_ITEMS}
                    error={errors.grade?.message}
                    onAfterChange={() => setValue("programId", "")}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="class-capacity" required>
                      {CLASS_MSG.FIELD_CAPACITY}
                    </Label>
                    <Input
                      id="class-capacity"
                      type="number"
                      min={1}
                      max={BUSINESS_RULES.CLASS_CAPACITY_MAX}
                      error={Boolean(errors.capacity)}
                      {...register("capacity", { valueAsNumber: true })}
                    />
                    <p
                      className={
                        errors.capacity
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {errors.capacity?.message ?? CLASS_MSG.FIELD_CAPACITY_UNIT}
                    </p>
                  </div>
                </div>

                <Alert variant="info">
                  <HugeiconsIcon icon={InformationCircleIcon} />
                  <AlertDescription>{CLASS_MSG.CAPACITY_HINT}</AlertDescription>
                </Alert>

                <FormSelect
                  control={control}
                  name="programId"
                  label={CLASS_MSG.FIELD_PROGRAM}
                  placeholder={CLASS_MSG.FIELD_PROGRAM_PLACEHOLDER}
                  items={programItems}
                  error={errors.programId?.message}
                />
              </div>
            </SectionCard>

            {/* 2 — Lịch cố định */}
            <SectionCard
              title={CLASS_MSG.SECTION_SCHEDULE_TITLE}
              description={CLASS_MSG.SECTION_SCHEDULE_DESC}
              action={<StepBadge label={CLASS_MSG.STEP_SCHEDULE} />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label required>{CLASS_MSG.FIELD_WEEKDAYS}</Label>
                    {values.weekdays.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {CLASS_MSG.FIELD_WEEKDAYS_SELECTED(
                          values.weekdays.length,
                          values.weekdays.join(", ")
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = values.weekdays.includes(day.shortLabel)

                      return (
                        <button
                          key={day.shortLabel}
                          type="button"
                          onClick={() => toggleWeekday(day.shortLabel)}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex size-14 flex-col items-center justify-center rounded-2xl border text-xs font-medium transition-colors outline-none",
                            "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="text-[0.625rem] opacity-70">
                            {day.label.replace("Thứ ", "T")}
                          </span>
                          <span className="text-sm font-bold">{day.shortLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.weekdays && (
                    <p className="text-xs text-destructive">{errors.weekdays.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="class-start-time" required>
                      {CLASS_MSG.FIELD_START_TIME}
                    </Label>
                    <Input
                      id="class-start-time"
                      type="time"
                      error={Boolean(errors.startTime)}
                      {...register("startTime")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-end-time" required>
                      {CLASS_MSG.FIELD_END_TIME}
                    </Label>
                    <Input
                      id="class-end-time"
                      type="time"
                      error={Boolean(errors.endTime)}
                      {...register("endTime")}
                    />
                    <p
                      className={
                        errors.endTime
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {errors.endTime?.message ??
                        (durationMinutes > 0
                          ? CLASS_MSG.FIELD_DURATION(durationMinutes)
                          : "")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-start-date" required>
                      {CLASS_MSG.FIELD_START_DATE}
                    </Label>
                    <Input
                      id="class-start-date"
                      type="date"
                      error={Boolean(errors.startDate)}
                      {...register("startDate")}
                    />
                    {errors.startDate && (
                      <p className="text-xs text-destructive">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <Alert variant="info">
                  <HugeiconsIcon icon={InformationCircleIcon} />
                  <AlertDescription>{CLASS_MSG.SCHEDULE_HINT}</AlertDescription>
                </Alert>
              </div>
            </SectionCard>

            {/* 3 — Phân công */}
            <SectionCard
              title={CLASS_MSG.SECTION_ASSIGN_TITLE}
              description={CLASS_MSG.SECTION_ASSIGN_DESC}
              action={<StepBadge label={CLASS_MSG.STEP_ASSIGN} />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    control={control}
                    name="teacherId"
                    label={CLASS_MSG.FIELD_TEACHER}
                    placeholder={CLASS_MSG.FIELD_TEACHER_PLACEHOLDER}
                    items={TEACHER_ITEMS}
                    error={errors.teacherId?.message}
                    icon={TeacherIcon}
                  />
                  <FormSelect
                    control={control}
                    name="room"
                    label={CLASS_MSG.FIELD_ROOM}
                    placeholder={CLASS_MSG.FIELD_ROOM_PLACEHOLDER}
                    items={ROOM_ITEMS}
                    error={errors.room?.message}
                    icon={Location01Icon}
                  />
                </div>

                {conflict && (
                  <Alert variant="danger">
                    <HugeiconsIcon icon={Alert01Icon} />
                    <AlertTitle className="flex flex-wrap items-center gap-2">
                      {CLASS_MSG.ROOM_CONFLICT_TITLE}
                      <Badge variant="danger" className="rounded-full">
                        {CLASS_MSG.ROOM_CONFLICT_BADGE}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        {CLASS_MSG.ROOM_CONFLICT_DESC(
                          conflict.room,
                          conflict.className,
                          `${conflict.weekdayLabel} ${conflict.time}`
                        )}
                      </p>
                      {availableRooms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs">
                            {CLASS_MSG.ROOM_CONFLICT_SUGGEST}
                          </span>
                          {availableRooms.map((item) => (
                            <Button
                              key={item.room}
                              type="button"
                              variant="outline"
                              size="xs"
                              className="rounded-full"
                              onClick={() =>
                                setValue("room", item.room, { shouldValidate: true })
                              }
                            >
                              {item.room} ({item.capacity} chỗ)
                            </Button>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Card xem trước */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <SessionPreviewCard
              sessions={preview}
              totalHours={totalHours}
              weekdayCount={values.weekdays.length}
            />
          </div>
        </div>

        <StickyFormFooter>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Cancel01Icon} />}
              onClick={() => router.push(ROUTES.MANAGER.CLASSES)}
            >
              {CLASS_MSG.CANCEL}
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => toast.success(CLASS_MSG.DRAFT_SAVED)}
              >
                {CLASS_MSG.SAVE_DRAFT}
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                isLoading={createClass.isPending}
                leftIcon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
              >
                {CLASS_MSG.SUBMIT(preview.length)}
              </Button>
            </div>
          </div>
        </StickyFormFooter>
      </form>
    </PageContainer>
  )
}

function StepBadge({ label }: { label: string }) {
  return (
    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </span>
  )
}

function SessionPreviewCard({
  sessions,
  totalHours,
  weekdayCount,
}: {
  sessions: ReturnType<typeof previewSessions>
  totalHours: number
  weekdayCount: number
}) {
  const first = sessions.at(0)
  const last = sessions.at(-1)

  return (
    <Card className="gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <HugeiconsIcon icon={Calendar01Icon} className="size-4 text-primary" />
            {CLASS_MSG.PREVIEW_TITLE(sessions.length)}
          </p>
          {first && last && (
            <p className="text-xs text-muted-foreground">
              {CLASS_MSG.PREVIEW_RANGE(formatDate(first.date), formatDate(last.date))}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="rounded-full">
          {CLASS_MSG.PREVIEW_AUTO}
        </Badge>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {CLASS_MSG.PREVIEW_EMPTY}
        </p>
      ) : (
        <>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={CheckmarkSquare01Icon}
              className="mt-0.5 size-3.5 shrink-0 text-primary"
            />
            {CLASS_MSG.PREVIEW_HOLIDAY_NOTE}
          </p>

          <div className="grid grid-cols-2 gap-3 border-y border-border py-3">
            <div>
              <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                {CLASS_MSG.PREVIEW_TOTAL_HOURS}
              </p>
              <p className="font-heading text-lg font-bold text-foreground">
                {CLASS_MSG.PREVIEW_HOURS_UNIT(totalHours)}
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                {CLASS_MSG.PREVIEW_FREQUENCY}
              </p>
              <p className="font-heading text-lg font-bold text-foreground">
                {CLASS_MSG.PREVIEW_FREQUENCY_UNIT(weekdayCount)}
              </p>
            </div>
          </div>

          <p className="text-xs font-medium text-foreground">
            {CLASS_MSG.PREVIEW_LIST_TITLE}
          </p>

          <ScrollArea className="h-64">
            <ol className="space-y-2 pr-3">
              {sessions.slice(0, PREVIEW_LIMIT).map((session) => (
                <li
                  key={session.order}
                  className="flex gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary tabular-nums">
                    {String(session.order).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {session.weekdayLabel} · {formatDate(session.date)}
                      <span className="ml-1 font-normal text-muted-foreground">
                        {session.time}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.lessonTitle}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>

          <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-3">
            <HugeiconsIcon icon={Book01Icon} className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {CLASS_MSG.PREVIEW_FOOTER}
              </p>
              <p className="text-xs text-muted-foreground">
                {CLASS_MSG.PREVIEW_FOOTER_SUB}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function FormSelect({
  control,
  name,
  label,
  placeholder,
  items,
  error,
  icon,
  onAfterChange,
}: {
  control: ReturnType<typeof useForm<ClassFormInput>>["control"]
  name: "subjectId" | "grade" | "programId" | "teacherId" | "room"
  label: string
  placeholder: string
  items: Record<string, string>
  error?: string
  icon?: typeof TeacherIcon
  onAfterChange?: () => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`class-${name}`} required>
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            items={items}
            value={field.value || null}
            onValueChange={(value) => {
              field.onChange(String(value ?? ""))
              onAfterChange?.()
            }}
          >
            <SelectTrigger
              id={`class-${name}`}
              className="rounded-xl"
              error={Boolean(error)}
            >
              <span className="flex min-w-0 items-center gap-2">
                {icon && (
                  <HugeiconsIcon
                    icon={icon}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
                <SelectValue placeholder={placeholder} />
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(items).map(([value, itemLabel]) => (
                <SelectItem key={value} value={value}>
                  {itemLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export { ClassFormView }

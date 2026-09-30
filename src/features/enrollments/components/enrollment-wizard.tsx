"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Folder01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer"
import { WizardLayout } from "@/components/shared/workflows/wizard-layout"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROUTES } from "@/constants/routes"
import {
  ENROLLMENT_STEP_FIELDS,
  enrollmentSchema,
  type EnrollmentInput,
} from "@/lib/validators/enrollment"
import { findClass, findSubject } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import {
  getClassOptionRows,
  getEnrollmentIdentity,
  getEnrollmentPrefill,
  getTuitionBreakdown,
} from "@/features/enrollments/selectors"
import { useCreateEnrollment } from "@/features/enrollments/hooks/use-create-enrollment"
import { EnrollmentSummaryPanel } from "@/features/enrollments/components/enrollment-summary-panel"
import { StepChild } from "@/features/enrollments/components/step-child"
import { StepClass } from "@/features/enrollments/components/step-class"
import { StepDone } from "@/features/enrollments/components/step-done"
import { StepLookup } from "@/features/enrollments/components/step-lookup"
import { StepPayment } from "@/features/enrollments/components/step-payment"
import type { EnrollmentResult } from "@/mocks/data/enrollments"

const STEPS = [
  { id: "parent", label: ENROLLMENT_MSG.STEP_PARENT, description: ENROLLMENT_MSG.STEP_PARENT_SUB },
  { id: "child", label: ENROLLMENT_MSG.STEP_CHILD, description: ENROLLMENT_MSG.STEP_CHILD_SUB },
  { id: "class", label: ENROLLMENT_MSG.STEP_CLASS, description: ENROLLMENT_MSG.STEP_CLASS_SUB },
  { id: "payment", label: ENROLLMENT_MSG.STEP_PAYMENT, description: ENROLLMENT_MSG.STEP_PAYMENT_SUB },
  { id: "done", label: ENROLLMENT_MSG.STEP_DONE, description: ENROLLMENT_MSG.STEP_DONE_SUB },
]

const CHILD_STEP = 1
const PAYMENT_STEP = 3
const LAST_STEP = STEPS.length - 1

const NEXT_LABEL: Record<number, string> = {
  0: ENROLLMENT_MSG.NEXT_CHILD,
  1: ENROLLMENT_MSG.NEXT_CLASS,
  2: ENROLLMENT_MSG.NEXT_PAYMENT,
  [PAYMENT_STEP]: ENROLLMENT_MSG.PAYMENT_CONFIRM_ACTION,
}

const EMPTY_VALUES: EnrollmentInput = {
  parentAccountId: "",
  studentProfileId: "",
  grade: "",
  subjectId: "",
  classId: "",
  months: 3,
  hasReceivedPayment: false,
}

function EnrollmentWizard() {
  const router = useRouter()
  const createEnrollment = useCreateEnrollment()
  const [result, setResult] = React.useState<EnrollmentResult | null>(null)

  // Deep-link từ chi tiết phụ huynh / học sinh: `?parentId=&studentId=` điền sẵn và nhảy bước.
  const [parentIdParam, setParentIdParam] = useQueryState("parentId", parseAsString)
  const [studentIdParam, setStudentIdParam] = useQueryState("studentId", parseAsString)
  const prefill = React.useMemo(
    () => getEnrollmentPrefill(parentIdParam, studentIdParam),
    [parentIdParam, studentIdParam]
  )

  const stepParser = React.useMemo(
    () => parseAsInteger.withDefault(prefill?.step ?? 0),
    [prefill?.step]
  )
  const [step, setStep] = useQueryState("step", stepParser)

  const form = useForm<EnrollmentInput>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: prefill ? { ...EMPTY_VALUES, ...prefill } : EMPTY_VALUES,
  })

  const { control, setValue, trigger, getValues, reset, formState } = form
  const values = useWatch({ control }) as EnrollmentInput

  const requestedStep = Math.min(LAST_STEP, Math.max(0, step))
  const isDone = requestedStep === LAST_STEP && result !== null

  // Chưa tra cứu được phụ huynh / chưa chọn con thì không được đứng ở bước phía sau.
  let currentStep = requestedStep === LAST_STEP && result === null ? PAYMENT_STEP : requestedStep
  if (!isDone && currentStep > 0 && !values.parentAccountId) currentStep = 0
  if (!isDone && currentStep > CHILD_STEP && !values.studentProfileId) currentStep = CHILD_STEP

  const identity = getEnrollmentIdentity(values.parentAccountId, values.studentProfileId)
  const selectedGrade = values.grade ? Number(values.grade) : undefined

  const selectedClass = values.classId ? findClass(values.classId) : undefined
  const monthlyFee = React.useMemo(() => {
    if (!values.classId || !values.subjectId) return 0
    return (
      getClassOptionRows(values.subjectId, selectedGrade).find(
        (row) => row.classRecord.id === values.classId
      )?.monthlyFee ?? 0
    )
  }, [values.classId, values.subjectId, selectedGrade])

  /**
   * Kỳ học bắt đầu từ ngày cố định của bộ mock — không gọi `new Date()` trong
   * render để giữ component thuần (rule `react-hooks/purity`).
   */
  const tuition = React.useMemo(
    () => getTuitionBreakdown(monthlyFee, values.months, new Date("2026-09-15")),
    [monthlyFee, values.months]
  )

  const goToStep = (next: number) => setStep(next)

  const handleNext = async () => {
    const isValid = await trigger(ENROLLMENT_STEP_FIELDS[currentStep])
    if (!isValid) return

    if (currentStep < PAYMENT_STEP) {
      goToStep(currentStep + 1)
      return
    }

    createEnrollment.mutate(getValues(), {
      onSuccess: (data) => {
        setResult(data)
        toast[data.emailStatus === "failed" ? "warning" : "success"](
          data.emailStatus === "failed"
            ? ENROLLMENT_MSG.CREATE_SUCCESS_EMAIL_FAILED
            : ENROLLMENT_MSG.CREATE_SUCCESS
        )
        goToStep(LAST_STEP)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  const handleStartNew = () => {
    reset(EMPTY_VALUES)
    setResult(null)
    createEnrollment.reset()
    setParentIdParam(null)
    setStudentIdParam(null)
    setStep(0)
  }

  const handleCancel = () => {
    toast.success(ENROLLMENT_MSG.CANCELLED)
    router.push(ROUTES.MANAGER.STUDENTS)
  }

  return (
    <PageContainer>
      <PageHeader
        title={ENROLLMENT_MSG.TITLE}
        description={ENROLLMENT_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Học sinh & Phụ huynh" },
          { label: ENROLLMENT_MSG.TITLE },
        ]}
        actions={
          <Badge variant="info" className="rounded-full">
            {ENROLLMENT_MSG.TERM_BADGE}
          </Badge>
        }
      />

      <WizardLayout
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(index) => !isDone && index <= currentStep && goToStep(index)}
        summaryPanel={
          isDone ? undefined : (
            <EnrollmentSummaryPanel
              currentStep={currentStep}
              totalSteps={STEPS.length}
              parentEmail={identity.parentEmail}
              studentName={identity.studentName}
              grade={selectedGrade}
              subjectCode={
                values.subjectId ? findSubject(values.subjectId)?.code : undefined
              }
              className={selectedClass?.name}
              scheduleText={
                selectedClass
                  ? `${selectedClass.weekdays.join(" - ")} · ${selectedClass.startTime}–${selectedClass.endTime}`
                  : undefined
              }
              expectedTuition={tuition.total}
              discount={0}
            />
          )
        }
        footer={
          isDone ? undefined : (
            <StickyFormFooter>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  leftIcon={<HugeiconsIcon icon={Cancel01Icon} />}
                  onClick={handleCancel}
                >
                  {ENROLLMENT_MSG.CANCEL}
                </Button>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {ENROLLMENT_MSG.CANCEL_NOTE}
                </span>

                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    leftIcon={<HugeiconsIcon icon={Folder01Icon} />}
                    onClick={() => toast.success(ENROLLMENT_MSG.DRAFT_SAVED)}
                  >
                    {ENROLLMENT_MSG.SAVE_DRAFT}
                  </Button>
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => goToStep(currentStep - 1)}
                    >
                      Quay lại
                    </Button>
                  )}
                  <Button
                    className="rounded-full"
                    isLoading={createEnrollment.isPending}
                    disabled={currentStep === PAYMENT_STEP && !values.hasReceivedPayment}
                    onClick={handleNext}
                  >
                    {NEXT_LABEL[currentStep]}
                  </Button>
                </div>
              </div>
            </StickyFormFooter>
          )
        }
      >
        {currentStep === 0 && <StepLookup form={form} />}

        {currentStep === CHILD_STEP && <StepChild form={form} />}

        {currentStep === 2 && (
          <StepClass
            studentProfileId={values.studentProfileId}
            childGrade={identity.childGrade}
            grade={values.grade}
            subjectId={values.subjectId}
            classId={values.classId}
            gradeError={formState.errors.grade?.message}
            subjectError={formState.errors.subjectId?.message}
            classError={formState.errors.classId?.message}
            onGradeChange={(grade) => {
              setValue("grade", grade)
              setValue("subjectId", "")
              setValue("classId", "")
            }}
            onSubjectChange={(subjectId) => {
              setValue("subjectId", subjectId)
              setValue("classId", "")
            }}
            onClassChange={(classId) => setValue("classId", classId)}
          />
        )}

        {currentStep === PAYMENT_STEP && <StepPayment form={form} tuition={tuition} />}

        {currentStep === LAST_STEP && result && (
          <StepDone result={result} onStartNew={handleStartNew} />
        )}
      </WizardLayout>
    </PageContainer>
  )
}

export { EnrollmentWizard }

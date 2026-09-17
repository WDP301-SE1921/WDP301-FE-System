import { HugeiconsIcon } from "@hugeicons/react"
import {
  Atom01Icon,
  CalculatorIcon,
  Leaf01Icon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons"

import { Card } from "@/components/ui/card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { SUBJECT_MAP } from "@/constants/subjects"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"

/** Icon minh họa theo mã môn — màu chữ/nền lấy từ `SubjectTag` qua `SUBJECT_MAP`. */
const SUBJECT_ICON: Record<string, typeof CalculatorIcon> = {
  [SUBJECT_MAP.MATH.code]: CalculatorIcon,
  [SUBJECT_MAP.PHYS.code]: Atom01Icon,
  [SUBJECT_MAP.CHEM.code]: TestTube01Icon,
  [SUBJECT_MAP.BIOL.code]: Leaf01Icon,
}

function SubjectsSection() {
  const sectionId = LANDING_NAV[0].href.replace("#", "")

  return (
    <section id={sectionId} className="scroll-mt-20 bg-background py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {LANDING_CONTENT.SUBJECTS_TITLE}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {LANDING_CONTENT.SUBJECTS_DESC}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_CONTENT.SUBJECTS.map((subject) => (
            <Card
              key={subject.code}
              className="gap-4 rounded-2xl transition-shadow hover:shadow-md"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={SUBJECT_ICON[subject.code]}
                  className="size-6"
                />
              </span>
              <SubjectTag code={subject.code} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subject.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export { SubjectsSection }

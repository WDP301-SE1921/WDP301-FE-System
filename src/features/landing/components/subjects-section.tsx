import { HugeiconsIcon } from "@hugeicons/react"
import {
  Atom01Icon,
  BookOpen01Icon,
  CalculatorIcon,
  Leaf01Icon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons"

import { Card } from "@/components/ui/card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { resolveSubject, type SubjectTone } from "@/constants/subjects"
import { LANDING_CONTENT, LANDING_NAV } from "@/features/landing/content"
import type { PublicSubject } from "@/types/backend"

/** Icon minh họa theo môn; môn Quản lý tạo thêm dùng icon sách. Màu nhãn lấy từ `SubjectTag`. */
const SUBJECT_ICON: Partial<Record<SubjectTone, typeof CalculatorIcon>> = {
  math: CalculatorIcon,
  physics: Atom01Icon,
  chemistry: TestTube01Icon,
  biology: Leaf01Icon,
}
const SUBJECT_BLURBS: Partial<Record<SubjectTone, string>> =
  LANDING_CONTENT.SUBJECT_BLURBS

/** `subjects` lấy từ `GET /center/subjects`; rỗng (chưa có môn hoặc BE lỗi) thì hiện dòng thông báo. */
function SubjectsSection({ subjects }: { subjects: PublicSubject[] }) {
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

        {subjects.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            {LANDING_CONTENT.SUBJECTS_EMPTY}
          </p>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((subject) => {
              // Theo tên như lịch và danh sách lớp, để một môn có cùng màu ở mọi màn.
              const { tone } = resolveSubject(subject.name)
              const blurb = SUBJECT_BLURBS[tone]
              return (
                <Card
                  key={subject.id}
                  className="gap-4 rounded-2xl transition-shadow hover:shadow-md"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HugeiconsIcon
                      icon={SUBJECT_ICON[tone] ?? BookOpen01Icon}
                      className="size-6"
                    />
                  </span>
                  <SubjectTag code={subject.name} />
                  {blurb && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {blurb}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export { SubjectsSection }

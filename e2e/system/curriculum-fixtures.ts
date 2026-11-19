import { unique, type World } from "../demo/world";

export interface CurriculumVersion {
  id: string;
  title: string;
  status: string;
  revision: number;
  version: number;
  fromDate: string;
  toDate: string;
  archiveReason: string | null;
  supersededById: string | null;
  lessons: { id: string; title: string; sequence: number; kind: string }[];
}

export async function draftCurriculum(
  world: World,
  fixture: Awaited<ReturnType<World["fixture"]>>,
  lessonCount = 2,
) {
  const unit = await world.call<CurriculumVersion>(
    "designer",
    "academic/curriculum-units",
    "POST",
    {
      programId: fixture.program.id,
      title: unique("Giáo trình cập nhật"),
    },
  );
  for (let sequence = 1; sequence <= lessonCount; sequence++) {
    const lesson = await world.call<{ id: string }>(
      "designer",
      `academic/curriculum-units/${unit.id}/lessons`,
      "POST",
      {
        title: unique(`Bài ${sequence}`),
        sequence,
        content: `Nội dung phương trình số ${sequence}.`,
      },
    );
    await world.call(
      "designer",
      `academic/lessons/${lesson.id}/outcomes`,
      "PATCH",
      {
        outcomeIds: [fixture.outcome.id],
      },
    );
  }
  return world.call<CurriculumVersion>(
    "designer",
    `academic/curriculum-units/${unit.id}`,
  );
}

export async function approveCurriculum(
  world: World,
  unitId: string,
  teacherId: string,
  outcomeSetId: string,
) {
  const submitted = await world.call<CurriculumVersion>(
    "designer",
    `academic/curriculum-units/${unitId}/submit`,
    "POST",
    { reviewerTeacherId: teacherId },
  );
  await world.call(
    "teacher",
    `academic/curriculum-units/${unitId}/technical-review`,
    "POST",
    {
      approved: true,
      expectedRevision: submitted.revision,
      note: "Nội dung kiểm thử đã được đọc và duyệt.",
    },
  );
  const set = await world.call<{ status: string }>(
    "teacher",
    `academic/outcome-sets/${outcomeSetId}`,
  );
  if (set.status === "DRAFT")
    await world.call(
      "teacher",
      `academic/outcome-sets/${outcomeSetId}/technical-approve`,
      "POST",
    );
  return world.call<CurriculumVersion>(
    "manager",
    `academic/curriculum-units/${unitId}/approve`,
    "POST",
  );
}

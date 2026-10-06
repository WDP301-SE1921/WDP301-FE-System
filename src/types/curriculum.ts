export interface CurriculumLesson {
  id: string;
  unitId: string;
  title: string;
  content: string;
  sequence: number;
  kind: "LESSON" | "MONTHLY_TEST";
  monthKey: string | null;
  status: "DRAFT" | "APPROVED";
}

export interface CurriculumUnit {
  id: string;
  programId: string;
  designerId: string;
  title: string;
  fromDate: string;
  toDate: string;
  version: number;
  status: "DRAFT" | "APPROVED";
  track: { id: string; grade: number; subject: string; subjectKey: string };
  _count?: { lessons: number };
}

export interface CurriculumUnitDetail extends CurriculumUnit {
  lessons: CurriculumLesson[];
}

export interface SessionReference {
  id: string;
  classId: string;
  startsAt: string;
  endsAt: string;
}

export interface SessionPreviewSlot {
  date: string;
  startsAt: string;
  endsAt: string;
  lessonId: string;
  lessonTitle: string;
  kind: "LESSON" | "MONTHLY_TEST";
  monthKey: string;
  conflicts: SessionReference[];
  makeupCandidates: SessionReference[];
}

export interface SessionPreview {
  classId: string;
  curriculumUnitId: string;
  fromDate: string;
  toDate: string;
  slots: SessionPreviewSlot[];
}

export interface ScheduledSession extends SessionReference {
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  class: { name: string; program: { grade: number; subject: string } };
  lesson: {
    id: string;
    title: string;
    kind: "LESSON" | "MONTHLY_TEST";
    monthKey: string | null;
    unitId: string | null;
  } | null;
}

export interface SessionGeneration {
  id: string;
  sessions: SessionReference[];
}

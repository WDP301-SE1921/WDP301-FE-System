import type {
  GradeReview,
  GradeScore,
  SubmissionRecord,
} from "@/types/academic-workflows";

export interface GradeInput {
  scores: GradeScore[];
  feedback: string;
}

interface GradeCommands {
  read: () => Promise<SubmissionRecord>;
  save: (input: GradeInput) => Promise<GradeReview>;
  approve: (id: string) => Promise<GradeReview>;
  publish: (id: string) => Promise<GradeReview>;
  objective: () => Promise<GradeReview>;
  onSaved?: (grade: GradeReview) => void;
}

/** Question order is presentation only. Feedback and the teacher's exact score remain significant. */
export function sameGrade(left: GradeInput, right: GradeInput): boolean {
  const key = (input: GradeInput) =>
    JSON.stringify({
      feedback: input.feedback,
      scores: [...input.scores]
        .sort((a, b) => a.questionId.localeCompare(b.questionId))
        .map(({ questionId, score, feedback }) => ({ questionId, score, feedback })),
    });
  return key(left) === key(right);
}

export function latestGrade(
  submission: SubmissionRecord,
): GradeReview | undefined {
  return submission.grades.reduce<GradeReview | undefined>(
    (latest, grade) =>
      !latest || grade.revision > latest.revision ? grade : latest,
    undefined,
  );
}

/**
 * BE creates an immutable revision on every save. Keep a synchronous lock and resume the saved revision instead
 * of POSTing it again after approve/publish fails. A failed save with an unknown outcome is read back first.
 */
export function createGradeWorkflow(commands: GradeCommands) {
  let busy = false;
  let uncertainSave: { input: GradeInput; previousRevision: number } | null =
    null;

  const exclusive = async <T>(work: () => Promise<T>): Promise<T> => {
    if (busy)
      throw new Error(
        "Đang xử lý bản chấm. Vui lòng đợi thao tác hiện tại hoàn tất.",
      );
    busy = true;
    try {
      return await work();
    } finally {
      busy = false;
    }
  };

  const recoverSave = async (): Promise<GradeReview | undefined> => {
    if (!uncertainSave) return undefined;
    const submission = await commands.read();
    const pending = uncertainSave;
    const saved = submission.grades.find(
      (grade) =>
        grade.revision > pending.previousRevision &&
        sameGrade(grade, pending.input),
    );
    if (!saved)
      throw new Error(
        "Chưa xác định được kết quả lưu bản chấm. Hãy thử kiểm tra lại trước khi lưu thêm bản mới.",
      );
    uncertainSave = null;
    commands.onSaved?.(saved);
    return saved;
  };

  const save = async (
    input: GradeInput,
    previousRevision: number,
  ): Promise<GradeReview> => {
    uncertainSave = { input, previousRevision };
    try {
      const saved = await commands.save(input);
      uncertainSave = null;
      commands.onSaved?.(saved);
      return saved;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number" &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408
      ) {
        uncertainSave = null;
        throw error;
      }
      // If the response was lost after commit, the immutable new revision can be recovered by its exact payload.
      // Never automatically issue another non-idempotent save when that result is still unknown.
      try {
        return (await recoverSave())!;
      } catch {
        throw error;
      }
    }
  };

  const currentGrade = async (id: string): Promise<GradeReview> => {
    const latest = latestGrade(await commands.read());
    if (!latest || latest.id !== id)
      throw new Error(
        "Bản chấm đã thay đổi ở phiên khác. Điểm đang nhập được giữ lại; tải lại bản chấm trước khi gửi.",
      );
    return latest;
  };

  const assertBaseline = (
    latest: GradeReview | undefined,
    input: GradeInput,
    expectedRevision?: number,
  ) => {
    if (
      expectedRevision !== undefined &&
      (latest?.revision ?? 0) !== expectedRevision &&
      (!latest || !sameGrade(latest, input))
    )
      throw new Error(
        "Bản chấm đã thay đổi ở phiên khác. Điểm đang nhập được giữ lại; tải lại bản chấm trước khi lưu hoặc gửi.",
      );
  };

  return {
    saveDraft: (input: GradeInput, expectedRevision?: number) =>
      exclusive(async () => {
        await recoverSave();
        const latest = latestGrade(await commands.read());
        assertBaseline(latest, input, expectedRevision);
        if (latest?.status === "DRAFT" && sameGrade(latest, input))
          return latest;
        return save(input, latest?.revision ?? 0);
      }),
    send: (input: GradeInput, expectedRevision?: number) =>
      exclusive(async () => {
        await recoverSave();
        const latest = latestGrade(await commands.read());
        assertBaseline(latest, input, expectedRevision);
        // An unchanged DRAFT/APPROVED resumes. Edited scores intentionally create a new revision; skipping save
        // here would publish the old score and silently discard what the teacher just entered.
        let grade =
          latest && sameGrade(latest, input) && latest.status !== "SUPERSEDED"
            ? latest
            : await save(input, latest?.revision ?? 0);
        if (grade.status === "PUBLISHED") return grade;
        grade = await currentGrade(grade.id);
        if (grade.status === "DRAFT") {
          try {
            grade = await commands.approve(grade.id);
          } catch (error) {
            const live = await currentGrade(grade.id).catch(() => undefined);
            if (
              !live ||
              (live.status !== "APPROVED" && live.status !== "PUBLISHED")
            )
              throw error;
            grade = live;
          }
        }
        grade = await currentGrade(grade.id);
        if (grade.status === "PUBLISHED") return grade;
        if (grade.status !== "APPROVED")
          throw new Error("Bản chấm chưa ở trạng thái có thể gửi điểm.");
        try {
          return await commands.publish(grade.id);
        } catch (error) {
          const live = await currentGrade(grade.id).catch(() => undefined);
          if (live?.status === "PUBLISHED") return live;
          throw error;
        }
      }),
    objective: () =>
      exclusive(async () => {
        await recoverSave();
        const grade = await commands.objective();
        commands.onSaved?.(grade);
        return grade;
      }),
  };
}

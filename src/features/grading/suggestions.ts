import type {
  AssignmentQuestion,
  CriterionScore,
  GradeScore,
} from "@/types/academic-workflows";

/** Stored AI jobs can use any criterion order; form rows always follow the rubric. */
export function normalizeGradeSuggestion(
  question: AssignmentQuestion,
  suggestion: GradeScore,
): GradeScore | undefined {
  if (
    suggestion.questionId !== question.id ||
    typeof suggestion.feedback !== "string"
  )
    return undefined;
  const rubric = question.criteria;
  if (!rubric?.length) {
    return Number.isFinite(suggestion.score) &&
      suggestion.score >= 0 &&
      suggestion.score <= question.maxScore
      ? {
          questionId: question.id,
          score: suggestion.score,
          feedback: suggestion.feedback,
        }
      : undefined;
  }
  const entries = suggestion.criteria;
  if (
    entries?.length !== rubric.length ||
    new Set(entries.map((c) => c.criterionId)).size !== rubric.length
  )
    return undefined;
  const ordered: CriterionScore[] = [];
  for (const criterion of rubric) {
    const score = entries.find((s) => s.criterionId === criterion.id);
    if (
      !score ||
      !Number.isFinite(score.score) ||
      score.score < 0 ||
      score.score > criterion.maxScore ||
      typeof score.feedback !== "string"
    )
      return undefined;
    ordered.push({
      criterionId: score.criterionId,
      score: score.score,
      feedback: score.feedback,
    });
  }
  return {
    questionId: question.id,
    score: Math.round(ordered.reduce((sum, c) => sum + c.score, 0) * 100) / 100,
    feedback: suggestion.feedback,
    criteria: ordered,
  };
}

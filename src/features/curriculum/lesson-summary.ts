/**
 * Tóm tắt nội dung bài học cho bảng: bỏ ký hiệu Markdown, gộp khoảng trắng.
 * Chỉ bỏ ký hiệu khi nó là Markdown thật (tiêu đề/danh sách đầu dòng, cặp nhấn mạnh bao quanh chữ),
 * để "2*3=6", "x*y", "C# cơ bản", "snake_case" giữ nguyên.
 */
export function lessonSummary(content: string | null | undefined): string {
  return (content ?? "")
    .replace(/```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+])\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(
      /(?<![\p{L}\p{N}])(\*{1,3}|_{1,3}|~~)(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}])/gu,
      "$2",
    )
    .replace(/\s+/g, " ")
    .trim();
}

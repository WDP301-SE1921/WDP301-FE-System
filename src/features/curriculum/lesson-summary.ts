/** Tóm tắt nội dung bài học cho bảng: bỏ ký hiệu Markdown, gộp khoảng trắng. */
export function lessonSummary(content: string | null | undefined): string {
  return (content ?? "")
    .replace(/```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+])\s+/gm, "")
    .replace(/(\*+|`|~~|(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}]))/gu, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

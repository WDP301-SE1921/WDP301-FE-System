/**
 * Màn nhập bài từ file có "thay đổi chưa lưu" không. Nhập xong thì file đã chọn không còn
 * là thay đổi chưa lưu, cho tới khi người dùng chọn file khác (lỗi #5 của UI_ROLE_FLOWS).
 */
export function importIsDirty(state: {
  formDirty: boolean;
  imported: boolean;
  hasPreview: boolean;
  hasPendingAttempt: boolean;
}): boolean {
  return (
    (state.formDirty && !state.imported) ||
    state.hasPreview ||
    state.hasPendingAttempt
  );
}

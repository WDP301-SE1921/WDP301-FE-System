import { parseAsString } from "nuqs";

/**
 * Query mở Sheet và hộp thoại tài khoản phụ huynh trên màn Học sinh & phụ huynh của Quản lý:
 * `parentId` mở Sheet xem, `parentEdit` mở hộp thoại sửa, `parentLock` mở hộp thoại khóa / mở khóa.
 */
export const parentPanelParsers = {
  parentId: parseAsString,
  parentEdit: parseAsString,
  parentLock: parseAsString,
};

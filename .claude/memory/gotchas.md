# Gotchas

- **npm project naming**: `create-next-app <Name>` fails if the name has capital letters (npm naming restriction). Scaffold into a lowercase temp folder, then move contents into the real (capitalized) repo folder.
- **PowerShell + git folders**: moving a freshly-scaffolded Next.js folder (which has its own `.git`) into a repo folder that already has `.git` fails on `Move-Item` for the `.git` directory specifically — everything else moves fine. Delete the leftover temp folder's `.git` remnants afterward and verify with `git status` in the destination.
- **SafeAreaView (mobile)**: must import from `react-native-safe-area-context`, not from `react-native` — the built-in one doesn't handle notches correctly.
- **FlatList (mobile)**: parent container needs `flex: 1` or scrolling silently breaks.
- **Base UI `Field.*` cần `<Field.Root>`**: mọi part của `@base-ui/react/field` gọi `useFieldRootContext(false)` và **throw ngay khi render** (Base UI error #28) nếu không được bọc trong `<Field.Root>` — lỗi này nổ cả lúc SSR nên `npm run build` fail ở bước prerender, không chỉ ở client. Vì form dự án dùng react-hook-form (không dùng `Field` của Base UI), `src/components/ui/label.tsx` đã đổi sang render `<label>` thuần. Đừng bọc primitive nào bằng `Field.*` nữa trừ khi chấp nhận luôn có `Field.Root` bao ngoài.
- **Xóa/thêm file trong `src/app/`**: Turbopack cache type ở `.next/dev/types/validator.ts` và vẫn trỏ tới route cũ → build báo `TS2307: Cannot find module '../../../src/app/page.js'`. Chạy `rm -rf .next` rồi build lại.
- **React Compiler + react-hook-form**: `watch()` bị lint `react-hooks/incompatible-library` (trả về function không memoize được). Dùng `<Controller>` hoặc `useController` cho field cần giá trị realtime thay vì `watch()`.

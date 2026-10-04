# Gotchas

- **npm project naming**: `create-next-app <Name>` fails if the name has capital letters (npm naming restriction). Scaffold into a lowercase temp folder, then move contents into the real (capitalized) repo folder.
- **PowerShell + git folders**: moving a freshly-scaffolded Next.js folder (which has its own `.git`) into a repo folder that already has `.git` fails on `Move-Item` for the `.git` directory specifically — everything else moves fine. Delete the leftover temp folder's `.git` remnants afterward and verify with `git status` in the destination.
- **SafeAreaView (mobile)**: must import from `react-native-safe-area-context`, not from `react-native` — the built-in one doesn't handle notches correctly.
- **FlatList (mobile)**: parent container needs `flex: 1` or scrolling silently breaks.

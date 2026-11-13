import fs from "node:fs";
import path from "node:path";
import environment from "./environment.cjs";

const { root } = environment;
const report = JSON.parse(
  fs.readFileSync(path.join(root, "e2e/.demo-results/results.json"), "utf8"),
);
const branchAudit = JSON.parse(
  fs.readFileSync(path.join(root, "e2e/demo/branch-audit.json"), "utf8"),
);
function collect(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.map((test) => ({
        title: spec.title,
        file: suite.file,
        status: test.results.at(-1)?.status ?? test.status,
        durationMs: test.results.at(-1)?.duration ?? 0,
        attachments:
          test.results.at(-1)?.attachments.map((item) => ({
            name: item.name,
            contentType: item.contentType,
            path: item.path
              ? path.relative(root, item.path).replaceAll("\\", "/")
              : undefined,
          })) ?? [],
      })),
    ),
    ...collect(suite.suites ?? []),
  ]);
}
const tests = collect(report.suites);
const summary = {
  startedAt: report.stats.startTime,
  command: "node e2e/demo/run.mjs --reuse --headed",
  stats: report.stats,
  fatalErrors: report.errors?.length ?? 0,
  nodeVersion: process.version,
  headed: true,
  repositories: branchAudit.repositories.map((repo) => ({
    repository: repo.repository,
    branch: repo.checkout,
    testedRemote: repo.testedRemote,
    commit: repo.testedCommit,
  })),
  boundaries: {
    database:
      "Dedicated localhost:3308/edugrade_e2e; real MySQL, migrations and Prisma",
    app: "Real Next.js and Expo web, not Android/iOS native",
    ai: "Deterministic local HTTP provider; external model quality not verified",
    email:
      "Real SMTP to local capture server; external inbox delivery not verified",
    webPush:
      "Disabled without VAPID/subscription; OS push delivery not verified",
    parentAbsence: "Real parent API; no absence form exists in mobile UI",
  },
  tests,
};
fs.writeFileSync(
  path.join(root, "e2e/demo/last-run.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
const local = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  dateStyle: "short",
  timeStyle: "medium",
}).format(new Date(summary.startedAt));
const passed = tests.filter((test) => test.status === "passed").length;
const markdown = [
  "# Kết quả Playwright E2E WDP",
  "",
  `Lượt chạy bắt đầu lúc **${local} (giờ Việt Nam)**.`,
  "",
  `**${passed}/${tests.length} passed**, ${report.stats.unexpected} failed, ${report.stats.skipped} skipped, ${report.stats.flaky} flaky. Tổng thời gian ${(report.stats.duration / 1000).toFixed(2)} giây. Chạy với cửa sổ trình duyệt hiển thị, không bật retry.`,
  "",
  "| Test | Kết quả | Thời gian |",
  "| --- | --- | --- |",
  ...tests.map(
    (test) =>
      `| ${test.title} | ${test.status} | ${(test.durationMs / 1000).toFixed(1)}s |`,
  ),
  "",
  "Báo cáo có ảnh, video, trace: `e2e/.demo-report/index.html`. Mở bằng `npm run test:e2e:demo:report`. Danh sách bằng chứng và commit từng repo nằm trong [last-run.json](./last-run.json).",
  "",
  "Chạy lại khi môi trường còn mở: `npm run test:e2e:demo:headed -- --reuse`. Môi trường đã dừng: `npm run test:e2e:demo:headed` để dựng/migrate/seed/build và chạy.",
  "",
  "Phạm vi: 6 luồng demo và các luồng vận hành, theo [README.md](./README.md). Mobile qua Expo web; parent báo nghỉ qua API thật; AI là provider kiểm thử cục bộ; email vào SMTP cục bộ; chưa xác minh Android/iOS native, độ chính xác AI, mail ngoài hoặc OS Web Push.",
  "",
  "Nhánh: BE dev; FE nền main trên feature/demo-e2e; Admin dev; FEM dev. FEM develop đã được tải/cập nhật riêng nhưng không tự gộp với dev; chi tiết trong [branch-audit.json](./branch-audit.json).",
  "",
].join("\n");
fs.writeFileSync(path.join(root, "e2e/demo/RESULTS.md"), markdown);
console.log(
  JSON.stringify({
    passed,
    total: tests.length,
    failed: report.stats.unexpected,
    skipped: report.stats.skipped,
    durationSeconds: report.stats.duration / 1000,
  }),
);

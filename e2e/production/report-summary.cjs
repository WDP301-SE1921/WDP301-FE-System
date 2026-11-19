const fs = require("node:fs");
const path = require("node:path");
const { root, runtime, urls, productionLinks } = require("./settings.cjs");
const number = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
const iso = (value) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Date(value).toISOString()
    : null;

function publicSummary(result, profile = "read-only") {
  const stats = result?.stats || {};
  const counts = {
    passed: number(stats.expected),
    failed: number(stats.unexpected),
    skipped: number(stats.skipped),
    flaky: number(stats.flaky),
  };
  counts.total = counts.passed + counts.failed + counts.skipped + counts.flaky;
  const setupErrors = Array.isArray(result?.errors) ? result.errors.length : 0;
  const outcome = !result?.stats
    ? "not-run"
    : setupErrors || counts.failed
      ? "failed"
      : counts.skipped || counts.flaky
        ? "incomplete"
        : counts.passed
          ? "passed"
          : "not-run";
  return {
    environment: "production",
    profile: ["public", "read-only", "services", "full"].includes(profile)
      ? profile
      : "unknown",
    hasResults: !!result?.stats,
    outcome,
    startTime: iso(stats.startTime),
    durationMs: number(stats.duration),
    counts,
    links: productionLinks(urls),
  };
}

function summaryHtml(summary) {
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><title>EduGrade Production — Playwright</title><h1>EduGrade Production</h1><p>Profile: ${summary.profile}; outcome: ${summary.outcome}.</p><p>${summary.hasResults ? `Passed: ${summary.counts.passed}; failed: ${summary.counts.failed}; skipped: ${summary.counts.skipped}; flaky: ${summary.counts.flaky}.` : "Chưa có kết quả test: bước chuẩn bị chưa hoàn tất."}</p><ul>${Object.entries(
    summary.links,
  )
    .map(
      ([name, url]) =>
        `<li><a href="${url}" rel="noopener noreferrer">${name}: ${url}</a></li>`,
    )
    .join(
      "",
    )}</ul><p>Báo cáo dùng chung chỉ có số liệu và liên kết production. Ảnh, traces và nội dung phiên đăng nhập không được đưa vào đây.</p></html>`;
}

function recoveryManifest(fixture) {
  if (!/^E2E-PROD \d{4}-\d{2}-\d{2} [a-f0-9]{8}$/.test(fixture.prefix))
    throw Error("Refuse recovery export: invalid test marker.");
  const safe = { prefix: fixture.prefix, createdAt: iso(fixture.createdAt) };
  for (const [key, name] of [
    ["program", "name"],
    ["classroom", "name"],
    ["room", "name"],
    ["student", "fullName"],
    ["unit", "title"],
    ["registration"],
    ["enrollment"],
  ]) {
    const value = fixture[key];
    if (!value) continue;
    if (
      typeof value.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,191}$/.test(value.id)
    )
      throw Error("Refuse recovery export: invalid resource ownership ID.");
    safe[key] = { id: value.id };
    if (name) {
      if (
        typeof value[name] !== "string" ||
        !value[name].startsWith(fixture.prefix)
      )
        throw Error("Refuse recovery export: resource ownership mismatch.");
      safe[key][name] = value[name];
    }
  }
  const knownStates = [
    "registrationChecked",
    "enrollmentEnded",
    "curriculumArchived",
    "studentDeleted",
    "classDeleted",
    "roomDeleted",
    "programDeleted",
  ];
  safe.cleanup = Object.fromEntries(
    knownStates
      .filter((key) => typeof fixture.cleanup?.[key] === "boolean")
      .map((key) => [key, fixture.cleanup[key]]),
  );
  safe.cleanedUp = fixture.cleanedUp === true;
  if (fixture.cleanedUpAt) safe.cleanedUpAt = iso(fixture.cleanedUpAt);
  return safe;
}

if (require.main === module) {
  const source = path.join(root, "e2e/.production-results/results.json");
  const result = fs.existsSync(source)
    ? JSON.parse(fs.readFileSync(source, "utf8"))
    : null;
  const summary = publicSummary(result, process.argv[2] || process.env.PROFILE);
  const output = path.join(root, "e2e/.production-summary");
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  fs.writeFileSync(path.join(output, "index.html"), summaryHtml(summary));
  const fixtureFile = path.join(runtime, "fixture.json");
  if (fs.existsSync(fixtureFile)) {
    const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
    if (!fixture.cleanedUp) {
      fs.writeFileSync(
        path.join(output, "recovery-fixture.json"),
        JSON.stringify(recoveryManifest(fixture), null, 2),
      );
      console.log(
        "Saved synthetic ownership fields for authorized cleanup recovery; no credentials or personal fields exported.",
      );
    }
  }
  console.log(
    "Saved shareable production counts/links without private evidence.",
  );
}

module.exports = { publicSummary, summaryHtml, recoveryManifest };

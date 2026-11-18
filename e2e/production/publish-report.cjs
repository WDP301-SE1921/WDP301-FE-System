const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const { setTimeout: delay } = require("node:timers/promises");
const { root, runtime } = require("./settings.cjs");
const { renderRecordedReport } = require("./report-from-results.cjs");
const { publicSummary } = require("./report-summary.cjs");
const siteUrl = "https://wdp301-se1921.github.io/WDP301-FE-System/";
const profiles = ["public", "read-only", "services", "full", "filtered"];

function authorizedRemote(value) {
  return /^(?:https:\/\/github\.com\/|git@github\.com:)WDP301-SE1921\/WDP301-FE-System(?:\.git)?\/?$/i.test(
    value,
  );
}

function assertPublishRemote(fetchUrl, pushUrls) {
  if (!authorizedRemote(fetchUrl))
    throw new Error("Refuse to publish reports to an unrelated repository.");
  if (!pushUrls.length || pushUrls.some((value) => !authorizedRemote(value)))
    throw new Error("Refuse to publish to an unrelated Git push destination.");
}

function publicationProfile(record) {
  const argv = record.config.argv || [];
  const command = argv.indexOf("test");
  const args = command >= 0 ? argv.slice(command + 1) : argv;
  const values = new Set([
    "-c",
    "--config",
    "--reporter",
    "--output",
    "--timeout",
    "--global-timeout",
    "--workers",
    "-j",
    "--retries",
    "--repeat-each",
    "--max-failures",
    "--project",
    "--browser",
    "--trace",
    "--update-source-method",
  ]);
  const flags = new Set([
    "--headed",
    "--debug",
    "--quiet",
    "--forbid-only",
    "--fail-on-flaky-tests",
    "--pass-with-no-tests",
    "--no-deps",
    "--ignore-snapshots",
    "-x",
  ]);
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const option = arg.split("=", 1)[0];
    if (values.has(option)) {
      if (!arg.includes("=")) index++;
      continue;
    }
    if (flags.has(arg)) continue;
    if (arg === "--" && index === args.length - 1) continue;
    return "filtered";
  }
  return record.config.metadata?.mode;
}

function assertPublishable(record) {
  if (
    !record.stats ||
    (record.stats.expected || 0) +
      (record.stats.unexpected || 0) +
      (record.stats.flaky || 0) ===
      0
  )
    throw new Error(
      "No test cases ran; the previous shared production report is retained.",
    );
}

function git(repoRoot, args, env = process.env, input) {
  try {
    return cp
      .execFileSync("git", args, {
        cwd: repoRoot,
        env: { ...env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
        input,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024,
      })
      .trim();
  } catch (error) {
    const rejected = /non-fast-forward|fetch first/i.test(String(error.stderr));
    const failure = new Error(
      rejected
        ? "The report branch advanced; retrying with its latest commit."
        : `Report publication failed during git ${args[0]}; check repository write access.`,
    );
    failure.code = rejected ? "REPORT_BRANCH_ADVANCED" : "REPORT_GIT_FAILED";
    throw failure;
  }
}

async function waitForPublication(
  profile,
  runId,
  { request = fetch, wait = delay, timeout = 180000 } = {},
) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await request(
        `${siteUrl}${profile}/summary.json?v=${runId}`,
        { signal: AbortSignal.timeout(15000), cache: "no-store" },
      );
      if (response.ok && (await response.json()).runId === runId) return true;
    } catch {
      /* A Pages build can still be starting. */
    }
    await wait(5000);
  }
  throw new Error(
    `Report was pushed but Pages is still updating. Open ${siteUrl}${profile}/ shortly.`,
  );
}

async function requestPagesBuild(token) {
  const response = await fetch(
    "https://api.github.com/repos/WDP301-SE1921/WDP301-FE-System/pages/builds",
    {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok)
    throw new Error(
      `GitHub Pages build request failed: HTTP ${response.status}.`,
    );
}

async function publishReport(
  record,
  { repoRoot = root, enforceRemote = true, wait = true } = {},
) {
  assertPublishable(record);
  const profile = publicationProfile(record);
  if (!profiles.includes(profile))
    throw new Error("Recorded production profile is not supported.");
  const remote = git(repoRoot, ["remote", "get-url", "origin"]);
  const pushUrls = git(repoRoot, [
    "remote",
    "get-url",
    "--push",
    "--all",
    "origin",
  ]).split(/\r?\n/);
  if (enforceRemote) assertPublishRemote(remote, pushUrls);
  const summary = publicSummary(record, profile);
  summary.profile = profile;
  summary.runId = crypto
    .createHash("sha256")
    .update(JSON.stringify(summary))
    .digest("hex")
    .slice(0, 24);
  fs.mkdirSync(runtime, { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    const folder = fs.mkdtempSync(path.join(runtime, "pages-publish-"));
    const directory = path.join(folder, "site");
    fs.mkdirSync(directory);
    const environment = {
      ...process.env,
      GIT_INDEX_FILE: path.join(folder, "index"),
    };
    const reference = git(repoRoot, [
      "ls-remote",
      "--heads",
      "origin",
      "refs/heads/gh-pages",
    ]);
    let parent;
    if (reference) {
      git(repoRoot, ["fetch", "origin", "refs/heads/gh-pages"]);
      parent = git(repoRoot, ["rev-parse", "FETCH_HEAD"]);
      const manifest = JSON.parse(
        git(repoRoot, ["show", `${parent}:site-manifest.json`]),
      );
      if (manifest.owner !== "edugrade-production-e2e")
        throw new Error("Refuse to overwrite an unrelated Pages site.");
      git(repoRoot, ["read-tree", parent], environment);
      git(
        repoRoot,
        [
          "checkout-index",
          "--all",
          `--prefix=${directory.replace(/\\/g, "/")}/`,
        ],
        environment,
      );
    } else git(repoRoot, ["read-tree", "--empty"], environment);
    const publishedRecord = {
      ...record,
      config: {
        ...record.config,
        metadata: { ...record.config.metadata, mode: profile },
      },
    };
    await renderRecordedReport(publishedRecord, {
      outputFolder: path.join(directory, profile),
      publish: true,
    });
    fs.writeFileSync(
      path.join(directory, profile, "summary.json"),
      JSON.stringify(summary, null, 2),
    );
    const available = profiles.filter((value) =>
      fs.existsSync(path.join(directory, value, "index.html")),
    );
    const home = available.includes("full") ? "full" : profile;
    fs.writeFileSync(
      path.join(directory, "index.html"),
      `<!doctype html><html lang="vi"><meta charset="utf-8"><title>EduGrade Production Reports</title><meta http-equiv="refresh" content="0;url=${home}/"><h1>EduGrade Production</h1><p><a href="${home}/">Mở báo cáo production</a></p></html>`,
    );
    fs.writeFileSync(path.join(directory, ".nojekyll"), "");
    fs.writeFileSync(
      path.join(directory, "site-manifest.json"),
      JSON.stringify(
        {
          owner: "edugrade-production-e2e",
          default: home,
          profiles: available,
        },
        null,
        2,
      ),
    );
    git(
      repoRoot,
      ["-c", "core.autocrlf=false", `--work-tree=${directory}`, "add", "--all"],
      environment,
    );
    const tree = git(repoRoot, ["write-tree"], environment);
    const commit = git(repoRoot, [
      "-c",
      "user.name=EduGrade Report Bot",
      "-c",
      "user.email=reports@edugrade.local",
      "commit-tree",
      tree,
      ...(parent ? ["-p", parent] : []),
      "-m",
      `docs(reports): production ${profile} ${record.stats.startTime}`,
    ]);
    try {
      git(repoRoot, ["push", "origin", `${commit}:refs/heads/gh-pages`]);
    } catch (error) {
      if (error.code === "REPORT_BRANCH_ADVANCED" && attempt < 2) continue;
      throw error;
    }
    if (
      enforceRemote &&
      process.env.GITHUB_ACTIONS === "true" &&
      process.env.GITHUB_TOKEN
    )
      await requestPagesBuild(process.env.GITHUB_TOKEN);
    if (wait) await waitForPublication(profile, summary.runId);
    return {
      commit,
      profile,
      runId: summary.runId,
      url: `${siteUrl}${profile}/`,
      siteDirectory: directory,
    };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const index = args.indexOf("--source");
  const source =
    index >= 0
      ? args[index + 1]
      : path.join(root, "e2e/.production-results/results.json");
  (async () => {
    const report = await publishReport(
      JSON.parse(fs.readFileSync(source, "utf8")),
      { wait: !args.includes("--no-wait") },
    );
    console.log(
      `Production report ${args.includes("--no-wait") ? "pushed; deployment pending" : "online"}: ${report.url}`,
    );
    console.log(`Report publication commit: ${report.commit}`);
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  authorizedRemote,
  assertPublishRemote,
  assertPublishable,
  publicationProfile,
  publishReport,
  waitForPublication,
  requestPagesBuild,
  siteUrl,
};

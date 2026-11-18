const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const { test } = require("node:test");
const { root } = require("./settings.cjs");

function runGit(cwd, args) {
  return cp
    .execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    .trim();
}

function result(mode) {
  return {
    config: {
      rootDir: __dirname,
      metadata: { mode },
      projects: [
        {
          name: "production",
          outputDir: path.join(root, "e2e/.production-results"),
        },
      ],
    },
    stats: {
      startTime: "2026-11-18T07:00:00.000Z",
      duration: 1000,
      expected: 1,
      unexpected: 0,
      skipped: 0,
      flaky: 0,
    },
    errors: [],
    suites: [
      {
        title: "synthetic.spec.ts",
        file: "synthetic.spec.ts",
        specs: [
          {
            id: "recorded-case",
            title: "Recorded production result",
            file: "synthetic.spec.ts",
            line: 1,
            column: 1,
            tests: [
              {
                projectName: "production",
                status: "expected",
                expectedStatus: "passed",
                results: [
                  {
                    startTime: "2026-11-18T07:00:00.000Z",
                    status: "passed",
                    duration: 1000,
                    retry: 0,
                    errors: [],
                    stdout: [],
                    stderr: [],
                    attachments: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

test("publishing preserves profiles and never switches or stages the teammate's source checkout", async (t) => {
  const { publishReport } = require("./publish-report.cjs");
  fs.mkdirSync(path.join(root, "e2e/.production-runtime"), { recursive: true });
  const base = fs.mkdtempSync(
    path.join(root, "e2e/.production-runtime/publish-contract-"),
  );
  t.after(() => {
    const allowed = path.resolve(root, "e2e/.production-runtime") + path.sep;
    assert.ok(path.resolve(base).startsWith(allowed));
    fs.rmSync(base, { recursive: true, force: true });
  });
  const remote = path.join(base, "remote.git");
  const checkout = path.join(base, "checkout");
  fs.mkdirSync(checkout);
  runGit(base, ["init", "--bare", remote]);
  runGit(checkout, ["init", "-b", "feature/team-source"]);
  runGit(checkout, ["config", "user.name", "Synthetic Test"]);
  runGit(checkout, ["config", "user.email", "test@example.invalid"]);
  runGit(checkout, ["remote", "add", "origin", remote]);
  fs.writeFileSync(path.join(checkout, "keep.txt"), "committed source\n");
  runGit(checkout, ["add", "keep.txt"]);
  runGit(checkout, ["commit", "-m", "initial"]);
  fs.writeFileSync(
    path.join(checkout, "keep.txt"),
    "teammate's uncommitted work\n",
  );
  const before = runGit(checkout, ["status", "--porcelain"]);
  await publishReport(result("full"), {
    repoRoot: checkout,
    enforceRemote: false,
    wait: false,
  });
  await publishReport(result("services"), {
    repoRoot: checkout,
    enforceRemote: false,
    wait: false,
  });
  assert.equal(
    runGit(checkout, ["branch", "--show-current"]),
    "feature/team-source",
  );
  assert.equal(runGit(checkout, ["status", "--porcelain"]), before);
  const full = JSON.parse(
    runGit(base, ["--git-dir", remote, "show", "gh-pages:full/summary.json"]),
  );
  const services = JSON.parse(
    runGit(base, [
      "--git-dir",
      remote,
      "show",
      "gh-pages:services/summary.json",
    ]),
  );
  assert.equal(full.counts.passed, 1);
  assert.equal(services.counts.passed, 1);
  assert.match(
    runGit(base, ["--git-dir", remote, "show", "gh-pages:index.html"]),
    /full\//,
  );
  assert.doesNotMatch(
    runGit(base, [
      "--git-dir",
      remote,
      "ls-tree",
      "-r",
      "--name-only",
      "gh-pages",
    ]),
    /keep.txt|\.env|auth.json/,
  );
});

test("publishing refuses an unrelated Git remote before creating a report commit", async () => {
  const { authorizedRemote } = require("./publish-report.cjs");
  assert.equal(
    authorizedRemote("git@github.com:WDP301-SE1921/WDP301-FE-System.git"),
    true,
  );
  assert.equal(
    authorizedRemote("https://github.com/WDP301-SE1921/WDP301-FE-System.git"),
    true,
  );
  assert.equal(authorizedRemote("https://github.com/another/repo.git"), false);
});

test("a filtered production run cannot replace the full-system report", () => {
  const { publicationProfile } = require("./publish-report.cjs");
  const input = result("full");
  input.config.argv = ["test", "--grep", "actual email"];
  assert.equal(publicationProfile(input), "filtered");
});

test("an authorized fetch remote cannot hide an unrelated push destination", () => {
  const { assertPublishRemote } = require("./publish-report.cjs");
  assert.throws(
    () =>
      assertPublishRemote(
        "https://github.com/WDP301-SE1921/WDP301-FE-System.git",
        ["https://github.com/another/repo.git"],
      ),
    /push destination/,
  );
});

test("short grep aliases and extensionless file filters stay out of the full report", () => {
  const { publicationProfile } = require("./publish-report.cjs");
  for (const args of [
    ["test", "-g", "actual email"],
    ["test", "04-business"],
    [
      "node",
      "cli.js",
      "test",
      "-c",
      "playwright.production.config.ts",
      "--headed",
      "--output",
      "artifacts",
    ],
  ]) {
    const input = result("full");
    input.config.argv = args;
    assert.equal(
      publicationProfile(input),
      args.includes("artifacts") ? "full" : "filtered",
    );
  }
});

test("a run that never executed a case cannot replace the shared production result", () => {
  const { assertPublishable } = require("./publish-report.cjs");
  assert.throws(
    () =>
      assertPublishable({
        stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 96 },
      }),
    /No test cases ran/,
  );
});

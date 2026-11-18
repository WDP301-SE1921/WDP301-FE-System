const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");

function recorded() {
  return {
    config: {
      rootDir: path.resolve(__dirname),
      projects: [
        {
          name: "production",
          outputDir: path.resolve(__dirname, "../.production-results"),
        },
      ],
      metadata: { mode: "full", token: "private-token" },
    },
    stats: {
      startTime: "2026-11-18T07:00:00.000Z",
      duration: 9000,
      expected: 1,
      unexpected: 1,
      skipped: 1,
      flaky: 0,
    },
    errors: [],
    suites: [
      {
        title: "sample.spec.ts",
        file: "sample.spec.ts",
        specs: ["passed", "failed", "skipped"].map((status, index) => ({
          id: `case-${index}`,
          title: `Recorded ${status} case`,
          file: "sample.spec.ts",
          line: index + 1,
          column: 1,
          tags: [],
          tests: [
            {
              projectName: "production",
              expectedStatus: "passed",
              status:
                status === "passed"
                  ? "expected"
                  : status === "failed"
                    ? "unexpected"
                    : "skipped",
              annotations: [{ type: "note", description: "private-note" }],
              results: [
                {
                  status,
                  duration: 1000,
                  startTime: "2026-11-18T07:00:00.000Z",
                  retry: 0,
                  workerIndex: 0,
                  errors:
                    status === "failed"
                      ? [{ message: "private-error-body" }]
                      : [],
                  stdout: [{ text: "private-jwt" }],
                  stderr: [],
                  attachments: [
                    {
                      name: "private evidence",
                      contentType: "text/plain",
                      body: Buffer.from("private-secret").toString("base64"),
                    },
                  ],
                },
              ],
            },
          ],
        })),
      },
    ],
  };
}

test("recorded HTML model preserves actual success, failure and skip outcomes", () => {
  const { recordedModel } = require("./report-from-results.cjs");
  const model = recordedModel(recorded(), { publish: true });
  const cases = model.suite.suites[0].allTests();
  assert.deepEqual(
    cases.map((item) => item.outcome()),
    ["expected", "unexpected", "skipped"],
  );
  assert.deepEqual(
    cases.map((item) => item.results[0].duration),
    [1000, 1000, 1000],
  );
  assert.equal(model.result.duration, 9000);
  assert.equal(
    model.result.startTime.toISOString(),
    "2026-11-18T07:00:00.000Z",
  );
  assert.equal(model.result.status, "failed");
});

test("public Playwright model excludes private metadata, annotations, logs and evidence", () => {
  const { recordedModel } = require("./report-from-results.cjs");
  const model = recordedModel(recorded(), { publish: true });
  const data = {
    metadata: model.config.metadata,
    cases: model.suite.allTests().map((item) => ({
      annotations: item.annotations,
      results: item.results,
    })),
  };
  assert.doesNotMatch(JSON.stringify(data), /private-|Bearer|accessToken/);
  assert.ok(
    model.suite
      .allTests()
      .every((item) => item.results[0].attachments.length === 0),
  );
  assert.equal(
    model.config.metadata.web,
    "https://edugrade.45.77.168.110.sslip.io",
  );
});

test("local recorded reports retain embedded evidence without executing a test", () => {
  const { recordedModel } = require("./report-from-results.cjs");
  const model = recordedModel(recorded());
  assert.equal(
    model.suite.allTests()[0].results[0].attachments[0].body.toString(),
    "private-secret",
  );
});

test("a local/demo project cannot be mislabeled and published as production", () => {
  const { recordedModel } = require("./report-from-results.cjs");
  const input = recorded();
  input.suites[0].specs[0].tests[0].projectName = "local";
  assert.throws(
    () => recordedModel(input, { publish: true }),
    /production project/,
  );
});

test("recorded report rendering isolates inherited output-directory overrides", async (t) => {
  const fs = require("node:fs");
  const { root } = require("./settings.cjs");
  const { renderRecordedReport } = require("./report-from-results.cjs");
  const parent = path.join(root, "e2e/.production-runtime");
  fs.mkdirSync(parent, { recursive: true });
  const folder = fs.mkdtempSync(path.join(parent, "render-contract-"));
  const decoy = path.join(folder, "do-not-touch");
  const output = path.join(folder, "leased-output");
  fs.mkdirSync(decoy);
  fs.writeFileSync(path.join(decoy, "keep.txt"), "teammate's existing report");
  const old = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR;
  process.env.PLAYWRIGHT_HTML_OUTPUT_DIR = decoy;
  t.after(() => {
    if (old === undefined) delete process.env.PLAYWRIGHT_HTML_OUTPUT_DIR;
    else process.env.PLAYWRIGHT_HTML_OUTPUT_DIR = old;
    assert.ok(path.resolve(folder).startsWith(path.resolve(parent) + path.sep));
    fs.rmSync(folder, { recursive: true, force: true });
  });
  await renderRecordedReport(recorded(), {
    outputFolder: output,
    publish: true,
  });
  assert.ok(
    fs.existsSync(path.join(decoy, "keep.txt")),
    "Existing report must not be removed by an inherited override",
  );
  assert.ok(fs.existsSync(path.join(output, "index.html")));
});

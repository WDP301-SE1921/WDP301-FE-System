const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const { test } = require("node:test");
const { root, runtime } = require("./settings.cjs");

for (const testExit of [0, 1]) {
  test(`publication failure starts no local viewer and preserves test exit ${testExit}`, (t) => {
    fs.mkdirSync(runtime, { recursive: true });
    const folder = fs.mkdtempSync(path.join(runtime, "run-lifecycle-"));
    t.after(() => {
      assert.ok(
        path.resolve(folder).startsWith(path.resolve(runtime) + path.sep),
      );
      fs.rmSync(folder, { recursive: true, force: true });
    });
    const resultFile = path.join(folder, "results.json");
    const opened = path.join(folder, "opened.txt");
    const preload = path.join(folder, "preload.cjs");
    fs.writeFileSync(
      preload,
      `
      const fs = require('node:fs');
      const assert = require('node:assert/strict');
      const local = require(${JSON.stringify(path.join(__dirname, "settings.cjs"))});
      local.runtime = ${JSON.stringify(folder)};
      const runner = require(${JSON.stringify(path.join(__dirname, "command.cjs"))});
      runner.command = async (script, args, environment) => {
        if (script !== 'node_modules/@playwright/test/cli.js') { fs.writeFileSync(${JSON.stringify(opened)}, 'opened'); return 0; }
        assert.equal(environment.PLAYWRIGHT_HTML_OPEN, 'never');
        assert.equal(environment.PW_TEST_HTML_REPORT_OPEN, 'never');
        fs.writeFileSync(${JSON.stringify(resultFile)}, JSON.stringify({config:{metadata:{mode:'public'}},stats:{}}));
        return ${testExit};
      };
      require(${JSON.stringify(path.join(__dirname, "publish-report.cjs"))}).publishReport = async () => { throw Error('synthetic publication failure'); };
    `,
    );
    const result = cp.spawnSync(
      process.execPath,
      ["--require", preload, "e2e/production/run.mjs", "--public"],
      {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
        env: {
          ...process.env,
          CI: "0",
          E2E_PRODUCTION_ENV_FILE: path.join(folder, "absent.env"),
          PLAYWRIGHT_JSON_OUTPUT_FILE: resultFile,
          PLAYWRIGHT_HTML_OPEN: "always",
          PW_TEST_HTML_REPORT_OPEN: "always",
        },
      },
    );
    assert.equal(result.status, testExit);
    assert.match(result.stderr, /synthetic publication failure/);
    assert.ok(!fs.existsSync(opened), "No local report server should start");
  });
}

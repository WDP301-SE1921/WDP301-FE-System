const assert = require("node:assert/strict");
const { test } = require("node:test");

test("production defaults to public and authenticated read-only checks", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection([], {});
  assert.equal(plan.write, false);
  assert.equal(plan.providers, false);
  assert.deepEqual(plan.files, [
    "00-production.spec.ts",
    "01-routes.spec.ts",
    "02-api.spec.ts",
  ]);
});

test("public profile never requires authentication or a fixture", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection(["--public"], {});
  assert.equal(plan.auth, false);
  assert.equal(plan.write, false);
  assert.deepEqual(plan.files, ["00-production.spec.ts"]);
});

test("services profile explicitly enables fresh AI jobs and live fixture writes", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection(["--services", "--headed"], {});
  assert.equal(plan.write, true);
  assert.equal(plan.providers, true);
  assert.equal(plan.recheckAi, true);
  assert.equal(plan.headed, true);
  assert.deepEqual(plan.files, ["03-providers.spec.ts", "04-business.spec.ts"]);
});

test("full profile retains all production route and business cases", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection(["--full"], {});
  assert.equal(plan.write, true);
  assert.equal(plan.providers, true);
  assert.equal(plan.files.length, 10);
  assert.ok(plan.files.includes("08-admin.spec.ts"));
  assert.ok(plan.files.includes("09-contract-updates.spec.ts"));
});

test("legacy write/provider flags keep their explicit behavior", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection(["--write", "--providers", "--recheck-ai"], {});
  assert.equal(plan.write, true);
  assert.equal(plan.providers, true);
  assert.equal(plan.recheckAi, true);
});

test("public profile rejects conflicting write options", () => {
  const { selection } = require("./selection.cjs");
  assert.throws(() => selection(["--public", "--write"], {}), /public.*write/i);
});

test("runner options are removed while Playwright UI and grep options are preserved", () => {
  const { selection } = require("./selection.cjs");
  const plan = selection(["--services", "--ui", "--grep", "actual email"], {});
  assert.deepEqual(plan.playwrightArgs, ["--ui", "--grep", "actual email"]);
  assert.equal(plan.ui, true);
});

test("worker processes reconstruct the runner profile from inherited variables", () => {
  const { selection } = require("./selection.cjs");
  const first = selection(["--services", "--headed"], {});
  const child = selection([], first.environment);
  assert.deepEqual(child.files, first.files);
  assert.equal(child.recheckAi, true);
  assert.equal(child.headed, true);
});

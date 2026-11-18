const assert = require("node:assert/strict");
const { test } = require("node:test");

test("a completed CLI run publishes online without starting a local report viewer", () => {
  const { afterRunPlan } = require("./after-run.cjs");
  assert.deepEqual(afterRunPlan([], {}, { publishReport: true }), {
    publish: true,
  });
});
test("list/help/UI and CI never accidentally open or republish an old local report", () => {
  const { afterRunPlan } = require("./after-run.cjs");
  for (const args of [["--list"], ["--help"], ["--ui"]])
    assert.deepEqual(afterRunPlan(args, {}, { publishReport: true }), {
      publish: false,
    });
  assert.deepEqual(afterRunPlan([], { CI: "true" }, { publishReport: true }), {
    publish: false,
  });
});
test("automation can explicitly opt out of publishing without changing test scope", () => {
  const { afterRunPlan } = require("./after-run.cjs");
  assert.deepEqual(
    afterRunPlan(["--no-open", "--no-publish"], {}, { publishReport: true }),
    { publish: false },
  );
});

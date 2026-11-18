const assert = require("node:assert/strict");
const { test } = require("node:test");

test("shared reports retain counts and production links, excluding all private evidence", () => {
  const { publicSummary, summaryHtml } = require("./report-summary.cjs");
  const input = {
    stats: {
      expected: 7,
      unexpected: 0,
      skipped: 0,
      flaky: 0,
      duration: 45000,
      startTime: "2026-11-18T06:00:00.000Z",
    },
    config: { metadata: { password: "private-password" } },
    suites: [
      {
        title: "private-account@example.com",
        errors: ["private-token"],
        attachments: [{ body: "private-api-key" }],
      },
    ],
  };
  const summary = publicSummary(input, "services");
  assert.deepEqual(summary.counts, {
    passed: 7,
    failed: 0,
    skipped: 0,
    flaky: 0,
    total: 7,
  });
  assert.equal(summary.links.web, "https://edugrade.45.77.168.110.sslip.io");
  assert.doesNotMatch(
    JSON.stringify(summary) + summaryHtml(summary),
    /private-|@example.com|attachments|metadata/,
  );
});

test("shared reports do not claim success if setup failed before a result was written", () => {
  const { publicSummary } = require("./report-summary.cjs");
  assert.equal(publicSummary(null, "full").hasResults, false);
});

test("a setup or cleanup error keeps a shared report failed even when test counts passed", () => {
  const { publicSummary } = require("./report-summary.cjs");
  const summary = publicSummary(
    {
      stats: { expected: 7, unexpected: 0 },
      errors: [{ message: "private-setup-error" }],
    },
    "services",
  );
  assert.equal(summary.outcome, "failed");
  assert.doesNotMatch(JSON.stringify(summary), /private-setup-error/);
});

test("recovery exports only synthetic ownership fields needed by cleanup", () => {
  const { recoveryManifest } = require("./report-summary.cjs");
  const prefix = "E2E-PROD 2026-11-18 abcdef12";
  const safe = recoveryManifest({
    prefix,
    createdAt: "2026-11-18T06:00:00.000Z",
    program: {
      id: "p",
      name: `${prefix} course`,
      teacherEmail: "private@example.com",
    },
    classroom: {
      id: "c",
      name: `${prefix} class`,
      password: "private-password",
    },
    student: {
      id: "s",
      fullName: `${prefix} child`,
      parentEmail: "private@example.com",
    },
    registration: { id: "r", parentEmail: "private@example.com" },
    enrollment: { id: "e", parent: "private@example.com" },
    unit: { id: "u", title: `${prefix} draft`, designerId: "private-user-id" },
    payment: { id: "private-payment", receipt: "private-receipt" },
    cleanup: { enrollmentEnded: true, privateField: "private-token" },
    tokens: { accessToken: "private-jwt" },
  });
  assert.deepEqual(safe.student, { id: "s", fullName: `${prefix} child` });
  assert.deepEqual(safe.registration, { id: "r" });
  assert.deepEqual(safe.cleanup, { enrollmentEnded: true });
  assert.doesNotMatch(
    JSON.stringify(safe),
    /private|parentEmail|password|tokens|payment/,
  );
});

test("recovery refuses records without the test marker or with an unrelated live name", () => {
  const { recoveryManifest } = require("./report-summary.cjs");
  assert.throws(
    () => recoveryManifest({ prefix: "A live class" }),
    /test marker/,
  );
  assert.throws(
    () =>
      recoveryManifest({
        prefix: "E2E-PROD 2026-11-18 abcdef12",
        student: { id: "s", fullName: "A real child" },
      }),
    /ownership/,
  );
});

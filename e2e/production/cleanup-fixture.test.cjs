const assert = require("node:assert/strict");
const { test } = require("node:test");
const prefix = "E2E-PROD 2026-11-18 abcdef12";
const base = () => ({ prefix, program: { id: "p", name: `${prefix} course` } });

function client(records) {
  const writes = [];
  const reads = [];
  return {
    writes,
    reads,
    config: { accounts: { parent: "parent@example.com" } },
    session: () => ({ user: { id: "designer" } }),
    items: (value) => (Array.isArray(value) ? value : value.items),
    call: async (role, route, method = "GET", body) => {
      if (method === "GET") {
        reads.push(route);
        assert.ok(
          Object.hasOwn(records, route),
          `Unexpected resource read: ${route}`,
        );
        return records[route];
      }
      writes.push({ role, route, method, body });
      if (route.endsWith("/request-changes"))
        return { ...records["academic/curriculum-units/u"], status: "DRAFT" };
      return {};
    },
  };
}

test("cleanup handles preparation failing after only the course was created", async () => {
  const { cleanupFixture } = require("./cleanup-fixture.cjs");
  const fixture = base();
  const api = client({ "programs/p": fixture.program });
  await cleanupFixture(api, fixture);
  assert.deepEqual(
    api.writes.map((x) => `${x.method} ${x.route}`),
    ["DELETE admin/records/program/p"],
  );
  assert.equal(fixture.cleanedUp, true);
});

test("cleanup cancels an owned draft registration even when payment/enrollment were never saved", async () => {
  const { cleanupFixture } = require("./cleanup-fixture.cjs");
  const fixture = {
    ...base(),
    classroom: { id: "c", name: `${prefix} class` },
    student: { id: "s", fullName: `${prefix} child` },
    registration: { id: "r" },
  };
  const api = client({
    "programs/p": fixture.program,
    "admin/classes/c": fixture.classroom,
    "admin/students/s": fixture.student,
    "registrations/r": {
      id: "r",
      classId: "c",
      targetStudentId: "s",
      parentEmail: "parent@example.com",
      status: "DRAFT",
    },
    "academic/enrollments?studentId=s": [],
  });
  await cleanupFixture(api, fixture);
  assert.deepEqual(
    api.writes.map((x) => `${x.method} ${x.route}`),
    [
      "POST registrations/r/cancel",
      "DELETE admin/records/student/s",
      "DELETE admin/records/class/c",
      "DELETE admin/records/program/p",
    ],
  );
  assert.equal(fixture.cleanedUp, true);
});

test("cleanup refuses a resource ownership mismatch before any write", async () => {
  const { cleanupFixture } = require("./cleanup-fixture.cjs");
  const fixture = {
    ...base(),
    classroom: { id: "c", name: `${prefix} class` },
  };
  const api = client({
    "programs/p": fixture.program,
    "admin/classes/c": { id: "c", name: "A live class" },
  });
  await assert.rejects(cleanupFixture(api, fixture), /ownership mismatch/);
  assert.equal(api.writes.length, 0);
});

test("cleanup returns its own pending curriculum to draft before deleting it as its designer", async () => {
  const { cleanupFixture } = require("./cleanup-fixture.cjs");
  const fixture = { ...base(), unit: { id: "u", title: `${prefix} draft` } };
  const api = client({
    "programs/p": fixture.program,
    "academic/curriculum-units/u": {
      ...fixture.unit,
      programId: "p",
      designerId: "designer",
      status: "PENDING_REVIEW",
    },
  });
  await cleanupFixture(api, fixture);
  assert.deepEqual(
    api.writes.map((x) => `${x.role} ${x.method} ${x.route}`),
    [
      "manager POST academic/curriculum-units/u/request-changes",
      "designer DELETE academic/curriculum-units/u",
      "admin DELETE admin/records/program/p",
    ],
  );
});

test("cleanup retries do not require already removed students/classes to remain readable", async () => {
  const { cleanupFixture } = require("./cleanup-fixture.cjs");
  const fixture = {
    ...base(),
    student: { id: "s", fullName: `${prefix} child` },
    classroom: { id: "c", name: `${prefix} class` },
    cleanup: {
      studentDeleted: true,
      classDeleted: true,
      enrollmentEnded: true,
    },
  };
  const api = client({ "programs/p": fixture.program });
  await cleanupFixture(api, fixture);
  assert.deepEqual(api.reads, ["programs/p"]);
  assert.equal(fixture.cleanedUp, true);
});

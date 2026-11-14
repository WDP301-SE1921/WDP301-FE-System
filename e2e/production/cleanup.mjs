import fs from "node:fs";
import api from "./api.cjs";
const file = `${api.runtime}/fixture.json`;
const fixture = JSON.parse(fs.readFileSync(file, "utf8"));
if (!/^E2E-PROD \d{4}-\d{2}-\d{2} [a-f0-9]{8}$/.test(fixture.prefix))
  throw Error("Refuse cleanup: unrecognized fixture marker.");
if (fixture.cleanedUp) {
  console.log("This production test fixture was already cleaned up.");
  process.exit(0);
}
const states = fixture.cleanup || {};
const save = () => {
  fixture.cleanup = states;
  fs.writeFileSync(file, JSON.stringify(fixture, null, 2));
};
const reason = `${fixture.prefix} completed test cleanup`;
const student = await api.call("admin", `admin/students/${fixture.student.id}`);
const classroom = await api.call(
  "admin",
  `admin/classes/${fixture.classroom.id}`,
);
if (
  student.fullName !== fixture.student.fullName ||
  !student.fullName.startsWith(fixture.prefix) ||
  classroom.name !== fixture.classroom.name ||
  !classroom.name.startsWith(fixture.prefix)
)
  throw Error(
    "Refuse cleanup: live records do not match this run's names and IDs.",
  );
if (!states.programDeleted) {
  const program = await api.call("manager", `programs/${fixture.program.id}`);
  if (
    program.name !== fixture.program.name ||
    !program.name.startsWith(fixture.prefix)
  )
    throw Error("Refuse cleanup: course ownership mismatch.");
}
async function step(key, work) {
  if (states[key]) return;
  await work();
  states[key] = true;
  save();
  console.log(`Production test cleanup: ${key}`);
}
if (process.argv.includes("--dry-run")) {
  console.log(
    "Verified this run's student, class and course names/IDs. No changes made.",
  );
  process.exit(0);
}
await step("enrollmentEnded", async () => {
  const rows = api.items(
    await api.call(
      "staff",
      `academic/enrollments?studentId=${fixture.student.id}`,
    ),
  );
  const enrollment = rows.find((row) => row.id === fixture.enrollment.id);
  if (!enrollment) throw Error("Refuse cleanup: fixture enrollment missing.");
  if (enrollment.classId !== fixture.classroom.id)
    throw Error("Refuse cleanup: fixture was moved to an unrelated class.");
  if (enrollment.status === "ACTIVE")
    await api.call(
      "staff",
      `academic/enrollments/${enrollment.id}/end`,
      "POST",
      { reason },
    );
});
await step("curriculumArchived", async () => {
  const unit = await api.call(
    "manager",
    `academic/curriculum-units/${fixture.unit.id}`,
  );
  if (
    unit.programId !== fixture.program.id ||
    !unit.title.startsWith(fixture.prefix)
  )
    throw Error("Refuse cleanup: curriculum ownership mismatch.");
  await api.call("manager", `academic/curriculum-units/${unit.id}`, "DELETE");
});
await step("studentDeleted", () =>
  api.call("admin", `admin/records/student/${fixture.student.id}`, "DELETE", {
    reason,
  }),
);
await step("classDeleted", () =>
  api.call("admin", `admin/records/class/${fixture.classroom.id}`, "DELETE", {
    reason,
  }),
);
await step("programDeleted", () =>
  api.call("admin", `admin/records/program/${fixture.program.id}`, "DELETE", {
    reason,
  }),
);
fixture.cleanedUp = true;
fixture.cleanedUpAt = new Date().toISOString();
fixture.retained = [
  "zero-value receipt/payment history",
  "assignment/submission/grade/report snapshots",
  "private test files required by history",
  "audit trail",
];
save();
fs.writeFileSync(
  `${api.runtime}/cleanup-summary.json`,
  JSON.stringify(
    {
      prefix: fixture.prefix,
      cleanedUpAt: fixture.cleanedUpAt,
      states,
      retained: fixture.retained,
    },
    null,
    2,
  ),
);
console.log(
  "Only this test's student, class and course were soft-deleted; curriculum archived; 0 VND history retained.",
);

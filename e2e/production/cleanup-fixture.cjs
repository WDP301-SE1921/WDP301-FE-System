async function cleanupFixture(
  api,
  fixture,
  { save = () => {}, log = () => {}, dryRun = false } = {},
) {
  if (!/^E2E-PROD \d{4}-\d{2}-\d{2} [a-f0-9]{8}$/.test(fixture.prefix))
    throw Error("Refuse cleanup: unrecognized fixture marker.");
  if (fixture.cleanedUp) return fixture;
  const states = fixture.cleanup || {};
  const reason = `${fixture.prefix} completed test cleanup`;
  const owned = (actual, expected, field) => {
    if (
      actual?.id !== expected.id ||
      actual[field] !== expected[field] ||
      !actual[field]?.startsWith(fixture.prefix)
    )
      throw Error("Refuse cleanup: resource ownership mismatch.");
  };
  for (const [key, state, role, route, field] of [
    ["program", "programDeleted", "manager", "programs", "name"],
    ["classroom", "classDeleted", "admin", "admin/classes", "name"],
    ["student", "studentDeleted", "admin", "admin/students", "fullName"],
  ]) {
    if (fixture[key] && !states[state])
      owned(
        await api.call(role, `${route}/${fixture[key].id}`),
        fixture[key],
        field,
      );
  }
  if (fixture.room && !states.roomDeleted) {
    const rooms = api.items(
      await api.call(
        "manager",
        `rooms?search=${encodeURIComponent(fixture.room.name)}&limit=100`,
      ),
    );
    owned(
      rooms.find((room) => room.id === fixture.room.id),
      fixture.room,
      "name",
    );
  }
  let registration;
  if (fixture.registration && !states.registrationChecked) {
    if (!fixture.student || !fixture.classroom)
      throw Error("Refuse cleanup: incomplete registration ownership.");
    registration = await api.call(
      "staff",
      `registrations/${fixture.registration.id}`,
    );
    if (
      registration.id !== fixture.registration.id ||
      registration.targetStudentId !== fixture.student.id ||
      registration.classId !== fixture.classroom.id ||
      registration.parentEmail !== api.config.accounts.parent
    )
      throw Error("Refuse cleanup: registration ownership mismatch.");
  }
  let unit;
  if (fixture.unit && !states.curriculumArchived) {
    unit = await api.call(
      "manager",
      `academic/curriculum-units/${fixture.unit.id}`,
    );
    owned(unit, fixture.unit, "title");
    if (
      unit.programId !== fixture.program?.id ||
      (!["APPROVED", "ARCHIVED"].includes(unit.status) &&
        unit.designerId !== api.session("designer").user.id)
    )
      throw Error("Refuse cleanup: curriculum ownership mismatch.");
  }
  let enrollments = [];
  if (fixture.student && fixture.classroom && !states.enrollmentEnded) {
    const rows = api.items(
      await api.call(
        "staff",
        `academic/enrollments?studentId=${fixture.student.id}`,
      ),
    );
    enrollments = fixture.enrollment
      ? rows.filter((row) => row.id === fixture.enrollment.id)
      : rows.filter((row) => row.classId === fixture.classroom.id);
    if (fixture.enrollment && !enrollments.length)
      throw Error("Refuse cleanup: fixture enrollment missing.");
    if (enrollments.some((row) => row.classId !== fixture.classroom.id))
      throw Error("Refuse cleanup: fixture was moved to an unrelated class.");
  }
  if (dryRun) return fixture;
  async function step(key, work) {
    if (states[key]) return;
    await work();
    states[key] = true;
    fixture.cleanup = states;
    save();
    log(`Production test cleanup: ${key}`);
  }
  if (registration)
    await step("registrationChecked", async () => {
      if (registration.status === "DRAFT")
        await api.call(
          "staff",
          `registrations/${registration.id}/cancel`,
          "POST",
        );
    });
  if (fixture.student && fixture.classroom)
    await step("enrollmentEnded", async () => {
      for (const enrollment of enrollments) {
        if (enrollment.status === "ACTIVE")
          await api.call(
            "staff",
            `academic/enrollments/${enrollment.id}/end`,
            "POST",
            { reason },
          );
      }
    });
  if (unit)
    await step("curriculumArchived", async () => {
      if (unit.status === "PENDING_REVIEW")
        unit = await api.call(
          "manager",
          `academic/curriculum-units/${unit.id}/request-changes`,
          "POST",
          { reason },
        );
      const role = ["APPROVED", "ARCHIVED"].includes(unit.status)
        ? "manager"
        : "designer";
      await api.call(role, `academic/curriculum-units/${unit.id}`, "DELETE");
    });
  for (const [key, state, kind] of [
    ["student", "studentDeleted", "student"],
    ["classroom", "classDeleted", "class"],
    ["room", "roomDeleted", "room"],
    ["program", "programDeleted", "program"],
  ]) {
    if (fixture[key])
      await step(state, () =>
        api.call(
          "admin",
          `admin/records/${kind}/${fixture[key].id}`,
          "DELETE",
          { reason },
        ),
      );
  }
  fixture.cleanup = states;
  fixture.cleanedUp = true;
  fixture.cleanedUpAt = new Date().toISOString();
  fixture.retained = [
    "zero-value receipt/payment history",
    "assignment/submission/grade/report snapshots",
    "private test files required by history",
    "audit trail",
  ];
  save();
  return fixture;
}

module.exports = { cleanupFixture };

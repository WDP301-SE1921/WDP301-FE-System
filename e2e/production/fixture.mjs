import fs from "node:fs";
import { randomUUID } from "node:crypto";
import api from "./api.cjs";
const { runtime, session, call, items, day } = api;
const file = `${runtime}/fixture.json`;
let fixture;
try {
  fixture = JSON.parse(fs.readFileSync(file, "utf8"));
  if (fixture.cleanedUp) {
    const history = `${runtime}/fixture-history`;
    fs.mkdirSync(history, { recursive: true });
    fs.writeFileSync(
      `${history}/${fixture.prefix.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`,
      JSON.stringify(fixture, null, 2),
    );
    throw new Error(
      "Start a new isolated fixture after the previous test cleanup.",
    );
  }
} catch {
  fixture = {
    prefix: `E2E-PROD ${day()} ${randomUUID().slice(0, 8)}`,
    records: [],
    createdAt: new Date().toISOString(),
  };
}
const save = () => fs.writeFileSync(file, JSON.stringify(fixture, null, 2));
async function create(key, kind, role, route, body, method = "POST") {
  if (fixture[key]) return fixture[key];
  const value = await call(role, route, method, body);
  fixture[key] = value;
  fixture.records.push({
    key,
    kind,
    id: value.id,
    name: body.name || body.title || body.fullName,
  });
  save();
  console.log(`Created production test ${kind}: ${key}`);
  return value;
}
save();
const subjects = items(await call("manager", "subjects"));
const subject = subjects.find((s) => s.name === "Toán") || subjects[0];
if (!subject)
  throw Error(
    "No subject available; production data was not seeded by this test.",
  );
const program = await create("program", "program", "manager", "programs", {
  name: `${fixture.prefix} course`,
  subjectId: subject.id,
  grade: 8,
  sessionsPerWeek: 1,
});
const classroom = await create("classroom", "class", "manager", "classes", {
  programId: program.id,
  name: `${fixture.prefix} class`,
  teacherId: session("teacher").user.id,
  capacity: 3,
  monthlyFee: 0,
});
if (!fixture.scheduleReady) {
  await call("manager", `classes/${classroom.id}/schedules`, "PUT", {
    schedules: [{ weekday: 7, startTime: "05:03", endTime: "05:23" }],
  });
  await call(
    "teacher",
    `classes/${classroom.id}/schedule-confirmation`,
    "PUT",
    { confirmed: true },
  );
  await call("manager", `classes/${classroom.id}`, "PATCH", { isOpen: true });
  fixture.scheduleReady = true;
  save();
}
if (!fixture.registration && !fixture.sameDaySchedule) {
  await call(
    "manager",
    `classes/${classroom.id}/schedule-confirmation`,
    "PUT",
    { confirmed: false, reason: `${fixture.prefix} adjust own test schedule` },
  );
  await call("manager", `classes/${classroom.id}/schedules`, "PUT", {
    schedules: [
      {
        weekday: new Date(`${day()}T00:00:00Z`).getUTCDay() || 7,
        startTime: "05:03",
        endTime: "05:23",
      },
    ],
  });
  await call(
    "teacher",
    `classes/${classroom.id}/schedule-confirmation`,
    "PUT",
    { confirmed: true },
  );
  fixture.sameDaySchedule = true;
  save();
}
const student = await create("student", "student", "parent", "me/students", {
  fullName: `${fixture.prefix} child`,
  grade: 8,
  dateOfBirth: "2013-04-20",
});
const registration = await create(
  "registration",
  "registration",
  "staff",
  "registrations",
  {
    targetStudentId: student.id,
    classId: classroom.id,
    startDate: day(),
    packageMonths: 1,
  },
);
if (!fixture.payment) {
  fixture.payment = await call(
    "staff",
    `registrations/${registration.id}/confirm-payment`,
    "POST",
    { receiptNumber: `${fixture.prefix} ZERO-VALUE TEST` },
  );
  fixture.records.push({
    key: "payment",
    kind: "zero-value-payment",
    id: fixture.payment.payment?.id || fixture.payment.id,
  });
  save();
}
const enrollments = items(
  await call("staff", `academic/enrollments?studentId=${student.id}`),
);
fixture.enrollment = enrollments.find((e) => e.classId === classroom.id);
save();
const lesson = await create(
  "lesson",
  "lesson",
  "designer",
  "academic/lessons",
  {
    programId: program.id,
    designerId: session("designer").user.id,
    title: `${fixture.prefix} equation`,
    content: "Giải phương trình 2x + 3 = 7. Biến đổi 2x = 4. Kết luận x = 2.",
    sequence: 1,
  },
);
if (!fixture.lessonApproved) {
  await call("manager", `academic/lessons/${lesson.id}/approve`, "POST");
  fixture.lessonApproved = true;
  save();
}
await create(
  "unit",
  "curriculum-unit",
  "designer",
  "academic/curriculum-units",
  {
    programId: program.id,
    title: `${fixture.prefix} draft`,
    fromDate: day(),
    toDate: day(6),
  },
);
if (!fixture.session) {
  const startsAt = new Date(Date.now() - 20 * 60000).toISOString();
  const endsAt = new Date(Date.now() - 19 * 60000).toISOString();
  await create("session", "session", "manager", "academic/sessions", {
    classId: classroom.id,
    lessonId: lesson.id,
    teacherId: session("teacher").user.id,
    startsAt,
    endsAt,
  });
}
console.log(
  "Production synthetic fixture ready. Tuition value: 0 VND; no existing records changed.",
);
